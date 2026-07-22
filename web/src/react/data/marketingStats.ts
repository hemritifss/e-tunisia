/**
 * Single source of truth for the marketing counters shown across the public
 * pages (Hero, About, Auth, Partner). Finding #7.
 *
 * Why this file exists: the same "impress the visitor" numbers were hardcoded
 * independently on four pages and had drifted out of sync. Home showed live,
 * hand-counted totals under the promise "counted by hand - no inflated numbers
 * here," while About/Auth/Partner advertised 2,500+ hidden places and 45,000+
 * reviews. Every public page now imports from here so the story stays honest
 * and consistent.
 *
 * PLACEHOLDER WARNING: every entry with `confirmed: false` is a CONSERVATIVE
 * PLACEHOLDER, deliberately low to respect the brand promise. None are real
 * figures. The product owner must confirm them before launch. Where a live
 * count already exists in the API (places, reviews), the live number should
 * win and these values act only as a fallback floor.
 */

export interface MarketingStat {
  /** Raw number - pass as `target` to the count-up <Stat> components. */
  value: number;
  /** Suffix the UI appends: '' | '+' | 'K' | '%'. Matches <Stat> `suffix`. */
  suffix: string;
  /** Pre-formatted display string, exactly as prose should render it. */
  display: string;
  /** Default human label. Pages may override for local wording. */
  label: string;
  /** true = verifiable fact, safe to ship. false = PLACEHOLDER, confirm first. */
  confirmed: boolean;
}

export const MARKETING_STATS = {
  // Home derives this live from api.getPlaces meta.total; 47 is a conservative
  // fallback matching the real hand-counted order of magnitude. PLACEHOLDER.
  placesCharted:       { value: 47,   suffix: '',  display: '47',     label: 'Places charted',       confirmed: false },
  // Home sums real reviewCounts and floors at this value. PLACEHOLDER / DATA.
  communityReviews:    { value: 1200, suffix: '+', display: '1,200+', label: 'Community reviews',     confirmed: false },
  // Verifiable fact: Tunisia has exactly 24 governorates.
  governorates:        { value: 24,   suffix: '',  display: '24',     label: 'Governorates',         confirmed: true  },
  // Verifiable heritage claim (Carthage founded ~814 BC).
  yearsOfHistory:      { value: 3000, suffix: '+', display: '3,000+', label: 'Years of history',     confirmed: true  },
  // PLACEHOLDER / DATA: needs a real registered-user count from the backend.
  travelers:           { value: 1500, suffix: '+', display: '1,500+', label: 'Travelers',            confirmed: false },
  // PLACEHOLDER / DATA: needs a real partner/host count from the backend.
  localHosts:          { value: 60,   suffix: '+', display: '60+',    label: 'Local hosts',          confirmed: false },
  // PLACEHOLDER / DATA: needs a real bookings-per-month figure from analytics.
  monthlyBookings:     { value: 500,  suffix: '+', display: '500+',   label: 'Monthly bookings',     confirmed: false },
  // PLACEHOLDER / DATA: needs a real satisfaction metric (survey/NPS).
  partnerSatisfaction: { value: 96,   suffix: '%', display: '96%',    label: 'Partner satisfaction', confirmed: false },
} as const satisfies Record<string, MarketingStat>;

export type MarketingStatKey = keyof typeof MARKETING_STATS;
