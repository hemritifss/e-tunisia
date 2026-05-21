import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserPlan } from '../users/user.entity';

/**
 * Plan-aware feature gating. The Source of Truth for "what can this user do".
 *
 * Two responsibilities:
 *   1. Resolve the *effective* plan (accounting for expired subscriptions
 *      that the DB still says are Premium/Business).
 *   2. Hand out feature caps per plan, and assert features as needed.
 *
 * Everything that gates on tier (write endpoints, suggestion weights,
 * analytics endpoints) goes through this single service.
 */
@Injectable()
export class BillingService {
    constructor(
        @InjectRepository(User) private usersRepo: Repository<User>,
    ) {}

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

    /** Return the feature caps for a plan. Single source of truth — no caps live elsewhere. */
    caps(plan: UserPlan): FeatureCaps {
        if (plan === UserPlan.BUSINESS) return BUSINESS_CAPS;
        if (plan === UserPlan.PREMIUM) return PRO_CAPS;
        return FREE_CAPS;
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
}

export interface FeatureCaps {
    /** Max saved trip plans per user. Infinity = unlimited. */
    maxTrips: number;
    /** Max combined saved places + posts. Infinity = unlimited. */
    maxSaves: number;
    /** Boost weight applied to this user in suggestion endpoints. */
    suggestionWeight: number;
    /** Whether the user can choose a custom passport theme. */
    customThemes: boolean;
    /** Whether the user can view their own passport analytics dashboard. */
    passportAnalytics: boolean;
    /** Whether the user can post in N languages on their places. */
    multiLangListings: boolean;
    /** Whether the user can boost places. */
    canBoost: boolean;
    /** Whether the user can access the owner dashboard. */
    ownerDashboard: boolean;
}

export const FREE_CAPS: FeatureCaps = {
    maxTrips: 3,
    maxSaves: 20,
    suggestionWeight: 1,
    customThemes: false,
    passportAnalytics: false,
    multiLangListings: false,
    canBoost: false,
    ownerDashboard: false,
};

export const PRO_CAPS: FeatureCaps = {
    maxTrips: Number.POSITIVE_INFINITY,
    maxSaves: Number.POSITIVE_INFINITY,
    suggestionWeight: 2,
    customThemes: true,
    passportAnalytics: true,
    multiLangListings: false,
    canBoost: false,
    ownerDashboard: false,
};

export const BUSINESS_CAPS: FeatureCaps = {
    maxTrips: Number.POSITIVE_INFINITY,
    maxSaves: Number.POSITIVE_INFINITY,
    suggestionWeight: 2,
    customThemes: true,
    passportAnalytics: true,
    multiLangListings: true,
    canBoost: true,
    ownerDashboard: true,
};

/** Stand-alone helper so other services can compute effective plan without DI. */
export function effectivePlanFor(u: { plan?: UserPlan; subscriptionExpiresAt?: Date | null }): UserPlan {
    const plan = u?.plan ?? UserPlan.FREE;
    if (plan === UserPlan.FREE) return UserPlan.FREE;
    const exp = u?.subscriptionExpiresAt;
    if (!exp) return plan; // never expires (legacy / lifetime)
    return new Date(exp).getTime() > Date.now() ? plan : UserPlan.FREE;
}

function upgradeError(code: 'pro_required' | 'business_required'): ForbiddenException {
    const err = new ForbiddenException({
        message: code === 'pro_required'
            ? 'This feature requires Pro Traveler.'
            : 'This feature requires a Verified Business plan.',
        code,
    });
    return err;
}
