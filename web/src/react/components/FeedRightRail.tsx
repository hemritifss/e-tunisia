import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, getImageUrl } from '../../shared/api';
import { Flame, MapPin, Star, Compass, Award } from 'lucide-react';

interface Person {
    id: string;
    handle: string | null;
    fullName: string;
    avatar: string | null;
    country: string | null;
    points?: number;
    role?: string;
    followersCount?: number;
}

function PersonRow({ user, sub }: { user: Person; sub?: React.ReactNode }) {
    const href = user.handle ? `#/u/${user.handle}` : '#';
    return (
        <a className="rail-row" href={href}>
            {user.avatar
                ? <img src={getImageUrl(user.avatar)} alt="" loading="lazy" />
                : <span className="rail-row-fallback">{(user.fullName || '?').slice(0, 1).toUpperCase()}</span>}
            <div className="rail-row-meta">
                <strong>{user.fullName}{user.role === 'creator' && <span className="rail-guide" title="Local Guide">✓</span>}</strong>
                <span>{sub ?? (user.handle ? `@${user.handle}` : '')}</span>
            </div>
        </a>
    );
}

function TopExplorersWidget() {
    const { data, isLoading } = useQuery({
        queryKey: ['top-explorers-rail'],
        queryFn: () => api.searchUsers(' ', 5).catch(() => []),
        staleTime: 5 * 60_000,
    });
    // searchUsers with empty/space query returns []; fall back to leaderboard fetch
    const { data: leaderboard } = useQuery({
        queryKey: ['leaderboard-rail'],
        queryFn: async () => {
            try {
                const r = await fetch('/api/v1/gamification/leaderboard?limit=5').then((r) => r.json());
                return Array.isArray(r) ? r : (r?.data ?? []);
            } catch { return []; }
        },
        enabled: Array.isArray(data) && data.length === 0,
        staleTime: 5 * 60_000,
    });

    const list: Person[] = Array.isArray(data) && data.length > 0
        ? data
        : (leaderboard || []).map((u: any) => ({
            id: u.id,
            handle: u.handle ?? null,
            fullName: u.fullName || u.name || 'Explorer',
            avatar: u.avatar || null,
            country: u.country || null,
            points: u.points || 0,
            role: u.role,
        }));

    if (isLoading && list.length === 0) return <div className="rail-skel" />;
    if (!list.length) return null;

    return (
        <section className="rail-card">
            <header className="rail-card-head">
                <h3><Flame size={14} /> Top Explorers</h3>
                <a href="#/leaderboard">See all</a>
            </header>
            <div className="rail-list">
                {list.slice(0, 5).map((u) => (
                    <PersonRow key={u.id} user={u} sub={u.points ? `${u.points.toLocaleString()} XP` : (u.handle ? `@${u.handle}` : '')} />
                ))}
            </div>
        </section>
    );
}

function GlobalActivityTicker() {
    const { data, isLoading } = useQuery({
        queryKey: ['global-activity-ticker'],
        queryFn: () => api.getGlobalActivity(8),
        staleTime: 60_000,
    });
    const entries: any[] = Array.isArray(data) ? data : (data as any)?.data ?? [];
    if (isLoading || !entries.length) return null;

    const verbFor = (t: string) =>
        t === 'review' ? 'reviewed' : t === 'trip' ? 'planned a trip' : t === 'endorse' ? 'endorsed' : 'joined';
    const iconFor = (t: string) =>
        t === 'review' ? <Star size={12} /> : t === 'trip' ? <Compass size={12} /> : t === 'endorse' ? <Award size={12} /> : <MapPin size={12} />;

    return (
        <section className="rail-card">
            <header className="rail-card-head">
                <h3><Flame size={14} /> Happening now</h3>
                <a href="#/activity">See all</a>
            </header>
            <div className="rail-ticker">
                {entries.slice(0, 6).map((e, i) => {
                    const actorHref = e.actor?.handle ? `#/u/${e.actor.handle}` : '#';
                    const targetName =
                        e.type === 'review' ? (e.target?.placeName || 'a place') :
                        e.type === 'trip' ? (e.target?.title || 'a trip') :
                        e.type === 'endorse' ? (e.target?.user?.fullName || 'someone') :
                        '';
                    return (
                        <a key={i} className="rail-ticker-row" href={actorHref}>
                            <span className="rail-ticker-icon">{iconFor(e.type)}</span>
                            <span className="rail-ticker-text">
                                <strong>{e.actor?.fullName || 'Someone'}</strong>{' '}
                                {verbFor(e.type)} <em>{targetName}</em>
                            </span>
                        </a>
                    );
                })}
            </div>
        </section>
    );
}

function PassportCTAWidget() {
    return (
        <section className="rail-card rail-cta-card">
            <div className="rail-cta-emoji">🇹🇳</div>
            <h3>Have you claimed your Passport?</h3>
            <p>Free, public profile + badges + trip planner.</p>
            <a className="btn primary sm block" href="#/register">Create yours →</a>
        </section>
    );
}

export function FeedRightRail() {
    const isAnon = typeof window !== 'undefined' && !localStorage.getItem('etunisia_token');
    return (
        <aside className="feed-rail">
            {isAnon && <PassportCTAWidget />}
            <TopExplorersWidget />
            <GlobalActivityTicker />
        </aside>
    );
}
