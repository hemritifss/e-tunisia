import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { User, UserPlan } from '../users/user.entity';
import { Subscription } from '../subscriptions/subscription.entity';
import { PaymentsService } from '../payments/payments.service';
import { FlouciService } from '../payments/flouci.service';
import { CreditsService } from '../credits/credits.service';
import { BillingCycle, FeatureCaps, PlanId } from './plan-catalog';
export { FeatureCaps } from './plan-catalog';
export declare class BillingService {
    private usersRepo;
    private subsRepo;
    private payments;
    private flouci;
    private credits;
    private config;
    private readonly logger;
    constructor(usersRepo: Repository<User>, subsRepo: Repository<Subscription>, payments: PaymentsService, flouci: FlouciService, credits: CreditsService, config: ConfigService);
    effectivePlan(userId: string): Promise<UserPlan>;
    caps(plan: UserPlan): FeatureCaps;
    assertFeature(userId: string, feature: keyof FeatureCaps | 'pro' | 'business'): Promise<void>;
    checkCap(userId: string, feature: 'maxTrips' | 'maxSaves', currentCount: number): Promise<{
        ok: boolean;
        cap: number;
        plan: UserPlan;
    }>;
    getCatalog(): {
        currency: string;
        plans: {
            id: PlanId;
            name: string;
            tagline: string;
            tint: string;
            monthly: number;
            yearly: number;
            features: string[];
            ctaLabel: string;
            featured: boolean;
            caps: {
                maxTrips: number;
                maxSaves: number;
                aiMessagesPerDay: number;
                customThemes: boolean;
                passportAnalytics: boolean;
                multiLangListings: boolean;
                canBoost: boolean;
                ownerDashboard: boolean;
            };
        }[];
    };
    createCheckout(userId: string, planId: string, cycle: BillingCycle): Promise<{
        url: string;
        mock: boolean;
    }>;
    createFlouciCheckout(userId: string, planId: string, cycle: BillingCycle): Promise<{
        url: string;
        mock: boolean;
    }>;
    handleFlouciReturn(paymentId: string): Promise<string>;
    manualUpgrade(userId: string, planId: string, cycle: BillingCycle, method: 'bank' | 'cash'): Promise<{
        status: 'pending';
        plan: string;
    }>;
    payWithCredits(userId: string, planId: string, cycle: BillingCycle): Promise<{
        ok: true;
        plan: PlanId;
        balance: number;
    }>;
    createPortal(userId: string): Promise<{
        url: string;
    }>;
    cancel(userId: string): Promise<{
        plan: UserPlan;
    }>;
    applyStripeEvent(event: any): Promise<void>;
    private applyPlan;
    private syncFromStripeSubscription;
    private findUserByCustomer;
    private ensureCustomer;
    private successUrl;
    private cancelUrl;
    private apiBaseUrl;
}
export { effectivePlanFor } from './plan-catalog';
