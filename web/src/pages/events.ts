// ============================================
// EVENTS PAGE — What's happening in Tunisia
// ============================================

import { events as mockEvents, type Event } from '../data';
import * as api from '../api';
import { replaceIcons } from '../icons';
import { isFlagged, toggleFlag, requireAuth } from '../ui-utils';

const eventImages: Record<string, string> = {
  'carthage-festival': 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&h=400&fit=crop',
  'tabarka-jazz': 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=600&h=400&fit=crop',
  'douz-sahara': 'https://images.unsplash.com/photo-1509316785289-ef98d7f4e7e8?w=600&h=400&fit=crop',
  'djerba-street': 'https://images.unsplash.com/photo-1499781350541-7783f6c6a0c8?w=600&h=400&fit=crop',
  'olive-oil': 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&h=400&fit=crop',
  'medina-night': 'https://images.unsplash.com/photo-1519999482648-25049ddd37b1?w=600&h=400&fit=crop',
};

const categoryColors: Record<string, string> = {
  'Music': 'var(--coral)',
  'Culture': 'var(--mediterranean)',
  'Food': 'var(--olive)',
  'Sports': 'var(--gold)',
  'Art': 'var(--accent)',
};

function renderEventCard(ev: any): string {
  const month = ev.month || (ev.date ? new Date(ev.date).toLocaleString('en', { month: 'short' }).toUpperCase() : '');
  const day = ev.day || (ev.date ? new Date(ev.date).getDate().toString().padStart(2, '0') : '');
  const image = ev.image || eventImages[ev.id] || 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=600&h=400&fit=crop';
  const catColor = categoryColors[ev.category] || 'var(--primary)';
  // Restore the user's persisted "attending" state on every render.
  const attending = !!ev.attending || isFlagged('event:' + ev.id + ':attend');

  return `
    <div class="event2-card reveal-on-scroll" data-event-id="${ev.id}">
      <div class="event2-img">
        <img src="${image}" alt="${ev.title}" />
        <span class="event2-cat" style="--cat-color: ${catColor}">${ev.category || 'Event'}</span>
      </div>
      <div class="event2-body">
        <div class="event2-date">
          <span class="event2-month">${month}</span>
          <span class="event2-day">${day}</span>
        </div>
        <div class="event2-info">
          <h4 class="event2-title">${ev.title}</h4>
          <p class="event2-location">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
            ${ev.location || ''}
          </p>
          <p class="event2-time">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            ${ev.time || ''}
          </p>
          <div class="event2-footer">
            <span class="event2-attendees">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
              ${ev.attendees || 0} attending
            </span>
            <button class="event2-attend-btn ${attending ? 'attended' : ''}" data-event="${ev.id}">
              ${attending
                ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> Attending'
                : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> Attend'
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function renderEventSkeleton(): string {
  return `
    <div class="event2-card event2-skeleton">
      <div class="skeleton" style="height: 180px;"></div>
      <div style="padding: 1.25rem;">
        <div class="skeleton skeleton-text" style="width: 70%; height: 18px; margin-bottom: 0.75rem;"></div>
        <div class="skeleton skeleton-text w-50" style="margin-bottom: 0.5rem;"></div>
        <div class="skeleton skeleton-text w-75" style="margin-bottom: 1rem;"></div>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div class="skeleton" style="width: 80px; height: 16px; border-radius: 100px;"></div>
          <div class="skeleton" style="width: 70px; height: 32px; border-radius: var(--radius-md);"></div>
        </div>
      </div>
    </div>
  `;
}

export function renderEventsPage(): string {
  return `
    <div class="events-page page-enter" data-design="sleek">
      <!-- Hero -->
      <section class="event2-hero">
        <div class="event2-hero-bg"></div>
        <div class="event2-hero-content">
          <span class="event2-eyebrow">Don't Miss Out</span>
          <h1>What's Happening in <span class="event2-accent">Tunisia</span></h1>
          <p>Festivals, cultural tours, food tastings, and unforgettable experiences across the country.</p>
        </div>
      </section>

      <!-- Filters -->
      <div class="event2-filters-wrapper">
        <div class="event2-filters" id="event-filters">
          <button class="event2-filter active" data-filter="all">All Events</button>
          <button class="event2-filter" data-filter="Music">Music</button>
          <button class="event2-filter" data-filter="Culture">Culture</button>
          <button class="event2-filter" data-filter="Food">Food</button>
          <button class="event2-filter" data-filter="Sports">Sports</button>
          <button class="event2-filter" data-filter="Art">Art</button>
        </div>
      </div>

      <!-- Grid -->
      <div class="event2-grid" id="events-list">
        ${[1, 2, 3, 4, 5, 6].map(() => renderEventSkeleton()).join('')}
      </div>
    </div>
  `;
}

let allEvents: any[] = [];

export async function initEventsPage() {
  const grid = document.getElementById('events-list');
  if (!grid) return;

  try {
    allEvents = await api.getEvents();
    if (!allEvents?.length) allEvents = mockEvents;
  } catch {
    allEvents = mockEvents;
  }

  grid.innerHTML = allEvents.map(ev => renderEventCard(ev)).join('');
  replaceIcons(grid);

  // Category filter
  document.querySelectorAll('.event2-filters .event2-filter').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.event2-filters .event2-filter').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = (btn as HTMLElement).dataset.filter;
      const filtered = filter === 'all' ? allEvents : allEvents.filter(e => e.category === filter);
      grid.innerHTML = filtered.map(ev => renderEventCard(ev)).join('');
      replaceIcons(grid);
      bindAttendButtons();
    });
  });

  bindAttendButtons();
}

function bindAttendButtons() {
  document.querySelectorAll('.event2-attend-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const el = btn as HTMLElement;
      const eventId = el.dataset.event;
      if (!eventId) return;
      if (!requireAuth('attend events')) return;
      if (el.classList.contains('attended')) return;
      el.classList.add('attended');
      el.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> Attending';
      toggleFlag('event:' + eventId + ':attend'); // persist so refresh keeps it
      try { api.attendEvent(eventId); } catch {}
    });
  });
}
