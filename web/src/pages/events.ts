// ============================================
// EVENTS PAGE — Connected to backend
// ============================================

import { events as mockEvents, type Event } from '../data';
import * as api from '../api';
import { replaceIcons } from '../icons';

function renderEventCard(ev: any): string {
  const month = ev.month || (ev.date ? new Date(ev.date).toLocaleString('en', { month: 'short' }).toUpperCase() : '');
  const day = ev.day || (ev.date ? new Date(ev.date).getDate().toString().padStart(2, '0') : '');

  return `
    <div class="event-card reveal-on-scroll" data-event-id="${ev.id}">
      <div class="event-date-box">
        <span class="event-month">${month}</span>
        <span class="event-day">${day}</span>
      </div>
      <div class="event-info">
        <h4 class="event-title">${ev.title}</h4>
        <p class="event-meta">
          <i class="lucide-map-pin"></i> ${ev.location || ''}
          <span class="event-time"><i class="lucide-clock"></i> ${ev.time || ''}</span>
        </p>
        <div class="event-footer">
          <span class="event-category">${ev.category || ''}</span>
          <span class="event-attendees"><i class="lucide-users"></i> ${ev.attendees || 0} attending</span>
        </div>
      </div>
      <button class="btn btn-sm btn-primary event-attend-btn" data-event="${ev.id}">
        <i class="lucide-check"></i> Attend
      </button>
    </div>
  `;
}

export function renderEventsPage(): string {
  return `
    <div class="events-page page-enter">
      <div class="events-header">
        <h1><i class="lucide-calendar"></i> Upcoming Events</h1>
        <p>Festivals, cultural tours, food tastings, and more across Tunisia.</p>
      </div>
      <div class="events-list" id="events-list">
        <div class="events-loading">
          <div class="spinner"></div>
          <p>Loading events...</p>
        </div>
      </div>
    </div>
  `;
}

export async function initEventsPage() {
  const list = document.getElementById('events-list');
  if (!list) return;

  let events: any[];
  try {
    events = await api.getEvents();
    if (!events?.length) events = mockEvents;
  } catch {
    events = mockEvents;
  }

  list.innerHTML = events.map(ev => renderEventCard(ev)).join('');
  replaceIcons(list);

  // Attend buttons
  document.querySelectorAll('.event-attend-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const el = btn as HTMLElement;
      if (el.classList.contains('attended')) return;
      el.classList.add('attended');
      el.innerHTML = '<i class="lucide-check-circle"></i> Attending';
      replaceIcons(el);
      const eventId = el.dataset.event;
      if (eventId) try { api.attendEvent(eventId); } catch {}
    });
  });
}
