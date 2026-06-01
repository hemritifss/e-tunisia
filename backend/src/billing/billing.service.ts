import { BadRequestException, ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { User, UserPlan } from '../users/user.entity';
import { Subscription, SubStatus } from '../subscriptions/subscription.entity';
import { PaymentsService } from '../payments/payments.service';
import { FlouciService } from '../payments/flouci.service';
import { CreditsService } from '../credits/credits.service';
import {
    BillingCycle,
    FeatureCaps,
    PlanId,
    amountFor,
    capsFor,
    displayCurrency,
    effectivePlanFor,
    getPlan,
    stripePriceIdFor,
    toPublicCatalog,
} from './plan-catalog';

// Re-export the gating types/helpers so existing importers keep working.
export { FeatureCaps } from './plan-catalog';

/**
 * Plan-aware feature gating + the single purchase path.
 *
 * Two responsibilities:
 *   1. Resolve the *effective* plan and hand out feature caps (gating).
 *   2. Own the upgrade flow: Stripe Checkout (card), manual pending (bank/cash),
 *      mock flip (dev, no keys), and apply Stripe webhook events.
 *
 * All caps + prices live in plan-catalog.ts — this service consumes them.
 */
@Injectable()
export class BillingService {
    private readonly logger = new Logger(BillingService.name);

    constructor(
        @InjectRepository(User) private usersRepo: Repository<User>,
        @InjectRepository(Subscription) private subsRepo: Repository<Subscription>,
        private payments: PaymentsService,
        private flouci: FlouciService,
        private credits: CreditsService,
        private config: ConfigService,
    ) {}

    // ─── Gating ────────────────────────────────────────────────────────────────

    /** Resolve the EFFECTIVE plan for a user, downgrading expired Pro/Biz to Free. */
    async effectivePlan(userId: string): Promise<UserPlan> {
        if (!userId) return UserPlan.FREE;
        const u = await this.usersRepo.findOne({
            where: { id: userId },
            select: ['id', 'plan', 'subscriptionExpiresAt'] as any,
        });
        if (!u) return UserPlan.FREE;
        return effectivePlanFor(u);
    }

    /** Return the feature caps for a plan. Single source of truth lives in plan-catalog. */
    caps(plan: UserPlan): FeatureCaps {
        return capsFor(plan);
    }

    /** Throws ForbiddenException with a code if the user can't use the feature. */
    async assertFeature(userId: string, feature: keyof FeatureCaps | 'pro' | 'business'): Promise<void> {
        const plan = await this.effectivePlan(userId);
        if (feature === 'pro') {
            if (plan === UserPlan.FREE) throw upgradeError('pro_required');
            return;
        }
        if (feature === 'business') {
            if (plan !== UserPlan.BUSINESS) throw upgradeError('business_required');
            return;
        }
        const caps = this.caps(plan);
        const val = (caps as any)[feature];
        if (val === true) return;       // boolean feature granted
        if (val === Infinity) return;   // unlimited
        if (typeof val === 'number') return; // numeric cap — caller should compare itself
        throw upgradeError('pro_required');
    }

    /** Helper for callers comparing against a numeric cap (trips, saves). */
    async checkCap(userId: string, feature: 'maxTrips' | 'maxSaves', currentCount: number): Promise<{ ok: boolean; cap: number; plan: UserPlan; }> {
        const plan = await this.effectivePlan(userId);
        const cap = this.caps(plan)[feature];
        return { ok: currentCount < cap, cap, plan };
    }

    // ─── Catalog ─────────────────────────────────────────────────────────────────

    /** Public, serializable plan catalog for the pricing page. */
    getCatalog() {
        return toPublicCatalog();
    }

    // ─── Purchase flow ─────────────────────────────────────────────────────────────

    /**
     * Start a checkout for `planId` on `cycle`.
     * - Stripe configured + price id present → real Checkout Session, returns its hosted URL.
     * - Otherwise → mock instant upgrade (dev), returns the success URL with ?mock=1.
     */
    async createCheckout(
        userId: string,
        planId: string,
        cycle: BillingCycle,
    ): Promise<{ url: string; mock: boolean }> {
        const entry = getPlan(planId);
        if (!entry || entry.id === 'free') throw new BadRequestException('Choose a paid plan (premium or business).');

        const successUrl = this.successUrl();
        const cancelUrl = this.cancelUrl();
        const priceId = stripePriceIdFor(entry, cycle);

        if (this.payments.stripeEnabled && priceId) {
            const user = await this.usersRepo.findOneOrFail({ where: { id: userId } });
            const customerId = await this.ensureCustomer(user);
            const session = await this.payments.createSubscriptionCheckout({
                customerId,
                priceId,
                successUrl,
                cancelUrl,
                metadata: { userId, planId: entry.id, cycle },
            });
            return { url: session.url, mock: false };
        }

        // Mock path — flip the plan now so dev can test the full UX without keys.
        await this.applyPlan(userId, entry.id as PlanId, cycle, {
            paymentMethod: 'mock',
            reference: `MOCK_${Date.now()}`,
            status: SubStatus.ACTIVE,
        });
        const sep = successUrl.includes('?') ? '&' : '?';
        return { url: `${successUrl}${sep}mock=1&plan=${entry.id}`, mock: true };
    }

    /**
     * Flouci (local TND rail) checkout. Generates a Flouci payment + a PENDING subscription
     * keyed by the Flouci payment id; the plan activates on /flouci/return after we verify
     * the payment server-side. Mock mode (no creds) flips the plan immediately.
     */
    async createFlouciCheckout(
        userId: string,
        planId: string,
        cycle: BillingCycle,
    ): Promise<{ url: string; mock: boolean }> {
        const entry = getPlan(planId);
        if (!entry || entry.id === 'free') throw new BadRequestException('Choose a paid plan (premium or business).');

        if (!this.flouci.enabled) {
            await this.applyPlan(userId, entry.id as PlanId, cycle, {
                paymentMethod: 'flouci',
                reference: `FLOUCI_MOCK_${Date.now()}`,
                status: SubStatus.ACTIVE,
            });
            const sep = this.successUrl().includes('?') ? '&' : '?';
            return { url: `${this.successUrl()}${sep}mock=1&plan=${entry.id}`, mock: true };
        }

        const amount = amountFor(entry.id, cycle);
        const returnLink = `${this.apiBaseUrl()}/api/v1/billing/flouci/return`;
        const { link, paymentId } = await this.flouci.generatePayment({
            amountTnd: amount,
            successLink: returnLink,
            failLink: returnLink,
            trackingId: `${userId}:${entry.id}:${cycle}`,
        });

        // Pending row the return handler matches on (amount → cycle inference).
        await this.subsRepo.save(this.subsRepo.create({
            userId,
            plan: entry.id,
            amount,
            currency: displayCurrency(),
            paymentMethod: 'flouci',
            paymentReference: `FLOUCI_${paymentId}`,
            status: SubStatus.PENDING,
        }));

        return { url: link, mock: false };
    }

    /**
     * Flouci redirects here after payment. Verify server-side, activate the pending row,
     * and return a frontend URL to redirect to (welcome on success, else cancel).
     */
    async handleFlouciReturn(paymentId: string): Promise<string> {
        if (!paymentId) return this.cancelUrl();
        const sub = await this.subsRepo.findOne({ where: { paymentReference: `FLOUCI_${paymentId}` } });
        if (!sub) return this.cancelUrl();

        const successWithPlan = () => {
            const sep = this.successUrl().includes('?') ? '&' : '?';
            return `${this.successUrl()}${sep}plan=${sub.plan}`;
        };

        if (sub.status === SubStatus.ACTIVE) return successWithPlan(); // already processed

        const { success } = await this.flouci.verifyPayment(paymentId);
        if (!success) {
            sub.status = SubStatus.CANCELLED;
            await this.subsRepo.save(sub);
            return this.cancelUrl();
        }

        const entry = getPlan(sub.plan);
        const isYearly = entry ? Math.abs(Number(sub.amount) - entry.yearly) < 0.01 : false;
        const now = new Date();
        const expiresAt = isYearly
            ? new Date(now.getFullYear() + 1, now.getMonth(), now.getDate())
            : new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

        await this.subsRepo.update({ userId: sub.userId, status: SubStatus.ACTIVE }, { status: SubStatus.CANCELLED });
        sub.status = SubStatus.ACTIVE;
        sub.startsAt = now;
        sub.expiresAt = expiresAt;
        await this.subsRepo.save(sub);
        await this.usersRepo.update(sub.userId, {
            plan: entry?.userPlan ?? UserPlan.FREE,
            subscriptionExpiresAt: expiresAt,
        });

        return successWithPlan();
    }

    /**
     * Manual (bank transfer / cash-at-office) upgrade — writes a PENDING subscription row.
     * The plan is NOT granted until an admin confirms the payment.
     */
    async manualUpgrade(
        userId: string,
        planId: string,
        cycle: BillingCycle,
        method: 'bank' | 'cash',
    ): Promise<{ status: 'pending'; plan: string }> {
        const entry = getPlan(planId);
        if (!entry || entry.id === 'free') throw new BadRequestException('Choose a paid plan.');

        const sub = this.subsRepo.create({
            userId,
            plan: entry.id,
            amount: amountFor(entry.id, cycle),
            currency: displayCurrency(),
            paymentMethod: method,
            paymentReference: `MANUAL_${method.toUpperCase()}_${Date.now()}`,
            status: SubStatus.PENDING, // not active until an admin confirms the payment
        });
        await this.subsRepo.save(sub);
        this.logger.log(`Manual ${method} upgrade requested by ${userId} for ${entry.id} (${cycle}) — awaiting admin confirm`);
        return { status: 'pending', plan: entry.id };
    }

    /**
     * Pay for a plan from the user's credit wallet. Debits the balance, then activates
     * the plan immediately. If activation fails after the debit, the charge is refunded
     * so the user is never left short. Throws BadRequestException (code
     * `insufficient_credits`) when the balance is too low — the FE offers a top-up.
     */
    async payWithCredits(
        userId: string,
        planId: string,
        cycle: BillingCycle,
    ): Promise<{ ok: true; plan: PlanId; balance: number }> {
        const entry = getPlan(planId);
        if (!entry || entry.id === 'free') throw new BadRequestException('Choose a paid plan (premium or business).');

        const amount = amountFor(entry.id, cycle);
        const note = `${entry.name} (${cycle})`;

        // Debit first (atomic + balance check inside chargeSubscription).
        const charge = await this.credits.chargeSubscription(userId, amount, note, entry.id);

        // Then grant the plan. Roll the charge back if anything goes wrong.
        try {
            await this.applyPlan(userId, entry.id as PlanId, cycle, {
                paymentMethod: 'credits',
                reference: `CREDITS_${Date.now()}`,
                status: SubStatus.ACTIVE,
            });
        } catch (err) {
            await this.credits.refund(userId, amount, `Refund — ${note} could not be activated`);
            this.logger.error(`payWithCredits: applyPlan failed for ${userId} (${entry.id}); refunded ${amount} TND`);
            throw err;
        }

        this.logger.log(`Credits checkout → ${entry.id} (${cycle}) for ${userId}, charged ${amount} TND`);
        return { ok: true, plan: entry.id as PlanId, balance: charge.balance };
    }

    /** Open the Stripe billing portal (manage card / cancel / invoices). */
    async createPortal(userId: string): Promise<{ url: string }> {
        if (!this.payments.stripeEnabled) {
            throw new BadRequestException('Billing portal is unavailable in mock mode.');
        }
        const user = await this.usersRepo.findOneOrFail({ where: { id: userId } });
        if (!user.stripeCustomerId) throw new BadRequestException('No Stripe customer for this account yet.');
        const session = await this.payments.createBillingPortalSession(user.stripeCustomerId, this.successUrl());
        return { url: session.url };
    }

    /** Cancel — downgrade to Free. Mock: immediate. (Real cancels arrive via webhook.) */
    async cancel(userId: string): Promise<{ plan: UserPlan }> {
        await this.usersRepo.update(userId, { plan: UserPlan.FREE, subscriptionExpiresAt: null as any });
        const active = await this.subsRepo.findOne({ where: { userId, status: SubStatus.ACTIVE } });
        if (active) {
            active.status = SubStatus.CANCELLED;
            await this.subsRepo.save(active);
        }
        return { plan: UserPlan.FREE };
    }

    /**
     * Apply a verified Stripe webhook event to plan state.
     * Handles subscription lifecycle so the DB mirrors Stripe.
     */
    async applyStripeEvent(event: any): Promise<void> {
        switch (event.type) {
            case 'checkout.session.completed': {
                const s = event.data.object;
                const userId = s.metadata?.userId;
                const planId = s.metadata?.planId as PlanId | undefined;
                const cycle = (s.metadata?.cycle as BillingCycle) || 'monthly';
                if (userId && planId) {
                    await this.applyPlan(userId, planId, cycle, {
                        paymentMethod: 'card',
                        reference: s.subscription || s.id,
                        customerId: s.customer,
                        status: SubStatus.ACTIVE,
                    });
                    this.logger.log(`Stripe checkout completed → ${planId} for ${userId}`);
                }
                break;
            }
            case 'customer.subscription.updated': {
                const sub = event.data.object;
                await this.syncFromStripeSubscription(sub);
                break;
            }
            case 'customer.subscription.deleted': {
                const sub = event.data.object;
                const user = await this.findUserByCustomer(sub.customer);
                if (user) {
                    await this.usersRepo.update(user.id, { plan: UserPlan.FREE, subscriptionExpiresAt: null as any });
                    this.logger.log(`Stripe subscription deleted → Free for ${user.id}`);
                }
                break;
            }
            default:
                break;
        }
    }

    // ─── internals ───────────────────────────────────────────────────────────────

    /** Set user.plan + expiry and upsert the Subscription record. */
    private async applyPlan(
        userId: string,
        planId: PlanId,
        cycle: BillingCycle,
        opts: { paymentMethod: string; reference?: string; customerId?: string; status: SubStatus },
    ): Promise<void> {
        const entry = getPlan(planId);
        if (!entry) return;

        const now = new Date();
        const expiresAt =
            cycle === 'yearly'
                ? new Date(now.getFullYear() + 1, now.getMonth(), now.getDate())
                : new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

        // Retire any currently-active sub for this user.
        const existing = await this.subsRepo.findOne({ where: { userId, status: SubStatus.ACTIVE } });
        if (existing) {
            existing.status = SubStatus.CANCELLED;
            await this.subsRepo.save(existing);
        }

        await this.subsRepo.save(this.subsRepo.create({
            userId,
            plan: entry.id,
            amount: amountFor(entry.id, cycle),
            currency: displayCurrency(),
            paymentMethod: opts.paymentMethod,
            paymentReference: opts.reference || `${opts.paymentMethod.toUpperCase()}_${Date.now()}`,
            status: opts.status,
            startsAt: now,
            expiresAt,
        }));

        const update: Partial<User> = { plan: entry.userPlan, subscriptionExpiresAt: expiresAt };
        if (opts.customerId) update.stripeCustomerId = opts.customerId;
        await this.usersRepo.update(userId, update);
    }

    /** Mirror a Stripe subscription object (period end + active/canceled) onto our user. */
    private async syncFromStripeSubscription(sub: any): Promise<void> {
        const user = await this.findUserByCustomer(sub.customer);
        if (!user) return;
        const periodEnd = sub.current_period_end ? new Date(sub.current_period_end * 1000) : null;
        const active = sub.status === 'active' || sub.status === 'trialing';
        if (!active) {
            await this.usersRepo.update(user.id, { plan: UserPlan.FREE, subscriptionExpiresAt: null as any });
            return;
        }
        // Plan stays as-is (set at checkout); just extend the expiry to the period end.
        if (periodEnd) await this.usersRepo.update(user.id, { subscriptionExpiresAt: periodEnd });
    }

    private async findUserByCustomer(customerId: string): Promise<User | null> {
        if (!customerId) return null;
        return this.usersRepo.findOne({ where: { stripeCustomerId: customerId } });
    }

    /** Get (or lazily create) the Stripe customer id for this user and persist it. */
    private async ensureCustomer(user: User): Promise<string> {
        if (user.stripeCustomerId) return user.stripeCustomerId;
        const customerId = await this.payments.getOrCreateCustomer({
            email: user.email,
            name: user.fullName,
            userId: user.id,
        });
        await this.usersRepo.update(user.id, { stripeCustomerId: customerId });
        return customerId;
    }

    private successUrl(): string {
        return this.config.get<string>('BILLING_SUCCESS_URL') || 'http://localhost:5173/#/premium/welcome';
    }

    private cancelUrl(): string {
        return this.config.get<string>('BILLING_CANCEL_URL') || 'http://localhost:5173/#/premium';
    }

    private apiBaseUrl(): string {
        return this.config.get<string>('PUBLIC_API_URL') || 'http://localhost:3000';
    }
}

// Kept for any callers that imported the standalone helper from here historically.
export { effectivePlanFor } from './plan-catalog';

function upgradeError(code: 'pro_required' | 'business_required'): ForbiddenException {
    const err = new ForbiddenException({
        message: code === 'pro_required'
            ? 'This feature requires Pro Traveler.'
            : 'This feature requires a Verified Business plan.',
        code,
    });
    return err;
}
