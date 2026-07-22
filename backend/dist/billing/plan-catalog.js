"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PLAN_CATALOG = exports.BUSINESS_CAPS = exports.PRO_CAPS = exports.FREE_CAPS = void 0;
exports.capsFor = capsFor;
exports.effectivePlanFor = effectivePlanFor;
exports.displayCurrency = displayCurrency;
exports.chargeCurrency = chargeCurrency;
exports.toStripeMinorUnits = toStripeMinorUnits;
exports.featureCount = featureCount;
exports.getPlan = getPlan;
exports.amountFor = amountFor;
exports.stripePriceIdFor = stripePriceIdFor;
exports.toPublicCatalog = toPublicCatalog;
const user_entity_1 = require("../users/user.entity");
exports.FREE_CAPS = {
    maxTrips: 3,
    maxSaves: 20,
    maxCollections: 3,
    suggestionWeight: 1,
    customThemes: false,
    passportAnalytics: false,
    multiLangListings: false,
    canBoost: false,
    ownerDashboard: false,
    aiMessagesPerDay: 5,
};
exports.PRO_CAPS = {
    maxTrips: Number.POSITIVE_INFINITY,
    maxSaves: Number.POSITIVE_INFINITY,
    maxCollections: Number.POSITIVE_INFINITY,
    suggestionWeight: 2,
    customThemes: true,
    passportAnalytics: true,
    multiLangListings: false,
    canBoost: false,
    ownerDashboard: false,
    aiMessagesPerDay: 100,
};
exports.BUSINESS_CAPS = {
    maxTrips: Number.POSITIVE_INFINITY,
    maxSaves: Number.POSITIVE_INFINITY,
    maxCollections: Number.POSITIVE_INFINITY,
    suggestionWeight: 2,
    customThemes: true,
    passportAnalytics: true,
    multiLangListings: true,
    canBoost: true,
    ownerDashboard: true,
    aiMessagesPerDay: Number.POSITIVE_INFINITY,
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
function featureCount(entry) {
    return entry.featureGroups.reduce((n, g) => n + g.items.length, 0);
}
exports.PLAN_CATALOG = [
    {
        id: 'free',
        userPlan: user_entity_1.UserPlan.FREE,
        name: 'Explorer',
        tagline: 'Everything you need to start wandering Tunisia',
        tint: 'var(--text-secondary)',
        monthly: 0,
        yearly: 0,
        stripePriceEnv: null,
        ctaLabel: 'Current plan',
        caps: exports.FREE_CAPS,
        features: [
            'Browse every place & hidden gem',
            'Read & write reviews',
            'Up to 3 saved trip plans · 20 saved places',
            'AI travel concierge — 5 chats a day',
            'Mood discovery, leaderboards & activity feed',
        ],
        featureGroups: [
            {
                label: 'The basics',
                icon: 'Compass',
                items: [
                    'Browse every place, event & hidden gem',
                    'Read & write reviews and check-ins',
                    'Collect governorate passport stamps',
                    'Up to 3 saved trip plans',
                    'Up to 20 saved places',
                    'AI travel concierge — 5 chats a day',
                    'Mood discovery, leaderboards & activity feed',
                ],
            },
        ],
    },
    {
        id: 'premium',
        userPlan: user_entity_1.UserPlan.PREMIUM,
        name: 'Pro Traveler',
        tagline: 'For explorers & creators who live in the app',
        tint: 'var(--gold)',
        monthly: 14.9,
        yearly: 149,
        stripePriceEnv: { monthly: 'STRIPE_PRICE_PREMIUM_MONTHLY', yearly: 'STRIPE_PRICE_PREMIUM_YEARLY' },
        ctaLabel: 'Upgrade to Pro',
        featured: true,
        caps: exports.PRO_CAPS,
        features: [
            'Everything in Free, uncapped',
            'AI concierge + itinerary builder — 100 chats a day',
            'Unlimited trip plans, saved places & carnet collections',
            'Collaborative carnets + auto-cover collages',
            'Gold Pro badge + custom passport themes',
            'Full hidden-gems radar — the whole map, unblurred',
            'Smart route optimizer, offline maps & live translate',
            'Ad-free everywhere + early access to events',
        ],
        featureGroups: [
            {
                label: 'AI & smart planning',
                icon: 'Sparkles',
                items: [
                    'AI travel concierge — 100 chats a day',
                    'AI itinerary builder — describe a vibe, get a day-by-day plan',
                    'Smart route optimizer — auto-orders each day to kill backtracking',
                    'Live translate — menus, signs & reviews in 30+ languages',
                    'Review summarizer — 200 reviews boiled down to 3 lines',
                    '“Surprise me” mood day — one-tap curated outing',
                ],
            },
            {
                label: 'Collections & carnets',
                icon: 'Layers',
                items: [
                    'Unlimited carnet collections — free stops at 3',
                    'Collaborative carnets — build a board live with friends',
                    'Auto-cover collages stitched from your places',
                    'Private carnets only you (and invitees) can see',
                    'Remix any editor collection into your own editable board',
                    'Export a carnet to a printable PDF + branded postcards',
                    'Send a whole collection straight to your trip in one tap',
                ],
            },
            {
                label: 'Your passport & profile',
                icon: 'BookMarked',
                items: [
                    'Unlimited trip plans & saved places',
                    'Gold Pro badge across the whole app',
                    'Custom passport themes & cover art',
                    'Passport analytics — see who viewed you',
                    'Animated + rare governorate stamps',
                    'Collectible louage-ticket keepsakes',
                ],
            },
            {
                label: 'Discovery & access',
                icon: 'Compass',
                items: [
                    'Full hidden-gems radar — the whole gem map, unblurred',
                    'Priority placement in suggestion feeds',
                    'Early access to events + ticket presales',
                    'Offline maps & guides for a whole governorate',
                    'Price-drop & event alerts on saved places',
                ],
            },
            {
                label: 'Create & share',
                icon: 'Share2',
                items: [
                    'Ad-free everywhere',
                    'Collaborative trips — plan live with friends',
                    'Export your carnet — printable PDF + branded postcards',
                ],
            },
        ],
    },
    {
        id: 'business',
        userPlan: user_entity_1.UserPlan.BUSINESS,
        name: 'Verified Business',
        tagline: 'For riads, restaurants, tours & agencies that want to grow',
        tint: 'var(--violet)',
        monthly: 74.9,
        yearly: 749,
        stripePriceEnv: { monthly: 'STRIPE_PRICE_BUSINESS_MONTHLY', yearly: 'STRIPE_PRICE_BUSINESS_YEARLY' },
        ctaLabel: 'Go Business',
        caps: exports.BUSINESS_CAPS,
        features: [
            'Everything in Pro, unlimited',
            'Verified Business badge + your own official page',
            'Boost & sponsored placement across search + feed',
            'Host events & sell tickets in-app',
            'Owner dashboard, real-time analytics & benchmarks',
            'Multi-language listings + reply to reviews as the business',
            '2 power controls: Team & Roles + API & Automations',
        ],
        featureGroups: [
            {
                label: 'Verification & presence',
                icon: 'BadgeCheck',
                items: [
                    'Everything in Pro — unlimited',
                    'Verified Business badge (blue check)',
                    'Claim & own your official place page',
                    'Rich profile — hours, menu, amenities, photos & video',
                    'Multiple locations under one account',
                    'Custom vanity URL / business handle',
                    'Featured logo + cover reel on your page',
                    'Verified owner-response badge on reviews',
                ],
            },
            {
                label: 'Growth & marketing',
                icon: 'TrendingUp',
                items: [
                    'Boost listings into featured slots',
                    'Sponsored placement in search & mood results',
                    'Branded collections — publish an official curated carnet',
                    'Get your places featured in editor & partner collections',
                    'Homepage & city-guide feature slots',
                    'Limited-time promos & deal badges',
                    'In-app coupon codes',
                    'Host events & sell tickets',
                    '“Happening now” broadcasts to nearby users',
                    'Seasonal campaign templates',
                    'Cross-promotion with partner businesses',
                    'Story ads in the feed',
                ],
            },
            {
                label: 'Customers & reviews',
                icon: 'MessagesSquare',
                items: [
                    'Owner dashboard & inquiry analytics',
                    'Direct inquiries & booking-request inbox',
                    'Reply to reviews as the business',
                    'Auto-translated replies (FR / AR / EN)',
                    'Saved reply templates',
                    'Review-request links (QR + shareable)',
                    'Instant new-review & reputation alerts',
                    'Review sentiment breakdown',
                    'Follower & repeat-visitor insights',
                    'Customer segments & saved audiences',
                ],
            },
            {
                label: 'Analytics & insight',
                icon: 'BarChart3',
                items: [
                    'Real-time views, saves, clicks & direction taps',
                    'Category benchmark vs. anonymized peers',
                    'Traffic sources & search-term report',
                    'Peak-hours & footfall heatmap',
                    'Conversion funnel — view → inquiry → visit',
                    'Weekly performance email digest',
                    'Exportable CSV / PDF reports',
                    'UTM-tagged share links',
                ],
            },
            {
                label: 'Listings & content',
                icon: 'LayoutList',
                items: [
                    'Multi-language listings (FR / AR / EN)',
                    'Menu / catalog / price-list module',
                    'Bookable services & opening-hours engine',
                    'Amenities, tags & accessibility info',
                    'Photo & video gallery with cover reel',
                    'Schedule posts & announcements',
                    'Bulk photo & listing import',
                ],
            },
            {
                label: 'Support & trust',
                icon: 'LifeBuoy',
                items: [
                    'Priority partner support (24h)',
                    'Dedicated account manager (annual plans)',
                    'Guided onboarding & profile-optimization session',
                    'Fake-review & fraud protection',
                    'Verified-payment trust seal',
                    'Early access to new business tools (beta)',
                    'Partner community & networking events',
                ],
            },
        ],
        advancedControls: [
            {
                title: 'Team & Roles control center',
                desc: 'Invite staff and assign Owner, Manager, Editor or Analyst roles with scoped permissions — plus a full activity audit log of who changed what.',
                icon: 'Users',
            },
            {
                title: 'Business API & Automations',
                desc: 'API keys + webhooks to sync hours, menu and inventory, auto-reply rules for reviews and inquiries, and no-code automations that run your listing on autopilot.',
                icon: 'Webhook',
            },
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
            featureGroups: p.featureGroups,
            featureCount: featureCount(p),
            advancedControls: p.advancedControls ?? [],
            ctaLabel: p.ctaLabel,
            featured: !!p.featured,
            caps: {
                maxTrips: Number.isFinite(p.caps.maxTrips) ? p.caps.maxTrips : null,
                maxSaves: Number.isFinite(p.caps.maxSaves) ? p.caps.maxSaves : null,
                maxCollections: Number.isFinite(p.caps.maxCollections) ? p.caps.maxCollections : null,
                aiMessagesPerDay: Number.isFinite(p.caps.aiMessagesPerDay) ? p.caps.aiMessagesPerDay : null,
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