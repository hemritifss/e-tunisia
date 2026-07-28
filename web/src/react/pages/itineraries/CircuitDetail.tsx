import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    ArrowLeft, Bookmark, BookmarkCheck, CalendarDays, Car, Bus, UserRound, Clock, MapPin,
    Printer, Copy, Share2, Send, Sparkles, Trash2, Repeat, Plus, X, AlertTriangle, Check,
    Wallet, Backpack, Info, Stamp, Route as RouteIcon, MoveRight, Download, Users, Compass,
} from 'lucide-react';
import * as api from '../../../api';
import { goTo, absoluteUrl } from '../../../router';
import { showToast } from '../../../ui-utils';
import { track } from '../../../analytics';
import * as cart from '../../../trip-cart';
import { formatMoney } from '../../../currency';
import { useCurrency } from '../../lib/useCurrency';
import { TripRouteMap, TripDayChips } from '../../components/TripRouteMap';
import { WeatherBadge } from '../../components/WeatherBadge';
import { TransportOptions } from '../../components/TransportOptions';
import * as store from './store';
import {
    buildPlan, defaultOptions, dayOffsetFromToday, fmtClock, fmtDuration, FOOD_BAND,
    parseDate, planToText, seasonFor, STAY_MULT,
    type FoodTier, type Pace, type Plan, type PlanOptions, type StayTier, type Transport,
} from './plan';
import { KindIcon, KIND_LABEL, SeasonStrip } from './bits';

const UNIVERSAL_PACKING = ['Passport + a photocopy', 'Sun cream', 'Power adapter (type C/E)', 'A little cash in small notes'];

export default function CircuitDetail({ slug }: { slug: string }) {
    useCurrency(); // re-render when the display currency changes
    const [tick, setTick] = useState(0);
    useEffect(() => store.onCircuitsChange(() => setTick((n) => n + 1)), []);

    const { data: circuit, isLoading, isError } = useQuery({
        queryKey: ['circuit', slug],
        queryFn: () => api.getCircuit(slug),
        staleTime: 10 * 60_000,
    });

    const [opts, setOpts] = useState<PlanOptions | null>(null);
    useEffect(() => {
        if (!circuit) return;
        const stored = store.readOptions(circuit.slug);
        setOpts({ ...defaultOptions(circuit), ...(stored || {}), swaps: {}, extras: {} });
        track('circuit_view', { slug: circuit.slug });
    }, [circuit]);

    const patch = useCallback((next: Partial<PlanOptions>) => {
        setOpts((prev) => {
            if (!prev) return prev;
            const merged = { ...prev, ...next };
            if (circuit) store.writeOptions(circuit.slug, merged);
            return merged;
        });
    }, [circuit]);

    const plan = useMemo(
        () => (circuit && opts ? buildPlan(circuit, opts) : null),
        [circuit, opts],
    );

    const { data: visited } = useQuery({
        queryKey: ['visited-ids'],
        // Auth-only endpoint — a 401 here would bounce the whole app to /hero.
        enabled: api.isLoggedIn(),
        queryFn: async () => {
            try {
                const res = await api.getVisitedIds();
                const ids = Array.isArray(res) ? res : (res as any)?.placeIds || [];
                return new Set<string>(ids.map(String));
            } catch { return new Set<string>(); }
        },
        staleTime: 5 * 60_000,
    });

    if (isLoading) {
        return (
            <div className="circuit-page cn-grain page-enter">
                <div className="cn-skeleton cn-skeleton--title" />
                <div className="cn-skeleton cn-skeleton--print" />
            </div>
        );
    }
    if (isError || !circuit || !opts || !plan) {
        return (
            <div className="circuit-page cn-grain page-enter">
                <div className="cn-empty">
                    <h3>That route isn’t in the book</h3>
                    <p className="cn-empty-note">It may have been renamed, or the catalog behind it moved.</p>
                    <a className="cn-btn" href="/itineraries" onClick={(e) => { e.preventDefault(); goTo('/itineraries'); }}>
                        Back to all circuits
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="circuit-page cn-grain page-enter">
            <Header circuit={circuit} plan={plan} opts={opts} saved={store.isSaved(circuit.slug)} tick={tick} />
            <RemixBar circuit={circuit} opts={opts} patch={patch} plan={plan} />
            <Overview circuit={circuit} plan={plan} opts={opts} visited={visited} />
            <MapSection plan={plan} />
            <Timeline circuit={circuit} plan={plan} opts={opts} patch={patch} visited={visited} />
            <div className="circuit-columns">
                <Budget circuit={circuit} plan={plan} opts={opts} patch={patch} />
                <div className="circuit-column">
                    <KnowHow circuit={circuit} />
                    <Packing circuit={circuit} tick={tick} />
                </div>
            </div>
            <CommitBar circuit={circuit} plan={plan} opts={opts} />
        </div>
    );
}

// ── header ───────────────────────────────────────────────────────────────

function Header({
    circuit, plan, opts, saved,
}: { circuit: api.CircuitDetail; plan: Plan; opts: PlanOptions; saved: boolean; tick: number }) {
    const month = (parseDate(opts.startDate)?.getMonth() ?? new Date().getMonth()) + 1;
    const season = seasonFor(circuit, month);
    const [offline, setOffline] = useState<'idle' | 'saving' | 'done'>('idle');

    const copyText = async () => {
        try {
            await navigator.clipboard.writeText(planToText(circuit, plan, opts));
            showToast('Itinerary copied — paste it anywhere');
        } catch { showToast('Could not copy', { type: 'error' }); }
    };

    const share = async () => {
        const url = absoluteUrl(`/itineraries/${circuit.slug}`);
        const payload = { title: circuit.title, text: circuit.tagline, url };
        if ((navigator as any).share) {
            try { await (navigator as any).share(payload); return; } catch { /* cancelled */ }
        }
        try { await navigator.clipboard.writeText(url); showToast('Link copied'); }
        catch { showToast('Could not copy the link', { type: 'error' }); }
    };

    /**
     * Offline pack: the trip cart's offline prefetcher takes a trip shape, so
     * hand it one built from the current plan — same images, same place data.
     */
    const saveOffline = async () => {
        if (offline === 'saving') return;
        setOffline('saving');
        try {
            const { prefetchTripOffline } = await import('../../../offline-trip');
            await prefetchTripOffline({
                slug: `circuit-${circuit.slug}`,
                title: circuit.title,
                stops: plan.days.flatMap((d) => d.stops.map((p) => ({
                    placeId: p.stop.placeId,
                    placeName: p.stop.name,
                    placeCity: p.stop.city,
                    placeCover: p.stop.cover,
                    dayIndex: d.index,
                }))),
            });
            setOffline('done');
            showToast('Saved — this route works without a signal');
        } catch {
            setOffline('idle');
            showToast('Could not save the whole route offline', { type: 'error' });
        }
    };

    return (
        <header className="circuit-head">
            <a className="circuit-back" href="/itineraries" onClick={(e) => { e.preventDefault(); goTo('/itineraries'); }}>
                <ArrowLeft size={14} /> All circuits
            </a>
            <span className="circuits-kicker"><RouteIcon size={13} /> {circuit.cities[0]} ⇢ {circuit.cities[circuit.cities.length - 1]}</span>
            <h1>{circuit.title}</h1>
            <p className="circuit-tagline">{circuit.tagline}</p>
            <p className="circuit-summary">{circuit.summary}</p>

            <div className={`circuit-season circuit-season--${season.verdict}`}>
                <strong>{season.label}.</strong> <span>{season.reason}</span>
                <SeasonStrip circuit={circuit} month={month} />
            </div>

            <div className="circuit-head-actions">
                <button type="button" className={`cn-btn cn-btn--quiet${saved ? ' is-on' : ''}`} onClick={() => {
                    const added = store.toggleSaved(circuit.slug);
                    showToast(added ? 'Saved to your carnet' : 'Removed from your carnet');
                }}>
                    {saved ? <BookmarkCheck size={15} /> : <Bookmark size={15} />} {saved ? 'Saved' : 'Save'}
                </button>
                <button type="button" className="cn-btn cn-btn--quiet" onClick={share}><Share2 size={15} /> Share</button>
                <button type="button" className="cn-btn cn-btn--quiet" onClick={copyText}><Copy size={15} /> Copy as text</button>
                <button type="button" className="cn-btn cn-btn--quiet" onClick={() => window.print()}><Printer size={15} /> Print</button>
                <button type="button" className="cn-btn cn-btn--quiet" onClick={saveOffline} disabled={offline === 'saving'}>
                    <Download size={15} /> {offline === 'saving' ? 'Saving…' : offline === 'done' ? 'Offline ready' : 'Save offline'}
                </button>
            </div>
        </header>
    );
}

// ── remix ────────────────────────────────────────────────────────────────

function RemixBar({
    circuit, opts, patch, plan,
}: { circuit: api.CircuitDetail; opts: PlanOptions; patch: (p: Partial<PlanOptions>) => void; plan: Plan }) {
    const [min, max] = circuit.dayRange;
    const first = circuit.stops[0];
    const last = circuit.stops[circuit.stops.length - 1];

    return (
        <section className="circuit-remix" aria-label="Shape this circuit to your trip">
            <div className="circuit-remix-head">
                <Sparkles size={14} />
                <h2>Bend it to your trip</h2>
                <span className="circuit-remix-note">Everything below re-plans instantly.</span>
            </div>

            <div className="circuit-remix-grid">
                <div className="ci-control ci-control--wide">
                    <label htmlFor="ci-days">Days I have</label>
                    <div className="ci-slider">
                        <input
                            id="ci-days"
                            type="range"
                            min={min}
                            max={max}
                            value={opts.days}
                            onChange={(e) => patch({ days: Number(e.target.value) })}
                        />
                        <output className="cn-num">{opts.days}</output>
                    </div>
                    <span className="ci-control-hint">
                        {opts.days === circuit.defaultDays
                            ? 'The route as written.'
                            : opts.days < circuit.defaultDays
                                ? `${plan.droppedForTime.length} stop${plan.droppedForTime.length === 1 ? '' : 's'} cut to fit.`
                                : 'More room — the days get gentler.'}
                    </span>
                </div>

                <div className="ci-control">
                    <span className="ci-control-label">Pace</span>
                    <div className="ci-segment" role="group" aria-label="Pace">
                        {(['relaxed', 'balanced', 'packed'] as Pace[]).map((p) => (
                            <button key={p} type="button" className={opts.pace === p ? 'is-on' : ''} onClick={() => patch({ pace: p })} aria-pressed={opts.pace === p}>
                                {p}
                            </button>
                        ))}
                    </div>
                    <span className="ci-control-hint">Sets how many hours a day you are actually out.</span>
                </div>

                <div className="ci-control">
                    <span className="ci-control-label">Getting around</span>
                    <div className="ci-segment" role="group" aria-label="Transport">
                        <button type="button" className={opts.transport === 'car' ? 'is-on' : ''} onClick={() => patch({ transport: 'car' as Transport })} aria-pressed={opts.transport === 'car'}><Car size={13} /> Own car</button>
                        <button type="button" className={opts.transport === 'public' ? 'is-on' : ''} onClick={() => patch({ transport: 'public' })} aria-pressed={opts.transport === 'public'}><Bus size={13} /> Louage</button>
                        <button type="button" className={opts.transport === 'guided' ? 'is-on' : ''} onClick={() => patch({ transport: 'guided' })} aria-pressed={opts.transport === 'guided'}><UserRound size={13} /> Driver</button>
                    </div>
                    {opts.transport === 'public' && !circuit.carFree && (
                        <span className="ci-control-hint ci-control-hint--warn">
                            <AlertTriangle size={11} /> This route wasn’t designed for public transport — expect taxi hops.
                        </span>
                    )}
                </div>

                <div className="ci-control">
                    <label htmlFor="ci-start">Starting</label>
                    <input
                        id="ci-start"
                        className="ci-date"
                        type="date"
                        value={opts.startDate || ''}
                        min={new Date().toISOString().slice(0, 10)}
                        onChange={(e) => patch({ startDate: e.target.value || null })}
                    />
                    <span className="ci-control-hint">Adds real dates and the forecast to each day.</span>
                </div>

                <div className="ci-control">
                    <label htmlFor="ci-travelers">Travellers</label>
                    <input
                        id="ci-travelers"
                        className="ci-number"
                        type="number"
                        min={1}
                        max={12}
                        value={opts.travelers}
                        onChange={(e) => patch({ travelers: Math.max(1, Math.min(12, Number(e.target.value) || 1)) })}
                    />
                    <span className="ci-control-hint">Splits the car, multiplies the tickets.</span>
                </div>

                <div className="ci-control ci-control--wide">
                    <span className="ci-control-label">Direction</span>
                    <button type="button" className="ci-direction" onClick={() => patch({ reverse: !opts.reverse })}>
                        <Repeat size={14} />
                        <span>
                            {opts.reverse
                                ? <>Running it backwards: <strong>{last?.city}</strong> <MoveRight size={12} /> <strong>{first?.city}</strong></>
                                : <>As written: <strong>{first?.city}</strong> <MoveRight size={12} /> <strong>{last?.city}</strong></>}
                        </span>
                    </button>
                    <span className="ci-control-hint">Flip it if you land at the far end.</span>
                </div>
            </div>

            {plan.droppedForTime.length > 0 && (
                <p className="circuit-cut">
                    <AlertTriangle size={13} />
                    <span>
                        Cut to fit {opts.days} days: {plan.droppedForTime.map((s) => s.name).join(', ')}.
                        {' '}Add a day to get {plan.droppedForTime.length === 1 ? 'it' : 'them'} back.
                    </span>
                </p>
            )}
        </section>
    );
}

// ── overview strip ───────────────────────────────────────────────────────

function Overview({
    circuit, plan, opts, visited,
}: { circuit: api.CircuitDetail; plan: Plan; opts: PlanOptions; visited?: Set<string> }) {
    const stamped = visited ? plan.stops.filter((s) => visited.has(s.placeId)).length : 0;
    const heavy = plan.longestLegKm >= 200;
    return (
        <section className="circuit-overview" aria-label="At a glance">
            <div className="ci-stat"><span className="ci-stat-value cn-num">{plan.days.length}</span><span className="ci-stat-label">days</span></div>
            <div className="ci-stat"><span className="ci-stat-value cn-num">{plan.stops.length}</span><span className="ci-stat-label">stops</span></div>
            <div className="ci-stat"><span className="ci-stat-value cn-num">{plan.totalKm}</span><span className="ci-stat-label">km by road</span></div>
            <div className="ci-stat"><span className="ci-stat-value">{fmtDuration(plan.totalDriveMinutes)}</span><span className="ci-stat-label">behind the wheel</span></div>
            <div className="ci-stat"><span className="ci-stat-value">{fmtDuration(plan.totalOnSiteMinutes)}</span><span className="ci-stat-label">on site</span></div>
            <div className="ci-stat ci-stat--money">
                <span className="ci-stat-value cn-num">{formatMoney(plan.cost.perPerson)}</span>
                <span className="ci-stat-label">per person, all in</span>
            </div>
            {stamped > 0 && (
                <div className="ci-stat ci-stat--stamp" title="Places already in your carnet">
                    <span className="ci-stat-value cn-num"><Stamp size={16} /> {stamped}</span>
                    <span className="ci-stat-label">already stamped</span>
                </div>
            )}
            {heavy && (
                <p className="circuit-warn">
                    <AlertTriangle size={13} />
                    Longest single hop is {plan.longestLegKm} km — that day is mostly road.
                    {opts.days < circuit.dayRange[1] && ' Adding a day breaks it up.'}
                </p>
            )}
        </section>
    );
}

// ── map ──────────────────────────────────────────────────────────────────

function MapSection({ plan }: { plan: Plan }) {
    const [activeDay, setActiveDay] = useState<number | null>(null);
    const stops = plan.days.flatMap((d) =>
        d.stops.map((p) => ({
            placeId: p.stop.placeId,
            placeName: p.stop.name,
            dayIndex: d.index,
            latitude: p.stop.latitude,
            longitude: p.stop.longitude,
        })),
    );
    if (!stops.length) return null;
    const pick = (d: number | null) => {
        setActiveDay(d);
        if (d != null) document.getElementById(`circuit-day-${d}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    return (
        <section className="circuit-map" aria-label="The route on the map">
            <TripDayChips days={plan.days.map((d) => d.index)} active={activeDay} onPick={pick} />
            <TripRouteMap stops={stops} activeDay={activeDay} onStopClick={(id) => goTo(`/place/${id}`)} />
        </section>
    );
}

// ── timeline ─────────────────────────────────────────────────────────────

function Timeline({
    circuit, plan, opts, patch, visited,
}: {
    circuit: api.CircuitDetail;
    plan: Plan;
    opts: PlanOptions;
    patch: (p: Partial<PlanOptions>) => void;
    visited?: Set<string>;
}) {
    const [addingTo, setAddingTo] = useState<api.CircuitStop | null>(null);
    const [swapping, setSwapping] = useState<api.CircuitStop | null>(null);

    const drop = (stop: api.CircuitStop) => {
        patch({ dropped: [...opts.dropped, stop.placeId] });
        showToast(`${stop.name} removed from this route`);
    };
    const restoreAll = () => patch({ dropped: [], swaps: {}, extras: {} });

    return (
        <section className="circuit-plan" aria-label="Day by day">
            <div className="circuit-plan-head">
                <h2>Day by day</h2>
                {(opts.dropped.length > 0 || Object.keys(opts.swaps).length > 0 || Object.keys(opts.extras).length > 0) && (
                    <button type="button" className="ci-linkish" onClick={restoreAll}>Reset my edits</button>
                )}
            </div>

            {plan.days.map((day, di) => {
                const prevDay = plan.days[di - 1];
                const from = prevDay?.stops[prevDay.stops.length - 1]?.stop;
                const to = day.stops[0]?.stop;
                const showConnector = !!from && !!to && from.city.toLowerCase() !== to.city.toLowerCase();
                return (
                    <React.Fragment key={day.index}>
                        {showConnector && (
                            <div className="circuit-connector">
                                <span className="circuit-connector-label">Overnight move · {from!.city} to {to!.city}</span>
                                <TransportOptions
                                    from={[from!.longitude, from!.latitude]}
                                    to={[to!.longitude, to!.latitude]}
                                    fromCity={from!.city}
                                    toCity={to!.city}
                                />
                            </div>
                        )}
                        <article className="circuit-day" id={`circuit-day-${day.index}`}>
                            <header className="circuit-day-head">
                                <span className="circuit-day-num cn-num">{String(day.index + 1).padStart(2, '0')}</span>
                                <div className="circuit-day-title">
                                    <h3>
                                        {day.date
                                            ? day.date.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })
                                            : `Day ${day.index + 1}`}
                                    </h3>
                                    <p>
                                        {day.span} · {day.stops.length} stop{day.stops.length === 1 ? '' : 's'} · {day.driveKm} km
                                        {day.driveMinutes > 0 && <> · {fmtDuration(day.driveMinutes)} moving</>}
                                    </p>
                                </div>
                                <div className="circuit-day-side">
                                    {day.date && dayOffsetFromToday(day.date) >= 0 && day.stops[0] && (
                                        <WeatherBadge
                                            lat={day.stops[0].stop.latitude}
                                            lon={day.stops[0].stop.longitude}
                                            dayOffset={dayOffsetFromToday(day.date)}
                                        />
                                    )}
                                    <span className="circuit-day-base" title="Where to book the night">
                                        <MapPin size={12} /> sleep in {day.base}
                                    </span>
                                </div>
                            </header>

                            <ol className="circuit-stops">
                                {day.stops.map((p) => (
                                    <li key={p.stop.placeId} className="circuit-stop">
                                        {p.leg && (
                                            <div className="circuit-leg">
                                                <Car size={12} />
                                                <span>{Math.round(p.leg.km * 1.25)} km · {fmtDuration(p.leg.minutes)}{p.leg.crossCity ? ' · new city' : ''}</span>
                                            </div>
                                        )}
                                        <div className="circuit-stop-row">
                                            <time className="circuit-stop-time cn-num">{fmtClock(p.arriveMin)}</time>
                                            {p.stop.cover
                                                ? <img className="circuit-stop-thumb" src={api.getImageUrl(p.stop.cover)} alt="" loading="lazy" />
                                                : <span className="circuit-stop-thumb circuit-stop-thumb--blank" aria-hidden="true" />}
                                            <div className="circuit-stop-body">
                                                <div className="circuit-stop-title">
                                                    <a href={`/place/${p.stop.placeId}`} onClick={(e) => { e.preventDefault(); goTo(`/place/${p.stop.placeId}`); }}>
                                                        {p.stop.name}
                                                    </a>
                                                    {visited?.has(p.stop.placeId) && (
                                                        <span className="circuit-stop-stamped" title="Already in your carnet"><Stamp size={12} /> stamped</span>
                                                    )}
                                                </div>
                                                <div className="circuit-stop-meta">
                                                    <span><KindIcon kind={p.stop.kind} size={12} /> {KIND_LABEL[p.stop.kind]}</span>
                                                    <span><MapPin size={12} /> {p.stop.city}</span>
                                                    <span><Clock size={12} /> {fmtDuration(p.stop.minutes)}</span>
                                                    {p.stop.entryPrice ? <span className="cn-num">{formatMoney(p.stop.entryPrice)}</span> : <span>free</span>}
                                                    {p.stop.rating > 0 && <span className="cn-num">★ {p.stop.rating.toFixed(1)}</span>}
                                                </div>
                                                <p className="circuit-stop-why">{p.stop.why}</p>
                                                {p.stop.openingHours && (
                                                    <p className="circuit-stop-hours"><Clock size={11} /> Opening hours: {p.stop.openingHours}</p>
                                                )}
                                                {p.slotWarning && (
                                                    <p className="circuit-stop-flag"><Info size={11} /> {p.slotWarning}</p>
                                                )}
                                                {p.transportWarning && (
                                                    <p className="circuit-stop-flag circuit-stop-flag--warn"><AlertTriangle size={11} /> {p.transportWarning}</p>
                                                )}
                                            </div>
                                            <div className="circuit-stop-tools">
                                                <button type="button" onClick={() => setSwapping(p.stop)} aria-label={`Swap ${p.stop.name}`} title="Swap for something nearby"><Repeat size={14} /></button>
                                                <button type="button" onClick={() => setAddingTo(p.stop)} aria-label={`Add a stop after ${p.stop.name}`} title="Add a stop after this"><Plus size={14} /></button>
                                                <button type="button" onClick={() => drop(p.stop)} aria-label={`Remove ${p.stop.name}`} title="Remove from this route"><Trash2 size={14} /></button>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ol>
                        </article>
                    </React.Fragment>
                );
            })}

            {opts.dropped.length > 0 && (
                <div className="circuit-dropped">
                    <span>Removed by you:</span>
                    {opts.dropped.map((id) => {
                        const s = circuit.stops.find((x) => x.placeId === id);
                        return (
                            <button key={id} type="button" onClick={() => patch({ dropped: opts.dropped.filter((d) => d !== id) })}>
                                {s?.name || 'stop'} <Plus size={11} />
                            </button>
                        );
                    })}
                </div>
            )}

            {addingTo && (
                <NearbyPicker
                    anchor={addingTo}
                    title={`What else is near ${addingTo.city}?`}
                    exclude={plan.stops.map((s) => s.placeId)}
                    onPick={(stop) => {
                        patch({ extras: { ...opts.extras, [addingTo.placeId]: [...(opts.extras[addingTo.placeId] || []), stop] } });
                        setAddingTo(null);
                        showToast(`${stop.name} added after ${addingTo.name}`);
                    }}
                    onClose={() => setAddingTo(null)}
                />
            )}
            {swapping && (
                <NearbyPicker
                    anchor={swapping}
                    title={`Swap ${swapping.name} for…`}
                    exclude={plan.stops.map((s) => s.placeId)}
                    onPick={(stop) => {
                        patch({ swaps: { ...opts.swaps, [swapping.placeId]: { ...stop, why: stop.why, priority: swapping.priority, slot: swapping.slot } } });
                        setSwapping(null);
                        showToast(`Swapped in ${stop.name}`);
                    }}
                    onClose={() => setSwapping(null)}
                />
            )}
        </section>
    );
}

/**
 * Pulls real catalog places within 35 km of a stop so a traveller can add a
 * detour or replace something they've already seen — the circuit stays wired
 * to the live catalog rather than being a frozen list.
 */
function NearbyPicker({
    anchor, title, exclude, onPick, onClose,
}: {
    anchor: api.CircuitStop;
    title: string;
    exclude: string[];
    onPick: (stop: api.CircuitStop) => void;
    onClose: () => void;
}) {
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKey); };
    }, [onClose]);

    const { data, isLoading } = useQuery({
        queryKey: ['circuit-nearby', anchor.placeId],
        queryFn: () => api.getNearbyPlaces(anchor.latitude, anchor.longitude, 35),
        staleTime: 10 * 60_000,
    });

    const options = (Array.isArray(data) ? data : [])
        .filter((p: any) => !exclude.includes(p.id))
        .slice(0, 12);

    const toStop = (p: any): api.CircuitStop => ({
        placeId: p.id,
        slug: p.slug,
        name: p.name,
        city: p.city,
        governorate: p.governorate,
        latitude: Number(p.latitude),
        longitude: Number(p.longitude),
        cover: p.coverImage || p.images?.[0] || null,
        rating: Number(p.rating) || 0,
        reviewCount: p.reviewCount || 0,
        tags: p.tags || [],
        entryPrice: p.entryPrice != null ? Number(p.entryPrice) : null,
        openingHours: p.openingHours || null,
        kind: 'sight',
        why: 'Your own detour — added from the catalog nearby.',
        priority: 2,
        minutes: p.avgVisitMinutes || 90,
        slot: 'midday',
        hopKm: 0,
    });

    return (
        <div className="cn-scrim" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="ci-picker" role="dialog" aria-modal="true" aria-label={title}>
                <header className="ci-picker-head">
                    <h3>{title}</h3>
                    <button type="button" onClick={onClose} aria-label="Close"><X size={18} /></button>
                </header>
                {isLoading && <p className="ci-picker-note">Looking within 35 km…</p>}
                {!isLoading && options.length === 0 && (
                    <p className="ci-picker-note">Nothing else in the catalog within 35 km yet. Know a spot? <a href="/submit-gem" onClick={(e) => { e.preventDefault(); onClose(); goTo('/submit-gem'); }}>Add it</a>.</p>
                )}
                <ul className="ci-picker-list">
                    {options.map((p: any) => (
                        <li key={p.id}>
                            <button type="button" onClick={() => onPick(toStop(p))}>
                                {p.coverImage
                                    ? <img src={api.getImageUrl(p.coverImage)} alt="" loading="lazy" />
                                    : <span className="ci-picker-blank" aria-hidden="true" />}
                                <span className="ci-picker-body">
                                    <strong>{p.name}</strong>
                                    <span>{p.city}{p.rating ? ` · ★ ${Number(p.rating).toFixed(1)}` : ''}</span>
                                </span>
                                <Plus size={16} />
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

// ── budget ───────────────────────────────────────────────────────────────

function Budget({
    circuit, plan, opts, patch,
}: { circuit: api.CircuitDetail; plan: Plan; opts: PlanOptions; patch: (p: Partial<PlanOptions>) => void }) {
    return (
        <section className="circuit-budget" aria-label="What it costs">
            <div className="circuit-panel-head"><Wallet size={15} /><h2>What it costs</h2></div>

            <div className="circuit-budget-tiers">
                <div className="ci-control">
                    <span className="ci-control-label">Beds</span>
                    <div className="ci-segment ci-segment--sm" role="group" aria-label="Accommodation level">
                        {(['hostel', 'mid', 'boutique'] as StayTier[]).map((t) => (
                            <button key={t} type="button" className={opts.stay === t ? 'is-on' : ''} onClick={() => patch({ stay: t })} aria-pressed={opts.stay === t}>
                                {t === 'hostel' ? 'Simple' : t === 'mid' ? 'Mid' : 'Boutique'}
                            </button>
                        ))}
                    </div>
                    <span className="ci-control-hint cn-num">
                        ~{Math.round(circuit.stayBandTnd * STAY_MULT[opts.stay])} TND per person per night
                    </span>
                </div>
                <div className="ci-control">
                    <span className="ci-control-label">Eating</span>
                    <div className="ci-segment ci-segment--sm" role="group" aria-label="Food level">
                        {(['street', 'mixed', 'restaurant'] as FoodTier[]).map((t) => (
                            <button key={t} type="button" className={opts.food === t ? 'is-on' : ''} onClick={() => patch({ food: t })} aria-pressed={opts.food === t}>
                                {t === 'street' ? 'Street' : t === 'mixed' ? 'Mixed' : 'Sit-down'}
                            </button>
                        ))}
                    </div>
                    <span className="ci-control-hint cn-num">{FOOD_BAND[opts.food]} TND per person per day</span>
                </div>
            </div>

            <table className="circuit-budget-table">
                <tbody>
                    {plan.cost.lines.map((line) => (
                        <tr key={line.label}>
                            <th scope="row">{line.label}<span>{line.note}</span></th>
                            <td className="cn-num">{formatMoney(line.total)}</td>
                        </tr>
                    ))}
                </tbody>
                <tfoot>
                    <tr>
                        <th scope="row">Total · {opts.travelers} traveller{opts.travelers === 1 ? '' : 's'}</th>
                        <td className="cn-num">{formatMoney(plan.cost.total)}</td>
                    </tr>
                    <tr>
                        <th scope="row">Per person</th>
                        <td className="cn-num">{formatMoney(plan.cost.perPerson)}</td>
                    </tr>
                    <tr className="circuit-budget-daily">
                        <th scope="row">Per person, per day</th>
                        <td className="cn-num">{formatMoney(plan.cost.perPersonPerDay)}</td>
                    </tr>
                </tfoot>
            </table>

            <p className="circuit-budget-note">
                <Info size={12} />
                Gate fees come from the place records; the rest are mid-2020s local bands —
                car hire at 115 TND/day, fuel at ~7 L/100 km. Flights are not included.
            </p>
        </section>
    );
}

// ── know-how + packing ───────────────────────────────────────────────────

function KnowHow({ circuit }: { circuit: api.CircuitDetail }) {
    return (
        <section className="circuit-know" aria-label="Know before you go">
            <div className="circuit-panel-head"><Compass size={15} /><h2>Know before you go</h2></div>
            <ul>
                {circuit.knowHow.map((k) => <li key={k}>{k}</li>)}
            </ul>
        </section>
    );
}

function Packing({ circuit, tick }: { circuit: api.CircuitDetail; tick: number }) {
    const items = useMemo(() => [...circuit.packing, ...UNIVERSAL_PACKING], [circuit.packing]);
    const done = useMemo(() => new Set(store.readChecklist(circuit.slug)), [circuit.slug, tick]);
    return (
        <section className="circuit-packing" aria-label="Packing list">
            <div className="circuit-panel-head">
                <Backpack size={15} />
                <h2>Pack for this one</h2>
                <span className="cn-num">{done.size}/{items.length}</span>
            </div>
            <ul>
                {items.map((item) => (
                    <li key={item}>
                        <label className={done.has(item) ? 'is-done' : ''}>
                            <input
                                type="checkbox"
                                checked={done.has(item)}
                                onChange={() => store.toggleChecklistItem(circuit.slug, item)}
                            />
                            <span className="ci-check" aria-hidden="true">{done.has(item) && <Check size={12} />}</span>
                            {item}
                        </label>
                    </li>
                ))}
            </ul>
        </section>
    );
}

// ── commit ───────────────────────────────────────────────────────────────

function CommitBar({
    circuit, plan, opts,
}: { circuit: api.CircuitDetail; plan: Plan; opts: PlanOptions }) {
    const [busy, setBusy] = useState(false);

    /** The whole point of the page: this plan becomes the user's real trip. */
    const sendToTrip = () => {
        cart.clearCart();
        cart.setTitle(circuit.title);
        cart.setTravelers(opts.travelers);
        cart.setDays(plan.days.length);
        cart.setStartDate(opts.startDate || null);
        for (const day of plan.days) {
            for (const p of day.stops) {
                cart.addStop({
                    placeId: p.stop.placeId,
                    placeName: p.stop.name,
                    placeCity: p.stop.city,
                    placeCover: p.stop.cover || undefined,
                    dayIndex: day.index,
                    timeSlot: fmtClock(p.arriveMin),
                });
            }
        }
        track('circuit_to_trip', { slug: circuit.slug, days: plan.days.length, stops: plan.stops.length });
        showToast('Loaded into your trip — edit, price and share it there');
        goTo('/trip');
    };

    /** Save it server-side first, so "share" hands over a real, live trip. */
    const saveAndShare = async () => {
        if (busy) return;
        setBusy(true);
        try {
            const trip = await api.saveTrip({
                title: circuit.title,
                travelers: opts.travelers,
                days: plan.days.length,
                stops: plan.days.flatMap((d) => d.stops.map((p) => ({ placeId: p.stop.placeId, dayIndex: d.index }))),
            });
            try { await navigator.clipboard.writeText(absoluteUrl(`/trip/${trip.slug}`)); } catch { /* ignore */ }
            showToast('Trip saved — link copied');
            goTo(`/trip/${trip.slug}`);
        } catch (err: any) {
            setBusy(false);
            showToast(err?.message || 'Could not save the trip', { type: 'error' });
        }
    };

    return (
        <section className="circuit-commit">
            <div className="circuit-commit-text">
                <strong>Take it with you</strong>
                <span>
                    {plan.days.length} days · {plan.stops.length} stops · {formatMoney(plan.cost.perPerson)} per person.
                    Sending it to your trip keeps every stop, day and arrival time.
                </span>
            </div>
            <div className="circuit-commit-actions">
                <button type="button" className="cn-btn" onClick={sendToTrip}><Send size={15} /> Send to my trip</button>
                <button type="button" className="cn-btn cn-btn--quiet" onClick={saveAndShare} disabled={busy}>
                    <Users size={15} /> {busy ? 'Saving…' : 'Save & share a link'}
                </button>
            </div>
        </section>
    );
}
