// ============================================
// DISCOVER TRIPS — /#/discover-trips
// Public browse of community-shared trip plans.
// ============================================

import * as api from '../api';
import { replaceIcons } from '../icons';

export function renderDiscoverTripsPage(): string {
  return `
    <div class="discover-trips-page page-enter" id="discover-trips-root">
      <header class="discover-trips-hero">
        <div class="discover-trips-hero-bg" aria-hidden="true"></div>
        <div class="discover-trips-hero-mesh" aria-hidden="true"></div>
        <div class="discover-trips-hero-orbs" aria-hidden="true">
          <span class="discover-trips-hero-orb"></span>
          <span class="discover-trips-hero-orb"></span>
        </div>
        <div class="discover-trips-hero-content">
          <span class="discover-trips-eyebrow"><i class="lucide-compass"></i> Community plans</span>
          <h1>Discover <span class="discover-trips-accent">trips</span></h1>
          <p>Travel plans shared by the e-Tunisia community. Tap any trip to view the full plan or clone it as your own.</p>
        </div>
      </header>

      <div class="discover-trips-filters" id="discover-trips-filters">
        <div class="discover-trips-tabs" data-role="sort" role="tablist" aria-label="Sort trips"></div>
        <div class="discover-trips-search-row">
          <span class="discover-trips-search-wrap">
            <i class="lucide-map-pin"></i>
            <input type="text" class="discover-trips-city" placeholder="Filter by city (e.g. Djerba)" data-role="city" aria-label="Filter by city" />
          </span>
          <span class="discover-trips-select-wrap">
            <i class="lucide-calendar-days"></i>
            <select class="discover-trips-days" data-role="days" aria-label="Trip length">
              <option value="">Any length</option>
              <option value="1-3">1–3 days</option>
              <option value="4-7">4–7 days</option>
              <option value="8-14">8–14 days</option>
              <option value="15-30">15+ days</option>
            </select>
          </span>
        </div>
      </div>

      <div id="discover-trips-grid" class="discover-trips-grid">
        <div class="discover-trips-loading"><div class="spinner"></div><p>Loading trips…</p></div>
      </div>
    </div>
  `;
}

function iconEl(name: string): HTMLElement {
  const i = document.createElement('i');
  i.className = name;
  return i;
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const d = Math.floor(ms / 86_400_000);
  if (d < 1) return 'today';
  if (d < 30) return `${d}d ago`;
  if (d < 365) return `${Math.floor(d / 30)}mo ago`;
  return `${Math.floor(d / 365)}y ago`;
}

let currentSort: 'popular' | 'new' = 'popular';
let currentCity = '';
let currentDays = '';

function buildTripCard(t: api.DiscoverTripCard): HTMLElement {
  const card = document.createElement('a');
  card.className = 'discover-trip-card';
  card.href = `#/trip/${t.slug}`;

  // Cover collage — up to 3 stacked preview images
  const cover = document.createElement('div');
  cover.className = 'discover-trip-cover';
  if (t.previewCovers.length > 0) {
    for (const src of t.previewCovers.slice(0, 3)) {
      const img = document.createElement('img');
      img.src = src.startsWith('http') ? src : `/uploads${src.startsWith('/') ? '' : '/'}${src}`;
      img.alt = '';
      img.loading = 'lazy';
      cover.appendChild(img);
    }
  } else {
    const ph = document.createElement('div');
    ph.className = 'discover-trip-cover-fallback';
    cover.appendChild(ph);
  }
  // Stop-count chip overlay
  const stopChip = document.createElement('span');
  stopChip.className = 'discover-trip-chip';
  stopChip.appendChild(iconEl('lucide-map-pin'));
  const stopText = document.createElement('span');
  stopText.textContent = ` ${t.stopCount} ${t.stopCount === 1 ? 'stop' : 'stops'}`;
  stopChip.appendChild(stopText);
  cover.appendChild(stopChip);
  card.appendChild(cover);

  // Body
  const body = document.createElement('div');
  body.className = 'discover-trip-body';

  const title = document.createElement('h3');
  title.className = 'discover-trip-title';
  title.textContent = t.title;
  body.appendChild(title);

  // Cities line
  if (t.previewCities.length > 0) {
    const cities = document.createElement('div');
    cities.className = 'discover-trip-cities';
    cities.textContent = t.previewCities.join(' · ') + (t.stopCount > t.previewCities.length ? ' · …' : '');
    body.appendChild(cities);
  }

  const meta = document.createElement('div');
  meta.className = 'discover-trip-meta';
  meta.appendChild(metaItem('lucide-calendar-days', `${t.days} ${t.days === 1 ? 'day' : 'days'}`));
  meta.appendChild(metaItem('lucide-users', `${t.travelers} ${t.travelers === 1 ? 'traveler' : 'travelers'}`));
  if (t.viewCount > 0) {
    meta.appendChild(metaItem('lucide-eye', String(t.viewCount)));
  }
  meta.appendChild(metaItem('lucide-clock', timeAgo(t.updatedAt)));
  body.appendChild(meta);

  card.appendChild(body);
  return card;
}

function metaItem(icon: string, text: string): HTMLElement {
  const span = document.createElement('span');
  span.appendChild(iconEl(icon));
  const t = document.createElement('span');
  t.textContent = ' ' + text;
  span.appendChild(t);
  return span;
}

function buildSortTabs(): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'discover-trips-tabs-inner';
  const opts: Array<{ key: 'popular' | 'new'; label: string; icon: string }> = [
    { key: 'popular', label: 'Popular', icon: 'lucide-flame' },
    { key: 'new',     label: 'Newest',  icon: 'lucide-clock' },
  ];
  for (const o of opts) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `discover-trips-tab ${currentSort === o.key ? 'active' : ''}`;
    btn.dataset.value = o.key;
    btn.appendChild(iconEl(o.icon));
    const t = document.createElement('span');
    t.textContent = ' ' + o.label;
    btn.appendChild(t);
    btn.addEventListener('click', () => {
      currentSort = o.key;
      refresh();
    });
    wrap.appendChild(btn);
  }
  return wrap;
}

async function refresh() {
  const grid = document.getElementById('discover-trips-grid');
  const tabsHost = document.querySelector('.discover-trips-tabs') as HTMLElement | null;
  if (!grid || !tabsHost) return;

  // Re-render sort tabs (cheap, keeps active state correct)
  tabsHost.replaceChildren();
  tabsHost.appendChild(buildSortTabs());

  grid.replaceChildren();
  const loading = document.createElement('div');
  loading.className = 'favorites-loading';
  const sp = document.createElement('div'); sp.className = 'spinner';
  loading.appendChild(sp);
  grid.appendChild(loading);

  // Parse days range
  let minDays: number | undefined;
  let maxDays: number | undefined;
  if (currentDays) {
    const [a, b] = currentDays.split('-');
    minDays = Number(a) || undefined;
    maxDays = Number(b) || undefined;
  }

  try {
    const res = await api.discoverTrips({
      sort: currentSort,
      city: currentCity || undefined,
      minDays, maxDays,
      limit: 36,
    });
    const rows = Array.isArray(res?.data) ? res.data : [];
    grid.replaceChildren();
    if (rows.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.appendChild(iconEl('lucide-search-x'));
      const h = document.createElement('h3');
      h.textContent = 'No trips match';
      empty.appendChild(h);
      const p = document.createElement('p');
      p.textContent = 'Try a different city or duration — or build the first trip yourself.';
      empty.appendChild(p);
      const cta = document.createElement('a');
      cta.className = 'btn btn-primary';
      cta.href = '#/explore';
      cta.appendChild(iconEl('lucide-compass'));
      cta.appendChild(document.createTextNode(' Browse places'));
      empty.appendChild(cta);
      grid.appendChild(empty);
    } else {
      for (const t of rows) grid.appendChild(buildTripCard(t));
    }
    replaceIcons(grid);
    replaceIcons(tabsHost);
  } catch {
    grid.replaceChildren();
    const err = document.createElement('p');
    err.className = 'text-muted';
    err.style.padding = 'var(--space-3)';
    err.textContent = 'Could not load trips.';
    grid.appendChild(err);
  }
}

export async function initDiscoverTripsPage() {
  const filters = document.getElementById('discover-trips-filters');
  if (!filters) return;
  const cityInput = filters.querySelector('[data-role="city"]') as HTMLInputElement;
  const daysSel = filters.querySelector('[data-role="days"]') as HTMLSelectElement;

  let timer: number | null = null;
  cityInput.addEventListener('input', () => {
    if (timer) clearTimeout(timer);
    timer = window.setTimeout(() => {
      currentCity = cityInput.value.trim();
      refresh();
    }, 250);
  });
  daysSel.addEventListener('change', () => {
    currentDays = daysSel.value;
    refresh();
  });

  await refresh();
}
