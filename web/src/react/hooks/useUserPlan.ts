import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../shared/api';

export type PlanId = 'free' | 'premium' | 'business' | 'admin';

export interface FeatureCaps {
    maxTrips: number | null;       // null = unlimited
    maxSaves: number | null;
    suggestionWeight: number;
    customThemes: boolean;
    passportAnalytics: boolean;
    multiLangListings: boolean;
    canBoost: boolean;
    ownerDashboard: boolean;
}

export interface PlanState {
    plan: PlanId;
    rawPlan: PlanId;
    expiresAt: string | null;
    caps: FeatureCaps;
}

const FREE_FALLBACK: PlanState = {
    plan: 'free',
    rawPlan: 'free',
    expiresAt: null,
    caps: {
        maxTrips: 3,
        maxSaves: 20,
        suggestionWeight: 1,
        customThemes: false,
        passportAnalytics: false,
        multiLangListings: false,
        canBoost: false,
        ownerDashboard: false,
    },
};

function isAuthed(): boolean {
    try { return !!localStorage.getItem('etunisia_token'); } catch { return false; }
}

export function useUserPlan(): PlanState & { isLoading: boolean; refetch: () => void } {
    const queryClient = useQueryClient();
    const enabled = isAuthed();

    const { data, isLoading } = useQuery({
        queryKey: ['my-plan'],
        queryFn: async () => {
            const r: any = await api.getMyPlan();
            return (r && r.plan ? r : null) as PlanState | null;
        },
        enabled,
        staleTime: 5 * 60_000,
    });

    return {
        ...(data || FREE_FALLBACK),
        isLoading,
        refetch: () => { queryClient.invalidateQueries({ queryKey: ['my-plan'] }); },
    };
}

/** Cheap helpers for component code. */
export function isPro(plan: PlanState | PlanId): boolean {
    const p = typeof plan === 'string' ? plan : plan.plan;
    return p === 'premium' || p === 'business' || p === 'admin';
}
export function isBusiness(plan: PlanState | PlanId): boolean {
    const p = typeof plan === 'string' ? plan : plan.plan;
    return p === 'business' || p === 'admin';
}
