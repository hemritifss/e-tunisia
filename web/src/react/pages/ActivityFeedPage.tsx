import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, getImageUrl } from '../../shared/api';
import { goTo } from '../../router';
import { usePopupStore } from '../stores/popup-store';
import {
    Star,
    Compass,
    Award,
    UserPlus,
    MapPin,
    Globe2,
    Users,
    Landmark,
    Sparkles,
    Waves,
    UtensilsCrossed,
    Camera,
    Moon,
    PiggyBank,
    Crown,
    ScrollText,
    ShoppingBag,
    Gem,
    Mountain,
    BellOff,
    PartyPopper,
    type LucideIcon,
} from 'lucide-react';
import { TOPIC_BY_ID } from '../components/endorsement-topics';

interface Actor {
    id: string;
    handle: string | null;
    fullName: string;
    avatar: string | null;
    plan?: string | null;
}

interface Entry {
    type: 'review' | 'trip' | 'endorse' | 'follow';
    createdAt: string;
    actor: Actor;
    target?: any;
}

const TOPIC_ICONS: Record<string, LucideIcon> = {
    landmark: Landmark,
    sparkles: Sparkles,
    waves: Waves,
    'utensils-crossed': UtensilsCrossed,
    camera: Camera,
    moon: Moon,
    users: Users,
    'piggy-bank': PiggyBank,
    crown: Crown,
    'scroll-text': ScrollText,
    'shopping-bag': ShoppingBag,
    gem: Gem,
    mountain: Mountain,
};

function topicIcon(iconName: string | undefined): LucideIcon {
    if (!iconName) return Award;
    return TOPIC_ICONS[iconName] || Award;
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

function actorHref(actor: Actor): string {
    return actor.handle ? `#/u/${actor.handle}` : '#';
}

function ActorLink({ actor, children }: { actor: Actor; children?: React.ReactNode }) {
    return (
        <a
            className="activity-actor-link"
            href={actorHref(actor)}
            data-user-id={actor.id || undefined}
            data-user-name={actor.fullName || undefined}
            data-user-avatar={actor.avatar ? getImageUrl(actor.avatar) : undefined}
            data-user-handle={actor.handle || undefined}
            data-user-plan={actor.plan || undefined}
        >
            {children ?? actor.fullName}
        </a>
    );
}

function ActorAvatar({ actor }: { actor: Actor }) {
    return (
        <span
            className="activity-avatar-wrap"
            data-user-id={actor.id || undefined}
            data-user-name={actor.fullName || undefined}
            data-user-avatar={actor.avatar ? getImageUrl(actor.avatar) : undefined}
            data-user-handle={actor.handle || undefined}
            data-user-plan={actor.plan || undefined}
        >
            {actor.avatar ? (
                <img className="activity-avatar" src={getImageUrl(actor.avatar)} alt="" loading="lazy" />
            ) : (
                <span className="activity-avatar activity-avatar-fallback">
                    {(actor.fullName || '?').slice(0, 1).toUpperCase()}
                </span>
            )}
        </span>
    );
}

function StarRow({ rating }: { rating: number }) {
    const r = Math.max(0, Math.min(5, Math.round(rating)));
    return (
        <span className="activity-rating" aria-label={`${r} out of 5 stars`}>
            {Array.from({ length: 5 }).map((_, i) => (
                <Star
                    key={i}
                    size={11}
                    strokeWidth={2}
                    className={i < r ? 'is-filled' : ''}
                />
            ))}
        </span>
    );
}

function EntryRow({ entry }: { entry: Entry }) {
    const t = entry.target || {};
    let iconEl: React.ReactNode = null;
    let body: React.ReactNode = null;

    switch (entry.type) {
        case 'review':
            iconEl = <Star size={14} />;
            body = (
                <>
                    <ActorLink actor={entry.actor} /> reviewed{' '}
                    {t.placeId ? <a href={`#/place/${t.placeId}`}>{t.placeName || 'a place'}</a> : t.placeName || 'a place'}
                    {typeof t.rating === 'number' && <StarRow rating={t.rating} />}
                    {t.placeCity && <span className="activity-meta"><MapPin size={12} /> {t.placeCity}</span>}
                    {t.snippet && <p className="activity-snippet">"{t.snippet}"</p>}
                </>
            );
            break;
        case 'trip':
            iconEl = <Compass size={14} />;
            body = (
                <>
                    <ActorLink actor={entry.actor} /> planned{' '}
                    {t.slug ? <a href={`#/trip/${t.slug}`}>{t.title || 'a trip'}</a> : t.title || 'a trip'}
                    <span className="activity-meta">
                        {t.days ? `${t.days}d` : ''}
                        {typeof t.stopCount === 'number' ? ` · ${t.stopCount} stop${t.stopCount === 1 ? '' : 's'}` : ''}
                    </span>
                </>
            );
            break;
        case 'endorse': {
            const topic = TOPIC_BY_ID[t.topic];
            const TopicIcon = topicIcon(topic?.icon);
            iconEl = <Award size={14} />;
            body = (
                <>
                    <ActorLink actor={entry.actor} /> endorsed{' '}
                    {t.user ? <ActorLink actor={t.user} /> : 'someone'}
                    {topic && (
                        <span className="activity-topic-chip">
                            <TopicIcon size={12} /> {topic.label}
                        </span>
                    )}
                </>
            );
            break;
        }
        case 'follow':
            iconEl = <UserPlus size={14} />;
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
            <span className="activity-entry-icon" aria-hidden="true">{iconEl}</span>
            <ActorAvatar actor={entry.actor} />
            <div className="activity-entry-body">
                <div className="activity-entry-text">{body}</div>
                <time className="activity-time" dateTime={entry.createdAt}>{timeAgo(entry.createdAt)}</time>
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
            goTo('/login');
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

    // Moments that overflowed the popup interrupt budget land here as unread.
    const missed = usePopupStore((s) => s.missed);
    const markMissedRead = usePopupStore((s) => s.markMissedRead);
    const unreadMissed = missed.filter((m) => !m.read);
    useEffect(() => {
        if (!unreadMissed.length) return;
        const t = setTimeout(() => markMissedRead(), 1600);
        return () => clearTimeout(t);
    }, [unreadMissed.length, markMissedRead]);

    const entries: Entry[] = Array.isArray(data) ? data : (data as any)?.data ?? [];

    return (
        <main className="activity-page">
            <header className="activity-page-head">
                <span className="activity-eyebrow">
                    <Sparkles size={12} /> {effectiveMode === 'following' ? 'Your circle' : 'Community pulse'}
                </span>
                <h1>{effectiveMode === 'following' ? 'Following' : 'Discover'}</h1>
                <p>
                    {effectiveMode === 'following'
                        ? 'What people you follow are doing across Tunisia.'
                        : 'Fresh activity from travelers exploring Tunisia right now.'}
                </p>
                <div className="activity-tabs" role="tablist" aria-label="Activity feed mode">
                    <button
                        type="button"
                        role="tab"
                        aria-selected={effectiveMode === 'following'}
                        className={`activity-tab${effectiveMode === 'following' ? ' is-active' : ''}`}
                        onClick={() => setModePersist('following')}
                    >
                        <Users size={14} />
                        <span>{anon ? 'Following — sign in' : 'Following'}</span>
                    </button>
                    <button
                        type="button"
                        role="tab"
                        aria-selected={effectiveMode === 'global'}
                        className={`activity-tab${effectiveMode === 'global' ? ' is-active' : ''}`}
                        onClick={() => setModePersist('global')}
                    >
                        <Globe2 size={14} />
                        <span>Discover</span>
                    </button>
                </div>
            </header>

            {unreadMissed.length > 0 && (
                <section className="activity-missed" aria-label="Moments you missed">
                    <div className="activity-missed-head">
                        <PartyPopper size={14} /> While you were away
                    </div>
                    <ul className="activity-missed-list">
                        {unreadMissed.slice(0, 6).map((m) => (
                            <li key={m.id} className="activity-missed-item">
                                <span className="activity-missed-dot" aria-hidden="true" />
                                <span className="activity-missed-text">{m.summary}</span>
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            {isLoading && (
                <div className="activity-skel" role="status" aria-label="Loading activity">
                    {Array.from({ length: 6 }).map((_, i) => <div key={i} className="activity-skel-row" />)}
                </div>
            )}

            {!isLoading && error && (
                <div className="activity-empty">
                    <div className="activity-empty-icon"><BellOff size={28} /></div>
                    <h3>Couldn't load the feed</h3>
                    <p>Check your connection and try again — your tab choice is preserved.</p>
                </div>
            )}

            {!isLoading && !error && entries.length === 0 && (
                <div className="activity-empty">
                    <div className="activity-empty-icon"><Globe2 size={28} /></div>
                    <h3>{effectiveMode === 'following' ? 'Your feed is quiet' : 'No recent activity yet'}</h3>
                    <p>
                        {effectiveMode === 'following'
                            ? 'Follow a few travelers and their reviews, trips, and endorsements will land here.'
                            : "Be the first to add to the story — review a place, plan a trip, endorse a local."}
                    </p>
                    {effectiveMode === 'following' ? (
                        <button type="button" className="btn primary" onClick={() => setModePersist('global')}>
                            See what's happening now <Compass size={14} />
                        </button>
                    ) : (
                        <a className="btn primary" href="#/explore">
                            Explore Tunisia <Compass size={14} />
                        </a>
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
