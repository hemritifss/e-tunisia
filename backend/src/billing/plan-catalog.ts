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
  features: string[];
  ctaLabel: string;
  featured?: boolean;
  caps: FeatureCaps;
}

export const PLAN_CATALOG: PlanCatalogEntry[] = [
  {
    id: 'free',
    userPlan: UserPlan.FREE,
    name: 'Free',
    tagline: 'Everything you need to start exploring',
    tint: 'var(--text-secondary)',
    monthly: 0,
    yearly: 0,
    stripePriceEnv: null,
    ctaLabel: 'Current plan',
    caps: FREE_CAPS,
    features: [
      'Browse every place & hidden gem',
      'Read & write reviews',
      'Up to 3 saved trip plans',
      'Up to 20 saved places',
      'AI travel concierge — 5 chats a day',
      'Mood discovery, leaderboards & activity feed',
    ],
  },
  {
    id: 'premium',
    userPlan: UserPlan.PREMIUM,
    name: 'Pro Traveler',
    tagline: 'For active explorers & creators',
    tint: 'var(--gold)',
    monthly: 14.9,
    yearly: 149,
    stripePriceEnv: { monthly: 'STRIPE_PRICE_PREMIUM_MONTHLY', yearly: 'STRIPE_PRICE_PREMIUM_YEARLY' },
    ctaLabel: 'Upgrade to Pro',
    featured: true,
    caps: PRO_CAPS,
    features: [
      'Everything in Free',
      'AI concierge, translations & smart search — 100 chats a day',
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
    userPlan: UserPlan.BUSINESS,
    name: 'Verified Business',
    tagline: 'For riads, restaurants, tours & agencies',
    tint: 'var(--violet)',
    monthly: 74.9,
    yearly: 749,
    stripePriceEnv: { monthly: 'STRIPE_PRICE_BUSINESS_MONTHLY', yearly: 'STRIPE_PRICE_BUSINESS_YEARLY' },
    ctaLabel: 'Go Business',
    caps: BUSINESS_CAPS,
    features: [
      'Everything in Pro',
      'Unlimited AI concierge & tools',
      'Verified business badge',
      'Owner dashboard & inquiry analytics',
      'Boost listings into featured slots',
      'Multi-language listings (FR / AR / EN)',
      'Reply to reviews as the business',
      'Priority partner support',
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
      ctaLabel: p.ctaLabel,
      featured: !!p.featured,
      // capability summary the FE can use for badges / gating hints
      caps: {
        maxTrips: Number.isFinite(p.caps.maxTrips) ? p.caps.maxTrips : null,
        maxSaves: Number.isFinite(p.caps.maxSaves) ? p.caps.maxSaves : null,
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
