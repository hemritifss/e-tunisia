// ============================================
// E-TUNISIA WEB APP
// Router + global interactions + React Islands
// ============================================

import { mountIsland, unmountAllIslands } from './react/lib/islands';
import FeedPage from './react/pages/FeedPage';
import ExplorePage from './react/pages/ExplorePage';
import AITravelPlanner from './react/pages/AITravelPlanner';
import ChallengesPage from './react/pages/ChallengesPage';
import PassportPage from './react/pages/PassportPage';

// Vanilla pages
import { renderFeedPage, initFeedPage } from './pages/feed';
import { renderExplorePage, initExplorePage } from './pages/explore';
import { renderEventsPage, initEventsPage } from './pages/events';
import { renderTipsPage, initTipsPage } from './pages/tips';
import { renderPlaceDetailPage, initPlaceDetailPage } from './pages/place-detail';
import { renderProfilePage, initProfilePage } from './pages/profile';
import { renderLeaderboardPage, initLeaderboardPage } from './pages/leaderboard';
import { renderBadgesPage, initBadgesPage } from './pages/badges';
import { renderLoginPage, renderRegisterPage, initAuthPage } from './pages/auth';
import { renderMapPage, initMapPage } from './pages/map';
import { renderFavoritesPage, initFavoritesPage } from './pages/favorites';
import { renderSettingsPage, initSettingsPage } from './pages/settings';
import { renderPremiumPage, initPremiumPage } from './pages/premium';
import { renderPartnerPage, initPartnerPage } from './pages/partner';
import { renderAboutPage, initAboutPage } from './pages/about';
import { renderItinerariesPage, initItinerariesPage } from './pages/itineraries';
import { renderCollectionsPage, initCollectionsPage } from './pages/collections';
import { renderHeroPage, initHeroPage } from './pages/hero';
import { renderCreditsPage, initCreditsPage } from './pages/credits';
import { renderUserProfilePage, initUserProfilePage } from './pages/user-profile';
import { renderPostDetailPage, initPostDetailPage } from './pages/post-detail';
import { renderSearchPage, initSearchPage } from './pages/search';
import { renderProfileEditPage, initProfileEditPage } from './pages/profile-edit';
import { renderMessagesPage, initMessagesPage } from './pages/messages';
import { renderOnboardingPage, initOnboardingPage } from './pages/onboarding';
import { renderSavedPage, initSavedPage } from './pages/saved';
import { renderTagPage, initTagPage } from './pages/tag';
import { renderInquiriesPage, initInquiriesPage } from './pages/inquiries';
import { renderOwnerPage, initOwnerPage } from './pages/owner';
import { renderTripPage, initTripPage } from './pages/trip';
import { renderDiscoverTripsPage, initDiscoverTripsPage } from './pages/discover-trips';
import { mountTripCart } from './trip-cart-ui';
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

function getRoute(hash: string): Route {
  const path = hash.replace('#', '') || '/';

  // --- Auth Guard ---
  // Routes that REQUIRE login (personal data). Everything else is browsable as guest.
  const authRequiredPrefixes = ['/profile', '/favorites', '/saved', '/inquiries', '/owner', '/settings', '/badges', '/leaderboard', '/credits', '/messages'];
  const authOnlyHome = path === '/';
  const requiresAuth = authOnlyHome || authRequiredPrefixes.some(p => path === p || path.startsWith(p + '/'));
  const heroOnlyRoutes = ['/login', '/register'];
  const isHeroOnly = heroOnlyRoutes.includes(path) || path === '/hero';
  const isLoggedIn = apiService.isLoggedIn();

  if (!isLoggedIn && requiresAuth) {
    history.replaceState(null, '', '#/hero');
    return { render: renderHeroPage, init: () => initHeroPage(), page: 'hero' };
  }

  if (isLoggedIn && isHeroOnly) {
    history.replaceState(null, '', '#/');
    return { render: renderFeedPage, init: initFeedPage, page: 'feed', isReact: true };
  }
  // ------------------

  // Post detail (uuid)
  const postMatch = path.match(/^\/post\/([0-9a-fA-F-]+)/);
  if (postMatch) {
    const pid = postMatch[1];
    return {
      render: () => renderPostDetailPage(pid),
      init: () => initPostDetailPage(pid),
      page: 'feed',
    };
  }

  // Hashtag page — /tag/<slug>
  const tagMatch = path.match(/^\/tag\/([^?/]+)/);
  if (tagMatch) {
    const tag = decodeURIComponent(tagMatch[1]);
    return {
      render: () => renderTagPage(tag),
      init: () => initTagPage(tag),
      page: 'explore',
    };
  }

  // Trip plan — /trip (current cart) or /trip/<slug> (saved)
  const tripMatch = path.match(/^\/trip(?:\/([a-z0-9]{4,32}))?$/i);
  if (tripMatch) {
    const slug = tripMatch[1] || null;
    return {
      render: () => renderTripPage(slug),
      init: () => initTripPage(slug),
      page: 'itineraries',
    };
  }

  // Public passport (handle): /u/<handle> — React island
  const passportMatch = path.match(/^\/u\/([a-z0-9_]{3,30})/i);
  if (passportMatch) {
    return { render: () => '', init: () => {}, page: 'passport', isReact: true };
  }

  // Public user profile (uuid)
  const userMatch = path.match(/^\/user\/([0-9a-fA-F-]+)/);
  if (userMatch) {
    const uid = userMatch[1];
    return {
      render: () => renderUserProfilePage(uid),
      init: () => initUserProfilePage(uid),
      page: 'profile',
    };
  }

  // Search results — supports /search?q=…
  if (path === '/search' || path.startsWith('/search?')) {
    return {
      render: renderSearchPage,
      init: initSearchPage,
      page: 'explore',
    };
  }

  // Messages — /messages, /messages/<roomId>, /messages/user/<userId>
  if (path === '/messages' || path.startsWith('/messages/')) {
    return {
      render: renderMessagesPage,
      init: initMessagesPage,
      page: 'messages',
    };
  }

  // Place detail
  const placeMatch = path.match(/^\/place\/(\w+)/);
  if (placeMatch) {
    return {
      render: () => renderPlaceDetailPage(placeMatch[1]),
      init: () => initPlaceDetailPage(),
      page: 'explore',
    };
  }

  const routes: Record<string, Route> = {
    '/': { render: renderFeedPage, init: initFeedPage, page: 'feed', isReact: true },
    '/explore': { render: renderExplorePage, init: () => initExplorePage(), page: 'explore', isReact: true },
    '/events': { render: renderEventsPage, init: () => initEventsPage(), page: 'events' },
    '/tips': { render: renderTipsPage, init: () => initTipsPage(), page: 'tips' },
    '/map': { render: renderMapPage, init: initMapPage, page: 'map' },
    '/profile': { render: renderProfilePage, init: () => initProfilePage(), page: 'profile' },
    '/leaderboard': { render: renderLeaderboardPage, init: () => initLeaderboardPage(), page: 'profile' },
    '/badges': { render: renderBadgesPage, init: () => initBadgesPage(), page: 'profile' },
    '/favorites': { render: renderFavoritesPage, init: () => initFavoritesPage(), page: 'favorites' },
    '/settings': { render: renderSettingsPage, init: initSettingsPage, page: 'profile' },
    '/login': { render: renderLoginPage, init: initAuthPage, page: '' },
    '/register': { render: renderRegisterPage, init: initAuthPage, page: '' },
    '/premium': { render: renderPremiumPage, init: initPremiumPage, page: 'premium' },
    '/partner': { render: renderPartnerPage, init: initPartnerPage, page: 'partner' },
    '/itineraries': { render: renderItinerariesPage, init: () => initItinerariesPage(), page: 'itineraries' },
    '/collections': { render: renderCollectionsPage, init: () => initCollectionsPage(), page: 'collections' },
    '/about': { render: renderAboutPage, init: () => initAboutPage(), page: 'hero' },
    '/hero': { render: renderHeroPage, init: () => initHeroPage(), page: 'hero' },
    '/credits': { render: renderCreditsPage, init: () => initCreditsPage(), page: 'profile' },
    '/profile/edit': { render: renderProfileEditPage, init: () => initProfileEditPage(), page: 'profile' },
    '/onboarding':   { render: renderOnboardingPage,  init: () => initOnboardingPage(),  page: '' },
    '/saved':        { render: renderSavedPage,       init: () => initSavedPage(),       page: 'favorites' },
    '/inquiries':    { render: renderInquiriesPage,   init: () => initInquiriesPage(),   page: 'profile' },
    '/owner':        { render: renderOwnerPage,       init: () => initOwnerPage(),       page: 'profile' },
    '/discover-trips': { render: renderDiscoverTripsPage, init: () => initDiscoverTripsPage(), page: 'itineraries' },
  };

  return routes[path] || routes['/'];
}

function navigate() {
  const content = document.getElementById('page-content');
  if (!content) return;

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

  const route = getRoute(location.hash);

  // Handle React island routes
  if (route.isReact) {
    content.innerHTML = '<div id="react-island-root" class="react-island-shell"></div>';
    const islandRoot = document.getElementById('react-island-root');
    if (islandRoot) {
      const path = location.hash.replace('#', '') || '/';
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
      }
    }
  } else {
    // Vanilla route - use View Transitions API if available
    if ('startViewTransition' in document) {
      (document as any).startViewTransition(() => {
        content.innerHTML = route.render();
        route.init();
        replaceIcons();
      });
    } else {
      content.innerHTML = route.render();
      route.init();
      replaceIcons();
    }
  }

  // Update active nav links
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.toggle('active', (link as HTMLElement).dataset.page === route.page);
  });
  document.querySelectorAll('.mobile-nav-item').forEach(link => {
    link.classList.toggle('active', (link as HTMLElement).dataset.page === route.page);
  });

  // Scroll to top on navigation
  window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
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
  } catch {
    // 401 already redirects to /hero inside the api wrapper.
  }
}

// Force a freshly-signed-in user (with onboardingComplete=false) into the wizard.
// Runs once per session, won't fight back if the user is already on onboarding/login/hero.
async function maybeRedirectToOnboarding() {
  const path = (location.hash || '#/').replace('#', '') || '/';
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
      location.hash = '#/onboarding';
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
      location.hash = q ? `#/search?q=${encodeURIComponent(q)}` : '#/search';
    });
  });

  // Submit on Enter: go to the search results page with the query.
  input?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const q = input.value.trim();
      overlay?.classList.remove('open');
      location.hash = q ? `#/search?q=${encodeURIComponent(q)}` : '#/search';
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
    if (t === 'follow') {
      return {
        icon: 'lucide-user-plus',
        color: 'oklch(60% 0.16 240)', // blue
        href: data.fromUserId ? `#/user/${data.fromUserId}` : null,
      };
    }
    if (t === 'comment') {
      return {
        icon: 'lucide-message-circle',
        color: 'oklch(58% 0.16 145)', // green
        href: data.postId ? `#/post/${data.postId}` : null,
      };
    }
    if (t === 'donation') {
      return {
        icon: 'lucide-coins',
        color: 'oklch(70% 0.17 80)', // gold
        href: '#/credits',
      };
    }
    if (t === 'mention') {
      return { icon: 'lucide-at-sign', color: 'oklch(60% 0.18 290)', href: data.postId ? `#/post/${data.postId}` : null };
    }
    if (t === 'badge') {
      return { icon: 'lucide-award', color: 'oklch(70% 0.17 80)', href: '#/badges' };
    }
    if (t === 'event') {
      return { icon: 'lucide-calendar', color: 'oklch(60% 0.18 25)', href: '#/events' };
    }
    if (t === 'tip') {
      return { icon: 'lucide-lightbulb', color: 'oklch(72% 0.15 75)', href: '#/tips' };
    }
    return { icon: 'lucide-bell', color: 'var(--text-muted)', href: null };
  }

  function renderNotif(n: any): string {
    const seed = encodeURIComponent(n.fromUser?.fullName || n.data?.fromUserName || n.id || 'user');
    const fromAvatar = n.fromUser?.avatar || n.data?.fromAvatar;
    const avatar = fromAvatar
      ? (fromAvatar.startsWith('http') || fromAvatar.startsWith('data:')
          ? fromAvatar
          : `https://api.dicebear.com/9.x/thumbs/svg?seed=${seed}`)
      : `https://api.dicebear.com/9.x/thumbs/svg?seed=${seed}`;
    const title = n.title || 'New activity';
    const body = n.body || '';
    const meta = notifTypeMeta(n);
    const inner = `
      <div class="notif-item-icon-wrap">
        <img src="${avatar}" alt="" class="notif-avatar" />
        <span class="notif-type-bubble" style="--type-color: ${meta.color}">
          <i class="${meta.icon}"></i>
        </span>
      </div>
      <div class="notif-body">
        <p class="notif-title">${title}</p>
        ${body ? `<p class="notif-sub">${body}</p>` : ''}
        <span class="notif-time">${timeAgo(n.createdAt)} ago</span>
      </div>
      ${!(n.isRead || n.read) ? '<span class="notif-unread-dot" aria-label="unread"></span>' : ''}
    `;
    if (meta.href) {
      return `<a class="notif-item ${n.isRead || n.read ? '' : 'unread'}" data-id="${n.id}" href="${meta.href}">${inner}</a>`;
    }
    return `<div class="notif-item ${n.isRead || n.read ? '' : 'unread'}" data-id="${n.id}">${inner}</div>`;
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

  window.addEventListener('hashchange', closeNotifs);

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
    import('./ui-utils').then(({ showToast }) => showToast(`${title}${body}`.slice(0, 140), { type: 'info' }));
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

  document.addEventListener('click', () => {
    dropdown?.classList.remove('open');
  });

  dropdown?.addEventListener('click', (e) => {
    e.stopPropagation();
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
  window.addEventListener('hashchange', closeMobileMenu);
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
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = (ev.target?.result as string) || '';
        if (!dataUrl) return;
        // Track the actual data URL so submitPost can upload + include it in the post.
        selectedFiles.push(dataUrl);

        const wrapper = document.createElement('div');
        wrapper.className = 'post-modal-photo-thumb';
        wrapper.innerHTML = `
          <img src="${dataUrl}" alt="${file.name}" />
          <button class="post-modal-photo-remove" aria-label="Remove photo">
            <i class="lucide-x"></i>
          </button>
        `;
        photoPreview.appendChild(wrapper);
        replaceIcons(wrapper);

        wrapper.querySelector('.post-modal-photo-remove')?.addEventListener('click', () => {
          wrapper.remove();
          selectedFiles = selectedFiles.filter(d => d !== dataUrl);
        });
      };
      reader.readAsDataURL(file);
    });

    photoBtn?.classList.add('has-photos');
  });

  mentionBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    mentionDropdown?.classList.toggle('open');
  });

  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (!target.closest('.post-modal-mention-wrapper')) {
      mentionDropdown?.classList.remove('open');
    }
  });

  mentionDropdown?.querySelectorAll('.post-modal-mention-item').forEach(item => {
    item.addEventListener('click', () => {
      const userName = (item as HTMLElement).dataset.user || '';
      if (taggedUsers.includes(userName)) return;
      taggedUsers.push(userName);
      renderTaggedUsers();
      mentionDropdown?.classList.remove('open');
    });
  });

  function renderTaggedUsers() {
    if (!taggedUsersContainer) return;
    if (taggedUsers.length === 0) {
      taggedUsersContainer.innerHTML = '';
      return;
    }
    taggedUsersContainer.innerHTML = taggedUsers.map(user => `
      <span class="post-modal-tagged-chip">
        <i class="lucide-user"></i>
        ${user}
        <button class="post-modal-tagged-remove" data-user="${user}" aria-label="Remove ${user}">
          <i class="lucide-x"></i>
        </button>
      </span>
    `).join('');
    replaceIcons(taggedUsersContainer);

    taggedUsersContainer.querySelectorAll('.post-modal-tagged-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const user = (btn as HTMLElement).dataset.user || '';
        taggedUsers = taggedUsers.filter(u => u !== user);
        renderTaggedUsers();
      });
    });
  }

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

    const tagSuffix = taggedUsers.length > 0 ? ` -- with ${taggedUsers.join(', ')}` : '';
    const bodyText = (bodyInput?.value.trim() || titleInput.value.trim()) + tagSuffix;

    // Try backend first (real persistence). Fall back to in-memory if offline / not logged in.
    let savedToBackend = false;
    if (apiService.isLoggedIn()) {
      try {
        if (submitBtn) submitBtn.disabled = true;
        // Push any attached photos to MinIO and use the returned URLs.
        let imageUrls: string[] = [];
        if (selectedFiles.length > 0) {
          imageUrls = await Promise.all(
            selectedFiles.map(d => apiService.uploadDataUrl(d, 'posts')),
          );
        }
        await apiService.createPost({
          title: titleInput.value.trim(),
          body: bodyText,
          category: selectedCatName,
          location: selectedLocation || undefined,
          images: imageUrls.length > 0 ? imageUrls : undefined,
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

    location.hash = '#/';
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
      location.hash = '#/login';
      return;
    }
    openModal();
  });
}

// ---- Init ----
function init() {
  initTheme();
  initSearch();
  initNotifications();
  initDropdown();
  initScrollNav();
  initHamburger();
  initPostModal();

  document.getElementById('theme-toggle')?.addEventListener('click', toggleTheme);

  replaceIcons();

  const handleLogout = () => {
    apiService.logout();
    document.querySelectorAll<HTMLElement>('[data-user-name]').forEach(el => { el.textContent = 'Guest'; });
    document.querySelectorAll<HTMLElement>('[data-user-level]').forEach(el => { el.textContent = 'Welcome'; });
    document.querySelectorAll<HTMLImageElement>('img[data-user-avatar]').forEach(el => {
      el.src = 'https://api.dicebear.com/9.x/thumbs/svg?seed=Tunisia';
    });
    location.hash = '#/hero';
  };
  document.getElementById('logout-btn')?.addEventListener('click', handleLogout);
  document.getElementById('mobile-logout-btn')?.addEventListener('click', handleLogout);

  // Mount the floating trip-cart UI once on app boot
  mountTripCart();

  window.addEventListener('hashchange', navigate);
  navigate();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
