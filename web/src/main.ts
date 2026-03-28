// ============================================
// E-TUNISIA WEB APP
// Router + global interactions
// ============================================

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
import { renderItinerariesPage, initItinerariesPage } from './pages/itineraries';
import { renderCollectionsPage, initCollectionsPage } from './pages/collections';
import { renderHeroPage, initHeroPage } from './pages/hero';
import { replaceIcons } from './icons';
import { posts, addUserPost, generateId, type Post } from './data';
import * as apiService from './api';

// ---- Router ----
type Route = {
  render: () => string;
  init: () => void;
  page: string;
};

function getRoute(hash: string): Route {
  const path = hash.replace('#', '') || '/';

  // --- Auth Guard ---
  const guestRoutes = ['/hero', '/login', '/register'];
  const isGuestRoute = guestRoutes.includes(path);
  const isLoggedIn = apiService.isLoggedIn();

  if (!isLoggedIn && !isGuestRoute) {
    history.replaceState(null, '', '#/hero');
    return { render: renderHeroPage, init: () => initHeroPage(), page: 'hero' };
  }

  if (isLoggedIn && isGuestRoute) {
    history.replaceState(null, '', '#/');
    return { render: renderFeedPage, init: initFeedPage, page: 'feed' };
  }
  // ------------------

  // Post detail
  const postMatch = path.match(/^\/post\/(\w+)/);
  if (postMatch) {
    return {
      render: () => renderPlaceDetailPage(postMatch[1]),
      init: () => initPlaceDetailPage(),
      page: 'feed',
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
    '/': { render: renderFeedPage, init: initFeedPage, page: 'feed' },
    '/explore': { render: renderExplorePage, init: () => initExplorePage(), page: 'explore' },
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
    '/itineraries': { render: renderItinerariesPage, init: () => initItinerariesPage(), page: 'explore' },
    '/collections': { render: renderCollectionsPage, init: () => initCollectionsPage(), page: 'explore' },
    '/hero': { render: renderHeroPage, init: () => initHeroPage(), page: 'hero' },
  };

  return routes[path] || routes['/'];
}

function navigate() {
  const content = document.getElementById('page-content');
  if (!content) return;

  // Toggle global body class for layout adjustments
  if (apiService.isLoggedIn()) {
    document.body.classList.remove('guest-mode');
  } else {
    document.body.classList.add('guest-mode');
  }

  const route = getRoute(location.hash);

  // Use View Transitions API if available
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

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay?.classList.contains('open')) {
      overlay.classList.remove('open');
    }
  });

  // Trending tags navigate
  document.querySelectorAll('.search-trending .tag').forEach(tag => {
    tag.addEventListener('click', () => {
      overlay?.classList.remove('open');
      location.hash = '#/explore';
    });
  });
}

// ---- Notifications panel ----
function initNotifications() {
  const toggle = document.getElementById('notif-toggle');
  const panel = document.getElementById('notif-panel');
  const overlay = document.getElementById('notif-panel-overlay');
  const badge = document.getElementById('notif-badge');
  const markReadBtn = document.getElementById('notif-mark-read');

  function openNotifs() {
    panel?.classList.add('open');
    overlay?.classList.add('open');
  }

  function closeNotifs() {
    panel?.classList.remove('open');
    overlay?.classList.remove('open');
  }

  toggle?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (panel?.classList.contains('open')) {
      closeNotifs();
    } else {
      openNotifs();
    }
  });

  overlay?.addEventListener('click', closeNotifs);

  // Mobile notification trigger in hamburger menu
  document.getElementById('mobile-notif-trigger')?.addEventListener('click', () => {
    // Close hamburger first
    document.getElementById('mobile-menu-panel')?.classList.remove('open');
    document.getElementById('mobile-menu-overlay')?.classList.remove('open');
    document.body.style.overflow = '';
    // Then open notifications
    setTimeout(openNotifs, 100);
  });

  // Mark all as read
  markReadBtn?.addEventListener('click', () => {
    panel?.querySelectorAll('.notif-item.unread').forEach(item => {
      item.classList.remove('unread');
    });
    if (badge) {
      badge.style.display = 'none';
    }
  });

  // Close on hash change
  window.addEventListener('hashchange', closeNotifs);
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

  // Search trigger
  document.getElementById('mobile-search-trigger')?.addEventListener('click', () => {
    closeMobileMenu();
    document.getElementById('search-overlay')?.classList.add('open');
    setTimeout(() => (document.getElementById('search-input') as HTMLInputElement)?.focus(), 100);
  });

  // Theme toggle
  document.getElementById('mobile-theme-trigger')?.addEventListener('click', () => {
    toggleTheme();
    const mobileIcon = document.getElementById('mobile-theme-icon');
    const current = document.documentElement.dataset.theme;
    if (mobileIcon) {
      mobileIcon.className = current === 'dark' ? 'lucide-sun' : 'lucide-moon';
      replaceIcons(mobileIcon.parentElement as HTMLElement);
    }
  });

  // Close on link navigation
  panel?.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', closeMobileMenu);
  });
  window.addEventListener('hashchange', closeMobileMenu);
}

// ---- Post composer modal (Facebook-style) ----
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

  // Tunisian locations for autocomplete
  const tunisianLocations = [
    'Sidi Bou Said', 'Carthage', 'Djerba', 'Douz', 'Tunis Medina',
    'Sousse', 'Bizerte', 'Tozeur', 'Kairouan', 'Tabarka',
  ];

  // ---- Category chip selection ----
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

  // ---- Location autocomplete ----
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

  // Close location dropdown when clicking outside
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (!target.closest('.post-modal-location-wrapper')) {
      locationDropdown?.classList.remove('open');
    }
  });

  // ---- Photo upload UI ----
  photoBtn?.addEventListener('click', () => {
    fileInput?.click();
  });

  fileInput?.addEventListener('change', () => {
    if (!fileInput.files || !photoPreview) return;
    selectedFiles = [];
    photoPreview.innerHTML = '';

    Array.from(fileInput.files).forEach(file => {
      selectedFiles.push(file.name);
      const reader = new FileReader();
      reader.onload = (ev) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'post-modal-photo-thumb';
        wrapper.innerHTML = `
          <img src="${ev.target?.result}" alt="${file.name}" />
          <button class="post-modal-photo-remove" aria-label="Remove photo">
            <i class="lucide-x"></i>
          </button>
        `;
        photoPreview.appendChild(wrapper);
        replaceIcons(wrapper);

        wrapper.querySelector('.post-modal-photo-remove')?.addEventListener('click', () => {
          wrapper.remove();
          selectedFiles = selectedFiles.filter(f => f !== file.name);
        });
      };
      reader.readAsDataURL(file);
    });

    photoBtn?.classList.add('has-photos');
  });

  // ---- Tag Members ----
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

  // ---- Submit state ----
  function updateSubmitState() {
    const canSubmit = (titleInput?.value.trim().length > 0) && !!selectedCategory;
    if (submitBtn) submitBtn.disabled = !canSubmit;
  }

  titleInput?.addEventListener('input', updateSubmitState);
  bodyInput?.addEventListener('input', updateSubmitState);

  // ---- Open / Close ----
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
    // Reset all fields
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

  // ---- Submit post ----
  function submitPost() {
    if (!titleInput?.value.trim() || !selectedCategory) return;

    const tagSuffix = taggedUsers.length > 0
      ? ` -- with ${taggedUsers.join(', ')}`
      : '';

    const bodyText = (bodyInput?.value.trim() || titleInput.value.trim()) + tagSuffix;

    const newPost: Post = {
      id: generateId(),
      title: titleInput.value.trim(),
      excerpt: bodyText,
      body: bodyText,
      category: selectedCatName,
      categoryClass: selectedCatClass,
      author: { name: 'Ahmed Ben Ali', avatar: 'https://api.dicebear.com/9.x/thumbs/svg?seed=Tunisia', level: 5 },
      votes: 1,
      userVote: 1,
      commentCount: 0,
      timeAgo: 'just now',
      location: selectedLocation || undefined,
    };

    addUserPost(newPost);
    closeModal();

    // Show success toast
    if (successToast) {
      successToast.classList.add('show');
      replaceIcons(successToast);
      setTimeout(() => successToast.classList.remove('show'), 3000);
    }

    location.hash = '#/';
    navigate();
  }

  overlay?.addEventListener('click', closeModal);
  cancelBtn?.addEventListener('click', closeModal);
  submitBtn?.addEventListener('click', submitPost);

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal?.classList.contains('open')) {
      closeModal();
    }
  });

  // Open on create-post-bar click (delegated)
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (target.closest('.create-post-bar')) {
      openModal();
    }
  });

  // Sidebar "Create Post" button
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (target.closest('.sidebar-about .btn-primary')) {
      e.preventDefault();
      openModal();
    }
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

  // Theme toggle
  document.getElementById('theme-toggle')?.addEventListener('click', toggleTheme);

  // Replace icons in static nav
  replaceIcons();

  // Global logout handler
  document.getElementById('logout-btn')?.addEventListener('click', () => {
    apiService.logout();
    location.hash = '#/hero';
  });

  // Router
  window.addEventListener('hashchange', navigate);
  navigate();
}

// Boot
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
