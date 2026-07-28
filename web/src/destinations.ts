// ============================================================================
// Destination registry — the single source of truth for "where can I go".
//
// Before this file, the same page had different names depending on which menu
// you opened it from: Circuits/Itineraries, Carnets/Collections, Daily
// Tasks/Challenges, Favorites/Saved Places. A user who saved a place could not
// predict which menu entry would bring it back — which is most of what "the app
// is hard to navigate" actually meant.
//
// Every menu (bottom rail, You hub, avatar dropdown, mobile drawer, command
// palette) renders from this list. Renaming a destination here renames it
// everywhere, so the labels cannot drift apart again.
//
// `icon` is a lucide icon *name*, usable from both worlds:
//   • vanilla HTML → <i class="lucide-{icon}">
//   • React        → the ICONS map in YouPage.tsx
// ============================================================================

export type DestinationGroup =
  | 'primary'
  | 'discover'
  | 'library'
  | 'progress'
  | 'connect'
  | 'business'
  | 'account';

export interface Destination {
  /** Canonical route. */
  path: string;
  /** The one label this destination is allowed to use, app-wide. */
  label: string;
  /** Lucide icon name (kebab-case), without the `lucide-` prefix. */
  icon: string;
  group: DestinationGroup;
  /** One-line description — shown on the You hub so the name isn't the only clue. */
  blurb?: string;
  /** Requires a signed-in user; guests get routed to /login. */
  auth?: boolean;
  /** `data-page` value used for active-state highlighting in the shell. */
  page?: string;
}

export const DESTINATIONS: Destination[] = [
  // ── The five that live in the bottom rail ──────────────────────────────
  { path: '/',           label: 'Home',    icon: 'home',    group: 'primary', page: 'feed',        blurb: 'Your feed' },
  { path: '/explore',    label: 'Explore', icon: 'compass', group: 'primary', page: 'explore',     blurb: 'Places, map, events and reels' },
  { path: '/trip',       label: 'Trip',    icon: 'luggage', group: 'primary', page: 'trip',        blurb: 'Your plan, day by day', auth: true },
  { path: '/you',        label: 'You',     icon: 'user',    group: 'primary', page: 'you',         blurb: 'Profile, library and progress' },

  // ── Discover ───────────────────────────────────────────────────────────
  { path: '/map',            label: 'Map',            icon: 'map',           group: 'discover', page: 'map',            blurb: 'Everything on one map' },
  { path: '/reels',          label: 'Reels',          icon: 'clapperboard',  group: 'discover', page: 'reels',          blurb: 'Short videos from travellers' },
  { path: '/events',         label: 'Events',         icon: 'calendar',      group: 'discover', page: 'events',         blurb: "What's on, by date" },
  { path: '/itineraries',    label: 'Circuits',       icon: 'route',         group: 'discover', page: 'itineraries',    blurb: 'Ready-made routes to remix' },
  { path: '/collections',    label: 'Carnets',        icon: 'layers',        group: 'discover', page: 'collections',    blurb: 'Curated boards of places' },
  { path: '/tips',           label: 'Tips',           icon: 'lightbulb',     group: 'discover', page: 'tips',           blurb: 'Local know-how' },
  { path: '/ai-planner',     label: 'AI Planner',     icon: 'sparkles',      group: 'discover', page: 'ai-planner',     blurb: 'Describe a trip, get a plan' },
  { path: '/discover-trips', label: 'Community trips', icon: 'compass',      group: 'discover', page: 'itineraries',    blurb: 'Trips other travellers shared' },
  { path: '/louage',         label: 'Louage',         icon: 'bus',           group: 'discover', page: 'louage',         blurb: 'Getting around by louage' },
  { path: '/safety',         label: 'Safety',         icon: 'shield',        group: 'discover', page: 'safety',         blurb: 'Practical safety notes' },

  // ── Library — the traveller's own things ───────────────────────────────
  { path: '/favorites',  label: 'Saved places', icon: 'heart',     group: 'library', page: 'favorites', blurb: 'Places you hearted',      auth: true },
  { path: '/saved',      label: 'Saved posts',  icon: 'bookmark',  group: 'library', page: 'favorites', blurb: 'Posts you bookmarked',    auth: true },
  { path: '/submit-gem', label: 'Add a gem',    icon: 'gem',       group: 'library', page: 'submit-gem', blurb: 'Put a hidden spot on the map', auth: true },

  // ── Progress ───────────────────────────────────────────────────────────
  { path: '/u/me',        label: 'My passport', icon: 'id-card', group: 'progress', page: 'passport',   blurb: 'Stamps, level and travel map', auth: true },
  { path: '/challenges',  label: 'Daily tasks', icon: 'flame',   group: 'progress', page: 'challenges', blurb: 'Small things worth XP',        auth: true },
  { path: '/badges',      label: 'Badges',      icon: 'award',    group: 'progress', page: 'profile',   blurb: 'What you have unlocked',       auth: true },
  { path: '/leaderboard', label: 'Leaderboard', icon: 'trophy',  group: 'progress', page: 'profile',    blurb: 'Top explorers this month' },
  { path: '/credits',     label: 'Credits',     icon: 'coins',   group: 'progress', page: 'profile',    blurb: 'Balance, top-ups and tips',    auth: true },

  // ── Connect ────────────────────────────────────────────────────────────
  { path: '/messages', label: 'Messages',  icon: 'message-circle', group: 'connect', page: 'messages', blurb: 'Your conversations',   auth: true },
  { path: '/activity', label: 'Following', icon: 'rss',            group: 'connect', page: 'activity', blurb: 'What people you follow are doing', auth: true },
  { path: '/profile',  label: 'Profile',   icon: 'user-round',     group: 'connect', page: 'profile',  blurb: 'How others see you',   auth: true },

  // ── Business ───────────────────────────────────────────────────────────
  { path: '/inquiries', label: 'My inquiries',    icon: 'send',      group: 'business', page: 'profile', blurb: 'Quote requests you sent', auth: true },
  { path: '/owner',     label: 'Owner dashboard', icon: 'briefcase', group: 'business', page: 'profile', blurb: 'Manage your listings',    auth: true },

  // ── Account ────────────────────────────────────────────────────────────
  { path: '/settings', label: 'Settings', icon: 'settings', group: 'account', page: 'profile', blurb: 'Appearance, language, privacy', auth: true },
];

/** Human-readable section titles for the You hub. */
export const GROUP_TITLES: Record<DestinationGroup, string> = {
  primary: 'Main',
  discover: 'Discover',
  library: 'My library',
  progress: 'Progress',
  connect: 'Connect',
  business: 'Business',
  account: 'Account',
};

const BY_PATH = new Map(DESTINATIONS.map((d) => [d.path, d]));

/** Look up a destination by its exact path. */
export function destination(path: string): Destination | undefined {
  return BY_PATH.get(path);
}

/** The canonical label for a path, for use in breadcrumbs/headers/toasts. */
export function labelFor(path: string): string {
  return BY_PATH.get(path)?.label ?? '';
}

/** All destinations in a group, in declaration order. */
export function group(g: DestinationGroup): Destination[] {
  return DESTINATIONS.filter((d) => d.group === g);
}

/**
 * The bottom rail's tabs, in order. Deliberately five and fixed — a rail that
 * scrolls horizontally hides its own contents, which is why the previous
 * nine-tab version was undiscoverable. "Create" is injected by the shell
 * between Explore and Trip as an action, not a destination.
 */
export const PRIMARY_TABS: Destination[] = group('primary');

/**
 * Paths that are top-level destinations — the global back button stays hidden
 * on these, because there is nothing above them to go back to.
 */
export const PRIMARY_PATHS: string[] = PRIMARY_TABS.map((d) => d.path);
