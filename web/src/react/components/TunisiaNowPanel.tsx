import React, { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, getImageUrl } from '../../shared/api';
import { TOPIC_BY_ID } from './endorsement-topics';
import { Activity, Flame, Users, Sparkles } from 'lucide-react';

/**
 * The single right-rail widget for the home feed. Instead of a stack of
 * three separate cards (FB style), this is ONE card with internal tabs —
 * less visual noise, more focus, and easy to add new tabs as we grow.
 */

type Tab = 'live' | 'trending' | 'people';

const TABS: Array<{ id: Tab; label: string; icon: React.ReactNode }> = [
    { id: 'live',     label: 'Live',     icon: <Activity size={14} /> },
    { id: 'trending', label: 'Trending', icon: <Flame size={14} /> },
    { id: 'people',   label: 'People',   icon: <Users size={14} /> },
];

function ago(iso: string): string {
    const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60); if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60); if (h < 24) return `${h}h`;
    return `${Math.floor(h / 24)}d`;
}

function summarize(e: any): { who: string; verb: string; what: string } {
    const who = e?.actor?.fullName?.split(' ')[0] || 'Someone';
    if (e.type === 'review') {
        return { who, verb: 'reviewed', what: e.target?.placeName || 'a place' };
    }
    if (e.type === 'trip') {
        return { who, verb: 'planned', what: e.target?.title || 'a trip' };
    }
    if (e.type === 'endorse') {
        const topic = e.target?.topic ? TOPIC_BY_ID[e.target.topic]?.label?.toLowerCase() : null;
        return { who, verb: 'endorsed', what: `${e.target?.user?.fullName?.split(' ')[0] || 'someone'}${topic ? ` · ${topic}` : ''}` };
    }
    if (e.type === 'follow') {
        return { who, verb: 'followed', what: e.target?.user?.fullName?.split(' ')[0] || 'someone' };
    }
    return { who, verb: 'is exploring', what: 'Tunisia' };
}

function LiveTab() {
    const { data, isLoading } = useQuery({
        queryKey: ['now-panel-live'],
        queryFn: () => api.getGlobalActivity(8),
        staleTime: 30_000,
        refetchInterval: 60_000,
    });
    const items: any[] = useMemo(() => Array.isArray(data) ? data : (data as any)?.data ?? [], [data]);

    if (isLoading && !items.length) return <SkeletonRows />;
    if (!items.length) return <Empty text="Nothing fresh yet. Try a mood above." />;

    return (
        <ul className="now-list">
            {items.slice(0, 6).map((e, i) => {
                const s = summarize(e);
                const href = e.actor?.handle ? `#/u/${e.actor.handle}` : '#/activity';
                return (
                    <li key={i} className="now-row">
                        <a href={href}>
                            {e.actor?.avatar
                                ? <img src={getImageUrl(e.actor.avatar)} alt="" loading="lazy" />
                                : <span className="now-row-fallback">{(s.who || '?').slice(0, 1).toUpperCase()}</span>}
                            <div className="now-row-text">
                                <strong>{s.who}</strong>
                                <span><em>{s.verb}</em> {s.what}</span>
                            </div>
                            <span className="now-row-time">{ago(e.createdAt)}</span>
                        </a>
                    </li>
                );
            })}
        </ul>
    );
}

function TrendingTab() {
    const { data, isLoading } = useQuery({
        queryKey: ['now-panel-trending-places'],
        queryFn: async () => {
            try {
                const r: any = await fetch('/api/v1/places/popular?limit=5').then((r) => r.json());
                return Array.isArray(r) ? r : (r?.data ?? []);
            } catch { return []; }
        },
        staleTime: 5 * 60_000,
    });
    const places: any[] = data || [];

    if (isLoading && !places.length) return <SkeletonRows />;
    if (!places.length) return <Empty text="No trending places yet." />;

    return (
        <ul className="now-list">
            {places.slice(0, 5).map((p, i) => (
                <li key={p.id || i} className="now-row">
                    <a href={`#/place/${p.id}`}>
                        {p.coverImage || (p.images && p.images[0])
                            ? <img src={getImageUrl(p.coverImage || p.images[0])} alt="" loading="lazy" />
                            : <span className="now-row-fallback">📍</span>}
                        <div className="now-row-text">
                            <strong>{p.name}</strong>
                            <span>{p.city || ''}{p.rating ? ` · ★ ${Number(p.rating).toFixed(1)}` : ''}</span>
                        </div>
                        <span className="now-row-rank">#{i + 1}</span>
                    </a>
                </li>
            ))}
        </ul>
    );
}

function PeopleTab() {
    const { data, isLoading } = useQuery({
        queryKey: ['now-panel-suggested-users'],
        queryFn: async () => {
            try {
                const r: any = await fetch('/api/v1/users/suggest/list?limit=5').then((r) => r.json());
                return Array.isArray(r) ? r : (r?.data ?? []);
            } catch { return []; }
        },
        staleTime: 5 * 60_000,
    });
    const users: any[] = data || [];

    if (isLoading && !users.length) return <SkeletonRows />;
    if (!users.length) return <Empty text="No suggestions yet. Visit places to seed your network." />;

    return (
        <ul className="now-list">
            {users.slice(0, 5).map((u, i) => {
                const href = u.handle ? `#/u/${u.handle}` : '#';
                return (
                    <li key={u.id || i} className="now-row">
                        <a href={href}>
                            {u.avatar
                                ? <img src={getImageUrl(u.avatar)} alt="" loading="lazy" />
                                : <span className="now-row-fallback">{(u.fullName || '?').slice(0, 1).toUpperCase()}</span>}
                            <div className="now-row-text">
                                <strong>{u.fullName}{u.role === 'creator' && <span className="now-guide" title="Local Guide">✓</span>}</strong>
                                <span>{u.handle ? `@${u.handle}` : (u.country || '')}</span>
                            </div>
                            <span className="now-row-points">{(u.points || 0).toLocaleString()} XP</span>
                        </a>
                    </li>
                );
            })}
        </ul>
    );
}

function SkeletonRows() {
    return (
        <div className="now-skel">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="now-skel-row" />)}
        </div>
    );
}

function Empty({ text }: { text: string }) {
    return <div className="now-empty">{text}</div>;
}

export function TunisiaNowPanel() {
    const [tab, setTab] = useState<Tab>('live');

    // Auto-cycle tabs every 12s for the first minute, then stop — gives the
    // page a "live" feel on first paint without being annoying long-term.
    useEffect(() => {
        let cycles = 0;
        const t = setInterval(() => {
            cycles += 1;
            setTab((current) => {
                const idx = TABS.findIndex((x) => x.id === current);
                return TABS[(idx + 1) % TABS.length].id;
            });
            if (cycles >= 4) clearInterval(t);
        }, 12_000);
        return () => clearInterval(t);
    }, []);

    return (
        <aside className="now-panel">
            <header className="now-panel-head">
                <div className="now-panel-title">
                    <Sparkles size={14} />
                    <span>Tunisia Now</span>
                </div>
                <nav className="now-panel-tabs" role="tablist">
                    {TABS.map((t) => (
                        <button
                            key={t.id}
                            role="tab"
                            aria-selected={tab === t.id}
                            className={tab === t.id ? 'active' : ''}
                            onClick={() => setTab(t.id)}
                        >
                            {t.icon}
                            <span>{t.label}</span>
                        </button>
                    ))}
                </nav>
            </header>
            <div className="now-panel-body">
                {tab === 'live' && <LiveTab />}
                {tab === 'trending' && <TrendingTab />}
                {tab === 'people' && <PeopleTab />}
            </div>
            <footer className="now-panel-foot">
                {tab === 'live' && <a href="#/activity">All activity →</a>}
                {tab === 'trending' && <a href="#/explore?sort=popular">Browse all places →</a>}
                {tab === 'people' && <a href="#/leaderboard">Top travelers →</a>}
            </footer>
        </aside>
    );
}
