import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, getImageUrl } from '../../shared/api';
import { Star, Compass, Award, UserPlus, MapPin, Globe2, Users } from 'lucide-react';
import { TOPIC_BY_ID } from '../components/endorsement-topics';

interface Actor { id: string; handle: string | null; fullName: string; avatar: string | null; }

interface Entry {
    type: 'review' | 'trip' | 'endorse' | 'follow';
    createdAt: string;
    actor: Actor;
    target?: any;
}

function timeAgo(iso: string): string {
    const t = new Date(iso).getTime();
    const s = Math.max(1, Math.floor((Date.now() - t) / 1000));
    if (s < 60) return `${s}s ago`;
    const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24); if (d < 7) return `${d}d ago`;
    return new Date(iso).toLocaleDateString();
}

function ActorLink({ actor, children }: { actor: Actor; children?: React.ReactNode }) {
    const href = actor.handle ? `#/u/${actor.handle}` : '#';
    return <a className="activity-actor-link" href={href}>{children ?? actor.fullName}</a>;
}

function Avatar({ actor }: { actor: Actor }) {
    return actor.avatar ? (
        <img className="activity-avatar" src={getImageUrl(actor.avatar)} alt="" loading="lazy" />
    ) : (
        <span className="activity-avatar activity-avatar-fallback">{(actor.fullName || '?').slice(0, 1).toUpperCase()}</span>
    );
}

function EntryRow({ entry }: { entry: Entry }) {
    const t = entry.target || {};
    let icon: React.ReactNode;
    let body: React.ReactNode;

    switch (entry.type) {
        case 'review':
            icon = <Star size={14} />;
            body = (
                <>
                    <ActorLink actor={entry.actor} /> reviewed{' '}
                    {t.placeId ? <a href={`#/place/${t.placeId}`}>{t.placeName || 'a place'}</a> : t.placeName || 'a place'}
                    {typeof t.rating === 'number' && (
                        <span className="activity-rating">{'★'.repeat(t.rating)}</span>
                    )}
                    {t.placeCity && <span className="activity-meta"><MapPin size={12} /> {t.placeCity}</span>}
                    {t.snippet && <p className="activity-snippet">"{t.snippet}"</p>}
                </>
            );
            break;
        case 'trip':
            icon = <Compass size={14} />;
            body = (
                <>
                    <ActorLink actor={entry.actor} /> planned{' '}
                    {t.slug ? <a href={`#/trip/${t.slug}`}>{t.title || 'a trip'}</a> : t.title || 'a trip'}
                    <span className="activity-meta">
                        {t.days ? `${t.days}d` : ''}
                        {typeof t.stopCount === 'number' ? ` · ${t.stopCount} stops` : ''}
                    </span>
                </>
            );
            break;
        case 'endorse': {
            const topic = TOPIC_BY_ID[t.topic];
            icon = <Award size={14} />;
            body = (
                <>
                    <ActorLink actor={entry.actor} /> endorsed{' '}
                    {t.user ? <ActorLink actor={t.user} /> : 'someone'}
                    {topic && (
                        <span className="activity-topic-chip">
                            {topic.emoji} {topic.label}
                        </span>
                    )}
                </>
            );
            break;
        }
        case 'follow':
            icon = <UserPlus size={14} />;
            body = (
                <>
                    <ActorLink actor={entry.actor} /> started following{' '}
                    {t.user ? <ActorLink actor={t.user} /> : 'someone'}
                </>
            );
            break;
    }

    return (
        <li className={`activity-entry activity-entry-${entry.type}`}>
            <div className="activity-entry-icon">{icon}</div>
            <Avatar actor={entry.actor} />
            <div className="activity-entry-body">
                <div>{body}</div>
                <time className="activity-time">{timeAgo(entry.createdAt)}</time>
            </div>
        </li>
    );
}

type FeedMode = 'following' | 'global';

function isAnon(): boolean {
    try { return !localStorage.getItem('etunisia_token'); } catch { return true; }
}

function readMode(): FeedMode {
    if (isAnon()) return 'global';
    return localStorage.getItem('activity-feed-mode') === 'global' ? 'global' : 'following';
}

export default function ActivityFeedPage() {
    const anon = isAnon();
    const [mode, setMode] = useState<FeedMode>(readMode());
    const setModePersist = (m: FeedMode) => {
        if (m === 'following' && anon) {
            // Anonymous viewer trying to peek at the following tab — bump to signup.
            window.location.hash = '#/login';
            return;
        }
        localStorage.setItem('activity-feed-mode', m);
        setMode(m);
    };

    const effectiveMode: FeedMode = anon ? 'global' : mode;

    const { data, isLoading, error } = useQuery({
        queryKey: ['activity-feed', effectiveMode],
        queryFn: () => (effectiveMode === 'following' ? api.getFollowingActivity(30) : api.getGlobalActivity(30)),
        staleTime: 60_000,
    });

    const entries: Entry[] = Array.isArray(data) ? data : (data as any)?.data ?? [];

    return (
        <main className="activity-page">
            <header className="activity-page-head">
                <h1>{effectiveMode === 'following' ? 'Following' : 'Discover'}</h1>
                <p>
                    {effectiveMode === 'following'
                        ? 'What people you follow are doing across Tunisia.'
                        : 'Fresh activity from travelers exploring Tunisia right now.'}
                </p>
                <div className="activity-tabs" role="tablist">
                    <button
                        role="tab"
                        aria-selected={effectiveMode === 'following'}
                        className={effectiveMode === 'following' ? 'active' : ''}
                        onClick={() => setModePersist('following')}
                    >
                        <Users size={14} /> {anon ? 'Following (sign in)' : 'Following'}
                    </button>
                    <button
                        role="tab"
                        aria-selected={effectiveMode === 'global'}
                        className={effectiveMode === 'global' ? 'active' : ''}
                        onClick={() => setModePersist('global')}
                    >
                        <Globe2 size={14} /> Discover
                    </button>
                </div>
            </header>

            {isLoading && (
                <div className="activity-skel">
                    {Array.from({ length: 6 }).map((_, i) => <div key={i} className="activity-skel-row" />)}
                </div>
            )}

            {!isLoading && error && (
                <div className="passport-empty">Couldn't load the feed.</div>
            )}

            {!isLoading && !error && entries.length === 0 && (
                <div className="activity-empty">
                    <div className="activity-empty-emoji">🌍</div>
                    <h3>{effectiveMode === 'following' ? 'Your feed is quiet.' : 'No recent activity yet.'}</h3>
                    <p>
                        {effectiveMode === 'following'
                            ? 'Follow a few travelers and their reviews, trips, and endorsements will land here.'
                            : "Be the first to add to the story — review a place, plan a trip, endorse a local."}
                    </p>
                    {effectiveMode === 'following' ? (
                        <button className="btn primary" onClick={() => setModePersist('global')}>See what's happening now →</button>
                    ) : (
                        <a className="btn primary" href="#/explore">Explore Tunisia →</a>
                    )}
                </div>
            )}

            {!isLoading && entries.length > 0 && (
                <ul className="activity-list">
                    {entries.map((e, i) => <EntryRow key={i} entry={e} />)}
                </ul>
            )}
        </main>
    );
}
