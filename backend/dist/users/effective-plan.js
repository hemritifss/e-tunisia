"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.effectivePlan = effectivePlan;
function effectivePlan(user) {
    if (!user)
        return 'free';
    const plan = (user.plan || 'free').toLowerCase();
    if (plan === 'free')
        return 'free';
    const exp = user.subscriptionExpiresAt;
    if (exp && new Date(exp).getTime() < Date.now())
        return 'free';
    return plan === 'business' ? 'business' : 'premium';
}
//# sourceMappingURL=effective-plan.js.map