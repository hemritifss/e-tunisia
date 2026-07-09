/**
 * Pure helper: resolves the user's current effective subscription plan.
 *
 * Reads `user.plan` and `user.subscriptionExpiresAt` — if a Pro/Business
 * subscription has lapsed, silently downgrades to 'free' WITHOUT touching
 * the DB. This is the single source of truth used by every service that
 * exposes a user in an API payload (posts, leaderboards, activity feed,
 * user search), so 'has this user expired?' is decided in one place.
 */
export function effectivePlan(user: { plan?: string | null; subscriptionExpiresAt?: Date | string | null } | null | undefined):
    'free' | 'premium' | 'business' {
    if (!user) return 'free';
    const plan = (user.plan || 'free').toLowerCase();
    if (plan === 'free') return 'free';
    const exp = user.subscriptionExpiresAt;
    if (exp && new Date(exp).getTime() < Date.now()) return 'free';
    return plan === 'business' ? 'business' : 'premium';
}
