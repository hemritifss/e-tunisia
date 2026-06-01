// ============================================
// E-TUNISIA WEB APP
// Router + global interactions + React Islands
// ============================================

import React from 'react';
import { mountIsland, unmountAllIslands } from './react/lib/islands';
import { showToast } from './ui-utils';
import { goTo, replace, currentRoute, onRouteChange, normalizeLegacyHash, beforeLeave, restoreScroll } from './router';

function esc(v: unknown): string {
  const s = String(v ?? '');
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
import FeedPage from './react/pages/FeedPage';
import ExplorePage from './react/pages/ExplorePage';
import ChallengesPage from './react/pages/ChallengesPage';
import PassportPage from './react/pages/PassportPage';
import ActivityFeedPage from './react/pages/ActivityFeedPage';
import MoodPage from './react/pages/MoodPage';
import ProUpgradePage from './react/pages/ProUpgradePage';

// Lazy-load heavy / rarely-visited pages to reduce initial bundle size
const ReelsPage = React.lazy(() => import('./react/pages/ReelsPage'));
const AITravelPlanner = React.lazy(() => import('./react/pages/AITravelPlanner'));
const AdminPage = React.lazy(() => import('./react/pages/AdminPage'));
const LeaderboardPage = React.lazy(() => import('./react/pages/LeaderboardPage'));
const FavoritesPage = React.lazy(() => import('./react/pages/FavoritesPage'));
const SavedPage = React.lazy(() => import('./react/pages/SavedPage'));
const EventsPage = React.lazy(() => import('./react/pages/EventsPage'));
const CollectionsPage = React.lazy(() => import('./react/pages/CollectionsPage'));
const TagPage = React.lazy(() => import('./react/pages/TagPage'));
const ItinerariesPage = React.lazy(() => import('./react/pages/ItinerariesPage'));
const DiscoverTripsPage = React.lazy(() => import('./react/pages/DiscoverTripsPage'));
const TipsPage = React.lazy(() => import('./react/pages/TipsPage'));
const SettingsPage = React.lazy(() => import('./react/pages/SettingsPage'));
const CreditsPage = React.lazy(() => import('./react/pages/CreditsPage'));
const InquiriesPage = React.lazy(() => import('./react/pages/InquiriesPage'));
const PasswordResetPage = React.lazy(() => import('./react/pages/PasswordResetPage'));
const OnboardingPage = React.lazy(() => import('./react/pages/OnboardingPage'));
const AuthPage = React.lazy(() => import('./react/pages/AuthPage'));
const PlaceDetailPage = React.lazy(() => import('./react/pages/PlaceDetailPage'));
const MapPage = React.lazy(() => import('./react/pages/MapPage'));
const ProfilePage = React.lazy(() => import('./react/pages/ProfilePage'));
const UserProfilePage = React.lazy(() => import('./react/pages/UserProfilePage'));
const TripPage = React.lazy(() => import('./react/pages/TripPage'));
const PostDetailPage = React.lazy(() => import('./react/pages/PostDetailPage'));
const OwnerPage = React.lazy(() => import('./react/pages/OwnerPage'));
const MessagesPage = React.lazy(() => import('./react/pages/MessagesPage'));
const SearchPage = React.lazy(() => import('./react/pages/SearchPage'));
const BadgesPage = React.lazy(() => import('./react/pages/BadgesPage'));
const ProfileEditPage = React.lazy(() => import('./react/pages/ProfileEditPage'));
const HeroPage = React.lazy(() => import('./react/pages/HeroPage'));
const AboutPage = React.lazy(() => import('./react/pages/AboutPage'));
const PartnerPage = React.lazy(() => import('./react/pages/PartnerPage'));

// Vanilla pages
import { initCommandPalette } from './command-palette';
import { initToasts } from './toasts';
import { mountTripCart, syncTripCartAuth } from './trip-cart-ui';
import { mountMessengerGlobals } from './react/lib/mount-messenger';
import { initPopupTriggers, clearPopups } from './react/components/popups';
import { connectRealtime, disconnectRealtime } from './realtime';
import { replaceIcons } from './icons';
import { posts, addUserPost, generateId, type Post } from './data';
import * as apiService from './api';

// ---- React Island Routes ----
const REACT_ROUTES = new Set(['/', '/explore']);

let currentUnmount: (() => void) | null = null;

// ---- Router ----
type Route = {
  render: () => string;
  init: () => void;
  page: string;
  isReact?: boolean;
};

function getRoute(route: string): Route {
  const path = route || '/';

  // --- Auth Guard ---
  // Routes that REQUIRE login (personal data). Everything else is browsable as guest.
  const authRequiredPrefixes = ['/profile', '/favorites', '/saved', '/inquiries', '/owner', '/settings', '/badges', '/leaderboard', '/credits', '/messages'];
  const authOnlyHome = path === '/';
  const requiresAuth = authOnlyHome || authRequiredPrefixes.some(p => path === p || path.startsWith(p + '/'));
  const heroOnlyRoutes = ['/login', '/register', '/forgot-password'];
  const isHeroOnly = heroOnlyRoutes.includes(path) || path === '/hero';
  const isLoggedIn = apiService.isLoggedIn();

  if (!isLoggedIn && requiresAuth) {
    replace('/hero');
    return { render: () => '', init: () => {}, page: 'hero', isReact: true };
  }

  if (isLoggedIn && isHeroOnly) {
    replace('/');
    return { render: () => '', init: () => {}, page: 'feed', isReact: true };
  }
  // ------------------

  // Post detail (React island reads the id from the path)
  if (/^\/post\/[0-9a-fA-F-]+/.test(path)) {
    return { render: () => '', init: () => {}, page: 'feed', isReact: true };
  }

  // Hashtag page — /tag/<slug> (React island reads the tag from the path)
  if (/^\/tag\/[^?/]+/.test(path)) {
    return { render: () => '', init: () => {}, page: 'explore', isReact: true };
  }

  // Trip plan — /trip (cart) or /trip/<slug> (saved); React island reads slug from path
  if (/^\/trip(?:\/[a-z0-9]{4,32})?$/i.test(path)) {
    return { render: () => '', init: () => {}, page: 'itineraries', isReact: true };
  }

  // Password reset with token (React island reads the token from the path)
  if (/^\/reset-password\/[a-zA-Z0-9]+/.test(path)) {
    return { render: () => '', init: () => {}, page: '', isReact: true };
  }

  // Public passport (handle): /u/<handle> — React island
  const passportMatch = path.match(/^\/u\/([a-z0-9_]{3,30})/i);
  if (passportMatch) {
    return { render: () => '', init: () => {}, page: 'passport', isReact: true };
  }

  // Following activity feed (authed) — React island
  if (path === '/activity') {
    return { render: () => '', init: () => {}, page: 'activity', isReact: true };
  }

  // Mood-led discovery — /mood/<id> React island, public
  const moodMatch = path.match(/^\/mood\/([a-z-]+)/i);
  if (moodMatch) {
    return { render: () => '', init: () => {}, page: 'explore', isReact: true };
  }

  // Pro / Business upgrade page — public, anon visitors get a sign-in CTA inline.
  // Also catches /premium/welcome (post-checkout celebration).
  if (path === '/pro' || path === '/upgrade' || path === '/premium' || path.startsWith('/premium/')) {
    return { render: () => '', init: () => {}, page: 'premium', isReact: true };
  }

  // Reels / Short video feed
  if (path === '/reels') {
    return { render: () => '', init: () => {}, page: 'reels', isReact: true };
  }

  // Admin moderation hub — guard renders forbidden state if backend rejects
  if (path === '/admin' || path.startsWith('/admin/')) {
    return { render: () => '', init: () => {}, page: 'admin', isReact: true };
  }

  // Public user profile (React island reads the id from the path)
  if (/^\/user\/[0-9a-fA-F-]+/.test(path)) {
    return { render: () => '', init: () => {}, page: 'profile', isReact: true };
  }

  // Search results — supports /search?q=…
  if (path === '/search' || path.startsWith('/search?')) {
    return { render: () => '', init: () => {}, page: 'explore', isReact: true };
  }

  // Messages — /messages, /messages/<roomId>, /messages/user/<userId>
  if (path === '/messages' || path.startsWith('/messages/')) {
    return { render: () => '', init: () => {}, page: 'messages', isReact: true };
  }

  // Place detail (React island reads the id from the path)
  if (/^\/place\/\w+/.test(path)) {
    return { render: () => '', init: () => {}, page: 'explore', isReact: true };
  }

  const routes: Record<string, Route> = {
    '/': { render: () => '', init: () => {}, page: 'feed', isReact: true },
    '/explore': { render: () => '', init: () => {}, page: 'explore', isReact: true },
    '/events': { render: () => '', init: () => {}, page: 'events', isReact: true },
    '/tips': { render: () => '', init: () => {}, page: 'tips', isReact: true },
    '/map': { render: () => '', init: () => {}, page: 'map', isReact: true },
    '/profile': { render: () => '', init: () => {}, page: 'profile', isReact: true },
    '/leaderboard': { render: () => '', init: () => {}, page: 'profile', isReact: true },
    '/badges': { render: () => '', init: () => {}, page: 'profile', isReact: true },
    '/favorites': { render: () => '', init: () => {}, page: 'favorites', isReact: true },
    '/settings': { render: () => '', init: () => {}, page: 'profile', isReact: true },
    '/login': { render: () => '', init: () => {}, page: '', isReact: true },
    '/register': { render: () => '', init: () => {}, page: '', isReact: true },
    '/partner': { render: () => '', init: () => {}, page: 'partner', isReact: true },
    '/itineraries': { render: () => '', init: () => {}, page: 'itineraries', isReact: true },
    '/collections': { render: () => '', init: () => {}, page: 'collections', isReact: true },
    '/about': { render: () => '', init: () => {}, page: 'hero', isReact: true },
    '/hero': { render: () => '', init: () => {}, page: 'hero', isReact: true },
    '/credits': { render: () => '', init: () => {}, page: 'profile', isReact: true },
    '/profile/edit': { render: () => '', init: () => {}, page: 'profile', isReact: true },
    '/profile-edit': { render: () => '', init: () => {}, page: 'profile', isReact: true },
    '/onboarding':   { render: () => '', init: () => {}, page: '', isReact: true },
    '/saved':        { render: () => '', init: () => {}, page: 'favorites', isReact: true },
    '/inquiries':    { render: () => '', init: () => {}, page: 'profile', isReact: true },
    '/owner':        { render: () => '', init: () => {}, page: 'profile', isReact: true },
    '/discover-trips': { render: () => '', init: () => {}, page: 'itineraries', isReact: true },
    '/forgot-password': { render: () => '', init: () => {}, page: '', isReact: true },
  };

  return routes[path] || routes['/'];
}

function navigate() {
  const content = document.getElementById('page-content');
  if (!content) return;

  // Save scroll position before leaving current route
  beforeLeave();

  // Clean up any existing React islands
  if (currentUnmount) {
    currentUnmount();
    currentUnmount = null;
  }
  unmountAllIslands();

  // Toggle global body class for layout adjustments
  if (apiService.isLoggedIn()) {
    document.body.classList.remove('guest-mode');
    // Hydrate placeholder user info on first navigation post-login + check onboarding.
    if (!(window as any).__userHydrated) {
      (window as any).__userHydrated = true;
      hydrateCurrentUser();
      maybeRedirectToOnboarding();
      connectRealtime(); // live notifications + DMs
    }
  } else {
    document.body.classList.add('guest-mode');
    (window as any).__userHydrated = false;
    disconnectRealtime();
  }

  // Show/hide login-gated floating UI (trip cart FAB + drawer) per nav.
  syncTripCartAuth();

  // Bulletproof JS-level toggle for the mobile bottom nav (show for everyone).
  const mobileNavEl = document.getElementById('mobile-nav') as HTMLElement | null;
  if (mobileNavEl) {
    mobileNavEl.hidden = false;
    mobileNavEl.setAttribute('aria-hidden', 'false');
  }

  // Mobile nav create button → open post modal
  const mobileCreateBtn = document.getElementById('mobile-nav-create') as HTMLButtonElement | null;
  if (mobileCreateBtn) {
    mobileCreateBtn.onclick = () => {
      if (!apiService.isLoggedIn()) {
        goTo('/login');
        return;
      }
      // On the Reels tab, the "+" should create a reel (video-first), not a text post.
      if (currentRoute() === '/reels') {
        window.dispatchEvent(new CustomEvent('etunisia:open-reel-composer'));
        return;
      }
      document.dispatchEvent(new CustomEvent('etunisia:open-post-modal'));
    };
  }

  const route = getRoute(currentRoute());

  // Handle React island routes
  if (route.isReact) {
    content.innerHTML = '<div id="react-island-root" class="react-island-shell page-enter"></div>';
    const islandRoot = document.getElementById('react-island-root');
    if (islandRoot) {
      // Drop the entrance class once it finishes so its lingering transform/filter
      // (animation fill) doesn't establish a containing block that would break any
      // position:fixed children (modals, the reel composer, etc.). Scope to the
      // pageEnter keyframe specifically — otherwise a child element's animationend
      // bubbles up and could strip the class mid-entrance. A timeout is the
      // belt-and-suspenders cleanup in case the event never fires.
      const el = islandRoot;
      const clearEnter = () => {
        el.classList.remove('page-enter');
        el.removeEventListener('animationend', onEnterEnd);
        window.clearTimeout(enterFallback);
      };
      const onEnterEnd = (e: AnimationEvent) => { if (e.animationName === 'pageEnter') clearEnter(); };
      el.addEventListener('animationend', onEnterEnd as EventListener);
      const enterFallback = window.setTimeout(clearEnter, 1200);
      const path = currentRoute();
      if (path === '/' || path === '') {
        currentUnmount = mountIsland(FeedPage, islandRoot);
      } else if (path === '/explore') {
        currentUnmount = mountIsland(ExplorePage, islandRoot);
      } else if (path === '/ai-planner') {
        currentUnmount = mountIsland(AITravelPlanner, islandRoot);
      } else if (path === '/challenges') {
        currentUnmount = mountIsland(ChallengesPage, islandRoot);
      } else if (/^\/u\/[a-z0-9_]{3,30}/i.test(path)) {
        currentUnmount = mountIsland(PassportPage, islandRoot);
      } else if (path === '/activity') {
        currentUnmount = mountIsland(ActivityFeedPage, islandRoot);
      } else if (/^\/mood\//i.test(path)) {
        currentUnmount = mountIsland(MoodPage, islandRoot);
      } else if (path === '/pro' || path === '/upgrade' || path === '/premium' || path.startsWith('/premium/')) {
        currentUnmount = mountIsland(ProUpgradePage, islandRoot);
      } else if (path === '/admin' || path.startsWith('/admin/')) {
        currentUnmount = mountIsland(AdminPage, islandRoot);
      } else if (path === '/reels') {
        currentUnmount = mountIsland(ReelsPage, islandRoot);
      } else if (path === '/leaderboard') {
        currentUnmount = mountIsland(LeaderboardPage, islandRoot);
      } else if (path === '/favorites') {
        currentUnmount = mountIsland(FavoritesPage, islandRoot);
      } else if (path === '/saved') {
        currentUnmount = mountIsland(SavedPage, islandRoot);
      } else if (path === '/events') {
        currentUnmount = mountIsland(EventsPage, islandRoot);
      } else if (path === '/collections') {
        currentUnmount = mountIsland(CollectionsPage, islandRoot);
      } else if (/^\/tag\//.test(path)) {
        currentUnmount = mountIsland(TagPage, islandRoot);
      } else if (path === '/itineraries') {
        currentUnmount = mountIsland(ItinerariesPage, islandRoot);
      } else if (path === '/discover-trips') {
        currentUnmount = mountIsland(DiscoverTripsPage, islandRoot);
      } else if (path === '/tips') {
        currentUnmount = mountIsland(TipsPage, islandRoot);
      } else if (path === '/settings') {
        currentUnmount = mountIsland(SettingsPage, islandRoot);
      } else if (path === '/credits') {
        currentUnmount = mountIsland(CreditsPage, islandRoot);
      } else if (path === '/inquiries') {
        currentUnmount = mountIsland(InquiriesPage, islandRoot);
      } else if (path === '/forgot-password' || /^\/reset-password\//.test(path)) {
        currentUnmount = mountIsland(PasswordResetPage, islandRoot);
      } else if (path === '/onboarding') {
        currentUnmount = mountIsland(OnboardingPage, islandRoot);
      } else if (path === '/login' || path === '/register') {
        currentUnmount = mountIsland(AuthPage, islandRoot);
      } else if (/^\/place\//.test(path)) {
        currentUnmount = mountIsland(PlaceDetailPage, islandRoot);
      } else if (/^\/post\//.test(path)) {
        currentUnmount = mountIsland(PostDetailPage, islandRoot);
      } else if (path === '/map') {
        currentUnmount = mountIsland(MapPage, islandRoot);
      } else if (path === '/profile') {
        currentUnmount = mountIsland(ProfilePage, islandRoot);
      } else if (/^\/user\//.test(path)) {
        currentUnmount = mountIsland(UserProfilePage, islandRoot);
      } else if (/^\/trip(\/|$)/.test(path)) {
        currentUnmount = mountIsland(TripPage, islandRoot);
      } else if (path === '/owner') {
        currentUnmount = mountIsland(OwnerPage, islandRoot);
      } else if (path === '/messages' || path.startsWith('/messages/')) {
        currentUnmount = mountIsland(MessagesPage, islandRoot);
      } else if (path === '/search' || path.startsWith('/search?')) {
        currentUnmount = mountIsland(SearchPage, islandRoot);
      } else if (path === '/badges') {
        currentUnmount = mountIsland(BadgesPage, islandRoot);
      } else if (path === '/profile/edit' || path === '/profile-edit') {
        currentUnmount = mountIsland(ProfileEditPage, islandRoot);
      } else if (path === '/hero') {
        currentUnmount = mountIsland(HeroPage, islandRoot);
      } else if (path === '/about') {
        currentUnmount = mountIsland(AboutPage, islandRoot);
      } else if (path === '/partner') {
        currentUnmount = mountIsland(PartnerPage, islandRoot);
      }
    }
  } else {
    const paint = () => {
      content.innerHTML = route.render();
      route.init();
      replaceIcons();
    };
    // Vanilla route - use View Transitions API if available.
    if ('startViewTransition' in document) {
      // A rapid second nav aborts the in-flight transition, rejecting its
      // .finished/.ready promises — swallow that expected abort so it doesn't
      // surface as an unhandled rejection (and the DOM still updates).
      const vt = (document as any).startViewTransition(paint);
      vt?.finished?.catch?.(() => {});
      vt?.ready?.catch?.(() => {});
      vt?.updateCallbackDone?.catch?.(() => {});
    } else {
      paint();
    }
  }

  // Update active nav links
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.toggle('active', (link as HTMLElement).dataset.page === route.page);
  });
  document.querySelectorAll('.mobile-nav-item').forEach(link => {
    const page = (link as HTMLElement).dataset.page;
    const el = link as HTMLElement;
    const href = el.getAttribute('href')?.replace('#', '') || '';
    // For guest users, auth-gated mobile nav items redirect to login
    const authGated = ['/messages', '/profile', '/favorites', '/saved', '/settings'];
    const isProtected = authGated.some(p => href === p || href.startsWith(p + '/'));
    if (isProtected && !apiService.isLoggedIn()) {
      el.onclick = (e) => {
        e.preventDefault();
        goTo('/login');
      };
    } else {
      el.onclick = null;
    }
    link.classList.toggle('active', page === route.page);
  });

  // Restore scroll position on back/forward; scroll to top on new navigation.
  // We detect popstate by checking if the navigation was not triggered by goTo/replace.
  const isPopstate = !(window as any).__routerPush;
  if (isPopstate) {
    restoreScroll(currentRoute());
  } else {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }
  (window as any).__routerPush = false;
}

// ---- User hydration ----
// Replaces every [data-user-name], [data-user-level], [data-user-avatar]
// element in the static shell with the real logged-in user's info.
async function hydrateCurrentUser() {
  if (!apiService.isLoggedIn()) return;
  try {
    const me: any = await apiService.getMyProfile();
    if (!me) return;
    const name = me.fullName || me.name || me.email || 'Member';
    const avatarPath = me.avatar || me.avatarUrl;
    const seed = name || me.email || me.id || 'user';
    const avatar = avatarPath
      ? apiService.getImageUrl(avatarPath, 'avatar')
      : `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(seed)}`;
    const level = me.level != null ? `Level ${me.level} Explorer` : (me.role === 'admin' ? 'Admin' : 'Explorer');

    document.querySelectorAll<HTMLElement>('[data-user-name]').forEach(el => { el.textContent = name; });
    document.querySelectorAll<HTMLElement>('[data-user-level]').forEach(el => { el.textContent = level; });
    document.querySelectorAll<HTMLImageElement>('img[data-user-avatar]').forEach(el => { el.src = avatar; });

    // Rewrite the placeholder "My Passport" link to the user's real handle.
    if (me.handle) {
      document.querySelectorAll<HTMLAnchorElement>('a[data-passport-link]').forEach(el => {
        el.href = `#/u/${encodeURIComponent(me.handle)}`;
      });
    } else {
      // No handle yet (legacy account before A1 backfill ran) — hide the entry.
      document.querySelectorAll<HTMLElement>('a[data-passport-link]').forEach(el => {
        el.style.display = 'none';
      });
    }
  } catch {
    // 401 already redirects to /hero inside the api wrapper.
  }
}

// Force a freshly-signed-in user (with onboardingComplete=false) into the wizard.
// Runs once per session, won't fight back if the user is already on onboarding/login/hero.
async function maybeRedirectToOnboarding() {
  const path = currentRoute();
  // Don't bounce away from auth/landing routes or from the wizard itself.
  if (
    path === '/onboarding' ||
    path === '/login' ||
    path === '/register' ||
    path === '/hero'
  ) return;
  try {
    const me: any = await apiService.getMyProfile();
    if (me && me.onboardingComplete === false) {
      goTo('/onboarding');
    }
  } catch {
    // Silent — auth wrapper handles 401 elsewhere.
  }
}

// Listen for token changes (from other tabs) and re-hydrate.
window.addEventListener('storage', (e) => {
  if (e.key === 'etunisia_token') hydrateCurrentUser();
});

// Re-hydrate after a profile edit so the navbar reflects the new name/avatar.
window.addEventListener('etunisia:profile-updated', () => {
  (window as any).__userHydrated = false;
  hydrateCurrentUser();
});

// ---- Theme ----
function initTheme() {
  const saved = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = saved || (prefersDark ? 'dark' : 'light');
  document.documentElement.dataset.theme = theme;

  const icon = document.getElementById('theme-icon');
  if (icon) {
    icon.className = theme === 'dark' ? 'lucide-sun' : 'lucide-moon';
  }
}

function toggleTheme() {
  const current = document.documentElement.dataset.theme;
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  localStorage.setItem('theme', next);

  const icon = document.getElementById('theme-icon');
  if (icon) {
    icon.className = next === 'dark' ? 'lucide-sun' : 'lucide-moon';
  }
}

// ---- Search overlay ----
function initSearch() {
  const toggle = document.getElementById('search-toggle');
  const overlay = document.getElementById('search-overlay');
  const close = document.getElementById('search-close');
  const input = document.getElementById('search-input') as HTMLInputElement;

  toggle?.addEventListener('click', () => {
    overlay?.classList.add('open');
    setTimeout(() => input?.focus(), 100);
  });

  close?.addEventListener('click', () => {
    overlay?.classList.remove('open');
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay?.classList.contains('open')) {
      overlay.classList.remove('open');
    }
  });

  document.querySelectorAll('.search-trending .tag').forEach(tag => {
    tag.addEventListener('click', () => {
      const q = (tag.textContent || '').trim();
      overlay?.classList.remove('open');
      goTo(q ? `/search?q=${encodeURIComponent(q)}` : '/search');
    });
  });

  // Submit on Enter: go to the search results page with the query.
  input?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const q = input.value.trim();
      overlay?.classList.remove('open');
      goTo(q ? `/search?q=${encodeURIComponent(q)}` : '/search');
    }
  });
}

// ---- Notifications panel ----
function initNotifications() {
  const toggle = document.getElementById('notif-toggle');
  const panel = document.getElementById('notif-panel');
  const overlay = document.getElementById('notif-panel-overlay');
  const badge = document.getElementById('notif-badge');
  const markReadBtn = document.getElementById('notif-mark-read');
  const list = panel?.querySelector('.notif-panel-list') as HTMLElement | null;

  function timeAgo(d: string | Date): string {
    const ms = Date.now() - new Date(d).getTime();
    const m = Math.floor(ms / 60_000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h`;
    return `${Math.floor(h / 24)}d`;
  }

  function notifBucket(d: string | Date): 'today' | 'week' | 'earlier' {
    const ms = Date.now() - new Date(d).getTime();
    if (ms < 24 * 60 * 60 * 1000) return 'today';
    if (ms < 7 * 24 * 60 * 60 * 1000) return 'week';
    return 'earlier';
  }

  function notifTypeMeta(n: any): { icon: string; color: string; href: string | null } {
    const t = (n.type || '').toLowerCase();
    const data = n.data || {};
    // Prefer passport route (handle) over UUID-based /user/:id when handle is present.
    const fromHandle = data.followerHandle || data.endorserHandle || data.fromHandle;
    const fromUserRef = fromHandle ? `#/u/${encodeURIComponent(fromHandle)}` : (data.fromUserId ? `#/user/${data.fromUserId}` : null);

    if (t === 'follow') {
      return { icon: 'lucide-user-plus', color: 'oklch(58% 0.14 240)', href: fromUserRef };
    }
    if (t === 'comment') {
      return {
        icon: 'lucide-message-circle',
        color: 'oklch(58% 0.16 145)',
        href: data.postId ? `#/post/${data.postId}` : null,
      };
    }
    if (t === 'donation') {
      return { icon: 'lucide-coins', color: 'oklch(78% 0.17 80)', href: '#/credits' };
    }
    if (t === 'mention') {
      // Endorsements ride the MENTION type but always include data.topic — distinguish them.
      if (data.topic) {
        return { icon: 'lucide-award', color: 'oklch(72% 0.18 200)', href: fromUserRef };
      }
      return { icon: 'lucide-at-sign', color: 'oklch(58% 0.20 290)', href: data.postId ? `#/post/${data.postId}` : fromUserRef };
    }
    if (t === 'badge') {
      return { icon: 'lucide-award', color: 'oklch(78% 0.17 80)', href: '#/badges' };
    }
    if (t === 'event') {
      return { icon: 'lucide-calendar', color: 'oklch(62% 0.19 25)', href: '#/events' };
    }
    if (t === 'tip') {
      return { icon: 'lucide-lightbulb', color: 'oklch(74% 0.15 75)', href: '#/tips' };
    }
    return { icon: 'lucide-bell', color: 'var(--text-muted)', href: null };
  }

  function escNotif(s: unknown): string {
    return String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function renderNotif(n: any): string {
    const seed = encodeURIComponent(n.fromUser?.fullName || n.data?.fromUserName || n.id || 'user');
    const fromAvatar = n.fromUser?.avatar || n.data?.fromAvatar || n.data?.followerAvatar || n.data?.endorserAvatar;
    const avatar = fromAvatar
      ? (fromAvatar.startsWith('http') || fromAvatar.startsWith('data:')
          ? fromAvatar
          : `https://api.dicebear.com/9.x/thumbs/svg?seed=${seed}`)
      : `https://api.dicebear.com/9.x/thumbs/svg?seed=${seed}`;
    const title = n.title || 'New activity';
    const body = n.body || '';
    const meta = notifTypeMeta(n);
    const id = String(n.id || '');
    // All user-controlled strings escaped — title/body/id come straight from the DB.
    const inner = `
      <div class="notif-item-icon-wrap">
        <img src="${escNotif(avatar)}" alt="" class="notif-avatar" />
        <span class="notif-type-bubble" style="--type-color: ${meta.color}">
          <i class="${meta.icon}"></i>
        </span>
      </div>
      <div class="notif-body">
        <p class="notif-title">${escNotif(title)}</p>
        ${body ? `<p class="notif-sub">${escNotif(body)}</p>` : ''}
        <span class="notif-time">${timeAgo(n.createdAt)} ago</span>
      </div>
      ${!(n.isRead || n.read) ? '<span class="notif-unread-dot" aria-label="unread"></span>' : ''}
    `;
    if (meta.href) {
      return `<a class="notif-item ${n.isRead || n.read ? '' : 'unread'}" data-id="${escNotif(id)}" href="${escNotif(meta.href)}">${inner}</a>`;
    }
    return `<div class="notif-item ${n.isRead || n.read ? '' : 'unread'}" data-id="${escNotif(id)}">${inner}</div>`;
  }

  function renderSection(label: string, items: any[]): string {
    if (items.length === 0) return '';
    return `
      <div class="notif-section">
        <div class="notif-section-label">${label}</div>
        ${items.map(renderNotif).join('')}
      </div>
    `;
  }

  async function loadNotifs() {
    if (!list) return;
    if (!apiService.isLoggedIn()) {
      list.innerHTML = `
        <div class="notif-empty">
          <i class="lucide-bell-off"></i>
          <p>Sign in to see your notifications.</p>
          <a class="btn btn-primary btn-sm" href="#/login">Sign in</a>
        </div>`;
      if (badge) badge.style.display = 'none';
      replaceIcons(list);
      return;
    }
    try {
      const items = await apiService.getNotifications();
      if (!Array.isArray(items) || items.length === 0) {
        list.innerHTML = `
          <div class="notif-empty">
            <i class="lucide-bell"></i>
            <p>No notifications yet. We'll ping you when something happens.</p>
          </div>`;
        if (badge) badge.style.display = 'none';
        replaceIcons(list);
        return;
      }
      const today: any[] = [];
      const week: any[] = [];
      const earlier: any[] = [];
      for (const n of items) {
        const b = notifBucket(n.createdAt);
        if (b === 'today') today.push(n);
        else if (b === 'week') week.push(n);
        else earlier.push(n);
      }
      list.innerHTML = `
        ${renderSection('Today', today)}
        ${renderSection('This week', week)}
        ${renderSection('Earlier', earlier)}
      `;
      const unread = items.filter((n: any) => !(n.isRead || n.read)).length;
      if (badge) {
        if (unread > 0) { badge.textContent = String(unread); badge.style.display = ''; }
        else badge.style.display = 'none';
      }
      replaceIcons(list);
    } catch {
      // leave the hardcoded fallback intact
    }
  }

  function openNotifs() {
    panel?.classList.add('open');
    overlay?.classList.add('open');
    loadNotifs();
  }

  function closeNotifs() {
    panel?.classList.remove('open');
    overlay?.classList.remove('open');
  }

  toggle?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (panel?.classList.contains('open')) closeNotifs();
    else openNotifs();
  });

  overlay?.addEventListener('click', closeNotifs);

  document.getElementById('mobile-notif-trigger')?.addEventListener('click', () => {
    document.getElementById('mobile-menu-panel')?.classList.remove('open');
    document.getElementById('mobile-menu-overlay')?.classList.remove('open');
    document.body.style.overflow = '';
    setTimeout(openNotifs, 100);
  });

  // ── Live refresh wires ─────────────────────────────────────────────────
  // 1) Realtime push: every NotificationsService.create() emits
  //    'notification:new' over WebSocket → realtime.ts re-emits it as
  //    'etunisia:notification-new'. Bump the badge + re-render the panel.
  // 2) Poll for new notifications every 45s while a tab is visible.
  // 3) Refresh when the tab regains focus or the route changes.

  let pollTimer: number | null = null;

  async function refreshBadge() {
    if (!apiService.isLoggedIn() || !badge) return;
    try {
      const res: any = await apiService.getUnreadCount();
      const n = Number(res?.unreadCount ?? res?.count ?? 0);
      if (n > 0) { badge.textContent = String(n); badge.style.display = ''; }
      else badge.style.display = 'none';
    } catch {}
  }

  function startPolling() {
    if (pollTimer != null) return;
    pollTimer = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      refreshBadge();
      // Re-render the open panel too, so badges + items stay in sync.
      if (panel?.classList.contains('open')) loadNotifs();
    }, 45_000);
  }

  function stopPolling() {
    if (pollTimer != null) { window.clearInterval(pollTimer); pollTimer = null; }
  }

  window.addEventListener('etunisia:notification-new', () => {
    // Live push from the WebSocket gateway — refresh immediately, no waiting.
    refreshBadge();
    if (panel?.classList.contains('open')) loadNotifs();
    // Give a brief flash on the bell to draw the eye.
    toggle?.classList.add('notif-toggle-flash');
    window.setTimeout(() => toggle?.classList.remove('notif-toggle-flash'), 900);
  });

  window.addEventListener('focus', () => { refreshBadge(); });
  onRouteChange(() => { refreshBadge(); });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') refreshBadge();
  });

  // First load + start polling
  refreshBadge();
  startPolling();
  window.addEventListener('beforeunload', stopPolling);

  markReadBtn?.addEventListener('click', async () => {
    panel?.querySelectorAll('.notif-item.unread').forEach(item => item.classList.remove('unread'));
    panel?.querySelectorAll('.notif-unread-dot').forEach(d => d.remove());
    if (badge) badge.style.display = 'none';
    try { await apiService.markAllNotificationsRead(); } catch {}
  });

  // Click any single notification → mark it read (without blocking the link's navigation).
  list?.addEventListener('click', async (ev) => {
    const target = ev.target as HTMLElement | null;
    if (!target) return;
    const item = target.closest('.notif-item') as HTMLElement | null;
    if (!item) return;
    const id = item.dataset.id;
    if (!id) return;
    const wasUnread = item.classList.contains('unread');
    if (!wasUnread) return;
    // Optimistically clear the unread state
    item.classList.remove('unread');
    item.querySelector('.notif-unread-dot')?.remove();
    if (badge) {
      const current = Number(badge.textContent || '0') || 0;
      const next = Math.max(0, current - 1);
      if (next === 0) badge.style.display = 'none';
      else badge.textContent = String(next);
    }
    try { await apiService.markNotificationRead(id); } catch {}
    // Close the panel on link clicks so the user sees the destination.
    if (item.tagName === 'A') closeNotifs();
  });

  onRouteChange(closeNotifs);

  // Pre-load badge count on app start (logged-in users only).
  if (apiService.isLoggedIn()) {
    apiService.getUnreadCount().then((c: any) => {
      const n = Number(c?.count ?? c) || 0;
      if (badge) {
        if (n > 0) { badge.textContent = String(n); badge.style.display = ''; }
        else badge.style.display = 'none';
      }
    }).catch(() => {});
  } else if (badge) {
    badge.style.display = 'none';
  }

  // ── Live notifications from WebSocket ──
  window.addEventListener('etunisia:notification-new', (e: any) => {
    const n = e?.detail || {};
    // 1. Bump the badge
    if (badge) {
      const current = Number(badge.textContent || '0') || 0;
      const next = current + 1;
      badge.textContent = String(next);
      badge.style.display = '';
    }
    // 2. If panel is open, prepend the new item live; otherwise refresh on next open
    if (panel?.classList.contains('open')) {
      loadNotifs();
    }
    // 3. Lightweight toast so the user knows something happened even if the panel isn't open
    const title = n.title || 'New activity';
    const body = n.body ? ` — ${n.body}` : '';
    showToast(`${title}${body}`.slice(0, 140), { type: 'info' });
  });
}

// ---- User dropdown ----
function initDropdown() {
  const btn = document.getElementById('avatar-btn');
  const dropdown = document.getElementById('user-dropdown');

  btn?.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown?.classList.toggle('open');
  });

  // Close on any click outside the avatar menu. Scoped via closest() so we don't
  // need to stopPropagation inside the dropdown — doing that would also block the
  // global link interceptor (also on document), and menu links would stop routing.
  document.addEventListener('click', (e) => {
    if (!(e.target as HTMLElement)?.closest('#avatar-menu')) {
      dropdown?.classList.remove('open');
    }
  });

  // Close the menu after picking an item. No stopPropagation here, so the click
  // still bubbles to the link interceptor (links) and the logout handler (button).
  dropdown?.addEventListener('click', (e) => {
    if ((e.target as HTMLElement)?.closest('.dropdown-item')) {
      dropdown.classList.remove('open');
    }
  });
}

// ---- Scrolled nav ----
function initScrollNav() {
  const nav = document.getElementById('main-nav');
  let ticking = false;

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        if (window.scrollY > 10) {
          nav?.classList.add('scrolled');
        } else {
          nav?.classList.remove('scrolled');
        }
        ticking = false;
      });
      ticking = true;
    }
  });
}

// ---- Mobile hamburger ----
function initHamburger() {
  const btn = document.getElementById('hamburger');
  const panel = document.getElementById('mobile-menu-panel');
  const overlay = document.getElementById('mobile-menu-overlay');

  function closeMobileMenu() {
    panel?.classList.remove('open');
    overlay?.classList.remove('open');
    document.body.style.overflow = '';
  }

  function openMobileMenu() {
    panel?.classList.add('open');
    overlay?.classList.add('open');
    document.body.style.overflow = 'hidden';
    replaceIcons(panel as HTMLElement);
  }

  const closeBtn = document.getElementById('mobile-menu-close');

  btn?.addEventListener('click', () => {
    panel?.classList.contains('open') ? closeMobileMenu() : openMobileMenu();
  });

  closeBtn?.addEventListener('click', closeMobileMenu);
  overlay?.addEventListener('click', closeMobileMenu);

  document.getElementById('mobile-search-trigger')?.addEventListener('click', () => {
    closeMobileMenu();
    document.getElementById('search-overlay')?.classList.add('open');
    setTimeout(() => (document.getElementById('search-input') as HTMLInputElement)?.focus(), 100);
  });

  document.getElementById('mobile-theme-trigger')?.addEventListener('click', () => {
    toggleTheme();
    const mobileIcon = document.getElementById('mobile-theme-icon');
    const current = document.documentElement.dataset.theme;
    if (mobileIcon) {
      mobileIcon.className = current === 'dark' ? 'lucide-sun' : 'lucide-moon';
      replaceIcons(mobileIcon.parentElement as HTMLElement);
    }
  });

  panel?.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', closeMobileMenu);
  });
  onRouteChange(closeMobileMenu);
}

// ---- Post composer modal ----
function initPostModal() {
  const overlay = document.getElementById('post-modal-overlay');
  const modal = document.getElementById('post-modal');
  const cancelBtn = document.getElementById('post-modal-cancel');
  const submitBtn = document.getElementById('post-modal-submit') as HTMLButtonElement;
  const titleInput = document.getElementById('post-modal-title') as HTMLInputElement;
  const bodyInput = document.getElementById('post-modal-body-input') as HTMLTextAreaElement;
  const categoriesContainer = document.getElementById('post-modal-categories');
  const locationInput = document.getElementById('post-modal-location-input') as HTMLInputElement;
  const locationDropdown = document.getElementById('post-modal-location-dropdown');
  const locationClear = document.getElementById('post-modal-location-clear');
  const photoBtn = document.getElementById('post-modal-photo-btn');
  const fileInput = document.getElementById('post-modal-file-input') as HTMLInputElement;
  const photoPreview = document.getElementById('post-modal-photo-preview');
  const mentionBtn = document.getElementById('post-modal-mention-btn');
  const mentionDropdown = document.getElementById('post-modal-mention-dropdown');
  const taggedUsersContainer = document.getElementById('post-modal-tagged-users');
  const successToast = document.getElementById('post-success-toast');

  let selectedCategory = '';
  let selectedCatName = '';
  let selectedCatClass = '';
  let selectedLocation = '';
  let taggedUsers: string[] = [];
  let selectedFiles: string[] = [];

  const tunisianLocations = [
    'Sidi Bou Said', 'Carthage', 'Djerba', 'Douz', 'Tunis Medina',
    'Sousse', 'Bizerte', 'Tozeur', 'Kairouan', 'Tabarka',
  ];

  categoriesContainer?.querySelectorAll('.post-modal-tag').forEach(btn => {
    btn.addEventListener('click', () => {
      categoriesContainer.querySelectorAll('.post-modal-tag').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      const el = btn as HTMLElement;
      selectedCategory = el.dataset.catId || '';
      selectedCatName = el.dataset.catName || '';
      selectedCatClass = el.dataset.catClass || '';
      updateSubmitState();
    });
  });

  // AI compose assist — improve / translate the body text in place (Phase 3).
  const aiBar = document.getElementById('post-modal-ai');
  const aiStatus = document.getElementById('post-modal-ai-status');
  let aiBusy = false;
  aiBar?.querySelectorAll('.post-modal-ai-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (aiBusy) return;
      const text = bodyInput?.value?.trim() || '';
      if (!text) {
        if (aiStatus) aiStatus.textContent = 'Write something first';
        setTimeout(() => { if (aiStatus) aiStatus.textContent = ''; }, 1800);
        return;
      }
      const el = btn as HTMLElement;
      const action = (el.dataset.aiAction as 'improve' | 'translate' | 'shorten' | 'expand') || 'improve';
      const lang = el.dataset.aiLang || undefined;
      aiBusy = true;
      aiBar.classList.add('is-busy');
      if (aiStatus) aiStatus.textContent = action === 'translate' ? 'Translating…' : 'Improving…';
      try {
        const out: any = await apiService.aiAssist({ text, action, targetLang: lang });
        if (out?.mock) {
          if (aiStatus) aiStatus.textContent = 'AI not configured';
        } else if (out?.text) {
          bodyInput.value = out.text;
          bodyInput.dispatchEvent(new Event('input', { bubbles: true }));
          if (aiStatus) aiStatus.textContent = '✓ Done';
        }
      } catch (e: any) {
        const m = typeof e?.message === 'string' ? e.message : (e?.message?.message || 'AI unavailable');
        if (aiStatus) aiStatus.textContent = String(m).slice(0, 48);
      } finally {
        aiBusy = false;
        aiBar.classList.remove('is-busy');
        setTimeout(() => {
          if (aiStatus && (aiStatus.textContent === '✓ Done' || aiStatus.textContent === 'AI not configured')) {
            aiStatus.textContent = '';
          }
        }, 2200);
      }
    });
  });

  function renderLocationSuggestions(filter: string) {
    if (!locationDropdown) return;
    const query = filter.toLowerCase().trim();
    const matches = query
      ? tunisianLocations.filter(loc => loc.toLowerCase().includes(query))
      : tunisianLocations;

    if (matches.length === 0 || !query) {
      locationDropdown.classList.remove('open');
      return;
    }

    locationDropdown.innerHTML = matches.map(loc => `
      <div class="post-modal-location-option" data-location="${loc}">
        <i class="lucide-map-pin"></i>
        <span>${loc}</span>
      </div>
    `).join('');
    locationDropdown.classList.add('open');
    replaceIcons(locationDropdown);

    locationDropdown.querySelectorAll('.post-modal-location-option').forEach(opt => {
      opt.addEventListener('click', () => {
        const loc = (opt as HTMLElement).dataset.location || '';
        selectLocation(loc);
      });
    });
  }

  function selectLocation(loc: string) {
    selectedLocation = loc;
    if (locationInput) locationInput.value = loc;
    if (locationClear) locationClear.style.display = 'flex';
    locationDropdown?.classList.remove('open');
    locationInput?.closest('.post-modal-location-input-wrap')?.classList.add('has-location');
  }

  function clearLocation() {
    selectedLocation = '';
    if (locationInput) locationInput.value = '';
    if (locationClear) locationClear.style.display = 'none';
    locationDropdown?.classList.remove('open');
    locationInput?.closest('.post-modal-location-input-wrap')?.classList.remove('has-location');
  }

  locationInput?.addEventListener('input', () => {
    renderLocationSuggestions(locationInput.value);
  });

  locationInput?.addEventListener('focus', () => {
    if (locationInput.value.trim()) {
      renderLocationSuggestions(locationInput.value);
    }
  });

  locationClear?.addEventListener('click', clearLocation);

  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (!target.closest('.post-modal-location-wrapper')) {
      locationDropdown?.classList.remove('open');
    }
  });

  photoBtn?.addEventListener('click', () => {
    fileInput?.click();
  });

  fileInput?.addEventListener('change', () => {
    if (!fileInput.files || !photoPreview) return;
    selectedFiles = [];
    photoPreview.innerHTML = '';

    Array.from(fileInput.files).forEach(file => {
      const isVideo = file.type.startsWith('video/');
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = (ev.target?.result as string) || '';
        if (!dataUrl) return;
        // Track the actual data URL so submitPost can upload + include it in the post.
        selectedFiles.push({ dataUrl, isVideo, file });

        const wrapper = document.createElement('div');
        wrapper.className = 'post-modal-photo-thumb';
        if (isVideo) {
          wrapper.innerHTML = `
            <video src="${dataUrl}" muted playsinline class="post-modal-video-thumb"></video>
            <span class="post-modal-video-badge">VIDEO</span>
            <button class="post-modal-photo-remove" aria-label="Remove video">
              <i class="lucide-x"></i>
            </button>
          `;
        } else {
          wrapper.innerHTML = `
            <img src="${dataUrl}" alt="${esc(file.name)}" />
            <button class="post-modal-photo-remove" aria-label="Remove photo">
              <i class="lucide-x"></i>
            </button>
          `;
        }
        photoPreview.appendChild(wrapper);
        replaceIcons(wrapper);

        wrapper.querySelector('.post-modal-photo-remove')?.addEventListener('click', () => {
          wrapper.remove();
          selectedFiles = selectedFiles.filter((d: any) => d.dataUrl !== dataUrl);
        });
      };
      reader.readAsDataURL(file);
    });

    photoBtn?.classList.add('has-photos');
  });

  // Dynamic @mention search
  let mentionQuery = '';
  let mentionDebounce: any;

  async function searchMentionUsers(query: string) {
    if (!mentionDropdown) return;
    if (!query.trim()) {
      mentionDropdown.innerHTML = '<div class="post-modal-mention-empty">Type to search users…</div>';
      return;
    }
    mentionDropdown.innerHTML = '<div class="post-modal-mention-loading">Searching…</div>';
    try {
      const users = await apiService.searchUsers(query, 8);
      if (!users || users.length === 0) {
        mentionDropdown.innerHTML = '<div class="post-modal-mention-empty">No users found</div>';
        return;
      }
      mentionDropdown.innerHTML = users.map((u: any) => `
        <div class="post-modal-mention-item" data-handle="${esc(u.handle || '')}" data-name="${esc(u.fullName || '')}">
          <img class="post-modal-mention-avatar" src="${apiService.getImageUrl(u.avatar, 'avatar')}" alt="" />
          <div class="post-modal-mention-info">
            <div class="post-modal-mention-name">${esc(u.fullName || u.handle)}</div>
            <div class="post-modal-mention-handle">@${esc(u.handle)}</div>
          </div>
        </div>
      `).join('');
      mentionDropdown.querySelectorAll('.post-modal-mention-item').forEach(item => {
        item.addEventListener('click', () => {
          const handle = (item as HTMLElement).dataset.handle || '';
          insertMention(handle);
          mentionDropdown?.classList.remove('open');
        });
      });
    } catch {
      mentionDropdown.innerHTML = '<div class="post-modal-mention-empty">Search failed</div>';
    }
  }

  function insertMention(handle: string) {
    if (!bodyInput || !handle) return;
    const start = bodyInput.selectionStart || 0;
    const end = bodyInput.selectionEnd || 0;
    const text = bodyInput.value;
    const before = text.slice(0, start);
    const after = text.slice(end);
    // Find if there's an unfinished @query at cursor
    const atMatch = before.match(/@([a-zA-Z0-9_]*)$/);
    const newBefore = atMatch ? before.slice(0, -atMatch[0].length) : before;
    const insert = `@${handle} `;
    bodyInput.value = newBefore + insert + after;
    const newCursor = newBefore.length + insert.length;
    bodyInput.setSelectionRange(newCursor, newCursor);
    bodyInput.focus();
  }

  mentionBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    mentionDropdown?.classList.toggle('open');
    if (mentionDropdown?.classList.contains('open')) {
      searchMentionUsers('');
    }
  });

  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (!target.closest('.post-modal-mention-wrapper')) {
      mentionDropdown?.classList.remove('open');
    }
  });

  // Type @ in body to trigger mention search
  bodyInput?.addEventListener('input', (e) => {
    const target = e.target as HTMLTextAreaElement;
    const cursor = target.selectionStart || 0;
    const text = target.value.slice(0, cursor);
    const match = text.match(/@([a-zA-Z0-9_]*)$/);
    if (match) {
      mentionDropdown?.classList.add('open');
      mentionQuery = match[1];
      clearTimeout(mentionDebounce);
      mentionDebounce = setTimeout(() => searchMentionUsers(mentionQuery), 200);
    } else if (!target.closest('.post-modal-mention-wrapper')) {
      mentionDropdown?.classList.remove('open');
    }
  });

  function updateSubmitState() {
    const canSubmit = (titleInput?.value.trim().length > 0) && !!selectedCategory;
    if (submitBtn) submitBtn.disabled = !canSubmit;
  }

  titleInput?.addEventListener('input', updateSubmitState);
  bodyInput?.addEventListener('input', updateSubmitState);

  function openModal() {
    modal?.classList.add('open');
    overlay?.classList.add('open');
    document.body.style.overflow = 'hidden';
    replaceIcons(modal as HTMLElement);
    setTimeout(() => titleInput?.focus(), 200);
  }

  function closeModal() {
    modal?.classList.remove('open');
    overlay?.classList.remove('open');
    document.body.style.overflow = '';
    if (titleInput) titleInput.value = '';
    if (bodyInput) bodyInput.value = '';
    selectedCategory = '';
    selectedCatName = '';
    selectedCatClass = '';
    clearLocation();
    taggedUsers = [];
    selectedFiles = [];
    if (taggedUsersContainer) taggedUsersContainer.innerHTML = '';
    if (photoPreview) photoPreview.innerHTML = '';
    if (fileInput) fileInput.value = '';
    photoBtn?.classList.remove('has-photos');
    categoriesContainer?.querySelectorAll('.post-modal-tag').forEach(b => b.classList.remove('selected'));
    mentionDropdown?.classList.remove('open');
    updateSubmitState();
  }

  async function submitPost() {
    if (!titleInput?.value.trim() || !selectedCategory) return;

    const bodyText = bodyInput?.value.trim() || titleInput.value.trim();

    // Try backend first (real persistence). Fall back to in-memory if offline / not logged in.
    let savedToBackend = false;
    if (apiService.isLoggedIn()) {
      try {
        if (submitBtn) submitBtn.disabled = true;
        // Push any attached photos/videos to MinIO and use the returned URLs.
        let imageUrls: string[] = [];
        let videoUrl: string | undefined;
        if (selectedFiles.length > 0) {
          const uploads = await Promise.all(
            selectedFiles.map(async (d: any) => {
              const url = await apiService.uploadDataUrl(d.dataUrl || d, 'posts');
              return { url, isVideo: d.isVideo };
            }),
          );
          imageUrls = uploads.filter((u) => !u.isVideo).map((u) => u.url);
          const firstVideo = uploads.find((u) => u.isVideo);
          if (firstVideo) videoUrl = firstVideo.url;
        }
        await apiService.createPost({
          title: titleInput.value.trim(),
          body: bodyText,
          category: selectedCatName,
          location: selectedLocation || undefined,
          images: imageUrls.length > 0 ? imageUrls : undefined,
          videoUrl,
        });
        savedToBackend = true;
      } catch (err) {
        console.warn('Backend post failed, falling back to local:', err);
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    }

    if (!savedToBackend) {
      const newPost: Post = {
        id: generateId(),
        title: titleInput.value.trim(),
        excerpt: bodyText,
        body: bodyText,
        category: selectedCatName,
        categoryClass: selectedCatClass,
        author: { name: 'You', avatar: 'https://api.dicebear.com/9.x/thumbs/svg?seed=Tunisia', level: 5 },
        votes: 1,
        userVote: 1,
        commentCount: 0,
        timeAgo: 'just now',
        location: selectedLocation || undefined,
      };
      addUserPost(newPost);
    }

    closeModal();

    if (successToast) {
      successToast.classList.add('show');
      replaceIcons(successToast);
      setTimeout(() => successToast.classList.remove('show'), 3000);
    }

    // Tell the React feed to refresh.
    window.dispatchEvent(new CustomEvent('etunisia:post-created'));

    goTo('/');
    navigate();
  }

  overlay?.addEventListener('click', closeModal);
  cancelBtn?.addEventListener('click', closeModal);
  submitBtn?.addEventListener('click', submitPost);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal?.classList.contains('open')) {
      closeModal();
    }
  });

  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (target.closest('.create-post-bar')) {
      openModal();
    }
  });

  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (target.closest('.sidebar-about .btn-primary')) {
      e.preventDefault();
      openModal();
    }
  });

  // React feed dispatches this when the user clicks "Share your moment" / "Your story" tile.
  document.addEventListener('etunisia:open-post-modal', () => {
    if (!apiService.isLoggedIn()) {
      goTo('/login');
      return;
    }
    openModal();
  });
}

// ---- Internal link interceptor ----
// Turns clicks on in-app links into client-side navigations (History API).
// Handles legacy `href="#/x"` anchors and any element with `data-link="/x"`,
// so existing templates keep working without a full href rewrite.
function initLinkInterceptor() {
  document.addEventListener('click', (e: MouseEvent) => {
    // Let modified clicks (new tab, etc.) and already-handled clicks pass through.
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    const el = (e.target as HTMLElement | null)?.closest('a[href], [data-link]') as HTMLElement | null;
    if (!el) return;

    let target: string | null = null;
    const dataLink = el.getAttribute('data-link');
    if (dataLink) {
      target = dataLink;
    } else {
      const a = el as HTMLAnchorElement;
      if (a.target === '_blank' || a.hasAttribute('download')) return;
      const href = a.getAttribute('href') || '';
      // Only intercept in-app routes: legacy "#/x". Bare "#" anchors, "#section"
      // jumps, and external/absolute URLs keep their native behavior.
      if (href.startsWith('#/')) target = href;
    }
    if (!target) return;

    e.preventDefault();
    goTo(target);
  });
}

// ---- Init ----
function init() {
  // Migrate any legacy "#/x" URL to a clean path before the first render.
  normalizeLegacyHash();

  initTheme();
  initToasts();
  initSearch();
  initNotifications();
  initCommandPalette();
  initDropdown();
  initScrollNav();
  initHamburger();
  initPostModal();
  initLinkInterceptor();

  document.getElementById('theme-toggle')?.addEventListener('click', toggleTheme);

  replaceIcons();

  const handleLogout = () => {
    apiService.logout();
    clearPopups();
    document.querySelectorAll<HTMLElement>('[data-user-name]').forEach(el => { el.textContent = 'Guest'; });
    document.querySelectorAll<HTMLElement>('[data-user-level]').forEach(el => { el.textContent = 'Welcome'; });
    document.querySelectorAll<HTMLImageElement>('img[data-user-avatar]').forEach(el => {
      el.src = 'https://api.dicebear.com/9.x/thumbs/svg?seed=Tunisia';
    });
    const target = '/hero';
    if (currentRoute() === target) {
      // Already on hero — a same-route nav won't fire a route change; force navigate() so guest-mode applies.
      navigate();
    } else {
      goTo(target);
    }
  };
  document.getElementById('logout-btn')?.addEventListener('click', handleLogout);
  document.getElementById('mobile-logout-btn')?.addEventListener('click', handleLogout);

  // Mount the floating trip-cart UI once on app boot
  mountTripCart();
  // Mount the Messenger globals (chat popups + mobile conversations launcher)
  mountMessengerGlobals();
  // Wire interactive popups (tip celebration, first-run tutorial, daily nudge)
  initPopupTriggers();

  onRouteChange(navigate);
  navigate();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
