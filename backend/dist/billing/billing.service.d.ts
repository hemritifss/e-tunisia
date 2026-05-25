import { Repository } from 'typeorm';
import { User, UserPlan } from '../users/user.entity';
export declare class BillingService {
    private usersRepo;
    constructor(usersRepo: Repository<User>);
    effectivePlan(userId: string): Promise<UserPlan>;
    caps(plan: UserPlan): FeatureCaps;
    assertFeature(userId: string, feature: keyof FeatureCaps | 'pro' | 'business'): Promise<void>;
    checkCap(userId: string, feature: 'maxTrips' | 'maxSaves', currentCount: number): Promise<{
        ok: boolean;
        cap: number;
        plan: UserPlan;
    }>;
}
export interface FeatureCaps {
    maxTrips: number;
    maxSaves: number;
    suggestionWeight: number;
    customThemes: boolean;
    passportAnalytics: boolean;
    multiLangListings: boolean;
    canBoost: boolean;
    ownerDashboard: boolean;
}
export declare const FREE_CAPS: FeatureCaps;
export declare const PRO_CAPS: FeatureCaps;
export declare const BUSINESS_CAPS: FeatureCaps;
export declare function effectivePlanFor(u: {
    plan?: UserPlan;
    subscriptionExpiresAt?: Date | null;
}): UserPlan;
