// ============================================
// TRIP CART — localStorage-backed personal trip-planning cart.
// Used from both vanilla pages (place-detail) and React (FeedPage etc.)
// Emits a DOM event so any UI can refresh on changes.
// ============================================

const STORAGE_KEY = 'etunisia_trip_cart_v1';

export interface CartStop {
  placeId: string;
  placeName?: string;
  placeCity?: string;
  placeCover?: string;
  packageId?: string | null;
  packageTitle?: string | null;
  pricePerPerson?: number | null;
  currency?: string | null;
  dayIndex: number;
  timeSlot?: string | null; // "HH:MM"
  addedAt: string;
}

export interface CartState {
  title: string;
  travelers: number;
  currency: string;
  days: number;
  startDate?: string | null; // "YYYY-MM-DD"
  stops: CartStop[];
}

function emptyState(): CartState {
  return {
    title: 'My Tunisia trip',
    travelers: 2,
    currency: 'TND',
    days: 1,
    startDate: null,
    stops: [],
  };
}

function readState(): CartState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw);
    const startDate = typeof parsed.startDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(parsed.startDate)
      ? parsed.startDate : null;
    return {
      title: String(parsed.title || 'My Tunisia trip'),
      travelers: Math.min(50, Math.max(1, Number(parsed.travelers) || 2)),
      currency: String(parsed.currency || 'TND'),
      days: Math.min(30, Math.max(1, Number(parsed.days) || 1)),
      startDate,
      stops: Array.isArray(parsed.stops) ? parsed.stops : [],
    };
  } catch {
    return emptyState();
  }
}

function writeState(state: CartState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
  window.dispatchEvent(new CustomEvent('etunisia:trip-cart-change', { detail: state }));
}

export function getCart(): CartState {
  return readState();
}

export function clearCart() {
  writeState(emptyState());
}

export function setTitle(title: string) {
  const s = readState();
  s.title = title.slice(0, 200) || 'My Tunisia trip';
  writeState(s);
}
export function setTravelers(n: number) {
  const s = readState();
  s.travelers = Math.min(50, Math.max(1, Math.floor(Number(n) || 2)));
  writeState(s);
}
export function setDays(n: number) {
  const s = readState();
  s.days = Math.min(30, Math.max(1, Math.floor(Number(n) || 1)));
  writeState(s);
}
export function setCurrency(currency: string) {
  const s = readState();
  s.currency = String(currency || 'TND').toUpperCase().slice(0, 8);
  writeState(s);
}
export function setStartDate(date: string | null) {
  const s = readState();
  s.startDate = date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null;
  writeState(s);
}
export function setStopTime(placeId: string, packageId: string | null | undefined, timeSlot: string | null) {
  const s = readState();
  const clean = timeSlot && /^\d{2}:\d{2}$/.test(timeSlot) ? timeSlot : null;
  s.stops = s.stops.map((x) =>
    x.placeId === placeId && (x.packageId || null) === (packageId || null) ? { ...x, timeSlot: clean } : x,
  );
  writeState(s);
}

/**
 * Add a stop to the cart. If a package is supplied, we replace any prior
 * stop for the same (place, package) pair so users don't double-add.
 * Otherwise, the same place can only appear once with no package.
 */
export function addStop(stop: {
  placeId: string;
  placeName?: string;
  placeCity?: string;
  placeCover?: string;
  packageId?: string | null;
  packageTitle?: string | null;
  pricePerPerson?: number | null;
  currency?: string | null;
  dayIndex?: number;
  timeSlot?: string | null;
}) {
  const s = readState();
  const dupIdx = s.stops.findIndex(x =>
    x.placeId === stop.placeId && (x.packageId || null) === (stop.packageId || null),
  );
  const next: CartStop = {
    placeId: stop.placeId,
    placeName: stop.placeName,
    placeCity: stop.placeCity,
    placeCover: stop.placeCover,
    packageId: stop.packageId || null,
    packageTitle: stop.packageTitle || null,
    pricePerPerson: typeof stop.pricePerPerson === 'number' ? stop.pricePerPerson : null,
    currency: stop.currency || null,
    dayIndex: Number.isFinite(stop.dayIndex) ? Number(stop.dayIndex) : s.stops.length,
    timeSlot: typeof stop.timeSlot === 'string' && /^\d{2}:\d{2}$/.test(stop.timeSlot) ? stop.timeSlot : null,
    addedAt: new Date().toISOString(),
  };
  if (dupIdx >= 0) s.stops[dupIdx] = next;
  else s.stops.push(next);
  // If we just exceeded current trip days, grow days to fit
  const maxDay = Math.max(...s.stops.map(x => x.dayIndex || 0), 0) + 1;
  if (maxDay > s.days) s.days = Math.min(30, maxDay);
  writeState(s);
  return s;
}

export function removeStop(placeId: string, packageId?: string | null) {
  const s = readState();
  s.stops = s.stops.filter(x => !(x.placeId === placeId && (x.packageId || null) === (packageId || null)));
  writeState(s);
  return s;
}

export function moveStopToDay(placeId: string, packageId: string | null, dayIndex: number) {
  const s = readState();
  const idx = s.stops.findIndex(x => x.placeId === placeId && (x.packageId || null) === (packageId || null));
  if (idx < 0) return s;
  s.stops[idx].dayIndex = Math.max(0, Math.min(29, Math.floor(dayIndex)));
  writeState(s);
  return s;
}

/**
 * Re-sequence one day's stops (route optimizer). `order[i]` is the new
 * position of that day's i-th stop. The overall array is rebuilt grouped by
 * day so the day-block rendering order stays stable.
 */
export function reorderDay(dayIndex: number, order: number[]) {
  const s = readState();
  const dayStops = s.stops.filter(x => (x.dayIndex || 0) === dayIndex);
  if (order.length !== dayStops.length || dayStops.length < 2) return s;
  const reordered: CartStop[] = new Array(dayStops.length);
  order.forEach((pos, i) => { reordered[pos] = dayStops[i]; });
  if (reordered.some(x => !x)) return s; // malformed permutation — refuse
  const days = [...new Set(s.stops.map(x => x.dayIndex || 0))].sort((a, b) => a - b);
  s.stops = days.flatMap(d =>
    d === dayIndex ? reordered : s.stops.filter(x => (x.dayIndex || 0) === d),
  );
  writeState(s);
  return s;
}

/** Total cost respecting party size; only sums stops that have a package with a price. */
export function calcTotal(state: CartState): { amount: number; currency: string; hasPriced: boolean } {
  const currency = state.currency || 'TND';
  let total = 0;
  let hasPriced = false;
  for (const stop of state.stops) {
    if (typeof stop.pricePerPerson === 'number' && stop.pricePerPerson > 0) {
      // Convert nothing for now — we just multiply within the stop's currency. Display warns when mixed.
      total += stop.pricePerPerson * state.travelers;
      hasPriced = true;
    }
  }
  return { amount: Math.round(total), currency, hasPriced };
}

/** Convenience: subscribe to cart changes. Returns an unsubscribe fn. */
export function onCartChange(cb: (state: CartState) => void): () => void {
  const handler = (e: any) => cb(e?.detail || readState());
  window.addEventListener('etunisia:trip-cart-change', handler);
  return () => window.removeEventListener('etunisia:trip-cart-change', handler);
}

/** Quick check: is this place (with optional package) already in the cart? */
export function inCart(placeId: string, packageId?: string | null): boolean {
  const s = readState();
  return s.stops.some(x => x.placeId === placeId && (x.packageId || null) === (packageId || null));
}
