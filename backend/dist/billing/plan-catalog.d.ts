import { UserPlan } from '../users/user.entity';
export type PlanId = 'free' | 'premium' | 'business';
export type BillingCycle = 'monthly' | 'yearly';
export interface FeatureCaps {
    maxTrips: number;
    maxSaves: number;
    suggestionWeight: number;
    customThemes: boolean;
    passportAnalytics: boolean;
    multiLangListings: boolean;
    canBoost: boolean;
    ownerDashboard: boolean;
    aiMessagesPerDay: number;
}
export declare const FREE_CAPS: FeatureCaps;
export declare const PRO_CAPS: FeatureCaps;
export declare const BUSINESS_CAPS: FeatureCaps;
export declare function capsFor(plan: UserPlan): FeatureCaps;
export declare function effectivePlanFor(u: {
    plan?: UserPlan;
    subscriptionExpiresAt?: Date | null;
}): UserPlan;
export declare function displayCurrency(): string;
export declare function chargeCurrency(): string;
export declare function toStripeMinorUnits(amountMajor: number, currency: string): number;
export interface PlanCatalogEntry {
    id: PlanId;
    userPlan: UserPlan;
    name: string;
    tagline: string;
    tint: string;
    monthly: number;
    yearly: number;
    stripePriceEnv: {
        monthly: string;
        yearly: string;
    } | null;
    features: string[];
    ctaLabel: string;
    featured?: boolean;
    caps: FeatureCaps;
}
export declare const PLAN_CATALOG: PlanCatalogEntry[];
export declare function getPlan(id: string): PlanCatalogEntry | undefined;
export declare function amountFor(id: string, cycle: BillingCycle): number;
export declare function stripePriceIdFor(entry: PlanCatalogEntry, cycle: BillingCycle): string | null;
export declare function toPublicCatalog(): {
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
