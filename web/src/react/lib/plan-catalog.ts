import { useQuery } from '@tanstack/react-query';
import { api } from '../../shared/api';

export type Tier = 'free' | 'premium' | 'business';
export type Cycle = 'monthly' | 'yearly';

export interface CatalogPlan {
  id: Tier;
  name: string;
  tagline: string;
  tint: string;
  monthly: number;
  yearly: number;
  features: string[];
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
      name: 'Free',
      tagline: 'Everything you need to start exploring',
      tint: 'var(--text-secondary)',
      monthly: 0,
      yearly: 0,
      ctaLabel: 'Current plan',
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
      name: 'Pro Traveler',
      tagline: 'For active explorers & creators',
      tint: 'var(--gold)',
      monthly: 14.9,
      yearly: 149,
      ctaLabel: 'Upgrade to Pro',
      featured: true,
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
      name: 'Verified Business',
      tagline: 'For riads, restaurants, tours & agencies',
      tint: 'var(--violet)',
      monthly: 74.9,
      yearly: 749,
      ctaLabel: 'Go Business',
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
  ],
};

export function fmtPrice(n: number, currency: string): string {
  if (!n) return 'Free';
  const hasFraction = Math.round(n * 100) % 100 !== 0;
  return `${n.toLocaleString(undefined, { minimumFractionDigits: hasFraction ? 2 : 0, maximumFractionDigits: 2 })} ${currency}`;
}

export function usePlanCatalog() {
  return useQuery<Catalog>({
    queryKey: ['plan-catalog'],
    queryFn: async () => {
      try {
        return (await api.getPlans()) as Catalog;
      } catch {
        return PLAN_FALLBACK;
      }
    },
    staleTime: 30 * 60_000,
    initialData: PLAN_FALLBACK,
  });
}
