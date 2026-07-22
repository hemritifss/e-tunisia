import { UserPlan } from '../users/user.entity';

/**
 * THE single source of truth for plans — price, caps, and marketing copy all live here.
 *
 * Before this file there were three disagreeing price books (subscriptions.service,
 * premium.ts, partner.ts). Everything money-related now derives from PLAN_CATALOG:
 *   - billing.service consumes `capsFor()` / `effectivePlanFor()` for feature gating
 *   - billing.controller serves `GET /billing/plans` from `toPublicCatalog()`
 *   - the Stripe checkout amount + the stripe-setup script read `amountFor()` / currency
 *   - subscriptions.service prices import from here
 *
 * Change a number here and it propagates everywhere. Don't hard-code prices elsewhere.
 */

export type PlanId = 'free' | 'premium' | 'business';
export type BillingCycle = 'monthly' | 'yearly';

// ─── Feature caps (the gating truth) ──────────────────────────────────────────

export interface FeatureCaps {
  /** Max saved trip plans per user. Infinity = unlimited. */
  maxTrips: number;
  /** Max combined saved places + posts. Infinity = unlimited. */
  maxSaves: number;
  /** Max personal collections ("carnets") a user can build. Infinity = unlimited. */
  maxCollections: number;
  /** Boost weight applied to this user in suggestion endpoints. */
  suggestionWeight: number;
  /** Whether the user can choose a custom passport theme. */
  customThemes: boolean;
  /** Whether the user can view their own passport analytics dashboard. */
  passportAnalytics: boolean;
  /** Whether the user can post listings in multiple languages. */
  multiLangListings: boolean;
  /** Whether the user can boost places. */
  canBoost: boolean;
  /** Whether the user can access the owner dashboard. */
  ownerDashboard: boolean;
  /** Daily AI-concierge message allowance. Infinity = unlimited. */
  aiMessagesPerDay: number;
}

export const FREE_CAPS: FeatureCaps = {
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

export const PRO_CAPS: FeatureCaps = {
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

export const BUSINESS_CAPS: FeatureCaps = {
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

export function capsFor(plan: UserPlan): FeatureCaps {
  if (plan === UserPlan.BUSINESS) return BUSINESS_CAPS;
  if (plan === UserPlan.PREMIUM) return PRO_CAPS;
  return FREE_CAPS;
}

/** Resolve the EFFECTIVE plan for a user, downgrading expired Pro/Biz to Free. */
export function effectivePlanFor(u: { plan?: UserPlan; subscriptionExpiresAt?: Date | null }): UserPlan {
  const plan = u?.plan ?? UserPlan.FREE;
  if (plan === UserPlan.FREE) return UserPlan.FREE;
  const exp = u?.subscriptionExpiresAt;
  if (!exp) return plan; // never expires (legacy / lifetime)
  return new Date(exp).getTime() > Date.now() ? plan : UserPlan.FREE;
}

// ─── Currency (resolved lazily so ConfigModule has populated process.env) ──────

/** What users SEE on the pricing page. */
export function displayCurrency(): string {
  return (process.env.BILLING_DISPLAY_CURRENCY || 'TND').toUpperCase();
}

/** What Stripe actually SETTLES in. May differ from display if the account can't do TND. */
export function chargeCurrency(): string {
  return (process.env.BILLING_CHARGE_CURRENCY || displayCurrency()).toUpperCase();
}

/** Stripe three-decimal currencies: smallest unit = major * 1000, and must be multiples of 10. */
const THREE_DECIMAL = new Set(['BHD', 'JOD', 'KWD', 'OMR', 'TND']);
/** Stripe zero-decimal currencies: amount is already the smallest unit. */
const ZERO_DECIMAL = new Set([
  'BIF', 'CLP', 'DJF', 'GNF', 'JPY', 'KMF', 'KRW', 'MGA',
  'PYG', 'RWF', 'UGX', 'VND', 'VUV', 'XAF', 'XOF', 'XPF',
]);

/** Convert a major-unit amount (e.g. 14.90 TND) into Stripe's smallest integer unit. */
export function toStripeMinorUnits(amountMajor: number, currency: string): number {
  const c = currency.toUpperCase();
  if (ZERO_DECIMAL.has(c)) return Math.round(amountMajor);
  if (THREE_DECIMAL.has(c)) return Math.round((amountMajor * 1000) / 10) * 10; // multiples of 10
  return Math.round(amountMajor * 100);
}

// ─── The catalog ───────────────────────────────────────────────────────────────

/** A titled bucket of feature lines — lets the pricing page render a long list without a wall of text. */
export interface FeatureGroup {
  /** Section heading, e.g. "AI & smart planning". */
  label: string;
  /** Lucide icon name the front-end maps to a glyph (kept as a string so the catalog stays serializable). */
  icon: string;
  items: string[];
}

/** A power-user control surface (Business only) — rendered as its own showcase, not a bullet. */
export interface AdvancedControl {
  title: string;
  desc: string;
  /** Lucide icon name. */
  icon: string;
}

export interface PlanCatalogEntry {
  id: PlanId;
  /** Maps to the UserPlan enum used by gating. */
  userPlan: UserPlan;
  name: string;
  tagline: string;
  /** CSS brand token used as the card accent on the front-end. */
  tint: string;
  /** Price in DISPLAY-currency major units. 0 for free. */
  monthly: number;
  yearly: number;
  /** Env var names holding the Stripe Price IDs (populated by stripe-setup). null for free. */
  stripePriceEnv: { monthly: string; yearly: string } | null;
  /** Flat highlight list — the marquee bullets shown on the card (also the back-compat `features`). */
  features: string[];
  /** Categorised full feature set — powers the "see all N features" panel + comparison. */
  featureGroups: FeatureGroup[];
  /** Power controls shown as their own showcase (Business). */
  advancedControls?: AdvancedControl[];
  ctaLabel: string;
  featured?: boolean;
  caps: FeatureCaps;
}

/** Total number of individual feature lines across every group — used for the "N features" label. */
export function featureCount(entry: PlanCatalogEntry): number {
  return entry.featureGroups.reduce((n, g) => n + g.items.length, 0);
}

export const PLAN_CATALOG: PlanCatalogEntry[] = [
  {
    id: 'free',
    userPlan: UserPlan.FREE,
    name: 'Explorer',
    tagline: 'Everything you need to start wandering Tunisia',
    tint: 'var(--text-secondary)',
    monthly: 0,
    yearly: 0,
    stripePriceEnv: null,
    ctaLabel: 'Current plan',
    caps: FREE_CAPS,
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
    userPlan: UserPlan.PREMIUM,
    name: 'Pro Traveler',
    tagline: 'For explorers & creators who live in the app',
    tint: 'var(--gold)',
    monthly: 14.9,
    yearly: 149,
    stripePriceEnv: { monthly: 'STRIPE_PRICE_PREMIUM_MONTHLY', yearly: 'STRIPE_PRICE_PREMIUM_YEARLY' },
    ctaLabel: 'Upgrade to Pro',
    featured: true,
    caps: PRO_CAPS,
    // Marquee bullets shown on the card. The full 20 live in featureGroups below.
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
    userPlan: UserPlan.BUSINESS,
    name: 'Verified Business',
    tagline: 'For riads, restaurants, tours & agencies that want to grow',
    tint: 'var(--violet)',
    monthly: 74.9,
    yearly: 749,
    stripePriceEnv: { monthly: 'STRIPE_PRICE_BUSINESS_MONTHLY', yearly: 'STRIPE_PRICE_BUSINESS_YEARLY' },
    ctaLabel: 'Go Business',
    caps: BUSINESS_CAPS,
    // Marquee bullets. The full 50 live in featureGroups; the 2 power controls in advancedControls.
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

export function getPlan(id: string): PlanCatalogEntry | undefined {
  return PLAN_CATALOG.find((p) => p.id === id);
}

/** DISPLAY-currency amount for a plan + cycle. */
export function amountFor(id: string, cycle: BillingCycle): number {
  const p = getPlan(id);
  if (!p) return 0;
  return cycle === 'yearly' ? p.yearly : p.monthly;
}

/** Resolve the configured Stripe Price ID for a plan + cycle (null if unset). */
export function stripePriceIdFor(entry: PlanCatalogEntry, cycle: BillingCycle): string | null {
  if (!entry.stripePriceEnv) return null;
  const envName = cycle === 'yearly' ? entry.stripePriceEnv.yearly : entry.stripePriceEnv.monthly;
  return process.env[envName] || null;
}

/** Serializable catalog for the front-end. Never leaks env var names / Stripe ids. */
export function toPublicCatalog() {
  const currency = displayCurrency();
  return {
    currency,
    plans: PLAN_CATALOG.map((p) => ({
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
      // capability summary the FE can use for badges / gating hints
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
