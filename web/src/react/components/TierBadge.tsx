import React from 'react';

type PlanLike = string | { plan?: string; role?: string } | null | undefined;

/**
 * The visible signal of paid status across the platform. One component,
 * five visual modes, ~12 mount points (feed bylines, leaderboards,
 * suggestion rows, search results, passport hero, place cards).
 *
 * Renders nothing for Free users — we don't tag the absence of a plan,
 * we tag presence.
 */
interface Props {
    plan?: PlanLike;
    role?: string | null;
    size?: 'xs' | 'sm' | 'md';
    /** If true, ✓ Verified Local Guide stacks alongside ✦ Pro when applicable. */
    showGuide?: boolean;
    /** Tooltip override. */
    title?: string;
}

function resolvePlan(plan: PlanLike): string {
    if (!plan) return 'free';
    if (typeof plan === 'string') return plan.toLowerCase();
    return (plan.plan || 'free').toLowerCase();
}

export function TierBadge({ plan, role, size = 'sm', showGuide = true, title }: Props) {
    const p = resolvePlan(plan);
    const isGuide = role === 'creator';
    const isBusiness = p === 'business';
    const isPro = p === 'premium' || isBusiness;
    if (!isPro && !(showGuide && isGuide)) return null;

    const sizeClass = `tier-badge tier-badge-${size}`;

    return (
        <span className="tier-badge-group">
            {isPro && (
                <span
                    className={`${sizeClass} tier-badge-${isBusiness ? 'business' : 'pro'}`}
                    title={title || (isBusiness ? 'Verified Business' : 'Pro Traveler')}
                    aria-label={isBusiness ? 'Verified Business' : 'Pro Traveler'}
                >
                    {isBusiness ? '✓' : '✦'}
                </span>
            )}
            {showGuide && isGuide && !isBusiness && (
                <span
                    className={`${sizeClass} tier-badge-guide`}
                    title="Local Guide"
                    aria-label="Local Guide"
                >
                    ✓
                </span>
            )}
        </span>
    );
}
