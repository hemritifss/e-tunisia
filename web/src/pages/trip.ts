// ============================================
// TRIP PAGE - /#/trip (current cart) and /#/trip/<slug> (saved)
// ============================================

import * as api from '../api';
import * as cart from '../trip-cart';
import { replaceIcons } from '../icons';
import { showToast } from '../ui-utils';

export function renderTripPage(_slug: string | null): string {
  return `
    <div class="trip-page page-enter" data-design="sleek" id="trip-root">
      <div class="favorites-loading">
        <div class="spinner"></div>
        <p>Loading trip…</p>
      </div>
    </div>
  `;
}

function iconEl(name: string): HTMLElement {
  const i = document.createElement('i');
  i.className = name;
  return i;
}

function fmtPrice(n: number, currency: string): string {
  return `${(Math.round(n) || 0).toLocaleString()} ${currency || 'TND'}`;
}

export async function initTripPage(slug: string | null) {
  const root = document.getElementById('trip-root');
  if (!root) return;

  if (slug) {
    await renderSavedTrip(root, slug);
  } else {
    renderCartView(root);
    // Re-render the cart view on every cart change so removals stay reflected
    cart.onCartChange(() => renderCartView(root));
  }
}

// ────────────────────────────────────────────────────────────
// Current cart view (/#/trip)
// ────────────────────────────────────────────────────────────
function renderCartView(root: HTMLElement) {
  const state = cart.getCart();
  root.replaceChildren();

  const head = document.createElement('header');
  head.className = 'trip-page-head';
  const titleWrap = document.createElement('div');
  const h1 = document.createElement('h1');
  h1.appendChild(iconEl('lucide-luggage'));
  h1.appendChild(document.createTextNode(' ' + (state.title || 'My Tunisia trip')));
  titleWrap.appendChild(h1);
  const sub = document.createElement('p');
  sub.className = 'trip-page-sub';
  sub.textContent = `${state.stops.length} ${state.stops.length === 1 ? 'stop' : 'stops'} - ${state.travelers} ${state.travelers === 1 ? 'traveler' : 'travelers'} - ${state.days} ${state.days === 1 ? 'day' : 'days'}`;
  titleWrap.appendChild(sub);
  head.appendChild(titleWrap);

  if (state.stops.length > 0) {
    const ctaRow = document.createElement('div');
    ctaRow.className = 'trip-page-actions';

    // Primary: send one inquiry per stop in one click (auto-saves first)
    const inquireAllBtn = document.createElement('button');
    inquireAllBtn.className = 'btn btn-primary';
    inquireAllBtn.type = 'button';
    inquireAllBtn.appendChild(iconEl('lucide-send'));
    inquireAllBtn.appendChild(document.createTextNode(' Request quotes for all'));
    inquireAllBtn.addEventListener('click', async () => {
      inquireAllBtn.disabled = true;
      try {
        const trip = await persistCart();
        if (trip) openBatchInquiryModal(trip);
      } finally {
        inquireAllBtn.disabled = false;
      }
    });
    ctaRow.appendChild(inquireAllBtn);

    const saveBtn = document.createElement('button');
    saveBtn.className = 'btn btn-outline';
    saveBtn.type = 'button';
    saveBtn.appendChild(iconEl('lucide-share-2'));
    saveBtn.appendChild(document.createTextNode(' Save & share'));
    saveBtn.addEventListener('click', () => saveCartTrip(saveBtn));
    ctaRow.appendChild(saveBtn);
    head.appendChild(ctaRow);
  }
  root.appendChild(head);

  if (state.stops.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.appendChild(iconEl('lucide-luggage'));
    const h = document.createElement('h3');
    h.textContent = 'Your trip is empty';
    empty.appendChild(h);
    const p = document.createElement('p');
    p.textContent = "Tap 'Add to trip' on any place or experience to start building your itinerary.";
    empty.appendChild(p);
    const explore = document.createElement('a');
    explore.className = 'btn btn-primary';
    explore.href = '#/explore';
    explore.appendChild(iconEl('lucide-compass'));
    explore.appendChild(document.createTextNode(' Browse places'));
    empty.appendChild(explore);
    root.appendChild(empty);
    replaceIcons(root);
    return;
  }

  // Group by day
  const byDay = new Map<number, typeof state.stops>();
  for (const s of state.stops) {
    const d = s.dayIndex || 0;
    if (!byDay.has(d)) byDay.set(d, []);
    byDay.get(d)!.push(s);
  }
  const days = [...byDay.keys()].sort((a, b) => a - b);

  const wrap = document.createElement('div');
  wrap.className = 'trip-days';
  for (const d of days) {
    wrap.appendChild(buildDayBlock(d, byDay.get(d)!, true));
  }
  root.appendChild(wrap);

  // Cost summary
  const total = cart.calcTotal(state);
  if (total.hasPriced) {
    const summary = document.createElement('aside');
    summary.className = 'trip-summary';
    const label = document.createElement('div');
    label.className = 'trip-summary-label';
    label.textContent = `Estimated total for ${state.travelers} ${state.travelers === 1 ? 'traveler' : 'travelers'}`;
    const val = document.createElement('div');
    val.className = 'trip-summary-val';
    val.textContent = fmtPrice(total.amount, total.currency);
    summary.appendChild(label);
    summary.appendChild(val);
    const note = document.createElement('div');
    note.className = 'trip-summary-note';
    note.textContent = 'Prices are reference quotes from each host. Final price is confirmed when the host accepts.';
    summary.appendChild(note);
    root.appendChild(summary);
  }
  replaceIcons(root);
}

async function saveCartTrip(btn: HTMLButtonElement) {
  const state = cart.getCart();
  btn.disabled = true;
  try {
    const trip = await api.saveTrip({
      title: state.title,
      travelers: state.travelers,
      currency: state.currency,
      days: state.days,
      stops: state.stops.map(s => ({
        placeId: s.placeId,
        packageId: s.packageId || undefined,
        dayIndex: s.dayIndex,
      })),
    });
    const url = `${location.origin}${location.pathname}#/trip/${trip.slug}`;
    try { await navigator.clipboard.writeText(url); } catch {}
    showToast('Trip saved - link copied');
    location.hash = `#/trip/${trip.slug}`;
  } catch (err: any) {
    btn.disabled = false;
    showToast(err?.message || 'Could not save trip', { type: 'error' });
  }
}

// ────────────────────────────────────────────────────────────
// Saved-trip view (/#/trip/<slug>)
// ────────────────────────────────────────────────────────────
async function renderSavedTrip(root: HTMLElement, slug: string) {
  let trip: api.TripPlan | null = null;
  try {
    trip = await api.getTripBySlug(slug);
  } catch (err: any) {
    root.replaceChildren();
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.appendChild(iconEl('lucide-search-x'));
    const h = document.createElement('h3');
    h.textContent = 'Trip not found';
    empty.appendChild(h);
    const p = document.createElement('p');
    p.textContent = err?.message || "This trip may be private or no longer exists.";
    empty.appendChild(p);
    const back = document.createElement('a');
    back.className = 'btn btn-primary';
    back.href = '#/';
    back.textContent = 'Back to feed';
    empty.appendChild(back);
    root.appendChild(empty);
    replaceIcons(root);
    return;
  }

  root.replaceChildren();

  // Header with title, share button, copy link
  const head = document.createElement('header');
  head.className = 'trip-page-head';
  const titleWrap = document.createElement('div');
  const h1 = document.createElement('h1');
  h1.appendChild(iconEl('lucide-luggage'));
  h1.appendChild(document.createTextNode(' ' + trip.title));
  titleWrap.appendChild(h1);
  const sub = document.createElement('p');
  sub.className = 'trip-page-sub';
  sub.textContent = `${trip.stops.length} ${trip.stops.length === 1 ? 'stop' : 'stops'} - ${trip.travelers} ${trip.travelers === 1 ? 'traveler' : 'travelers'} - ${trip.days} ${trip.days === 1 ? 'day' : 'days'}`;
  titleWrap.appendChild(sub);
  head.appendChild(titleWrap);

  const actions = document.createElement('div');
  actions.className = 'trip-page-actions';

  // Primary CTA — fan-out one inquiry per stop in one click
  const inquireAllBtn = document.createElement('button');
  inquireAllBtn.className = 'btn btn-primary';
  inquireAllBtn.type = 'button';
  inquireAllBtn.appendChild(iconEl('lucide-send'));
  inquireAllBtn.appendChild(document.createTextNode(' Request quotes for all'));
  inquireAllBtn.addEventListener('click', () => openBatchInquiryModal(trip!));
  actions.appendChild(inquireAllBtn);

  const shareBtn = document.createElement('button');
  shareBtn.className = 'btn btn-outline';
  shareBtn.type = 'button';
  shareBtn.appendChild(iconEl('lucide-link'));
  shareBtn.appendChild(document.createTextNode(' Copy link'));
  shareBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(location.href);
      showToast('Link copied');
    } catch { showToast('Could not copy', { type: 'error' }); }
  });
  actions.appendChild(shareBtn);

  // "Customize this trip" — clones stops into the local cart
  const cloneBtn = document.createElement('button');
  cloneBtn.className = 'btn btn-primary';
  cloneBtn.type = 'button';
  cloneBtn.appendChild(iconEl('lucide-copy'));
  cloneBtn.appendChild(document.createTextNode(' Use as my trip'));
  cloneBtn.addEventListener('click', () => {
    cart.clearCart();
    cart.setTitle(trip!.title);
    cart.setTravelers(trip!.travelers);
    cart.setDays(trip!.days);
    cart.setCurrency(trip!.currency);
    for (const s of trip!.stops) {
      cart.addStop({
        placeId: s.placeId,
        placeName: s.placeName || undefined,
        placeCity: s.placeCity || undefined,
        placeCover: s.placeCover || undefined,
        packageId: s.packageId,
        packageTitle: s.packageTitle,
        pricePerPerson: s.pricePerPerson,
        currency: s.currency,
        dayIndex: s.dayIndex,
      });
    }
    showToast('Loaded into your trip cart');
    location.hash = '#/trip';
  });
  actions.appendChild(cloneBtn);
  head.appendChild(actions);
  root.appendChild(head);

  // Days
  const byDay = new Map<number, api.TripStop[]>();
  for (const s of trip.stops) {
    const d = s.dayIndex || 0;
    if (!byDay.has(d)) byDay.set(d, []);
    byDay.get(d)!.push(s);
  }
  const days = [...byDay.keys()].sort((a, b) => a - b);
  const wrap = document.createElement('div');
  wrap.className = 'trip-days';
  for (const d of days) {
    wrap.appendChild(buildDayBlock(d, byDay.get(d)!, false));
  }
  root.appendChild(wrap);

  // Total summary — uses saved snapshot prices
  let total = 0;
  let hasPriced = false;
  for (const s of trip.stops) {
    if (typeof s.pricePerPerson === 'number' && s.pricePerPerson > 0) {
      total += s.pricePerPerson * trip.travelers;
      hasPriced = true;
    }
  }
  if (hasPriced) {
    const summary = document.createElement('aside');
    summary.className = 'trip-summary';
    const label = document.createElement('div');
    label.className = 'trip-summary-label';
    label.textContent = `Estimated total for ${trip.travelers} ${trip.travelers === 1 ? 'traveler' : 'travelers'}`;
    const val = document.createElement('div');
    val.className = 'trip-summary-val';
    val.textContent = fmtPrice(total, trip.currency);
    summary.appendChild(label);
    summary.appendChild(val);
    root.appendChild(summary);
  }

  // Footer: viewer info
  const foot = document.createElement('div');
  foot.className = 'trip-foot';
  foot.textContent = `Trip plan - ${trip.viewCount.toLocaleString()} ${trip.viewCount === 1 ? 'view' : 'views'} - shared from e-Tunisia`;
  root.appendChild(foot);

  replaceIcons(root);
}

// ────────────────────────────────────────────────────────────
// Shared row builder for both views
// ────────────────────────────────────────────────────────────
function buildDayBlock(dayIdx: number, stops: any[], editable: boolean): HTMLElement {
  const block = document.createElement('section');
  block.className = 'trip-day';

  const head = document.createElement('header');
  head.className = 'trip-day-head';
  const num = document.createElement('span');
  num.className = 'trip-day-num';
  num.textContent = String(dayIdx + 1);
  head.appendChild(num);
  const lab = document.createElement('span');
  lab.className = 'trip-day-label';
  lab.textContent = `Day ${dayIdx + 1}`;
  head.appendChild(lab);
  block.appendChild(head);

  const list = document.createElement('div');
  list.className = 'trip-day-list';
  for (const s of stops) list.appendChild(buildStopCard(s, editable));
  block.appendChild(list);
  return block;
}

function buildStopCard(stop: any, editable: boolean): HTMLElement {
  const card = document.createElement('article');
  card.className = 'trip-stop';

  if (stop.placeCover) {
    const img = document.createElement('img');
    img.className = 'trip-stop-img';
    img.src = api.getImageUrl(stop.placeCover);
    img.alt = '';
    img.loading = 'lazy';
    card.appendChild(img);
  } else {
    const ph = document.createElement('div');
    ph.className = 'trip-stop-img trip-stop-img-fallback';
    card.appendChild(ph);
  }

  const body = document.createElement('div');
  body.className = 'trip-stop-body';

  const linkRow = document.createElement('div');
  linkRow.className = 'trip-stop-link-row';
  const link = document.createElement('a');
  link.className = 'trip-stop-title';
  link.href = `#/place/${stop.placeId}`;
  link.textContent = stop.placeName || 'Place';
  linkRow.appendChild(link);

  if (editable) {
    const rm = document.createElement('button');
    rm.className = 'trip-stop-remove';
    rm.type = 'button';
    rm.setAttribute('aria-label', 'Remove from trip');
    rm.appendChild(iconEl('lucide-x'));
    rm.addEventListener('click', () => cart.removeStop(stop.placeId, stop.packageId || null));
    linkRow.appendChild(rm);
  }
  body.appendChild(linkRow);

  if (stop.packageTitle) {
    const pkg = document.createElement('div');
    pkg.className = 'trip-stop-pkg';
    pkg.appendChild(iconEl('lucide-package'));
    const txt = document.createElement('span');
    txt.textContent = ' ' + stop.packageTitle;
    pkg.appendChild(txt);
    body.appendChild(pkg);
  }
  if (stop.placeCity) {
    const c = document.createElement('div');
    c.className = 'trip-stop-meta';
    c.appendChild(iconEl('lucide-map-pin'));
    const txt = document.createElement('span');
    txt.textContent = ' ' + stop.placeCity;
    c.appendChild(txt);
    body.appendChild(c);
  }
  if (typeof stop.pricePerPerson === 'number' && stop.pricePerPerson > 0) {
    const price = document.createElement('div');
    price.className = 'trip-stop-price';
    const strong = document.createElement('strong');
    strong.textContent = `${stop.pricePerPerson} ${stop.currency || 'TND'}`;
    price.appendChild(strong);
    price.appendChild(document.createTextNode(' / person'));
    body.appendChild(price);
  }

  card.appendChild(body);
  return card;
}

/** Save current cart → backend, return the persisted trip (or null on failure). */
async function persistCart(): Promise<api.TripPlan | null> {
  const state = cart.getCart();
  if (state.stops.length === 0) {
    showToast('Add at least one stop first', { type: 'error' });
    return null;
  }
  try {
    return await api.saveTrip({
      title: state.title,
      travelers: state.travelers,
      currency: state.currency,
      days: state.days,
      stops: state.stops.map(s => ({
        placeId: s.placeId,
        packageId: s.packageId || undefined,
        dayIndex: s.dayIndex,
      })),
    });
  } catch (err: any) {
    showToast(err?.message || 'Could not save trip', { type: 'error' });
    return null;
  }
}

// ────────────────────────────────────────────────────────────
// Bundle inquiry modal — one message, fans out to every host
// ────────────────────────────────────────────────────────────
function field(name: string, type: string, label: string, opts: {
  required?: boolean; maxLength?: number; minLength?: number; min?: string; step?: string;
  placeholder?: string; value?: string;
} = {}): HTMLLabelElement {
  const wrap = document.createElement('label');
  const sp = document.createElement('span');
  sp.textContent = label;
  wrap.appendChild(sp);
  const input = document.createElement('input');
  input.name = name;
  input.type = type;
  if (opts.required) input.required = true;
  if (opts.maxLength) input.maxLength = opts.maxLength;
  if (opts.minLength) input.minLength = opts.minLength;
  if (opts.min) input.min = opts.min;
  if (opts.step) input.step = opts.step;
  if (opts.placeholder) input.placeholder = opts.placeholder;
  if (opts.value) input.value = opts.value;
  wrap.appendChild(input);
  return wrap;
}

function rowOf(...children: HTMLElement[]): HTMLDivElement {
  const row = document.createElement('div');
  row.className = 'inquiry-row';
  for (const c of children) row.appendChild(c);
  return row;
}

function openBatchInquiryModal(trip: api.TripPlan) {
  document.getElementById('trip-inquiry-overlay')?.remove();

  let prefName = '';
  let prefEmail = '';
  let prefPhone = '';
  try {
    const cached = localStorage.getItem('etunisia_user');
    if (cached) {
      const u = JSON.parse(cached);
      prefName  = u?.fullName || u?.name || '';
      prefEmail = u?.email || '';
      prefPhone = u?.phone || '';
    }
  } catch {}
  const today = new Date().toISOString().slice(0, 10);

  const overlay = document.createElement('div');
  overlay.id = 'trip-inquiry-overlay';
  overlay.className = 'sheet-overlay';

  const sheet = document.createElement('div');
  sheet.className = 'sheet inquiry-modal';
  sheet.setAttribute('role', 'dialog');

  const uniqueHosts = new Set(trip.stops.map(s => s.placeId)).size;

  const head = document.createElement('header');
  head.className = 'sheet-head';
  const titleWrap = document.createElement('div');
  const h = document.createElement('h3');
  h.textContent = 'Request quotes for all stops';
  titleWrap.appendChild(h);
  const sub = document.createElement('p');
  sub.className = 'inquiry-sub';
  sub.textContent = `One message goes to ${uniqueHosts} ${uniqueHosts === 1 ? 'host' : 'hosts'} - each will reply directly.`;
  titleWrap.appendChild(sub);
  head.appendChild(titleWrap);
  const closeBtn = document.createElement('button');
  closeBtn.className = 'sheet-close';
  closeBtn.appendChild(iconEl('lucide-x'));
  head.appendChild(closeBtn);
  sheet.appendChild(head);

  const form = document.createElement('form');
  form.className = 'inquiry-form';

  // Row 1: name + email
  form.appendChild(rowOf(
    field('name',  'text',  'Your name *', { required: true, maxLength: 120, value: prefName }),
    field('email', 'email', 'Email *',     { required: true, maxLength: 200, value: prefEmail }),
  ));
  // Row 2: phone + budget
  form.appendChild(rowOf(
    field('phone',  'tel',    'Phone',  { maxLength: 40, value: prefPhone }),
    field('budget', 'number', 'Budget', { min: '0', step: '50', placeholder: 'optional' }),
  ));
  // Row 3: dates
  form.appendChild(rowOf(
    field('dateFrom', 'date', 'From', { min: today }),
    field('dateTo',   'date', 'To',   { min: today }),
  ));
  // Message
  const msgLabel = document.createElement('label');
  msgLabel.className = 'inquiry-full';
  const msgSp = document.createElement('span');
  msgSp.textContent = 'Message *';
  msgLabel.appendChild(msgSp);
  const msgTa = document.createElement('textarea');
  msgTa.name = 'message';
  msgTa.rows = 4;
  msgTa.required = true;
  msgTa.minLength = 5;
  msgTa.maxLength = 2000;
  msgTa.value = `Hi, I'm planning "${trip.title}" for ${trip.travelers} traveler${trip.travelers === 1 ? '' : 's'}. Please share availability + pricing for your part of the trip.`;
  msgLabel.appendChild(msgTa);
  form.appendChild(msgLabel);

  // Disclaimer
  const disc = document.createElement('p');
  disc.className = 'inquiry-disclaimer';
  disc.appendChild(iconEl('lucide-shield-check'));
  const discTxt = document.createElement('span');
  discTxt.textContent = ' Same message goes to every host on your trip. Each replies privately.';
  disc.appendChild(discTxt);
  form.appendChild(disc);

  // Actions
  const actions = document.createElement('div');
  actions.className = 'inquiry-actions';
  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'btn btn-ghost';
  cancelBtn.type = 'button';
  cancelBtn.textContent = 'Cancel';
  actions.appendChild(cancelBtn);
  const submitBtn = document.createElement('button');
  submitBtn.className = 'btn btn-primary';
  submitBtn.type = 'submit';
  submitBtn.appendChild(iconEl('lucide-send'));
  submitBtn.appendChild(document.createTextNode(' Send to all'));
  actions.appendChild(submitBtn);
  form.appendChild(actions);

  sheet.appendChild(form);
  overlay.appendChild(sheet);
  document.body.appendChild(overlay);
  replaceIcons(overlay);
  document.body.style.overflow = 'hidden';

  const close = () => {
    overlay.remove();
    document.body.style.overflow = '';
    window.removeEventListener('keydown', onKey);
  };
  const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
  window.addEventListener('keydown', onKey);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  closeBtn.addEventListener('click', close);
  cancelBtn.addEventListener('click', close);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const payload = {
      name:  String(fd.get('name')  || '').trim(),
      email: String(fd.get('email') || '').trim(),
      phone: String(fd.get('phone') || '').trim() || undefined,
      dateFrom: String(fd.get('dateFrom') || '') || undefined,
      dateTo:   String(fd.get('dateTo')   || '') || undefined,
      budget: fd.get('budget') ? Number(fd.get('budget')) : undefined,
      message: String(fd.get('message') || '').trim(),
    };
    submitBtn.disabled = true;
    try {
      const res = await api.batchInquireTrip(trip.slug, payload);
      form.remove();

      const success = document.createElement('div');
      success.className = 'inquiry-success';
      const iconWrap = document.createElement('div');
      iconWrap.className = 'inquiry-success-icon';
      iconWrap.appendChild(iconEl('lucide-check-circle-2'));
      success.appendChild(iconWrap);
      const sH = document.createElement('h3');
      sH.textContent = `${res.sent} ${res.sent === 1 ? 'host' : 'hosts'} notified`;
      success.appendChild(sH);
      const p = document.createElement('p');
      p.textContent = `Each will reply to ${payload.email} shortly. Track replies under My Inquiries.`;
      success.appendChild(p);
      if (res.failures.length > 0) {
        const warn = document.createElement('p');
        warn.style.cssText = 'color: var(--text-muted); font-size: 0.82rem;';
        warn.textContent = `${res.failures.length} stop${res.failures.length === 1 ? '' : 's'} couldn't be reached — you can retry from those place pages.`;
        success.appendChild(warn);
      }
      const linkRow = document.createElement('div');
      linkRow.style.cssText = 'display:flex; gap:8px; margin-top:8px;';
      const a = document.createElement('a');
      a.className = 'btn btn-primary';
      a.href = '#/inquiries';
      a.textContent = 'View my inquiries';
      a.addEventListener('click', close);
      linkRow.appendChild(a);
      const doneBtn = document.createElement('button');
      doneBtn.className = 'btn btn-ghost';
      doneBtn.type = 'button';
      doneBtn.textContent = 'Done';
      doneBtn.addEventListener('click', close);
      linkRow.appendChild(doneBtn);
      success.appendChild(linkRow);
      sheet.appendChild(success);
      replaceIcons(sheet);
      showToast(`Inquiries sent to ${res.sent} ${res.sent === 1 ? 'host' : 'hosts'}`);
    } catch (err: any) {
      submitBtn.disabled = false;
      const msg = err?.message || (Array.isArray(err?.details) ? err.details.join(', ') : '') || 'Could not send';
      showToast(msg, { type: 'error' });
    }
  });
}
