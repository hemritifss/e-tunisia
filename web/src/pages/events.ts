import { events } from '../data';

export function renderEventsPage(): string {
  return `
    <div class="events-page page-enter">
      <h2>Upcoming Events</h2>
      <p class="text-secondary" style="margin-bottom: var(--space-6);">Discover festivals, tours, and experiences happening across Tunisia</p>

      <div class="tabs">
        <button class="tab active" data-tab="all">All Events</button>
        <button class="tab" data-tab="music">Music & Arts</button>
        <button class="tab" data-tab="cultural">Cultural</button>
        <button class="tab" data-tab="food">Food & Drink</button>
        <button class="tab" data-tab="wellness">Wellness</button>
      </div>

      <div class="events-list stagger-children">
        ${events.map(ev => `
          <div class="event-card reveal-on-scroll" data-event-cat="${ev.category.toLowerCase().replace(/[& ]/g, '-')}">
            <div class="event-date-box">
              <span class="event-date-month">${ev.month}</span>
              <span class="event-date-day">${ev.day}</span>
            </div>
            <div class="event-info">
              <h4 class="event-title">${ev.title}</h4>
              <div class="event-detail" style="margin-bottom: var(--space-1);">
                <i class="lucide-map-pin" style="font-size: 0.75rem;"></i>
                ${ev.location}
              </div>
              <div class="event-detail" style="margin-bottom: var(--space-1);">
                <i class="lucide-clock" style="font-size: 0.75rem;"></i>
                ${ev.time}
              </div>
              <div class="event-detail">
                <i class="lucide-users" style="font-size: 0.75rem;"></i>
                ${ev.attendees} attending
              </div>
            </div>
            <div style="display: flex; align-items: center;">
              <button class="btn btn-sm btn-secondary">Attend</button>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

export function initEventsPage() {
  document.querySelectorAll('.events-page .tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.events-page .tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
    });
  });
}
