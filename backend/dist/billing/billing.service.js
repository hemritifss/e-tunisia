"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var BillingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.effectivePlanFor = exports.BillingService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const config_1 = require("@nestjs/config");
const user_entity_1 = require("../users/user.entity");
const subscription_entity_1 = require("../subscriptions/subscription.entity");
const payments_service_1 = require("../payments/payments.service");
const flouci_service_1 = require("../payments/flouci.service");
const credits_service_1 = require("../credits/credits.service");
const plan_catalog_1 = require("./plan-catalog");
let BillingService = BillingService_1 = class BillingService {
    constructor(usersRepo, subsRepo, payments, flouci, credits, config) {
        this.usersRepo = usersRepo;
        this.subsRepo = subsRepo;
        this.payments = payments;
        this.flouci = flouci;
        this.credits = credits;
        this.config = config;
        this.logger = new common_1.Logger(BillingService_1.name);
    }
    async effectivePlan(userId) {
        if (!userId)
            return user_entity_1.UserPlan.FREE;
        const u = await this.usersRepo.findOne({
            where: { id: userId },
            select: ['id', 'plan', 'subscriptionExpiresAt'],
        });
        if (!u)
            return user_entity_1.UserPlan.FREE;
        return (0, plan_catalog_1.effectivePlanFor)(u);
    }
    caps(plan) {
        return (0, plan_catalog_1.capsFor)(plan);
    }
    async assertFeature(userId, feature) {
        const plan = await this.effectivePlan(userId);
        if (feature === 'pro') {
            if (plan === user_entity_1.UserPlan.FREE)
                throw upgradeError('pro_required');
            return;
        }
        if (feature === 'business') {
            if (plan !== user_entity_1.UserPlan.BUSINESS)
                throw upgradeError('business_required');
            return;
        }
        const caps = this.caps(plan);
        const val = caps[feature];
        if (val === true)
            return;
        if (val === Infinity)
            return;
        if (typeof val === 'number')
            return;
        throw upgradeError('pro_required');
    }
    async checkCap(userId, feature, currentCount) {
        const plan = await this.effectivePlan(userId);
        const cap = this.caps(plan)[feature];
        return { ok: currentCount < cap, cap, plan };
    }
    getCatalog() {
        return (0, plan_catalog_1.toPublicCatalog)();
    }
    async createCheckout(userId, planId, cycle) {
        const entry = (0, plan_catalog_1.getPlan)(planId);
        if (!entry || entry.id === 'free')
            throw new common_1.BadRequestException('Choose a paid plan (premium or business).');
        const successUrl = this.successUrl();
        const cancelUrl = this.cancelUrl();
        const priceId = (0, plan_catalog_1.stripePriceIdFor)(entry, cycle);
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
        await this.applyPlan(userId, entry.id, cycle, {
            paymentMethod: 'mock',
            reference: `MOCK_${Date.now()}`,
            status: subscription_entity_1.SubStatus.ACTIVE,
        });
        const sep = successUrl.includes('?') ? '&' : '?';
        return { url: `${successUrl}${sep}mock=1&plan=${entry.id}`, mock: true };
    }
    async createFlouciCheckout(userId, planId, cycle) {
        const entry = (0, plan_catalog_1.getPlan)(planId);
        if (!entry || entry.id === 'free')
            throw new common_1.BadRequestException('Choose a paid plan (premium or business).');
        if (!this.flouci.enabled) {
            await this.applyPlan(userId, entry.id, cycle, {
                paymentMethod: 'flouci',
                reference: `FLOUCI_MOCK_${Date.now()}`,
                status: subscription_entity_1.SubStatus.ACTIVE,
            });
            const sep = this.successUrl().includes('?') ? '&' : '?';
            return { url: `${this.successUrl()}${sep}mock=1&plan=${entry.id}`, mock: true };
        }
        const amount = (0, plan_catalog_1.amountFor)(entry.id, cycle);
        const returnLink = `${this.apiBaseUrl()}/api/v1/billing/flouci/return`;
        const { link, paymentId } = await this.flouci.generatePayment({
            amountTnd: amount,
            successLink: returnLink,
            failLink: returnLink,
            trackingId: `${userId}:${entry.id}:${cycle}`,
        });
        await this.subsRepo.save(this.subsRepo.create({
            userId,
            plan: entry.id,
            amount,
            currency: (0, plan_catalog_1.displayCurrency)(),
            paymentMethod: 'flouci',
            paymentReference: `FLOUCI_${paymentId}`,
            status: subscription_entity_1.SubStatus.PENDING,
        }));
        return { url: link, mock: false };
    }
    async handleFlouciReturn(paymentId) {
        if (!paymentId)
            return this.cancelUrl();
        const sub = await this.subsRepo.findOne({ where: { paymentReference: `FLOUCI_${paymentId}` } });
        if (!sub)
            return this.cancelUrl();
        const successWithPlan = () => {
            const sep = this.successUrl().includes('?') ? '&' : '?';
            return `${this.successUrl()}${sep}plan=${sub.plan}`;
        };
        if (sub.status === subscription_entity_1.SubStatus.ACTIVE)
            return successWithPlan();
        const { success } = await this.flouci.verifyPayment(paymentId);
        if (!success) {
            sub.status = subscription_entity_1.SubStatus.CANCELLED;
            await this.subsRepo.save(sub);
            return this.cancelUrl();
        }
        const entry = (0, plan_catalog_1.getPlan)(sub.plan);
        const isYearly = entry ? Math.abs(Number(sub.amount) - entry.yearly) < 0.01 : false;
        const now = new Date();
        const expiresAt = isYearly
            ? new Date(now.getFullYear() + 1, now.getMonth(), now.getDate())
            : new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
        await this.subsRepo.update({ userId: sub.userId, status: subscription_entity_1.SubStatus.ACTIVE }, { status: subscription_entity_1.SubStatus.CANCELLED });
        sub.status = subscription_entity_1.SubStatus.ACTIVE;
        sub.startsAt = now;
        sub.expiresAt = expiresAt;
        await this.subsRepo.save(sub);
        await this.usersRepo.update(sub.userId, {
            plan: entry?.userPlan ?? user_entity_1.UserPlan.FREE,
            subscriptionExpiresAt: expiresAt,
        });
        return successWithPlan();
    }
    async manualUpgrade(userId, planId, cycle, method) {
        const entry = (0, plan_catalog_1.getPlan)(planId);
        if (!entry || entry.id === 'free')
            throw new common_1.BadRequestException('Choose a paid plan.');
        const sub = this.subsRepo.create({
            userId,
            plan: entry.id,
            amount: (0, plan_catalog_1.amountFor)(entry.id, cycle),
            currency: (0, plan_catalog_1.displayCurrency)(),
            paymentMethod: method,
            paymentReference: `MANUAL_${method.toUpperCase()}_${Date.now()}`,
            status: subscription_entity_1.SubStatus.PENDING,
        });
        await this.subsRepo.save(sub);
        this.logger.log(`Manual ${method} upgrade requested by ${userId} for ${entry.id} (${cycle}) — awaiting admin confirm`);
        return { status: 'pending', plan: entry.id };
    }
    async payWithCredits(userId, planId, cycle) {
        const entry = (0, plan_catalog_1.getPlan)(planId);
        if (!entry || entry.id === 'free')
            throw new common_1.BadRequestException('Choose a paid plan (premium or business).');
        const amount = (0, plan_catalog_1.amountFor)(entry.id, cycle);
        const note = `${entry.name} (${cycle})`;
        const charge = await this.credits.chargeSubscription(userId, amount, note, entry.id);
        try {
            await this.applyPlan(userId, entry.id, cycle, {
                paymentMethod: 'credits',
                reference: `CREDITS_${Date.now()}`,
                status: subscription_entity_1.SubStatus.ACTIVE,
            });
        }
        catch (err) {
            await this.credits.refund(userId, amount, `Refund — ${note} could not be activated`);
            this.logger.error(`payWithCredits: applyPlan failed for ${userId} (${entry.id}); refunded ${amount} TND`);
            throw err;
        }
        this.logger.log(`Credits checkout → ${entry.id} (${cycle}) for ${userId}, charged ${amount} TND`);
        return { ok: true, plan: entry.id, balance: charge.balance };
    }
    async createPortal(userId) {
        if (!this.payments.stripeEnabled) {
            throw new common_1.BadRequestException('Billing portal is unavailable in mock mode.');
        }
        const user = await this.usersRepo.findOneOrFail({ where: { id: userId } });
        if (!user.stripeCustomerId)
            throw new common_1.BadRequestException('No Stripe customer for this account yet.');
        const session = await this.payments.createBillingPortalSession(user.stripeCustomerId, this.successUrl());
        return { url: session.url };
    }
    async cancel(userId) {
        await this.usersRepo.update(userId, { plan: user_entity_1.UserPlan.FREE, subscriptionExpiresAt: null });
        const active = await this.subsRepo.findOne({ where: { userId, status: subscription_entity_1.SubStatus.ACTIVE } });
        if (active) {
            active.status = subscription_entity_1.SubStatus.CANCELLED;
            await this.subsRepo.save(active);
        }
        return { plan: user_entity_1.UserPlan.FREE };
    }
    async applyStripeEvent(event) {
        switch (event.type) {
            case 'checkout.session.completed': {
                const s = event.data.object;
                const userId = s.metadata?.userId;
                const planId = s.metadata?.planId;
                const cycle = s.metadata?.cycle || 'monthly';
                if (userId && planId) {
                    await this.applyPlan(userId, planId, cycle, {
                        paymentMethod: 'card',
                        reference: s.subscription || s.id,
                        customerId: s.customer,
                        status: subscription_entity_1.SubStatus.ACTIVE,
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
                    await this.usersRepo.update(user.id, { plan: user_entity_1.UserPlan.FREE, subscriptionExpiresAt: null });
                    this.logger.log(`Stripe subscription deleted → Free for ${user.id}`);
                }
                break;
            }
            default:
                break;
        }
    }
    async applyPlan(userId, planId, cycle, opts) {
        const entry = (0, plan_catalog_1.getPlan)(planId);
        if (!entry)
            return;
        const now = new Date();
        const expiresAt = cycle === 'yearly'
            ? new Date(now.getFullYear() + 1, now.getMonth(), now.getDate())
            : new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
        const existing = await this.subsRepo.findOne({ where: { userId, status: subscription_entity_1.SubStatus.ACTIVE } });
        if (existing) {
            existing.status = subscription_entity_1.SubStatus.CANCELLED;
            await this.subsRepo.save(existing);
        }
        await this.subsRepo.save(this.subsRepo.create({
            userId,
            plan: entry.id,
            amount: (0, plan_catalog_1.amountFor)(entry.id, cycle),
            currency: (0, plan_catalog_1.displayCurrency)(),
            paymentMethod: opts.paymentMethod,
            paymentReference: opts.reference || `${opts.paymentMethod.toUpperCase()}_${Date.now()}`,
            status: opts.status,
            startsAt: now,
            expiresAt,
        }));
        const update = { plan: entry.userPlan, subscriptionExpiresAt: expiresAt };
        if (opts.customerId)
            update.stripeCustomerId = opts.customerId;
        await this.usersRepo.update(userId, update);
    }
    async syncFromStripeSubscription(sub) {
        const user = await this.findUserByCustomer(sub.customer);
        if (!user)
            return;
        const periodEnd = sub.current_period_end ? new Date(sub.current_period_end * 1000) : null;
        const active = sub.status === 'active' || sub.status === 'trialing';
        if (!active) {
            await this.usersRepo.update(user.id, { plan: user_entity_1.UserPlan.FREE, subscriptionExpiresAt: null });
            return;
        }
        if (periodEnd)
            await this.usersRepo.update(user.id, { subscriptionExpiresAt: periodEnd });
    }
    async findUserByCustomer(customerId) {
        if (!customerId)
            return null;
        return this.usersRepo.findOne({ where: { stripeCustomerId: customerId } });
    }
    async ensureCustomer(user) {
        if (user.stripeCustomerId)
            return user.stripeCustomerId;
        const customerId = await this.payments.getOrCreateCustomer({
            email: user.email,
            name: user.fullName,
            userId: user.id,
        });
        await this.usersRepo.update(user.id, { stripeCustomerId: customerId });
        return customerId;
    }
    successUrl() {
        return this.config.get('BILLING_SUCCESS_URL') || 'http://localhost:5173/#/premium/welcome';
    }
    cancelUrl() {
        return this.config.get('BILLING_CANCEL_URL') || 'http://localhost:5173/#/premium';
    }
    apiBaseUrl() {
        return this.config.get('PUBLIC_API_URL') || 'http://localhost:3000';
    }
};
exports.BillingService = BillingService;
exports.BillingService = BillingService = BillingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(subscription_entity_1.Subscription)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        payments_service_1.PaymentsService,
        flouci_service_1.FlouciService,
        credits_service_1.CreditsService,
        config_1.ConfigService])
], BillingService);
var plan_catalog_2 = require("./plan-catalog");
Object.defineProperty(exports, "effectivePlanFor", { enumerable: true, get: function () { return plan_catalog_2.effectivePlanFor; } });
function upgradeError(code) {
    const err = new common_1.ForbiddenException({
        message: code === 'pro_required'
            ? 'This feature requires Pro Traveler.'
            : 'This feature requires a Verified Business plan.',
        code,
    });
    return err;
}
//# sourceMappingURL=billing.service.js.map