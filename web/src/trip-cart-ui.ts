// ============================================
// Floating Trip Cart UI — a tab bottom-right + a side drawer.
// Wires once on app boot and listens to the cart-change event.
// ============================================

import * as cart from './trip-cart';
import * as api from './api';
import { replaceIcons } from './icons';
import { showToast } from './ui-utils';

let mounted = false;
let cartUnsubscribe: (() => void) | null = null;

function createFab() {
  if (document.getElementById('trip-cart-fab')) return;

  const fab = document.createElement('button');
  fab.id = 'trip-cart-fab';
  fab.className = 'trip-cart-fab';
  fab.setAttribute('aria-label', 'Open trip cart');
  fab.appendChild(iconEl('lucide-luggage'));
  const label = document.createElement('span');
  label.textContent = 'My trip';
  fab.appendChild(label);
  const count = document.createElement('span');
  count.className = 'trip-cart-count';
  count.dataset.role = 'count';
  fab.appendChild(count);
  document.body.appendChild(fab);

  const refreshFab = () => {
    const s = cart.getCart();
    const n = s.stops.length;
    fab.classList.toggle('is-empty', n === 0);
    const countEl = fab.querySelector<HTMLSpanElement>('[data-role="count"]')!;
    countEl.textContent = String(n);
    countEl.style.display = n > 0 ? '' : 'none';
  };
  refreshFab();
  cartUnsubscribe = cart.onCartChange(refreshFab);
  fab.addEventListener('click', openDrawer);
  replaceIcons(fab);
}

function destroyFab() {
  document.getElementById('trip-cart-fab')?.remove();
  document.getElementById('trip-cart-drawer')?.remove();
  document.querySelector('.trip-cart-backdrop')?.remove();
  if (cartUnsubscribe) { cartUnsubscribe(); cartUnsubscribe = null; }
}

export function mountTripCart() {
  if (mounted) return;
  mounted = true;
  syncTripCartAuth();
}

// Called by router on every navigate so the FAB appears/disappears with login state.
export function syncTripCartAuth() {
  if (api.isLoggedIn()) createFab();
  else destroyFab();
}

function iconEl(name: string): HTMLElement {
  const i = document.createElement('i');
  i.className = name;
  return i;
}

function fmtPrice(amount: number, currency: string): string {
  return `${amount.toLocaleString()} ${currency}`;
}

function openDrawer() {
  document.getElementById('trip-cart-drawer')?.remove();

  const drawer = document.createElement('aside');
  drawer.id = 'trip-cart-drawer';
  drawer.className = 'trip-cart-drawer';
  drawer.setAttribute('role', 'dialog');
  drawer.setAttribute('aria-label', 'Trip cart');

  const head = document.createElement('header');
  head.className = 'trip-cart-head';
  const title = document.createElement('div');
  title.className = 'trip-cart-title';
  const h = document.createElement('h2');
  h.textContent = 'My Tunisia trip';
  h.dataset.role = 'title';
  const sub = document.createElement('p');
  sub.className = 'trip-cart-sub';
  sub.dataset.role = 'sub';
  title.appendChild(h);
  title.appendChild(sub);
  head.appendChild(title);
  const closeBtn = document.createElement('button');
  closeBtn.className = 'trip-cart-close';
  closeBtn.setAttribute('aria-label', 'Close');
  closeBtn.appendChild(iconEl('lucide-x'));
  head.appendChild(closeBtn);
  drawer.appendChild(head);

  // Controls
  const controls = document.createElement('div');
  controls.className = 'trip-cart-controls';
  const tripTitleInput = document.createElement('input');
  tripTitleInput.type = 'text';
  tripTitleInput.maxLength = 60;
  tripTitleInput.placeholder = 'Trip name';
  tripTitleInput.className = 'trip-cart-title-input';
  tripTitleInput.dataset.role = 'title-input';
  controls.appendChild(tripTitleInput);

  const stepperRow = document.createElement('div');
  stepperRow.className = 'trip-cart-stepper-row';
  stepperRow.appendChild(buildStepper('Travelers', 'travelers', 1, 50));
  stepperRow.appendChild(buildStepper('Days', 'days', 1, 30));
  controls.appendChild(stepperRow);

  drawer.appendChild(controls);

  // Stops list
  const list = document.createElement('div');
  list.className = 'trip-cart-list';
  list.dataset.role = 'list';
  drawer.appendChild(list);

  // Footer
  const foot = document.createElement('footer');
  foot.className = 'trip-cart-foot';
  const totalLine = document.createElement('div');
  totalLine.className = 'trip-cart-total';
  totalLine.dataset.role = 'total';
  foot.appendChild(totalLine);

  const actions = document.createElement('div');
  actions.className = 'trip-cart-actions';
  const clearBtn = document.createElement('button');
  clearBtn.className = 'btn btn-ghost btn-sm';
  clearBtn.type = 'button';
  clearBtn.textContent = 'Clear';
  clearBtn.addEventListener('click', () => {
    if (cart.getCart().stops.length === 0) return;
    if (!confirm('Empty your trip cart?')) return;
    cart.clearCart();
    refresh();
  });
  actions.appendChild(clearBtn);

  const saveBtn = document.createElement('button');
  saveBtn.className = 'btn btn-primary';
  saveBtn.type = 'button';
  saveBtn.dataset.role = 'save';
  saveBtn.appendChild(iconEl('lucide-share-2'));
  saveBtn.appendChild(document.createTextNode(' Save & share'));
  saveBtn.addEventListener('click', onSave);
  actions.appendChild(saveBtn);
  foot.appendChild(actions);
  drawer.appendChild(foot);

  // Overlay backdrop
  const backdrop = document.createElement('div');
  backdrop.className = 'trip-cart-backdrop';
  document.body.appendChild(backdrop);
  document.body.appendChild(drawer);
  document.body.style.overflow = 'hidden';

  const close = () => {
    drawer.remove();
    backdrop.remove();
    document.body.style.overflow = '';
    window.removeEventListener('keydown', onKey);
    unsubscribe();
  };
  const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
  window.addEventListener('keydown', onKey);
  backdrop.addEventListener('click', close);
  closeBtn.addEventListener('click', close);

  // Wire inputs
  tripTitleInput.addEventListener('input', () => cart.setTitle(tripTitleInput.value));

  function buildStepper(label: string, role: string, min: number, max: number): HTMLElement {
    const wrap = document.createElement('div');
    wrap.className = 'trip-cart-stepper';
    const lbl = document.createElement('div');
    lbl.className = 'trip-cart-stepper-label';
    lbl.textContent = label;
    wrap.appendChild(lbl);
    const ctrl = document.createElement('div');
    ctrl.className = 'trip-cart-stepper-ctrl';
    const minus = document.createElement('button');
    minus.type = 'button';
    minus.textContent = '−';
    const val = document.createElement('span');
    val.dataset.role = role;
    val.textContent = '0';
    const plus = document.createElement('button');
    plus.type = 'button';
    plus.textContent = '+';
    minus.addEventListener('click', () => stepBy(role, -1, min, max));
    plus.addEventListener('click', () => stepBy(role, +1, min, max));
    ctrl.appendChild(minus);
    ctrl.appendChild(val);
    ctrl.appendChild(plus);
    wrap.appendChild(ctrl);
    return wrap;
  }

  function stepBy(role: string, delta: number, min: number, max: number) {
    const s = cart.getCart();
    const next = Math.min(max, Math.max(min, (s as any)[role] + delta));
    if (role === 'travelers') cart.setTravelers(next);
    else if (role === 'days') cart.setDays(next);
  }

  function refresh() {
    const s = cart.getCart();
    (drawer.querySelector('[data-role="title-input"]') as HTMLInputElement).value = s.title;
    (drawer.querySelector('[data-role="travelers"]') as HTMLElement).textContent = String(s.travelers);
    (drawer.querySelector('[data-role="days"]') as HTMLElement).textContent = String(s.days);

    list.replaceChildren();
    if (s.stops.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'trip-cart-empty';
      empty.appendChild(iconEl('lucide-luggage'));
      const t = document.createElement('h3');
      t.textContent = 'Your trip is empty';
      empty.appendChild(t);
      const p = document.createElement('p');
      p.textContent = 'Tap "Add to trip" on any place or experience to start building your itinerary.';
      empty.appendChild(p);
      const go = document.createElement('a');
      go.className = 'btn btn-primary';
      go.href = '#/explore';
      go.textContent = 'Browse places';
      go.addEventListener('click', close);
      empty.appendChild(go);
      list.appendChild(empty);
      replaceIcons(list);
    } else {
      // Group by dayIndex
      const byDay = new Map<number, typeof s.stops>();
      for (const stop of s.stops) {
        const d = stop.dayIndex || 0;
        if (!byDay.has(d)) byDay.set(d, []);
        byDay.get(d)!.push(stop);
      }
      const dayKeys = [...byDay.keys()].sort((a, b) => a - b);
      for (const dayIdx of dayKeys) {
        const dayWrap = document.createElement('div');
        dayWrap.className = 'trip-cart-day';
        const dayHead = document.createElement('div');
        dayHead.className = 'trip-cart-day-head';
        dayHead.textContent = `Day ${dayIdx + 1}`;
        dayWrap.appendChild(dayHead);
        for (const stop of byDay.get(dayIdx)!) dayWrap.appendChild(buildStopRow(stop));
        list.appendChild(dayWrap);
      }
      replaceIcons(list);
    }

    const totalEl = drawer.querySelector('[data-role="total"]') as HTMLElement;
    totalEl.replaceChildren();
    const total = cart.calcTotal(s);
    if (total.hasPriced) {
      const totLabel = document.createElement('div');
      totLabel.className = 'trip-cart-total-label';
      totLabel.textContent = `Estimated total for ${s.travelers} ${s.travelers === 1 ? 'traveler' : 'travelers'}`;
      const totVal = document.createElement('div');
      totVal.className = 'trip-cart-total-val';
      totVal.textContent = fmtPrice(total.amount, total.currency);
      totalEl.appendChild(totLabel);
      totalEl.appendChild(totVal);
    } else if (s.stops.length > 0) {
      const note = document.createElement('div');
      note.className = 'trip-cart-total-label';
      note.textContent = 'Add bookable experiences to see a total.';
      totalEl.appendChild(note);
    }
  }

  function buildStopRow(stop: cart.CartStop): HTMLElement {
    const row = document.createElement('div');
    row.className = 'trip-cart-row';
    if (stop.placeCover) {
      const img = document.createElement('img');
      const isHttp = /^https?:/.test(stop.placeCover);
      img.src = isHttp ? stop.placeCover : `/uploads${stop.placeCover.startsWith('/') ? '' : '/'}${stop.placeCover}`;
      img.alt = '';
      img.className = 'trip-cart-row-img';
      img.loading = 'lazy';
      row.appendChild(img);
    } else {
      const ph = document.createElement('div');
      ph.className = 'trip-cart-row-img trip-cart-row-img-fallback';
      row.appendChild(ph);
    }
    const body = document.createElement('div');
    body.className = 'trip-cart-row-body';
    const t = document.createElement('div');
    t.className = 'trip-cart-row-title';
    t.textContent = stop.placeName || 'Place';
    body.appendChild(t);
    if (stop.packageTitle) {
      const pkg = document.createElement('div');
      pkg.className = 'trip-cart-row-pkg';
      pkg.textContent = stop.packageTitle;
      body.appendChild(pkg);
    }
    if (stop.placeCity) {
      const c = document.createElement('div');
      c.className = 'trip-cart-row-meta';
      c.textContent = stop.placeCity;
      body.appendChild(c);
    }
    if (typeof stop.pricePerPerson === 'number' && stop.pricePerPerson > 0) {
      const p = document.createElement('div');
      p.className = 'trip-cart-row-price';
      p.textContent = `${stop.pricePerPerson} ${stop.currency || 'TND'} / person`;
      body.appendChild(p);
    }
    row.appendChild(body);

    const rm = document.createElement('button');
    rm.className = 'trip-cart-row-remove';
    rm.type = 'button';
    rm.setAttribute('aria-label', 'Remove');
    rm.appendChild(iconEl('lucide-x'));
    rm.addEventListener('click', () => {
      cart.removeStop(stop.placeId, stop.packageId);
    });
    row.appendChild(rm);
    return row;
  }

  async function onSave() {
    const state = cart.getCart();
    if (state.stops.length === 0) {
      showToast('Add at least one stop first', { type: 'error' });
      return;
    }
    const btn = drawer.querySelector('[data-role="save"]') as HTMLButtonElement;
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
      showToast('Trip saved — link copied to clipboard');
      const url = `${location.origin}${location.pathname}#/trip/${trip.slug}`;
      try { await navigator.clipboard.writeText(url); } catch {}
      close();
      location.hash = `#/trip/${trip.slug}`;
    } catch (err: any) {
      btn.disabled = false;
      showToast(err?.message || 'Could not save trip', { type: 'error' });
    }
  }

  const unsubscribe = cart.onCartChange(refresh);
  refresh();
  replaceIcons(drawer);
}
