export declare function effectivePlan(user: {
    plan?: string | null;
    subscriptionExpiresAt?: Date | string | null;
} | null | undefined): 'free' | 'premium' | 'business';
