import React, { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    Layers, Search, X, SlidersHorizontal, Heart, Bookmark, BookmarkCheck,
    Plus, MapPin, Lock, BadgeCheck, Pencil, Sparkles, Stamp, ArrowRight,
    Globe, EyeOff, Users,
} from 'lucide-react';
import * as api from '../../../api';
import { goTo } from '../../../router';
import { showToast } from '../../../ui-utils';
import { track } from '../../../analytics';
import * as store from './store';
import {
    THEMES, StampTag, CoverCollage, useVisitedIds, usePlan,
    normalizeCurated, carnetToView, type CollectionView,
} from './bits';

type Tab = 'curated' | 'mine';
type SortKey = 'loved' | 'newest' | 'places' | 'az';

const MOCK_COLLECTIONS = [
    { id: 'm1', title: 'Best Beach Destinations', placeIds: ['3', '7', '8'], coverImage: 'https://images.unsplash.com/photo-1598554200951-b9f36526ecd9?w=600&q=80', description: "Crystal-clear waters and golden sand along Tunisia's Mediterranean coast." },
    { id: 'm2', title: 'UNESCO World Heritage Sites', placeIds: ['2', '4', '6'], coverImage: 'https://images.unsplash.com/photo-1770712857881-2133f72fcab7?w=600&q=80', description: "Explore Tunisia's 8 UNESCO-listed treasures spanning millennia of history." },
    { id: 'm3', title: 'Top Food Experiences', placeIds: ['1', '4'], coverImage: 'https://images.unsplash.com/photo-1742806418170-f051cb880314?w=600&q=80', description: 'From street food to fine dining, the best culinary stops in Tunisia.' },
    { id: 'm4', title: 'Desert & Oasis Adventures', placeIds: ['5'], coverImage: 'https://images.unsplash.com/photo-1689742855019-a09e208930e8?w=600&q=80', description: 'Journey into the Sahara and discover hidden oases.' },
    { id: 'm5', title: 'Architecture & Medinas', placeIds: ['1', '4', '8'], coverImage: 'https://images.unsplash.com/photo-1677942269665-1a08bf81d362?w=600&q=80', description: 'Centuries of Islamic, Ottoman, and colonial architecture.' },
    { id: 'm6', title: 'Hidden Gems', placeIds: ['7'], coverImage: 'https://images.unsplash.com/photo-1653173449794-09b4ec96a17f?w=600&q=80', description: 'Off-the-beaten-path destinations most tourists never find.' },
];

/** Stable week index so the "collection of the week" rotates but stays put per week. */
function weekIndex(): number {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    return Math.floor((now.getTime() - start.getTime()) / (7 * 864e5));
}

interface Props {
    onOpen: (view: CollectionView) => void;
    onNewCarnet: () => void;
    onEditCarnet: (carnetId: string) => void;
}

export default function CollectionsDirectory({ onOpen, onNewCarnet, onEditCarnet }: Props) {
    const { isPro } = usePlan();
    const [tab, setTab] = useState<Tab>('curated');
    const [q, setQ] = useState('');
    const [theme, setTheme] = useState<string | null>(null);
    const [sort, setSort] = useState<SortKey>('loved');
    const [tick, setTick] = useState(0);

    useEffect(() => store.onCollectionsChange(() => setTick((n) => n + 1)), []);
    useEffect(() => { track('collections_view', {}); }, []);

    const { data: rawCurated, isLoading } = useQuery({
        queryKey: ['collections'],
        queryFn: async () => {
            try {
                const cols = await api.getCollections();
                if (cols?.length) return cols;
            } catch { /* fall through to mock */ }
            return MOCK_COLLECTIONS;
        },
        staleTime: 10 * 60_000,
    });

    const { data: visited } = useVisitedIds();

    const curated = useMemo<CollectionView[]>(
        () => (rawCurated || []).map(normalizeCurated),
        [rawCurated],
    );
    const carnets = useMemo<CollectionView[]>(
        () => store.listCarnets().map(carnetToView),
        [tick],
    );
    const loved = useMemo(() => new Set(store.lovedIds()), [tick]);
    const saved = useMemo(() => new Set(store.savedIds()), [tick]);

    // Shared deep links (?c=<id>) open the collection once the data lands.
    const [deepLinkDone, setDeepLinkDone] = useState(false);
    useEffect(() => {
        if (deepLinkDone) return;
        const id = new URLSearchParams(window.location.search).get('c');
        if (!id) return;
        const match = curated.find((c) => c.id === id) || carnets.find((c) => c.id === id);
        if (match) { onOpen(match); setDeepLinkDone(true); }
    }, [curated, carnets, deepLinkDone, onOpen]);

    // The masthead's honest tally.
    const stats = useMemo(() => {
        const placesCurated = carnets.reduce((n, c) => n + c.count, 0);
        return {
            carnets: carnets.length,
            places: placesCurated,
            loved: loved.size,
        };
    }, [carnets, loved]);

    const base = tab === 'curated' ? curated : carnets;

    const filtered = useMemo(() => {
        let list = [...base];
        const needle = q.trim().toLowerCase();
        if (needle) {
            list = list.filter((c) => `${c.title} ${c.description || ''}`.toLowerCase().includes(needle));
        }
        if (theme) list = list.filter((c) => c.theme === theme);
        list.sort((a, b) => {
            if (sort === 'places') return b.count - a.count;
            if (sort === 'az') return a.title.localeCompare(b.title);
            if (sort === 'newest') {
                const at = a.updatedAt || a.raw?.createdAt || '';
                const bt = b.updatedAt || b.raw?.createdAt || '';
                return String(bt).localeCompare(String(at));
            }
            return b.likeCount - a.likeCount || b.count - a.count; // loved
        });
        return list;
    }, [base, q, theme, sort]);

    // Featured = a curated pick that rotates weekly, richest-first as the pool.
    const featured = useMemo<CollectionView | null>(() => {
        if (!curated.length) return null;
        const pool = [...curated].sort((a, b) => b.count - a.count || b.likeCount - a.likeCount);
        return pool[weekIndex() % pool.length] || pool[0];
    }, [curated]);

    const activeFilters = (theme ? 1 : 0) + (q ? 1 : 0);
    const reset = () => { setTheme(null); setQ(''); };

    const onLove = (v: CollectionView) => {
        const added = store.toggleLove(v.id);
        track('collection_love', { id: v.id, loved: added });
    };
    const onSave = (v: CollectionView) => {
        const added = store.toggleSave(v.id);
        showToast(added ? 'Saved to your carnet shelf' : 'Removed from shelf');
        track('collection_save', { id: v.id, saved: added });
    };
    const onNew = () => {
        if (store.atCarnetCap(isPro)) {
            showToast('Free plan holds 3 carnets — go Pro for unlimited', { type: 'error' });
            goTo('/pro');
            return;
        }
        onNewCarnet();
    };

    return (
        <div className="collections-page cn-grain page-enter" data-design="carnet">
            <header className="collections-masthead">
                <span className="cn-kicker"><Layers size={13} /> Carnet de collections</span>
                <h1 className="cn-title">
                    Sets to <em>explore</em>, boards to <em>build</em>
                </h1>
                <p className="collections-lede">
                    A collection is a themed page of places — the editors keep a shelf of them
                    (hidden beaches, UNESCO sites, food trails), and you keep your own carnets:
                    boards you fill with the places you never want to forget.
                </p>

                <dl className="collections-stats" aria-label="Your carnet at a glance">
                    <div><dt>Your carnets</dt><dd className="cn-num">{stats.carnets}</dd></div>
                    <div><dt>Places pinned</dt><dd className="cn-num">{stats.places}</dd></div>
                    <div><dt>Collections loved</dt><dd className="cn-num">{stats.loved}</dd></div>
                </dl>
            </header>

            {featured && tab === 'curated' && !q && !theme && (
                <FeaturedSpotlight
                    view={featured}
                    loved={loved.has(featured.id)}
                    onOpen={() => onOpen(featured)}
                    onLove={() => onLove(featured)}
                />
            )}

            <div className="collections-tabs" role="tablist" aria-label="Collections">
                <button
                    type="button" role="tab" aria-selected={tab === 'curated'}
                    className={`collections-tab${tab === 'curated' ? ' is-on' : ''}`}
                    onClick={() => setTab('curated')}
                >
                    <Sparkles size={14} /> Editor's picks
                    <span className="collections-tab-count">{curated.length}</span>
                </button>
                <button
                    type="button" role="tab" aria-selected={tab === 'mine'}
                    className={`collections-tab${tab === 'mine' ? ' is-on' : ''}`}
                    onClick={() => setTab('mine')}
                >
                    <Bookmark size={14} /> My carnets
                    <span className="collections-tab-count">{carnets.length}</span>
                </button>
                <button type="button" className="cn-btn collections-new" onClick={onNew}>
                    <Plus size={16} /> New carnet
                </button>
            </div>

            <div className="collections-toolbar">
                <label className="collections-search">
                    <Search size={15} />
                    <input
                        type="search" value={q} onChange={(e) => setQ(e.target.value)}
                        placeholder="Search a collection, a theme, a place…"
                        aria-label="Search collections"
                    />
                    {q && <button type="button" onClick={() => setQ('')} aria-label="Clear search"><X size={14} /></button>}
                </label>
                <label className="collections-sort">
                    <SlidersHorizontal size={14} />
                    <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} aria-label="Sort collections">
                        <option value="loved">Most loved</option>
                        <option value="newest">Newest</option>
                        <option value="places">Most places</option>
                        <option value="az">A – Z</option>
                    </select>
                </label>
            </div>

            <div className="collections-filters" role="group" aria-label="Filter by theme">
                {THEMES.map((t) => (
                    <button
                        key={t.key} type="button"
                        className={`cn-chip${theme === t.key ? ' is-on' : ''}`}
                        onClick={() => setTheme(theme === t.key ? null : t.key)}
                        aria-pressed={theme === t.key}
                    >
                        <span aria-hidden="true">{t.emoji}</span> {t.label}
                    </button>
                ))}
                {activeFilters > 0 && (
                    <button type="button" className="cn-chip cn-chip--reset" onClick={reset}>
                        <X size={12} /> Clear
                    </button>
                )}
            </div>

            {tab === 'curated' && isLoading && (
                <div className="collections-grid">
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="cn-col-card cn-col-card--skeleton">
                            <div className="cn-skeleton cn-skeleton--print" />
                            <div className="cn-col-card-body">
                                <div className="cn-skeleton cn-skeleton--title" />
                                <div className="cn-skeleton cn-skeleton--line" />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {tab === 'mine' && carnets.length === 0 && (
                <div className="cn-empty">
                    <Stamp size={30} aria-hidden="true" />
                    <p className="cn-empty-note">Your carnet shelf is empty — press the first stamp.</p>
                    <p className="cn-empty-hint">
                        A carnet is your own themed board. Fill it with beaches, cafés, ruins —
                        whatever you're chasing — then send the whole thing to a trip or a friend.
                    </p>
                    <button type="button" className="cn-btn" onClick={onNew}><Plus size={16} /> Start your first carnet</button>
                </div>
            )}

            {!isLoading && filtered.length === 0 && !(tab === 'mine' && carnets.length === 0) && (
                <div className="cn-empty">
                    <h3>Nothing matches that</h3>
                    <p className="cn-empty-note">Loosen a filter and the collections come back.</p>
                    <button type="button" className="cn-btn cn-btn--quiet" onClick={reset}>Reset filters</button>
                </div>
            )}

            {filtered.length > 0 && (
                <div className="collections-grid">
                    {tab === 'mine' && !store.atCarnetCap(isPro) && (
                        <button type="button" className="cn-col-newtile" onClick={onNew}>
                            <Plus size={22} />
                            <span>New carnet</span>
                            <small>{isPro ? 'Unlimited' : `${carnets.length}/${store.FREE_MAX_CARNETS} used`}</small>
                        </button>
                    )}
                    {filtered.map((v) =>
                        v.kind === 'curated' ? (
                            <CuratedCard
                                key={v.id} view={v}
                                loved={loved.has(v.id)} saved={saved.has(v.id)}
                                onOpen={() => onOpen(v)} onLove={() => onLove(v)} onSave={() => onSave(v)}
                            />
                        ) : (
                            <CarnetCard
                                key={v.id} view={v} visited={visited}
                                onOpen={() => onOpen(v)} onEdit={() => onEditCarnet(v.id)}
                            />
                        ),
                    )}
                </div>
            )}
        </div>
    );
}

// ── featured ─────────────────────────────────────────────────────────────────

function FeaturedSpotlight({
    view, loved, onOpen, onLove,
}: { view: CollectionView; loved: boolean; onOpen: () => void; onLove: () => void }) {
    return (
        <section className="collections-featured" aria-label="Collection of the week">
            <div className="collections-featured-plate">
                <CoverCollage cover={view.cover} theme={view.theme} alt="" />
                <span className="collections-featured-ribbon"><Sparkles size={12} /> Collection of the week</span>
            </div>
            <div className="collections-featured-body">
                <StampTag theme={view.theme} />
                <h2 className="cn-title">{view.title}</h2>
                {view.description && <p>{view.description}</p>}
                <div className="collections-featured-meta">
                    <span><MapPin size={13} /> {view.count} place{view.count === 1 ? '' : 's'}</span>
                    {view.likeCount > 0 && <span><Heart size={13} /> {view.likeCount}</span>}
                </div>
                <div className="collections-featured-actions">
                    <button type="button" className="cn-btn" onClick={onOpen}>Open the collection <ArrowRight size={15} /></button>
                    <button
                        type="button"
                        className={`cn-icon-btn${loved ? ' is-on' : ''}`}
                        onClick={onLove} aria-pressed={loved} aria-label={loved ? 'Loved' : 'Love this collection'}
                    >
                        <Heart size={16} fill={loved ? 'currentColor' : 'none'} />
                    </button>
                </div>
            </div>
        </section>
    );
}

// ── cards ────────────────────────────────────────────────────────────────────

function CuratedCard({
    view, loved, saved, onOpen, onLove, onSave,
}: {
    view: CollectionView; loved: boolean; saved: boolean;
    onOpen: () => void; onLove: () => void; onSave: () => void;
}) {
    const locked = view.isPremium;
    return (
        <article className="cn-col-card" onClick={onOpen} role="link" tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter') onOpen(); }} aria-label={view.title}>
            <div className="cn-col-card-plate">
                <CoverCollage cover={view.cover} theme={view.theme} alt="" />
                <span className="cn-col-card-count"><MapPin size={12} /> {view.count}</span>
                {view.isBusiness && (
                    <span className="cn-col-card-brand" title="Official business collection"><BadgeCheck size={12} /> Brand</span>
                )}
                {locked && <span className="cn-col-card-lock" title="Premium collection"><Lock size={12} /> Pro</span>}
                <div className="cn-col-card-actions" onClick={(e) => e.stopPropagation()}>
                    <button type="button" className={`cn-icon-btn${loved ? ' is-on' : ''}`} onClick={onLove}
                        aria-pressed={loved} aria-label={loved ? 'Loved' : 'Love'} title="Love">
                        <Heart size={15} fill={loved ? 'currentColor' : 'none'} />
                    </button>
                    <button type="button" className={`cn-icon-btn${saved ? ' is-on' : ''}`} onClick={onSave}
                        aria-pressed={saved} aria-label={saved ? 'Saved' : 'Save'} title="Save to shelf">
                        {saved ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
                    </button>
                </div>
            </div>
            <div className="cn-col-card-body">
                <div className="cn-col-card-head">
                    <StampTag theme={view.theme} />
                    {view.likeCount > 0 && <span className="cn-col-card-loves cn-num"><Heart size={11} /> {view.likeCount}</span>}
                </div>
                <h3>{view.title}</h3>
                {view.description && <p className="cn-col-card-desc">{view.description}</p>}
                <span className="cn-col-card-cta">Open <ArrowRight size={13} /></span>
            </div>
        </article>
    );
}

function CarnetCard({
    view, visited, onOpen, onEdit,
}: {
    view: CollectionView; visited?: Set<string>;
    onOpen: () => void; onEdit: () => void;
}) {
    const done = visited ? view.placeIds.filter((id) => visited.has(id)).length : 0;
    const pct = view.count ? Math.round((done / view.count) * 100) : 0;
    return (
        <article className="cn-col-card cn-col-card--mine" onClick={onOpen} role="link" tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter') onOpen(); }} aria-label={view.title}>
            <div className="cn-col-card-plate">
                <CoverCollage cover={view.cover} covers={view.placeCovers} theme={view.theme} alt="" />
                <span className="cn-col-card-count"><MapPin size={12} /> {view.count}</span>
                <span className="cn-col-card-privacy" title={view.isPrivate ? 'Private' : 'Public'}>
                    {view.isPrivate ? <EyeOff size={12} /> : <Globe size={12} />}
                </span>
                {view.collaborators && view.collaborators.length > 0 && (
                    <span className="cn-col-card-collab" title={`${view.collaborators.length} collaborators`}>
                        <Users size={12} /> {view.collaborators.length}
                    </span>
                )}
                <div className="cn-col-card-actions" onClick={(e) => e.stopPropagation()}>
                    <button type="button" className="cn-icon-btn" onClick={onEdit} aria-label="Edit carnet" title="Edit">
                        <Pencil size={15} />
                    </button>
                </div>
            </div>
            <div className="cn-col-card-body">
                <div className="cn-col-card-head">
                    <StampTag theme={view.theme} />
                </div>
                <h3>{view.title}</h3>
                {view.description
                    ? <p className="cn-col-card-desc">{view.description}</p>
                    : <p className="cn-col-card-desc cn-col-card-desc--muted">No note yet — open to add places.</p>}
                {done > 0 && (
                    <div className="cn-col-card-stamps" title={`${done} of ${view.count} stamped`}>
                        <Stamp size={12} />
                        <span className="cn-col-card-stamps-bar"><span style={{ width: `${pct}%` }} /></span>
                        <span className="cn-num">{done}/{view.count}</span>
                    </div>
                )}
                <span className="cn-col-card-cta">Open carnet <ArrowRight size={13} /></span>
            </div>
        </article>
    );
}
