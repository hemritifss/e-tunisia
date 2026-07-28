import { useQuery } from '@tanstack/react-query';
import { api } from '../../shared/api';

export type Tier = 'free' | 'premium' | 'business';
export type Cycle = 'monthly' | 'yearly';

/** A titled bucket of feature lines — the pricing card renders these grouped, not as one flat wall. */
export interface FeatureGroup {
  label: string;
  /** Lucide icon name; the page maps it to a glyph. */
  icon: string;
  items: string[];
}

/** A Business-only power surface, rendered as its own showcase card. */
export interface AdvancedControl {
  title: string;
  desc: string;
  /** Lucide icon name. */
  icon: string;
}

export interface CatalogPlan {
  id: Tier;
  name: string;
  tagline: string;
  tint: string;
  monthly: number;
  yearly: number;
  /** Marquee highlights shown on the card face. */
  features: string[];
  /** Full categorised feature set behind the "see all N features" panel. */
  featureGroups?: FeatureGroup[];
  /** Total feature-line count across all groups (server-computed; falls back to a local count). */
  featureCount?: number;
  /** Business power controls. */
  advancedControls?: AdvancedControl[];
  ctaLabel: string;
  featured?: boolean;
}

export interface Catalog {
  currency: string;
  plans: CatalogPlan[];
}

export const PLAN_FALLBACK: Catalog = {
  currency: 'TND',
  plans: [
    {
      id: 'free',
      name: 'Explorer',
      tagline: 'Everything you need to start wandering Tunisia',
      tint: 'var(--text-secondary)',
      monthly: 0,
      yearly: 0,
      ctaLabel: 'Current plan',
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
      name: 'Pro Traveler',
      tagline: 'For explorers & creators who live in the app',
      tint: 'var(--warning)',
      monthly: 14.9,
      yearly: 149,
      ctaLabel: 'Upgrade to Pro',
      featured: true,
      features: [
        'Everything in Free, uncapped',
        'AI concierge + itinerary builder — 100 chats a day',
        'Unlimited trip plans & saved places',
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
      name: 'Verified Business',
      tagline: 'For riads, restaurants, tours & agencies that want to grow',
      tint: 'var(--violet)',
      monthly: 74.9,
      yearly: 749,
      ctaLabel: 'Go Business',
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
  ],
};

export function fmtPrice(n: number, currency: string): string {
  if (!n) return 'Free';
  const hasFraction = Math.round(n * 100) % 100 !== 0;
  return `${n.toLocaleString(undefined, { minimumFractionDigits: hasFraction ? 2 : 0, maximumFractionDigits: 2 })} ${currency}`;
}

/** Total feature-line count for a plan — prefers the server value, falls back to counting groups. */
export function planFeatureCount(p: CatalogPlan): number {
  if (typeof p.featureCount === 'number') return p.featureCount;
  return (p.featureGroups ?? []).reduce((n, g) => n + g.items.length, 0);
}

export function usePlanCatalog() {
  return useQuery<Catalog>({
    queryKey: ['plan-catalog'],
    queryFn: async () => {
      try {
        const remote = (await api.getPlans()) as Catalog;
        // Older backends serve plans without the grouped feature set — backfill from the local
        // fallback so the redesigned page always has groups + advanced controls to render.
        const merged: Catalog = {
          currency: remote?.currency || PLAN_FALLBACK.currency,
          plans: (remote?.plans || []).map((rp) => {
            const local = PLAN_FALLBACK.plans.find((lp) => lp.id === rp.id);
            return {
              ...rp,
              featureGroups: rp.featureGroups?.length ? rp.featureGroups : local?.featureGroups,
              advancedControls: rp.advancedControls?.length ? rp.advancedControls : local?.advancedControls,
            };
          }),
        };
        return merged.plans.length ? merged : PLAN_FALLBACK;
      } catch {
        return PLAN_FALLBACK;
      }
    },
    staleTime: 30 * 60_000,
    initialData: PLAN_FALLBACK,
  });
}
