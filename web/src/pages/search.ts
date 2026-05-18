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

  container.innerHTML = `<div class="text-muted text-center" style="padding:var(--space-4);">Searching…</div>`;
  let res: { places: any[] } = { places: [] };
  try { res = await api.search(query); } catch {}

  if (!res.places.length) {
    container.innerHTML = `<div class="empty-state" style="padding:var(--space-8);"><i class="lucide-search-x" style="font-size:2.5rem;color:var(--text-muted);"></i><h3>No matches for “${escapeHtml(query)}”</h3><p>Try a different city or tag.</p></div>`;
    replaceIcons(container);
    return;
  }

  container.innerHTML = `
    <section class="search-section">
      <h3 class="search-section-title">Places <span class="text-muted">(${res.places.length})</span></h3>
      <div class="search-place-grid">
        ${res.places.map(renderPlaceTile).join('')}
      </div>
    </section>
  `;
  replaceIcons(container);
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
