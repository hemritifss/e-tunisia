// ============================================
// EVENTS PAGE — What's happening in Tunisia
// Cinematic hero + Lucide-iconed filters + featured-first grid.
// Per design-system/pages/events.md.
// ============================================

import { events as mockEvents } from '../data';
import * as api from '../api';
import { replaceIcons } from '../icons';
import { isFlagged, toggleFlag, requireAuth } from '../ui-utils';

const eventImages: Record<string, string> = {
  'carthage-festival': 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&h=400&fit=crop',
  'tabarka-jazz':      'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=600&h=400&fit=crop',
  'douz-sahara':       'https://images.unsplash.com/photo-1509316785289-ef98d7f4e7e8?w=600&h=400&fit=crop',
  'djerba-street':     'https://images.unsplash.com/photo-1499781350541-7783f6c6a0c8?w=600&h=400&fit=crop',
  'olive-oil':         'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&h=400&fit=crop',
  'medina-night':      'https://images.unsplash.com/photo-1519999482648-25049ddd37b1?w=600&h=400&fit=crop',
};

/** Category metadata — closes the loop with Explore + Mood palettes. */
interface CategoryDef {
  id: string;
  label: string;
  /** lucide-* icon name used via <i class="lucide-NAME"> + replaceIcons() */
  icon: string;
  /** Brand token reference (resolves at use-time via inline --cat-tint). */
  tint: string;
}

const CATEGORIES: CategoryDef[] = [
  { id: 'all',     label: 'All Events', icon: 'calendar-days',    tint: 'var(--text-secondary)' },
  { id: 'Music',   label: 'Music',      icon: 'music-2',          tint: 'var(--coral)' },
  { id: 'Culture', label: 'Culture',    icon: 'theater',          tint: 'var(--mediterranean)' },
  { id: 'Food',    label: 'Food',       icon: 'utensils-crossed', tint: 'var(--olive)' },
  { id: 'Sports',  label: 'Sports',     icon: 'trophy',           tint: 'var(--gold)' },
  { id: 'Art',     label: 'Art',        icon: 'palette',          tint: 'var(--accent)' },
];

const CATEGORY_TINTS: Record<string, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c.tint]),
);

function esc(s: string): string {
  return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function renderEventCard(ev: any, opts: { featured?: boolean } = {}): string {
  const month = ev.month || (ev.date ? new Date(ev.date).toLocaleString('en', { month: 'short' }).toUpperCase() : '');
  const day = ev.day || (ev.date ? new Date(ev.date).getDate().toString().padStart(2, '0') : '');
  const image = ev.image || eventImages[ev.id] || 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=600&h=400&fit=crop';
  const tint = CATEGORY_TINTS[ev.category] || 'var(--accent)';
  const attending = !!ev.attending || isFlagged('event:' + ev.id + ':attend');
  const variantClass = opts.featured ? ' event2-card-featured' : '';

  return `
    <article class="event2-card${variantClass} reveal-on-scroll" data-event-id="${esc(ev.id)}" style="--cat-tint: ${tint}">
      <div class="event2-img">
        <img src="${esc(image)}" alt="${esc(ev.title)}" loading="lazy" />
        <span class="event2-cat">
          <i class="lucide-tag"></i>
          ${esc(ev.category || 'Event')}
        </span>
        ${opts.featured ? '<span class="event2-featured-badge"><i class="lucide-sparkles"></i> Featured</span>' : ''}
      </div>
      <div class="event2-body">
        <div class="event2-date" aria-label="${esc(month)} ${esc(day)}">
          <span class="event2-month">${esc(month)}</span>
          <span class="event2-day">${esc(day)}</span>
        </div>
        <div class="event2-info">
          <h3 class="event2-title">${esc(ev.title)}</h3>
          ${ev.location ? `<p class="event2-location"><i class="lucide-map-pin"></i> ${esc(ev.location)}</p>` : ''}
          ${ev.time ? `<p class="event2-time"><i class="lucide-clock"></i> ${esc(ev.time)}</p>` : ''}
          <div class="event2-footer">
            <span class="event2-attendees">
              <i class="lucide-users"></i>
              <strong>${Number(ev.attendees) || 0}</strong> attending
            </span>
            <button
              type="button"
              class="event2-attend-btn ${attending ? 'is-attended' : ''}"
              data-event="${esc(ev.id)}"
              aria-pressed="${attending ? 'true' : 'false'}"
            >
              <i class="lucide-${attending ? 'check' : 'plus'}"></i>
              <span>${attending ? 'Attending' : 'Attend'}</span>
            </button>
          </div>
        </div>
      </div>
    </article>
  `;
}

export function renderEventSkeleton(): string {
  return `
    <div class="event2-card event2-skeleton" aria-hidden="true">
      <div class="event2-skel-img"></div>
      <div class="event2-skel-body">
        <div class="event2-skel-line w-70"></div>
        <div class="event2-skel-line w-50"></div>
        <div class="event2-skel-line w-75"></div>
        <div class="event2-skel-footer">
          <div class="event2-skel-pill"></div>
          <div class="event2-skel-btn"></div>
        </div>
      </div>
    </div>
  `;
}

export function renderEventsPage(): string {
  return `
    <div class="events-page page-enter">
      <!-- Hero — cinematic mesh + 2 orbs -->
      <section class="event2-hero">
        <div class="event2-hero-gradient" aria-hidden="true"></div>
        <div class="event2-hero-mesh" aria-hidden="true"></div>
        <div class="event2-hero-orbs" aria-hidden="true">
          <span class="event2-hero-orb"></span>
          <span class="event2-hero-orb"></span>
        </div>
        <div class="event2-hero-content">
          <span class="event2-eyebrow">
            <i class="lucide-calendar-days"></i>
            Don't miss out
          </span>
          <h1>What's happening in <span class="event2-accent">Tunisia</span></h1>
          <p>Festivals, cultural tours, food tastings, and unforgettable experiences across the country.</p>
        </div>
      </section>

      <!-- Category filters — Lucide icons + brand tints -->
      <nav class="event2-filters-wrapper" aria-label="Event category filter">
        <div class="event2-filters" id="event-filters" role="tablist">
          ${CATEGORIES.map((c, i) => `
            <button
              type="button"
              role="tab"
              class="event2-filter${i === 0 ? ' active' : ''}"
              data-filter="${esc(c.id)}"
              style="--cat-tint: ${c.tint}"
              aria-selected="${i === 0 ? 'true' : 'false'}"
            >
              <span class="event2-filter-icon"><i class="lucide-${c.icon}"></i></span>
              ${esc(c.label)}
            </button>
          `).join('')}
        </div>
      </nav>

      <!-- Grid -->
      <div class="event2-grid" id="events-list">
        ${[1, 2, 3, 4, 5, 6].map(() => renderEventSkeleton()).join('')}
      </div>
    </div>
  `;
}

let allEvents: any[] = [];

function renderEmpty(activeLabel: string): string {
  return `
    <div class="event2-empty">
      <div class="event2-empty-icon"><i class="lucide-calendar-x"></i></div>
      <h3>No ${esc(activeLabel.toLowerCase())} events on the calendar</h3>
      <p>Check back soon — new ones land here as the community shares them.</p>
      <button type="button" class="btn btn-outline" data-clear-filter>
        <i class="lucide-rotate-ccw"></i> Show all events
      </button>
    </div>
  `;
}

function paintGrid(grid: HTMLElement, list: any[], opts: { activeLabel?: string } = {}) {
  if (!list.length) {
    grid.innerHTML = renderEmpty(opts.activeLabel || 'matching');
    replaceIcons(grid);
    grid.querySelector<HTMLButtonElement>('[data-clear-filter]')?.addEventListener('click', () => {
      const allBtn = document.querySelector<HTMLButtonElement>('.event2-filter[data-filter="all"]');
      allBtn?.click();
    });
    return;
  }

  // Featured-first variant on the canonical (unfiltered) list — first card spans the row.
  const html = list
    .map((ev, i) => renderEventCard(ev, { featured: i === 0 && list.length >= 3 }))
    .join('');
  grid.innerHTML = html;
  replaceIcons(grid);
  bindAttendButtons();
}

export async function initEventsPage() {
  const grid = document.getElementById('events-list');
  if (!grid) return;

  try {
    allEvents = await api.getEvents();
    if (!allEvents?.length) allEvents = mockEvents as any[];
  } catch {
    allEvents = mockEvents as any[];
  }

  paintGrid(grid, allEvents);

  // Category filter
  document.querySelectorAll<HTMLButtonElement>('.event2-filters .event2-filter').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll<HTMLButtonElement>('.event2-filters .event2-filter').forEach((b) => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      const filter = btn.dataset.filter || 'all';
      const filtered = filter === 'all' ? allEvents : allEvents.filter((e) => e.category === filter);
      const cat = CATEGORIES.find((c) => c.id === filter);
      paintGrid(grid, filtered, { activeLabel: cat?.label || 'matching' });
    });
  });
}

function bindAttendButtons() {
  document.querySelectorAll<HTMLButtonElement>('.event2-attend-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const eventId = btn.dataset.event;
      if (!eventId) return;
      if (!requireAuth('attend events')) return;
      if (btn.classList.contains('is-attended')) return;

      btn.classList.add('is-attended', 'is-celebrating');
      btn.setAttribute('aria-pressed', 'true');
      btn.innerHTML = '<i class="lucide-check"></i> <span>Attending</span>';
      replaceIcons(btn);
      toggleFlag('event:' + eventId + ':attend');
      try { api.attendEvent(eventId); } catch {}

      // Brief celebration animation; clears so the rest state is calm.
      window.setTimeout(() => btn.classList.remove('is-celebrating'), 600);
    });
  });
}
