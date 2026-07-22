import React, { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    Route, Search, Bookmark, BookmarkCheck, Scale, X, CalendarDays, MapPin,
    Car, Bus, Footprints, ArrowRight, SlidersHorizontal, Stamp, Compass,
} from 'lucide-react';
import * as api from '../../../api';
import { goTo } from '../../../router';
import { showToast } from '../../../ui-utils';
import { track } from '../../../analytics';
import * as store from './store';
import { seasonFor, fmtDuration } from './plan';
import { REGION_LABEL, SeasonStrip, SeasonVerdictChip, THEME_LABEL } from './bits';

type SortKey = 'recommended' | 'shortest' | 'cheapest' | 'longest';

const THEMES: Array<api.CircuitSummary['theme']> = ['heritage', 'desert', 'coast', 'nature', 'food', 'city'];
const REGIONS: Array<api.CircuitSummary['region']> = ['north', 'centre', 'south', 'nationwide'];

/** Rough per-person floor so the directory can sort and filter on money. */
function roughCostTnd(c: api.CircuitSummary): number {
    const nights = Math.max(0, c.defaultDays - 1);
    return Math.round(c.entryCostTnd + c.stayBandTnd * nights + 75 * c.defaultDays + c.distanceKm * 0.12);
}

function useVisitedIds() {
    // Guests have no "visited" list, and the call is auth-only — hitting it
    // anonymously returns 401, which the API wrapper turns into a hard redirect
    // to /hero. So only run it when signed in.
    return useQuery({
        queryKey: ['visited-ids'],
        enabled: api.isLoggedIn(),
        queryFn: async () => {
            try {
                const res = await api.getVisitedIds();
                const ids = Array.isArray(res) ? res : (res as any)?.placeIds || [];
                return new Set<string>(ids.map(String));
            } catch {
                return new Set<string>();
            }
        },
        staleTime: 5 * 60_000,
    });
}

export default function CircuitsDirectory() {
    const month = new Date().getMonth() + 1;
    const [q, setQ] = useState('');
    const [theme, setTheme] = useState<api.CircuitSummary['theme'] | null>(null);
    const [region, setRegion] = useState<api.CircuitSummary['region'] | null>(null);
    const [maxDays, setMaxDays] = useState<number | null>(null);
    const [carFreeOnly, setCarFreeOnly] = useState(false);
    const [inSeasonOnly, setInSeasonOnly] = useState(false);
    const [savedOnly, setSavedOnly] = useState(false);
    const [sort, setSort] = useState<SortKey>('recommended');
    const [showCompare, setShowCompare] = useState(false);
    const [tick, setTick] = useState(0);

    useEffect(() => store.onCircuitsChange(() => setTick((n) => n + 1)), []);
    useEffect(() => { track('circuits_directory_view', {}); }, []);

    const { data: circuits, isLoading, isError } = useQuery({
        queryKey: ['circuits'],
        queryFn: api.getCircuits,
        staleTime: 10 * 60_000,
    });

    const { data: visited } = useVisitedIds();
    const saved = useMemo(() => new Set(store.savedSlugs()), [tick]);
    const compare = useMemo(() => store.compareSlugs(), [tick]);

    const filtered = useMemo(() => {
        let list = circuits ? [...circuits] : [];
        const needle = q.trim().toLowerCase();
        if (needle) {
            list = list.filter((c) =>
                [c.title, c.tagline, c.summary, ...c.cities].join(' ').toLowerCase().includes(needle),
            );
        }
        if (theme) list = list.filter((c) => c.theme === theme);
        if (region) list = list.filter((c) => c.region === region);
        if (maxDays) list = list.filter((c) => c.dayRange[0] <= maxDays);
        if (carFreeOnly) list = list.filter((c) => c.carFree);
        if (inSeasonOnly) list = list.filter((c) => seasonFor(c, month).verdict !== 'avoid');
        if (savedOnly) list = list.filter((c) => saved.has(c.slug));

        const seasonRank = (c: api.CircuitSummary) =>
            ({ perfect: 0, fine: 1, avoid: 2 })[seasonFor(c, month).verdict];
        list.sort((a, b) => {
            if (sort === 'shortest') return a.distanceKm - b.distanceKm;
            if (sort === 'cheapest') return roughCostTnd(a) - roughCostTnd(b);
            if (sort === 'longest') return b.defaultDays - a.defaultDays;
            // Recommended = what you could actually enjoy this month, richest first.
            return seasonRank(a) - seasonRank(b) || b.stopCount - a.stopCount;
        });
        return list;
    }, [circuits, q, theme, region, maxDays, carFreeOnly, inSeasonOnly, savedOnly, sort, saved, month]);

    const activeFilters =
        (theme ? 1 : 0) + (region ? 1 : 0) + (maxDays ? 1 : 0) +
        (carFreeOnly ? 1 : 0) + (inSeasonOnly ? 1 : 0) + (savedOnly ? 1 : 0);

    const resetFilters = () => {
        setTheme(null); setRegion(null); setMaxDays(null);
        setCarFreeOnly(false); setInSeasonOnly(false); setSavedOnly(false); setQ('');
    };

    return (
        <div className="circuits-page cn-grain page-enter" data-design="carnet">
            <header className="circuits-masthead">
                <span className="circuits-kicker"><Route size={13} /> Routes · carnet de circuits</span>
                <h1>Circuits you can <em>actually take</em></h1>
                <p>
                    Every stop below is a real place in the catalog — with coordinates, opening
                    hours and a page of its own. Pick a route, bend it to the days you have,
                    then send the whole thing to your trip.
                </p>
            </header>

            <div className="circuits-toolbar">
                <label className="circuits-search">
                    <Search size={15} />
                    <input
                        type="search"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Search a route, a city, a theme…"
                        aria-label="Search circuits"
                    />
                    {q && <button type="button" onClick={() => setQ('')} aria-label="Clear search"><X size={14} /></button>}
                </label>

                <div className="circuits-days">
                    <span className="circuits-days-label"><CalendarDays size={13} /> I have</span>
                    {[2, 3, 4, 5, 7, 10].map((d) => (
                        <button
                            key={d}
                            type="button"
                            className={`circuits-day-pill${maxDays === d ? ' is-on' : ''}`}
                            onClick={() => setMaxDays(maxDays === d ? null : d)}
                            aria-pressed={maxDays === d}
                        >
                            {d}d
                        </button>
                    ))}
                </div>

                <label className="circuits-sort">
                    <SlidersHorizontal size={14} />
                    <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} aria-label="Sort circuits">
                        <option value="recommended">Best for {new Date().toLocaleString(undefined, { month: 'long' })}</option>
                        <option value="shortest">Least driving</option>
                        <option value="cheapest">Cheapest</option>
                        <option value="longest">Longest trip</option>
                    </select>
                </label>
            </div>

            <div className="circuits-filters" role="group" aria-label="Filter circuits">
                {THEMES.map((t) => (
                    <button
                        key={t}
                        type="button"
                        className={`ci-chip${theme === t ? ' is-on' : ''}`}
                        onClick={() => setTheme(theme === t ? null : t)}
                        aria-pressed={theme === t}
                    >
                        {THEME_LABEL[t]}
                    </button>
                ))}
                <span className="ci-chip-sep" aria-hidden="true" />
                {REGIONS.map((r) => (
                    <button
                        key={r}
                        type="button"
                        className={`ci-chip${region === r ? ' is-on' : ''}`}
                        onClick={() => setRegion(region === r ? null : r)}
                        aria-pressed={region === r}
                    >
                        {REGION_LABEL[r]}
                    </button>
                ))}
                <span className="ci-chip-sep" aria-hidden="true" />
                <button type="button" className={`ci-chip${carFreeOnly ? ' is-on' : ''}`} onClick={() => setCarFreeOnly(!carFreeOnly)} aria-pressed={carFreeOnly}>
                    <Bus size={12} /> No car needed
                </button>
                <button type="button" className={`ci-chip${inSeasonOnly ? ' is-on' : ''}`} onClick={() => setInSeasonOnly(!inSeasonOnly)} aria-pressed={inSeasonOnly}>
                    In season now
                </button>
                <button type="button" className={`ci-chip${savedOnly ? ' is-on' : ''}`} onClick={() => setSavedOnly(!savedOnly)} aria-pressed={savedOnly}>
                    <Bookmark size={12} /> Saved ({saved.size})
                </button>
                {activeFilters > 0 && (
                    <button type="button" className="ci-chip ci-chip--reset" onClick={resetFilters}>
                        <X size={12} /> Clear
                    </button>
                )}
            </div>

            {isLoading && (
                <div className="circuits-grid">
                    {[0, 1, 2, 3].map((i) => (
                        <div key={i} className="ci-card ci-card--skeleton">
                            <div className="cn-skeleton cn-skeleton--print" />
                            <div className="cn-skeleton cn-skeleton--title" />
                            <div className="cn-skeleton cn-skeleton--line" />
                        </div>
                    ))}
                </div>
            )}

            {isError && (
                <div className="cn-empty">
                    <h3>The route book didn’t open</h3>
                    <p className="cn-empty-note">We couldn’t reach the circuits service. Try again in a moment.</p>
                </div>
            )}

            {!isLoading && !isError && filtered.length === 0 && (
                <div className="cn-empty">
                    <h3>Nothing matches that</h3>
                    <p className="cn-empty-note">
                        {savedOnly ? 'You haven’t saved a circuit yet.' : 'Loosen a filter and the routes come back.'}
                    </p>
                    <button type="button" className="cn-btn cn-btn--quiet" onClick={resetFilters}>Reset filters</button>
                </div>
            )}

            {!isLoading && filtered.length > 0 && (
                <>
                    <div className="circuits-count">
                        {filtered.length} route{filtered.length === 1 ? '' : 's'}
                        {circuits && filtered.length !== circuits.length ? ` of ${circuits.length}` : ''}
                    </div>
                    <div className="circuits-grid">
                        {filtered.map((c) => (
                            <CircuitCard
                                key={c.slug}
                                circuit={c}
                                month={month}
                                saved={saved.has(c.slug)}
                                comparing={compare.includes(c.slug)}
                                visited={visited}
                            />
                        ))}
                    </div>
                </>
            )}

            {compare.length > 0 && (
                <CompareTray
                    slugs={compare}
                    circuits={circuits || []}
                    onOpen={() => setShowCompare(true)}
                />
            )}
            {showCompare && (
                <CompareSheet
                    circuits={(circuits || []).filter((c) => compare.includes(c.slug))}
                    month={month}
                    onClose={() => setShowCompare(false)}
                />
            )}
        </div>
    );
}

// ── card ─────────────────────────────────────────────────────────────────

function CircuitCard({
    circuit, month, saved, comparing, visited,
}: {
    circuit: api.CircuitSummary;
    month: number;
    saved: boolean;
    comparing: boolean;
    visited?: Set<string>;
}) {
    const season = seasonFor(circuit, month);
    const cost = roughCostTnd(circuit);
    const cover = circuit.covers[0] ? api.getImageUrl(circuit.covers[0]) : null;

    const open = () => goTo(`/itineraries/${circuit.slug}`);
    const onSave = (e: React.MouseEvent) => {
        e.stopPropagation();
        const added = store.toggleSaved(circuit.slug);
        showToast(added ? 'Circuit saved to your carnet' : 'Removed from your carnet');
        track('circuit_save', { slug: circuit.slug, saved: added });
    };
    const onCompare = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!store.toggleCompare(circuit.slug)) {
            showToast(`Compare holds ${store.COMPARE_MAX} routes — drop one first`, { type: 'error' });
        }
    };

    return (
        <article
            className={`ci-card${season.verdict === 'avoid' ? ' is-offseason' : ''}`}
            onClick={open}
            role="link"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter') open(); }}
            aria-label={circuit.title}
        >
            <div className="ci-card-plate">
                {cover
                    ? <img src={cover} alt="" loading="lazy" />
                    : <div className="ci-card-plate-blank" aria-hidden="true" />}
                <span className="ci-card-days"><CalendarDays size={12} /> {circuit.defaultDays} days</span>
                {circuit.carFree && <span className="ci-card-carfree" title="Runs on louage, train and on foot"><Footprints size={12} /> car-free</span>}
                <div className="ci-card-actions" onClick={(e) => e.stopPropagation()}>
                    <button type="button" className={`ci-icon-btn${saved ? ' is-on' : ''}`} onClick={onSave} aria-label={saved ? 'Remove from saved' : 'Save circuit'} title={saved ? 'Saved' : 'Save'}>
                        {saved ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
                    </button>
                    <button type="button" className={`ci-icon-btn${comparing ? ' is-on' : ''}`} onClick={onCompare} aria-label="Add to comparison" title="Compare">
                        <Scale size={15} />
                    </button>
                </div>
            </div>

            <div className="ci-card-body">
                <div className="ci-card-head">
                    <h2>{circuit.title}</h2>
                    <SeasonVerdictChip circuit={circuit} month={month} />
                </div>
                <p className="ci-card-tagline">{circuit.tagline}</p>

                <ol className="ci-card-route" aria-label="Cities on this route">
                    {circuit.cities.slice(0, 5).map((city, i) => (
                        <li key={city + i}>{city}</li>
                    ))}
                    {circuit.cities.length > 5 && <li className="ci-card-route-more">+{circuit.cities.length - 5}</li>}
                </ol>

                <SeasonStrip circuit={circuit} month={month} />

                <div className="ci-card-facts">
                    <span><MapPin size={12} /> {circuit.stopCount} stops</span>
                    <span><Car size={12} /> ~{circuit.distanceKm} km</span>
                    <span className="cn-num">~{cost} TND<small> pp</small></span>
                </div>

                <StampProgress circuit={circuit} visited={visited} />

                <span className="ci-card-cta">Open the route <ArrowRight size={14} /></span>
            </div>
        </article>
    );
}

/**
 * The carnet tie-in: how much of this circuit you have already stamped.
 * Silent until the traveller has actually been somewhere on this route —
 * an empty progress bar on every card would just be noise.
 */
function StampProgress({ circuit, visited }: { circuit: api.CircuitSummary; visited?: Set<string> }) {
    if (!visited?.size) return null;
    const done = circuit.stopIds.filter((id) => visited.has(id)).length;
    if (done === 0) return null;
    const pct = Math.round((done / Math.max(1, circuit.stopCount)) * 100);
    return (
        <div className="ci-card-stamps" title={`${done} of ${circuit.stopCount} stops already stamped`}>
            <Stamp size={12} />
            <span className="ci-card-stamps-bar"><span style={{ width: `${pct}%` }} /></span>
            <span className="cn-num">{done}/{circuit.stopCount} stamped</span>
        </div>
    );
}

// ── compare ──────────────────────────────────────────────────────────────

function CompareTray({
    slugs, circuits, onOpen,
}: { slugs: string[]; circuits: api.CircuitSummary[]; onOpen: () => void }) {
    const picked = circuits.filter((c) => slugs.includes(c.slug));
    if (!picked.length) return null;
    return (
        <div className="ci-tray" role="region" aria-label="Comparison tray">
            <span className="ci-tray-label"><Scale size={14} /> Comparing</span>
            <div className="ci-tray-items">
                {picked.map((c) => (
                    <button key={c.slug} type="button" className="ci-tray-item" onClick={() => store.toggleCompare(c.slug)} title="Remove from comparison">
                        {c.title} <X size={12} />
                    </button>
                ))}
            </div>
            <div className="ci-tray-actions">
                <button type="button" className="cn-btn" onClick={onOpen} disabled={picked.length < 2}>
                    Compare {picked.length}
                </button>
                <button type="button" className="ci-tray-clear" onClick={store.clearCompare}>Clear</button>
            </div>
        </div>
    );
}

function CompareSheet({
    circuits, month, onClose,
}: { circuits: api.CircuitSummary[]; month: number; onClose: () => void }) {
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKey); };
    }, [onClose]);

    const rows: Array<{ label: string; render: (c: api.CircuitSummary) => React.ReactNode }> = [
        { label: 'Days (as written)', render: (c) => `${c.defaultDays}` },
        { label: 'Works between', render: (c) => `${c.dayRange[0]}–${c.dayRange[1]} days` },
        { label: 'Stops', render: (c) => `${c.stopCount}` },
        { label: 'Road distance', render: (c) => `~${c.distanceKm} km` },
        { label: 'Time on site', render: (c) => fmtDuration(c.onSiteMinutes) },
        { label: 'Effort', render: (c) => c.difficulty },
        { label: 'Region', render: (c) => REGION_LABEL[c.region] },
        { label: 'Without a car', render: (c) => (c.carFree ? 'Yes' : 'No') },
        { label: 'Gate fees', render: (c) => (c.entryCostTnd ? `${c.entryCostTnd} TND pp` : 'None') },
        { label: 'From', render: (c) => <strong className="cn-num">~{roughCostTnd(c)} TND pp</strong> },
        { label: `Season in ${new Date().toLocaleString(undefined, { month: 'long' })}`, render: (c) => <SeasonVerdictChip circuit={c} month={month} /> },
    ];

    return (
        <div className="cn-scrim ci-compare-scrim" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="ci-compare" role="dialog" aria-modal="true" aria-label="Compare circuits">
                <header className="ci-compare-head">
                    <h2>Side by side</h2>
                    <button type="button" className="ci-compare-close" onClick={onClose} aria-label="Close comparison"><X size={18} /></button>
                </header>
                <div className="ci-compare-scroll">
                    <table className="ci-compare-table">
                        <thead>
                            <tr>
                                <th scope="col" />
                                {circuits.map((c) => (
                                    <th key={c.slug} scope="col">
                                        <a href={`/itineraries/${c.slug}`} onClick={(e) => { e.preventDefault(); onClose(); goTo(`/itineraries/${c.slug}`); }}>
                                            {c.title}
                                        </a>
                                        <span>{c.tagline}</span>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row) => (
                                <tr key={row.label}>
                                    <th scope="row">{row.label}</th>
                                    {circuits.map((c) => <td key={c.slug}>{row.render(c)}</td>)}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <footer className="ci-compare-foot">
                    <Compass size={14} />
                    <span>Estimates use the circuit as written — open a route to bend it to your dates, pace and budget.</span>
                </footer>
            </div>
        </div>
    );
}
