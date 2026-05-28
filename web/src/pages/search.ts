// ============================================
// SEARCH RESULTS — /#/search?q=...
// Aggregates places + people by query. Live-debounced.
// Per design-system/pages/messages-search.md.
// ============================================

import * as api from '../api';
import { replaceIcons } from '../icons';

function esc(s: unknown): string {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export function renderSearchPage(): string {
  return `
    <div class="search-page page-enter">
      <header class="search-page-head">
        <span class="search-page-eyebrow"><i class="lucide-search"></i> Discover</span>
        <h1>Search Tunisia</h1>
        <p>Find places, cities, tags, or travelers — all in one place.</p>
        <div class="search-page-input-wrap">
          <i class="lucide-search search-page-input-icon"></i>
          <input
            id="search-page-input"
            type="search"
            class="search-page-input"
            placeholder="Search places, cities, tags, people…"
            autocomplete="off"
            aria-label="Search"
          />
          <button
            type="button"
            class="search-page-clear"
            id="search-page-clear"
            aria-label="Clear search"
            hidden
          ><i class="lucide-x"></i></button>
        </div>
      </header>

      <div id="search-page-results" class="search-page-results"></div>
    </div>
  `;
}

function getQuery(): string {
  const hash = location.hash || '';
  const i = hash.indexOf('?');
  if (i < 0) return '';
  const params = new URLSearchParams(hash.slice(i + 1));
  return params.get('q') || (params.get('hashtag') ? '#' + params.get('hashtag') : '') || '';
}

export async function initSearchPage() {
  const input = document.getElementById('search-page-input') as HTMLInputElement | null;
  const results = document.getElementById('search-page-results') as HTMLElement | null;
  const clearBtn = document.getElementById('search-page-clear') as HTMLButtonElement | null;
  if (!input || !results) return;

  const initialQ = getQuery();
  if (initialQ) {
    input.value = initialQ;
    if (clearBtn) clearBtn.hidden = false;
  }

  // Debounced live search
  let timer: number | null = null;
  const run = () => {
    if (timer) clearTimeout(timer);
    if (clearBtn) clearBtn.hidden = !input.value;
    timer = window.setTimeout(() => doSearch(input.value, results), 200);
  };
  input.addEventListener('input', run);

  clearBtn?.addEventListener('click', () => {
    input.value = '';
    clearBtn.hidden = true;
    input.focus();
    doSearch('', results);
  });

  if (initialQ) await doSearch(initialQ, results);
  else renderHint(results);

  setTimeout(() => input.focus(), 100);
}

function renderHint(container: HTMLElement) {
  container.innerHTML = `
    <div class="search-empty">
      <div class="search-empty-icon"><i class="lucide-search"></i></div>
      <h3>Start typing to search</h3>
      <p>Find places, cities, tags, or travelers across Tunisia.</p>
    </div>
  `;
  replaceIcons(container);
}

function renderNoMatch(container: HTMLElement, query: string) {
  container.innerHTML = `
    <div class="search-empty">
      <div class="search-empty-icon"><i class="lucide-search-x"></i></div>
      <h3>No matches for "${esc(query)}"</h3>
      <p>Try a different city, tag, or handle.</p>
    </div>
  `;
  replaceIcons(container);
}

async function doSearch(q: string, container: HTMLElement) {
  const query = (q || '').trim();
  const baseHash = location.hash.split('?')[0] || '#/search';
  history.replaceState(null, '', query ? `${baseHash}?q=${encodeURIComponent(query)}` : baseHash);

  if (!query) {
    renderHint(container);
    return;
  }

  // Loading placeholder (skeletons rather than spinner — looks more responsive).
  container.innerHTML = `
    <div class="search-loading">
      ${Array.from({ length: 4 }).map(() => '<div class="search-skel-row"></div>').join('')}
    </div>
  `;

  const res = await api.search(query).catch(() => ({ places: [] as any[], posts: [] as any[], users: [] as any[] }));
  const places = res?.places || [];
  const posts = res?.posts || [];
  const users = res?.users || [];

  container.textContent = '';

  if (!places.length && !users.length && !posts.length) {
    renderNoMatch(container, query);
    return;
  }

  if (users.length) container.appendChild(buildPeopleSection(users));
  if (places.length) container.appendChild(buildPlacesSection(places));
  if (posts.length) container.appendChild(buildPostsSection(posts));
  replaceIcons(container);
}

function buildSection(title: string, count: number, body: HTMLElement): HTMLElement {
  const section = document.createElement('section');
  section.className = 'search-section';
  const heading = document.createElement('h2');
  heading.className = 'search-section-title';
  const titleSpan = document.createElement('span');
  titleSpan.textContent = title;
  heading.appendChild(titleSpan);
  const countPill = document.createElement('span');
  countPill.className = 'search-section-count';
  countPill.textContent = String(count);
  heading.appendChild(countPill);
  section.appendChild(heading);
  section.appendChild(body);
  return section;
}

function buildPeopleSection(people: any[]): HTMLElement {
  const list = document.createElement('div');
  list.className = 'search-people-list';
  people.forEach((u) => list.appendChild(buildPersonCard(u)));
  return buildSection('People', people.length, list);
}

function tierBadge(u: any): HTMLElement | null {
  // Tier hierarchy: Business > Pro > Local Guide. One badge maximum.
  // Per MASTER §4 no-emoji-icons, ✦/✓ glyphs replaced with Lucide icons.
  let kind: 'business' | 'pro' | 'guide' | null = null;
  if (u.plan === 'business') kind = 'business';
  else if (u.plan === 'premium' || u.plan === 'admin') kind = 'pro';
  else if (u.role === 'creator') kind = 'guide';
  if (!kind) return null;

  const badge = document.createElement('span');
  badge.className = `search-tier-badge is-${kind}`;
  badge.title = kind === 'business' ? 'Verified Business' : kind === 'pro' ? 'Pro Traveler' : 'Local Guide';
  badge.setAttribute('aria-label', badge.title);
  const icon = document.createElement('i');
  icon.className = kind === 'pro' ? 'lucide-sparkles' : kind === 'business' ? 'lucide-check' : 'lucide-badge-check';
  badge.appendChild(icon);
  return badge;
}

function buildPersonCard(u: any): HTMLAnchorElement {
  const card = document.createElement('a');
  card.className = 'search-person-card';
  card.href = u.handle ? `#/u/${encodeURIComponent(u.handle)}` : '#';
  // data-user-* lets the global UserActionMenu open on right-click / long-press
  card.setAttribute('data-user-id', u.id || '');
  card.setAttribute('data-user-name', u.fullName || '');
  card.setAttribute('data-user-avatar', u.avatar ? api.getImageUrl(u.avatar, 'avatar') : '');
  card.setAttribute('data-user-handle', u.handle || '');
  card.setAttribute('data-user-plan', u.plan || '');

  const img = document.createElement('img');
  img.className = 'search-person-avatar';
  img.alt = '';
  img.loading = 'lazy';
  img.src = u.avatar
    ? api.getImageUrl(u.avatar, 'avatar')
    : `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(u.fullName || u.handle || 'u')}`;
  card.appendChild(img);

  const meta = document.createElement('div');
  meta.className = 'search-person-meta';

  const nameLine = document.createElement('strong');
  nameLine.className = 'search-person-name';
  nameLine.textContent = u.fullName || 'Traveler';
  const badge = tierBadge(u);
  if (badge) nameLine.appendChild(badge);
  meta.appendChild(nameLine);

  const sub = document.createElement('span');
  sub.className = 'search-person-sub';
  const handlePart = u.handle ? `@${u.handle}` : '';
  const countryPart = u.country ? ` · ${u.country}` : '';
  sub.textContent = `${handlePart}${countryPart}`.trim() || ' ';
  meta.appendChild(sub);

  if (u.bio) {
    const bio = document.createElement('span');
    bio.className = 'search-person-bio';
    bio.textContent = u.bio;
    meta.appendChild(bio);
  }
  card.appendChild(meta);

  const followers = document.createElement('span');
  followers.className = 'search-person-followers';
  const fIcon = document.createElement('i');
  fIcon.className = 'lucide-users';
  followers.appendChild(fIcon);
  const fCount = document.createElement('span');
  fCount.textContent = String(u.followersCount || 0);
  followers.appendChild(fCount);
  card.appendChild(followers);

  return card;
}

function buildPlacesSection(places: any[]): HTMLElement {
  const grid = document.createElement('div');
  grid.className = 'search-place-grid';
  places.forEach((p) => {
    const cat = p.category?.name || p.category || '';
    const img = api.getImageUrl(p.coverImage || (p.images && p.images[0]) || '', 'place');
    const tile = document.createElement('a');
    tile.href = `#/place/${p.id}`;
    tile.className = 'search-place-card';
    tile.innerHTML = `
      <div class="search-place-img"><img src="${esc(img)}" alt="" loading="lazy" /></div>
      <div class="search-place-info">
        <strong>${esc(p.name)}</strong>
        <span class="search-place-sub"><i class="lucide-map-pin"></i> ${esc(p.city || '')}${cat ? ' · ' + esc(cat) : ''}</span>
      </div>
    `;
    grid.appendChild(tile);
  });
  return buildSection('Places', places.length, grid);
}


function buildPostsSection(posts: any[]): HTMLElement {
  const list = document.createElement('div');
  list.className = 'search-post-list';
  posts.forEach((p) => {
    const card = document.createElement('a');
    card.href = `#/post/${p.id}`;
    card.className = 'search-post-card';
    card.innerHTML = `
      <div class="search-post-content">
        <strong>${esc(p.title)}</strong>
        <p>${esc(p.body?.slice(0, 120))}${p.body?.length > 120 ? '…' : ''}</p>
        <span class="search-post-meta">${esc(p.category || 'Post')} · ${esc(p.location || '')}</span>
      </div>
    `;
    list.appendChild(card);
  });
  return buildSection('Posts', posts.length, list);
}
