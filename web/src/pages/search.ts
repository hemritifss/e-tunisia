// ============================================
// SEARCH RESULTS — /#/search?q=...
// Aggregates places (and later posts + users) by query.
// ============================================

import * as api from '../api';
import { replaceIcons } from '../icons';

export function renderSearchPage(): string {
  return `
    <div class="search-page page-enter" data-design="sleek">
      <header class="search-page-header">
        <h1><i class="lucide-search"></i> Search</h1>
        <div class="search-page-input-wrap">
          <i class="lucide-search"></i>
          <input id="search-page-input" type="text" placeholder="Search places, cities, tags…" autocomplete="off" />
        </div>
      </header>

      <div id="search-page-results"></div>
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
  const input = document.getElementById('search-page-input') as HTMLInputElement;
  const results = document.getElementById('search-page-results');
  if (!input || !results) return;

  const initialQ = getQuery();
  if (initialQ) input.value = initialQ;

  // Debounced live search
  let timer: number | null = null;
  const run = () => {
    if (timer) clearTimeout(timer);
    timer = window.setTimeout(() => doSearch(input.value, results), 200);
  };
  input.addEventListener('input', run);

  if (initialQ) await doSearch(initialQ, results);
  else results.innerHTML = `<div class="empty-state" style="padding:var(--space-8);"><i class="lucide-search" style="font-size:2.5rem;color:var(--text-muted);"></i><h3>Type to search</h3><p>Find places, cities, or tags across Tunisia.</p></div>`;

  setTimeout(() => input.focus(), 100);
}

async function doSearch(q: string, container: HTMLElement) {
  const query = (q || '').trim();
  // Persist current query in the hash
  const baseHash = location.hash.split('?')[0] || '#/search';
  history.replaceState(null, '', query ? `${baseHash}?q=${encodeURIComponent(query)}` : baseHash);

  if (!query) {
    container.innerHTML = `<div class="empty-state" style="padding:var(--space-8);"><i class="lucide-search" style="font-size:2.5rem;color:var(--text-muted);"></i><h3>Type to search</h3><p>Find places, cities, or tags across Tunisia.</p></div>`;
    replaceIcons(container);
    return;
  }

  // Loading state (text-only, no untrusted interpolation)
  container.textContent = '';
  const loader = document.createElement('div');
  loader.className = 'text-muted text-center';
  loader.style.padding = 'var(--space-4)';
  loader.textContent = 'Searching…';
  container.appendChild(loader);

  // Places + people in parallel — neither blocks the other.
  const [placesRes, peopleRes] = await Promise.all([
    api.search(query).catch(() => ({ places: [] as any[] })),
    fetch(`/api/v1/users/search?q=${encodeURIComponent(query)}&limit=12`)
      .then((r) => r.json())
      .then((r) => (Array.isArray(r) ? r : r?.data ?? []))
      .catch(() => [] as any[]),
  ]);
  const places = placesRes?.places || [];
  const people: any[] = peopleRes || [];

  container.textContent = '';

  if (!places.length && !people.length) {
    renderEmptyState(container, query);
    return;
  }

  if (people.length) container.appendChild(buildPeopleSection(people));
  if (places.length) container.appendChild(buildPlacesSection(places));
  replaceIcons(container);
}

function renderEmptyState(container: HTMLElement, query: string) {
  const wrap = document.createElement('div');
  wrap.className = 'empty-state';
  wrap.style.padding = 'var(--space-8)';
  const icon = document.createElement('i');
  icon.className = 'lucide-search-x';
  icon.style.fontSize = '2.5rem';
  icon.style.color = 'var(--text-muted)';
  const h3 = document.createElement('h3');
  h3.textContent = `No matches for "${query}"`;
  const p = document.createElement('p');
  p.textContent = 'Try a different city, tag, or handle.';
  wrap.append(icon, h3, p);
  container.appendChild(wrap);
  replaceIcons(container);
}

function buildPeopleSection(people: any[]): HTMLElement {
  const section = document.createElement('section');
  section.className = 'search-section';
  const heading = document.createElement('h3');
  heading.className = 'search-section-title';
  heading.append('People ');
  const meta = document.createElement('span');
  meta.className = 'text-muted';
  meta.textContent = `(${people.length})`;
  heading.appendChild(meta);
  section.appendChild(heading);
  const list = document.createElement('div');
  list.className = 'search-people-list';
  people.forEach((u) => list.appendChild(buildPersonCard(u)));
  section.appendChild(list);
  return section;
}

function buildPersonCard(u: any): HTMLAnchorElement {
  const card = document.createElement('a');
  card.className = 'search-person-card';
  card.href = u.handle ? `#/u/${encodeURIComponent(u.handle)}` : '#';

  const img = document.createElement('img');
  img.alt = u.fullName || 'Traveler';
  img.loading = 'lazy';
  img.src = u.avatar
    ? api.getImageUrl(u.avatar, 'avatar')
    : `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(u.fullName || u.handle || 'u')}`;
  card.appendChild(img);

  const meta = document.createElement('div');
  meta.className = 'search-person-meta';
  const nameLine = document.createElement('strong');
  nameLine.textContent = u.fullName || 'Traveler';
  if (u.role === 'creator') {
    nameLine.append(' ');
    const guide = document.createElement('span');
    guide.className = 'search-person-guide';
    guide.title = 'Local Guide';
    guide.textContent = '✓';
    nameLine.appendChild(guide);
  }
  meta.appendChild(nameLine);

  const sub = document.createElement('span');
  sub.className = 'text-xs text-muted';
  const handlePart = u.handle ? `@${u.handle}` : '';
  const countryPart = u.country ? ` · ${u.country}` : '';
  sub.textContent = `${handlePart}${countryPart}`.trim() || ' ';
  meta.appendChild(sub);

  if (u.bio) {
    const bio = document.createElement('span');
    bio.className = 'search-person-bio text-xs';
    bio.textContent = u.bio;
    meta.appendChild(bio);
  }
  card.appendChild(meta);

  const followers = document.createElement('span');
  followers.className = 'search-person-followers text-xs text-muted';
  const icon = document.createElement('i');
  icon.className = 'lucide-users';
  icon.style.fontSize = '.7rem';
  followers.append(icon, ` ${u.followersCount || 0}`);
  card.appendChild(followers);

  return card;
}

function buildPlacesSection(places: any[]): HTMLElement {
  const section = document.createElement('section');
  section.className = 'search-section';
  const heading = document.createElement('h3');
  heading.className = 'search-section-title';
  heading.append('Places ');
  const meta = document.createElement('span');
  meta.className = 'text-muted';
  meta.textContent = `(${places.length})`;
  heading.appendChild(meta);
  section.appendChild(heading);
  const grid = document.createElement('div');
  grid.className = 'search-place-grid';
  const tpl = document.createElement('template');
  tpl.innerHTML = places.map(renderPlaceTile).join('');
  grid.appendChild(tpl.content.cloneNode(true));
  section.appendChild(grid);
  return section;
}

function renderPlaceTile(p: any): string {
  const cat = p.category?.name || p.category || '';
  const img = api.getImageUrl(p.coverImage || (p.images && p.images[0]) || '', 'place');
  return `
    <a href="#/place/${p.id}" class="search-place-card">
      <img src="${img}" alt="${p.name}" loading="lazy" />
      <div class="search-place-info">
        <strong>${p.name}</strong>
        <span class="text-xs text-muted"><i class="lucide-map-pin" style="font-size:.7rem"></i> ${p.city || ''}${cat ? ' · ' + cat : ''}</span>
      </div>
    </a>
  `;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
