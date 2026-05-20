// ============================================
// MY INQUIRIES — /#/inquiries
// Shows quote requests the user has submitted across places.
// ============================================

import * as api from '../api';
import { replaceIcons } from '../icons';

export function renderInquiriesPage(): string {
  return `
    <div class="inquiries-page page-enter" data-design="sleek" id="inquiries-root">
      <div class="favorites-header">
        <h1><i class="lucide-send"></i> My Inquiries</h1>
        <p>Quote and booking requests you've sent to places.</p>
      </div>
      <div id="inquiry-list" class="inquiry-list">
        <div class="favorites-loading">
          <div class="spinner"></div>
          <p>Loading your inquiries…</p>
        </div>
      </div>
    </div>
  `;
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60_000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function fmtDate(d: string | null | undefined): string {
  if (!d) return '';
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return '';
  return dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/** Build a card via createElement so user-provided strings flow through textContent only. */
function buildCard(i: any): HTMLElement {
  const place = i.place || {};
  // For BOOKED inquiries, the card becomes a div so the inline "review" button doesn't trigger nav.
  const isBooked = i.status === 'booked';
  const a: HTMLAnchorElement | HTMLDivElement = isBooked
    ? document.createElement('div')
    : (() => {
        const el = document.createElement('a');
        el.href = `#/place/${place.id || ''}`;
        return el;
      })();
  a.className = 'inquiry-card';

  // Thumb
  if (place.coverImage) {
    const img = document.createElement('img');
    img.className = 'inquiry-card-thumb';
    img.src = api.getImageUrl(place.coverImage);
    img.loading = 'lazy';
    img.alt = '';
    a.appendChild(img);
  } else {
    const ph = document.createElement('div');
    ph.className = 'inquiry-card-thumb';
    a.appendChild(ph);
  }

  // Body
  const body = document.createElement('div');
  body.className = 'inquiry-card-body';

  const headerRow = document.createElement('div');
  headerRow.style.cssText = 'display:flex; justify-content:space-between; align-items:flex-start; gap:8px;';
  const title = document.createElement('h3');
  title.className = 'inquiry-card-title';
  title.textContent = place.name || 'Place';
  const pill = document.createElement('span');
  pill.className = `inquiry-status-pill ${String(i.status || 'new')}`;
  pill.textContent = i.status || 'new';
  headerRow.appendChild(title);
  headerRow.appendChild(pill);
  body.appendChild(headerRow);

  // Meta line
  const dateRange = (i.dateFrom || i.dateTo)
    ? `${fmtDate(i.dateFrom)}${i.dateTo ? ' → ' + fmtDate(i.dateTo) : ''}`
    : 'Dates flexible';
  const meta = document.createElement('div');
  meta.className = 'inquiry-card-meta';
  const partyTxt = `${i.partySize || 1} ${i.partySize === 1 ? 'traveler' : 'travelers'}`;
  const cityTxt = place.city ? `${place.city} · ` : '';
  const budgetTxt = i.budget ? ` · ${i.budget} ${i.currency || 'TND'}` : '';
  meta.textContent = `${cityTxt}${partyTxt} · ${dateRange}${budgetTxt}`;
  body.appendChild(meta);

  // Message
  const msg = document.createElement('p');
  msg.className = 'inquiry-card-msg';
  msg.textContent = i.message || '';
  body.appendChild(msg);

  // Sent at
  const sent = document.createElement('div');
  sent.className = 'inquiry-card-meta';
  sent.style.marginTop = '4px';
  sent.textContent = `Sent ${timeAgo(i.createdAt)}`;
  body.appendChild(sent);

  // Booked → prompt for a verified review (deep-link carries the inquiry ID so the
  // server can verify ownership and stamp the review with verifiedInquiryId).
  if (isBooked && place.id) {
    const reviewRow = document.createElement('div');
    reviewRow.className = 'inquiry-card-cta';
    const reviewBtn = document.createElement('a');
    reviewBtn.className = 'btn btn-primary btn-sm';
    reviewBtn.href = `#/place/${place.id}?review=1&inquiry=${i.id}`;
    const star = document.createElement('i');
    star.className = 'lucide-star';
    reviewBtn.appendChild(star);
    reviewBtn.appendChild(document.createTextNode(' Leave a verified review'));
    reviewRow.appendChild(reviewBtn);
    const placeLink = document.createElement('a');
    placeLink.className = 'btn btn-ghost btn-sm';
    placeLink.href = `#/place/${place.id}`;
    placeLink.textContent = 'Open place';
    reviewRow.appendChild(placeLink);
    body.appendChild(reviewRow);
  }

  a.appendChild(body);
  return a;
}

function renderEmpty(list: HTMLElement) {
  list.replaceChildren();
  const wrap = document.createElement('div');
  wrap.className = 'empty-state';
  wrap.innerHTML = `
    <i class="lucide-send" style="font-size: 3rem; color: var(--text-muted);"></i>
    <h3>No inquiries yet</h3>
    <p>Find a place you like and tap <strong>Request a quote</strong> — hosts usually reply within 24h.</p>
    <a href="#/explore" class="btn btn-primary"><i class="lucide-compass"></i> Browse places</a>
  `;
  list.appendChild(wrap);
  replaceIcons(list);
}

function renderError(list: HTMLElement) {
  list.replaceChildren();
  const wrap = document.createElement('div');
  wrap.className = 'empty-state';
  wrap.innerHTML = `
    <i class="lucide-alert-circle" style="font-size: 3rem; color: var(--text-muted);"></i>
    <h3>Couldn't load inquiries</h3>
    <p>Sign in and try again.</p>
    <a href="#/login" class="btn btn-primary">Sign in</a>
  `;
  list.appendChild(wrap);
  replaceIcons(list);
}

export async function initInquiriesPage() {
  const list = document.getElementById('inquiry-list');
  if (!list) return;

  let rows: any[] = [];
  try {
    const res = await api.listMyInquiries(1, 50);
    rows = Array.isArray(res?.data) ? res.data : [];
  } catch {
    renderError(list);
    return;
  }

  if (rows.length === 0) {
    renderEmpty(list);
    return;
  }

  list.replaceChildren();
  for (const row of rows) {
    list.appendChild(buildCard(row));
  }
  replaceIcons(list);
}
