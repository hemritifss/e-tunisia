"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PLAN_CATALOG = exports.BUSINESS_CAPS = exports.PRO_CAPS = exports.FREE_CAPS = void 0;
exports.capsFor = capsFor;
exports.effectivePlanFor = effectivePlanFor;
exports.displayCurrency = displayCurrency;
exports.chargeCurrency = chargeCurrency;
exports.toStripeMinorUnits = toStripeMinorUnits;
exports.getPlan = getPlan;
exports.amountFor = amountFor;
exports.stripePriceIdFor = stripePriceIdFor;
exports.toPublicCatalog = toPublicCatalog;
const user_entity_1 = require("../users/user.entity");
exports.FREE_CAPS = {
    maxTrips: 3,
    maxSaves: 20,
    suggestionWeight: 1,
    customThemes: false,
    passportAnalytics: false,
    multiLangListings: false,
    canBoost: false,
    ownerDashboard: false,
};
exports.PRO_CAPS = {
    maxTrips: Number.POSITIVE_INFINITY,
    maxSaves: Number.POSITIVE_INFINITY,
    suggestionWeight: 2,
    customThemes: true,
    passportAnalytics: true,
    multiLangListings: false,
    canBoost: false,
    ownerDashboard: false,
};
exports.BUSINESS_CAPS = {
    maxTrips: Number.POSITIVE_INFINITY,
    maxSaves: Number.POSITIVE_INFINITY,
    suggestionWeight: 2,
    customThemes: true,
    passportAnalytics: true,
    multiLangListings: true,
    canBoost: true,
    ownerDashboard: true,
};
function capsFor(plan) {
    if (plan === user_entity_1.UserPlan.BUSINESS)
        return exports.BUSINESS_CAPS;
    if (plan === user_entity_1.UserPlan.PREMIUM)
        return exports.PRO_CAPS;
    return exports.FREE_CAPS;
}
function effectivePlanFor(u) {
    const plan = u?.plan ?? user_entity_1.UserPlan.FREE;
    if (plan === user_entity_1.UserPlan.FREE)
        return user_entity_1.UserPlan.FREE;
    const exp = u?.subscriptionExpiresAt;
    if (!exp)
        return plan;
    return new Date(exp).getTime() > Date.now() ? plan : user_entity_1.UserPlan.FREE;
}
function displayCurrency() {
    return (process.env.BILLING_DISPLAY_CURRENCY || 'TND').toUpperCase();
}
function chargeCurrency() {
    return (process.env.BILLING_CHARGE_CURRENCY || displayCurrency()).toUpperCase();
}
const THREE_DECIMAL = new Set(['BHD', 'JOD', 'KWD', 'OMR', 'TND']);
const ZERO_DECIMAL = new Set([
    'BIF', 'CLP', 'DJF', 'GNF', 'JPY', 'KMF', 'KRW', 'MGA',
    'PYG', 'RWF', 'UGX', 'VND', 'VUV', 'XAF', 'XOF', 'XPF',
]);
function toStripeMinorUnits(amountMajor, currency) {
    const c = currency.toUpperCase();
    if (ZERO_DECIMAL.has(c))
        return Math.round(amountMajor);
    if (THREE_DECIMAL.has(c))
        return Math.round((amountMajor * 1000) / 10) * 10;
    return Math.round(amountMajor * 100);
}
exports.PLAN_CATALOG = [
    {
        id: 'free',
        userPlan: user_entity_1.UserPlan.FREE,
        name: 'Free',
        tagline: 'Everything you need to start exploring',
        tint: 'var(--text-secondary)',
        monthly: 0,
        yearly: 0,
        stripePriceEnv: null,
        ctaLabel: 'Current plan',
        caps: exports.FREE_CAPS,
        features: [
            'Browse every place & hidden gem',
            'Read & write reviews',
            'Up to 3 saved trip plans',
            'Up to 20 saved places',
            'Mood discovery, leaderboards & activity feed',
        ],
    },
    {
        id: 'premium',
        userPlan: user_entity_1.UserPlan.PREMIUM,
        name: 'Pro Traveler',
        tagline: 'For active explorers & creators',
        tint: 'var(--gold)',
        monthly: 14.9,
        yearly: 149,
        stripePriceEnv: { monthly: 'STRIPE_PRICE_PREMIUM_MONTHLY', yearly: 'STRIPE_PRICE_PREMIUM_YEARLY' },
        ctaLabel: 'Upgrade to Pro',
        featured: true,
        caps: exports.PRO_CAPS,
        features: [
            'Everything in Free',
            'Unlimited trip plans & saves',
            'Gold Pro badge across the app',
            'Custom passport themes',
            'Passport analytics — who viewed you',
            'Priority in suggestion feeds',
            'Ad-free experience & early event access',
        ],
    },
    {
        id: 'business',
        userPlan: user_entity_1.UserPlan.BUSINESS,
        name: 'Verified Business',
        tagline: 'For riads, restaurants, tours & agencies',
        tint: 'var(--violet)',
        monthly: 74.9,
        yearly: 749,
        stripePriceEnv: { monthly: 'STRIPE_PRICE_BUSINESS_MONTHLY', yearly: 'STRIPE_PRICE_BUSINESS_YEARLY' },
        ctaLabel: 'Go Business',
        caps: exports.BUSINESS_CAPS,
        features: [
            'Everything in Pro',
            'Verified business badge',
            'Owner dashboard & inquiry analytics',
            'Boost listings into featured slots',
            'Multi-language listings (FR / AR / EN)',
            'Reply to reviews as the business',
            'Priority partner support',
        ],
    },
];
function getPlan(id) {
    return exports.PLAN_CATALOG.find((p) => p.id === id);
}
function amountFor(id, cycle) {
    const p = getPlan(id);
    if (!p)
        return 0;
    return cycle === 'yearly' ? p.yearly : p.monthly;
}
function stripePriceIdFor(entry, cycle) {
    if (!entry.stripePriceEnv)
        return null;
    const envName = cycle === 'yearly' ? entry.stripePriceEnv.yearly : entry.stripePriceEnv.monthly;
    return process.env[envName] || null;
}
function toPublicCatalog() {
    const currency = displayCurrency();
    return {
        currency,
        plans: exports.PLAN_CATALOG.map((p) => ({
            id: p.id,
            name: p.name,
            tagline: p.tagline,
            tint: p.tint,
            monthly: p.monthly,
            yearly: p.yearly,
            features: p.features,
            ctaLabel: p.ctaLabel,
            featured: !!p.featured,
            caps: {
                maxTrips: Number.isFinite(p.caps.maxTrips) ? p.caps.maxTrips : null,
                maxSaves: Number.isFinite(p.caps.maxSaves) ? p.caps.maxSaves : null,
                customThemes: p.caps.customThemes,
                passportAnalytics: p.caps.passportAnalytics,
                multiLangListings: p.caps.multiLangListings,
                canBoost: p.caps.canBoost,
                ownerDashboard: p.caps.ownerDashboard,
            },
        })),
    };
}
//# sourceMappingURL=plan-catalog.js.map