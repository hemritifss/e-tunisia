import '../../styles/trip-schedule.css';
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import { Luggage, Send, Share2, Compass, Link as LinkIcon, Copy, X, Package, MapPin, SearchX, ShieldCheck, CheckCircle2, PlaneLanding, PlaneTakeoff, Clock, CalendarDays } from 'lucide-react';
import * as api from '../../api';
import { ogShareUrl } from '../../shared/api';
import * as cart from '../../trip-cart';
import { showToast } from '../../ui-utils';
import { currentPath, goTo, absoluteUrl, onRouteChange } from '../../router';
import { TripRouteMap, TripDayChips } from '../components/TripRouteMap';
import { WeatherBadge } from '../components/WeatherBadge';
import { TransportOptions } from '../components/TransportOptions';
import { useCurrency } from '../lib/useCurrency';
import { formatMoney } from '../../currency';
import { useT } from '../../i18n/useT';

// Migrated from vanilla pages/trip.ts — cart view (/trip) + saved view (/trip/:slug).

function slugFromPath(): string | null {
  const m = currentPath().match(/^\/trip(?:\/([a-z0-9]{4,32}))?/i);
  return m && m[1] ? m[1] : null;
}

// TND amounts flip to the visitor's chosen display currency; a non-TND source
// currency (rare) is shown as stored.
const fmtPrice = (n: number, currency: string) =>
  currency && currency !== 'TND'
    ? `${(Math.round(n) || 0).toLocaleString()} ${currency}`
    : formatMoney(n);

function StopCard({ stop, editable }: { stop: any; editable: boolean }) {
  return (
    <article className="trip-stop">
      {stop.placeCover ? (
        <img className="trip-stop-img" src={api.getImageUrl(stop.placeCover)} alt="" loading="lazy" />
      ) : (
        <div className="trip-stop-img trip-stop-img-fallback" />
      )}
      <div className="trip-stop-body">
        <div className="trip-stop-link-row">
          <a className="trip-stop-title" href={`#/place/${stop.placeId}`}>{stop.placeName || 'Place'}</a>
          {editable && (
            <button className="trip-stop-remove" type="button" aria-label="Remove from trip" onClick={() => cart.removeStop(stop.placeId, stop.packageId || null)}>
              <X />
            </button>
          )}
        </div>
        {stop.packageTitle && <div className="trip-stop-pkg"><Package /> <span> {stop.packageTitle}</span></div>}
        {stop.placeCity && <div className="trip-stop-meta"><MapPin /> <span> {stop.placeCity}</span></div>}
        {editable ? (
          <label className="trip-stop-time">
            <Clock size={13} />
            <input
              type="time"
              value={stop.timeSlot || ''}
              onChange={(e) => cart.setStopTime(stop.placeId, stop.packageId || null, e.target.value || null)}
              aria-label="Start time for this stop"
            />
          </label>
        ) : (
          stop.timeSlot && <div className="trip-stop-meta trip-stop-time-ro"><Clock size={13} /> <span> {stop.timeSlot}</span></div>
        )}
        {typeof stop.pricePerPerson === 'number' && stop.pricePerPerson > 0 && (
          <div className="trip-stop-price"><strong>{fmtPrice(stop.pricePerPerson, stop.currency)}</strong> / person</div>
        )}
      </div>
    </article>
  );
}

function DayBlocks({ stops, editable, startDate }: { stops: any[]; editable: boolean; startDate?: string | null }) {
  const t = useT();
  const today = new Date();
  const byDay = new Map<number, any[]>();
  for (const s of stops) {
    const d = s.dayIndex || 0;
    if (!byDay.has(d)) byDay.set(d, []);
    byDay.get(d)!.push(s);
  }
  const days = [...byDay.keys()].sort((a, b) => a - b);
  const last = days[days.length - 1];
  // A day's representative geocoded stop (first with coords) + its city — used for
  // weather and the inter-city "how to get there" connector.
  const repOf = (d: number): { coord: [number, number]; city?: string } | null => {
    const s = (byDay.get(d) || []).find(
      (x) => Number.isFinite(Number(x.latitude)) && Number.isFinite(Number(x.longitude)),
    );
    return s ? { coord: [Number(s.longitude), Number(s.latitude)], city: s.placeCity || undefined } : null;
  };
  const norm = (s?: string) => (s || '').trim().toLowerCase();
  return (
    <div className="trip-days">
      {days.map((d, i) => {
        const coordStop = byDay.get(d)!.find(
          (s) => Number.isFinite(Number(s.latitude)) && Number.isFinite(Number(s.longitude)),
        );
        const dt = dayDate(startDate, d);
        const isToday = dt ? isSameDay(dt, today) : false;
        const weatherOffset = dt ? offsetFromToday(dt) : d;
        // Inter-city transport connector when this day starts in a different city.
        const rep = repOf(d);
        const prevRep = i > 0 ? repOf(days[i - 1]) : null;
        const connector = prevRep && rep && prevRep.city && rep.city && norm(prevRep.city) !== norm(rep.city)
          ? <TransportOptions from={prevRep.coord} to={rep.coord} fromCity={prevRep.city} toCity={rep.city} />
          : null;
        return (
        <React.Fragment key={d}>
        {connector}
        <section className={`trip-day${isToday ? ' is-today' : ''}`} id={`trip-day-${d}`}>
          <header className="trip-day-head">
            <span className="trip-day-num">{d + 1}</span>
            <span className="trip-day-label">{t('trip.day')} {d + 1}</span>
            {dt && (
              <span className="trip-day-date">{dt.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
            )}
            {isToday && <span className="trip-day-tag trip-day-tag-today">Today</span>}
            {coordStop && weatherOffset >= 0 && (
              <WeatherBadge lat={Number(coordStop.latitude)} lon={Number(coordStop.longitude)} dayOffset={weatherOffset} />
            )}
            {d === days[0] && (
              <span className="trip-day-tag trip-day-tag-arrival"><PlaneLanding size={13} /> {t('trip.arrival')}</span>
            )}
            {d === last && days.length > 1 && (
              <span className="trip-day-tag trip-day-tag-departure"><PlaneTakeoff size={13} /> {t('trip.departure')}</span>
            )}
          </header>
          <div className="trip-day-list">
            {byDay.get(d)!.map((s, si) => <StopCard key={(s.placeId || '') + (s.packageId || '') + si} stop={s} editable={editable} />)}
          </div>
        </section>
        </React.Fragment>
        );
      })}
    </div>
  );
}

/**
 * "Your whole trip on the map" — day chips + route map, shared by the live
 * cart and saved trips. Picking a day filters the route AND scrolls its plan
 * into view, so the map and the day-by-day guide stay one experience.
 */
function TripMapSection({ stops, editable = false }: { stops: any[]; editable?: boolean }) {
  const [activeDay, setActiveDay] = useState<number | null>(null);
  const days = [...new Set(stops.map((s: any) => s.dayIndex || 0))].sort((a, b) => a - b);
  if (!stops.length) return null;
  const pick = (d: number | null) => {
    setActiveDay(d);
    if (d != null) {
      document.getElementById(`trip-day-${d}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };
  return (
    <section className="trip-map-section">
      <TripDayChips days={days} active={activeDay} onPick={pick} />
      <TripRouteMap
        stops={stops}
        activeDay={activeDay}
        onStopClick={(placeId) => goTo(`/place/${placeId}`)}
        onReorderDay={editable ? (day, order) => cart.reorderDay(day, order) : undefined}
      />
    </section>
  );
}

function BatchInquiryModal({ trip, onClose }: { trip: any; onClose: () => void }) {
  const [sent, setSent] = useState<{ sent: number; failures: any[]; email: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const uniqueHosts = new Set(trip.stops.map((s: any) => s.placeId)).size;

  let prefName = '', prefEmail = '', prefPhone = '';
  try {
    const cached = localStorage.getItem('etunisia_user');
    if (cached) { const u = JSON.parse(cached); prefName = u?.fullName || u?.name || ''; prefEmail = u?.email || ''; prefPhone = u?.phone || ''; }
  } catch { /* ignore */ }

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [onClose]);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      name: String(fd.get('name') || '').trim(),
      email: String(fd.get('email') || '').trim(),
      phone: String(fd.get('phone') || '').trim() || undefined,
      dateFrom: String(fd.get('dateFrom') || '') || undefined,
      dateTo: String(fd.get('dateTo') || '') || undefined,
      budget: fd.get('budget') ? Number(fd.get('budget')) : undefined,
      message: String(fd.get('message') || '').trim(),
    };
    setBusy(true);
    try {
      const res = await api.batchInquireTrip(trip.slug, payload);
      setSent({ sent: res.sent, failures: res.failures || [], email: payload.email });
      showToast(`Inquiries sent to ${res.sent} ${res.sent === 1 ? 'host' : 'hosts'}`);
    } catch (err: any) {
      setBusy(false);
      showToast(err?.message || (Array.isArray(err?.details) ? err.details.join(', ') : '') || 'Could not send', { type: 'error' });
    }
  };

  return createPortal(
    <div className="sheet-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sheet inquiry-modal" role="dialog">
        <header className="sheet-head">
          <div>
            <h3>Request quotes for all stops</h3>
            <p className="inquiry-sub">{sent ? `${sent.sent} ${sent.sent === 1 ? 'host' : 'hosts'} notified` : `One message goes to ${uniqueHosts} ${uniqueHosts === 1 ? 'host' : 'hosts'} - each will reply directly.`}</p>
          </div>
          <button className="sheet-close" onClick={onClose}><X /></button>
        </header>
        {sent ? (
          <div className="inquiry-success">
            <div className="inquiry-success-icon"><CheckCircle2 /></div>
            <h3>{sent.sent} {sent.sent === 1 ? 'host' : 'hosts'} notified</h3>
            <p>Each will reply to {sent.email} shortly. Track replies under My Inquiries.</p>
            {sent.failures.length > 0 && (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{sent.failures.length} stop{sent.failures.length === 1 ? '' : 's'} couldn't be reached — you can retry from those place pages.</p>
            )}
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <a className="btn btn-primary" href="#/inquiries" onClick={onClose}>View my inquiries</a>
              <button className="btn btn-ghost" type="button" onClick={onClose}>Done</button>
            </div>
          </div>
        ) : (
          <form className="inquiry-form" onSubmit={submit}>
            <div className="inquiry-row">
              <label><span>Your name *</span><input name="name" type="text" required maxLength={120} defaultValue={prefName} /></label>
              <label><span>Email *</span><input name="email" type="email" required maxLength={200} defaultValue={prefEmail} /></label>
            </div>
            <div className="inquiry-row">
              <label><span>Phone</span><input name="phone" type="tel" maxLength={40} defaultValue={prefPhone} /></label>
              <label><span>Budget</span><input name="budget" type="number" min={0} step={50} placeholder="optional" /></label>
            </div>
            <div className="inquiry-row">
              <label><span>From</span><input name="dateFrom" type="date" min={today} /></label>
              <label><span>To</span><input name="dateTo" type="date" min={today} /></label>
            </div>
            <label className="inquiry-full">
              <span>Message *</span>
              <textarea name="message" rows={4} required minLength={5} maxLength={2000} defaultValue={`Hi, I'm planning "${trip.title}" for ${trip.travelers} traveler${trip.travelers === 1 ? '' : 's'}. Please share availability + pricing for your part of the trip.`} />
            </label>
            <p className="inquiry-disclaimer"><ShieldCheck /> <span> Same message goes to every host on your trip. Each replies privately.</span></p>
            <div className="inquiry-actions">
              <button className="btn btn-ghost" type="button" onClick={onClose}>Cancel</button>
              <button className="btn btn-primary" type="submit" disabled={busy}><Send /> Send to all</button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body,
  );
}

function CartView() {
  const [state, setState] = useState(cart.getCart());
  const [inquiry, setInquiry] = useState<any | null>(null);
  const [savingBtn, setSavingBtn] = useState(false);

  useEffect(() => cart.onCartChange(() => setState(cart.getCart())), []);

  const requestAll = async () => {
    if (state.stops.length === 0) { showToast('Add at least one stop first', { type: 'error' }); return; }
    try {
      const trip = await api.saveTrip(serialize(state));
      if (trip) setInquiry(trip);
    } catch (err: any) {
      showToast(err?.message || 'Could not save trip', { type: 'error' });
    }
  };

  const saveAndShare = async () => {
    setSavingBtn(true);
    try {
      const trip = await api.saveTrip(serialize(state));
      // Copy the crawler-visible OG link (rich preview), not the raw SPA URL.
      const url = ogShareUrl(`trip/${trip.slug}`);
      try { await navigator.clipboard.writeText(url); } catch { /* ignore */ }
      showToast('Trip saved - link copied');
      goTo(`/trip/${trip.slug}`);
    } catch (err: any) {
      setSavingBtn(false);
      showToast(err?.message || 'Could not save trip', { type: 'error' });
    }
  };

  const total = cart.calcTotal(state);

  return (
    <div className="trip-page page-enter" data-design="sleek" id="trip-root">
      <header className="trip-page-head">
        <div>
          <h1><Luggage /> {state.title || 'My Tunisia trip'}</h1>
          <p className="trip-page-sub">{state.stops.length} {state.stops.length === 1 ? 'stop' : 'stops'} - {state.travelers} {state.travelers === 1 ? 'traveler' : 'travelers'} - {state.days} {state.days === 1 ? 'day' : 'days'}</p>
        </div>
        {state.stops.length > 0 && (
          <div className="trip-page-actions">
            <label className="trip-start-date" title="Set your trip start date">
              <CalendarDays size={15} />
              <input
                type="date"
                value={state.startDate || ''}
                onChange={(e) => cart.setStartDate(e.target.value || null)}
                aria-label="Trip start date"
              />
            </label>
            <button className="btn btn-primary" type="button" onClick={requestAll}><Send /> Request quotes for all</button>
            <button className="btn btn-outline" type="button" disabled={savingBtn} onClick={saveAndShare}><Share2 /> Save &amp; share</button>
          </div>
        )}
      </header>

      {state.stops.length === 0 ? (
        <div className="empty-state">
          <Luggage />
          <h3>Your trip is empty</h3>
          <p>Tap 'Add to trip' on any place or experience to start building your itinerary.</p>
          <a className="btn btn-primary" href="#/explore"><Compass /> Browse places</a>
        </div>
      ) : (
        <>
          <TripMapSection stops={state.stops} editable />
          <DayBlocks stops={state.stops} editable startDate={state.startDate} />
          {total.hasPriced && (
            <aside className="trip-summary">
              <div className="trip-summary-label">Estimated total for {state.travelers} {state.travelers === 1 ? 'traveler' : 'travelers'}</div>
              <div className="trip-summary-val">{fmtPrice(total.amount, total.currency)}</div>
              <div className="trip-summary-note">Prices are reference quotes from each host. Final price is confirmed when the host accepts.</div>
            </aside>
          )}
        </>
      )}

      {inquiry && <BatchInquiryModal trip={inquiry} onClose={() => setInquiry(null)} />}
    </div>
  );
}

function serialize(state: any) {
  return {
    title: state.title, travelers: state.travelers, currency: state.currency, days: state.days,
    startDate: state.startDate || undefined,
    stops: state.stops.map((s: any) => ({
      placeId: s.placeId, packageId: s.packageId || undefined, dayIndex: s.dayIndex,
      timeSlot: s.timeSlot || undefined,
    })),
  };
}

/** The calendar date for a 0-indexed trip day, given a "YYYY-MM-DD" start. */
function dayDate(startDate: string | null | undefined, dayIndex: number): Date | null {
  if (!startDate || !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) return null;
  const [y, m, d] = startDate.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + dayIndex);
  return dt;
}
function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
/** Whole-day offset from today (local), for aligning the weather forecast. */
function offsetFromToday(dt: Date): number {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const d = new Date(dt); d.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - today.getTime()) / 86_400_000);
}

function SavedTripView({ slug }: { slug: string }) {
  const [inquiry, setInquiry] = useState<any | null>(null);
  const { data: trip, isLoading, isError, error } = useQuery({
    queryKey: ['trip', slug],
    queryFn: () => api.getTripBySlug(slug),
  });

  if (isLoading) {
    return <div className="trip-page page-enter" data-design="sleek" id="trip-root"><div className="trip-skeleton"><div className="sk-title skeleton-block" /><div className="sk-subtitle skeleton-block" /></div></div>;
  }
  if (isError || !trip) {
    return (
      <div className="trip-page page-enter" data-design="sleek" id="trip-root">
        <div className="empty-state">
          <SearchX />
          <h3>Trip not found</h3>
          <p>{(error as any)?.message || 'This trip may be private or no longer exists.'}</p>
          <a className="btn btn-primary" href="#/">Back to feed</a>
        </div>
      </div>
    );
  }

  const clone = () => {
    cart.clearCart();
    cart.setTitle(trip.title);
    cart.setTravelers(trip.travelers);
    cart.setDays(trip.days);
    cart.setCurrency(trip.currency);
    cart.setStartDate((trip as any).startDate || null);
    for (const s of trip.stops) {
      cart.addStop({
        placeId: s.placeId, placeName: s.placeName || undefined, placeCity: s.placeCity || undefined, placeCover: s.placeCover || undefined,
        packageId: s.packageId, packageTitle: s.packageTitle, pricePerPerson: s.pricePerPerson, currency: s.currency, dayIndex: s.dayIndex, timeSlot: (s as any).timeSlot,
      });
    }
    showToast('Loaded into your trip cart');
    goTo('/trip');
  };

  const copyLink = async () => {
    // Share the OG route so WhatsApp/Facebook/X render a rich preview card.
    const url = ogShareUrl(`trip/${trip.slug}`);
    try { await navigator.clipboard.writeText(url); showToast('Link copied'); }
    catch { showToast('Could not copy', { type: 'error' }); }
  };

  let total = 0, hasPriced = false;
  for (const s of trip.stops) {
    if (typeof s.pricePerPerson === 'number' && s.pricePerPerson > 0) { total += s.pricePerPerson * trip.travelers; hasPriced = true; }
  }

  return (
    <div className="trip-page page-enter" data-design="sleek" id="trip-root">
      <header className="trip-page-head">
        <div>
          <h1><Luggage /> {trip.title}</h1>
          <p className="trip-page-sub">{trip.stops.length} {trip.stops.length === 1 ? 'stop' : 'stops'} - {trip.travelers} {trip.travelers === 1 ? 'traveler' : 'travelers'} - {trip.days} {trip.days === 1 ? 'day' : 'days'}</p>
        </div>
        <div className="trip-page-actions">
          <button className="btn btn-primary" type="button" onClick={() => setInquiry(trip)}><Send /> Request quotes for all</button>
          <button className="btn btn-outline" type="button" onClick={copyLink}><LinkIcon /> Copy link</button>
          <button className="btn btn-primary" type="button" onClick={clone}><Copy /> Use as my trip</button>
        </div>
      </header>

      <TripMapSection stops={trip.stops} />
      <DayBlocks stops={trip.stops} editable={false} startDate={(trip as any).startDate} />

      {hasPriced && (
        <aside className="trip-summary">
          <div className="trip-summary-label">Estimated total for {trip.travelers} {trip.travelers === 1 ? 'traveler' : 'travelers'}</div>
          <div className="trip-summary-val">{fmtPrice(total, trip.currency)}</div>
        </aside>
      )}

      <div className="trip-foot">Trip plan - {trip.viewCount.toLocaleString()} {trip.viewCount === 1 ? 'view' : 'views'} - shared from e-Tunisia</div>

      {inquiry && <BatchInquiryModal trip={inquiry} onClose={() => setInquiry(null)} />}
    </div>
  );
}

export default function TripPage() {
  const [slug, setSlug] = useState(slugFromPath());
  useCurrency(); // re-render the whole trip view when the display currency changes
  useEffect(() => onRouteChange(() => setSlug(slugFromPath())), []);
  return slug ? <SavedTripView slug={slug} /> : <CartView />;
}
