import React, { useEffect, useState } from 'react';
import {
    Compass, Map, Bookmark, Trophy, Globe2, IdCard,
    Heart, Briefcase, Send, Calendar, Crown, Lightbulb, Award,
    ChevronDown, ChevronUp, Clapperboard, Sparkles, Route, Layers, Shield, Gem, Bus, Waves, Wand2, Gift,
} from 'lucide-react';
import { api, getImageUrl } from '../../shared/api';
import { useAuthStore } from '../stores/auth-store';

interface MiniPassport {
    handle: string | null;
    fullName: string;
    avatar: string | null;
    country: string | null;
    passportLevel: string;
    followersCount: number;
    followingCount: number;
    role: string;
}

type ShortcutItem = {
    id: string;
    icon: React.ReactNode;
    label: string;
    href?: string;
    creatorOnly?: boolean;
    isPassport?: boolean;
};

const PRIMARY: ShortcutItem[] = [
    { id: 'passport',   icon: <IdCard size={18} />,   label: 'My Passport',  isPassport: true },
    { id: 'reels',      icon: <Clapperboard size={18} />, label: 'Reels',    href: '#/reels' },
    { id: 'activity',   icon: <Globe2 size={18} />,   label: 'Following',    href: '#/activity' },
    { id: 'explore',    icon: <Compass size={18} />,  label: 'Explore',      href: '#/explore' },
    { id: 'add-gem',    icon: <Gem size={18} />,      label: 'Add a hidden gem', href: '#/submit-gem' },
    { id: 'ai-planner', icon: <Sparkles size={18} />, label: 'AI Planner',   href: '#/ai-planner' },
    { id: 'map',        icon: <Map size={18} />,      label: 'Map',          href: '#/map' },
    { id: 'itineraries',icon: <Route size={18} />,    label: 'Itineraries',  href: '#/itineraries' },
    { id: 'collections',icon: <Layers size={18} />,   label: 'Collections',  href: '#/collections' },
    { id: 'trips',      icon: <Map size={18} />,      label: 'Trips',        href: '#/discover-trips' },
    { id: 'saved',      icon: <Bookmark size={18} />, label: 'Saved Posts',  href: '#/saved' },
    { id: 'favorites',  icon: <Heart size={18} />,    label: 'Saved Places', href: '#/favorites' },
    { id: 'leaderboard',icon: <Trophy size={18} />,   label: 'Leaderboard',  href: '#/leaderboard' },
    { id: 'badges',     icon: <Award size={18} />,    label: 'Badges',       href: '#/badges' },
];

const SECONDARY: ShortcutItem[] = [
    { id: 'inquiries', icon: <Send size={18} />,      label: 'My Inquiries', href: '#/inquiries' },
    { id: 'events',    icon: <Calendar size={18} />,  label: 'Events',       href: '#/events' },
    { id: 'tips',      icon: <Lightbulb size={18} />, label: 'Travel Tips',  href: '#/tips' },
    { id: 'safety',    icon: <Shield size={18} />,    label: 'Safety & essentials', href: '#/safety' },
    { id: 'louage',    icon: <Bus size={18} />,       label: 'Louage & transport', href: '#/louage' },
    { id: 'jellyfish', icon: <Waves size={18} />,     label: 'Beach report 🪼', href: '#/jellyfish' },
    { id: 'city-quiz', icon: <Wand2 size={18} />,     label: 'Which city are you?', href: '#/city-quiz' },
    { id: 'wrapped',   icon: <Gift size={18} />,      label: 'Summer Wrapped ✨', href: '#/wrapped' },
    { id: 'owner',     icon: <Briefcase size={18} />, label: 'Owner Tools',  href: '#/owner', creatorOnly: true },
    { id: 'premium',   icon: <Crown size={18} />,     label: 'Go Premium',   href: '#/premium' },
];

export function FeedShortcuts() {
    const user = useAuthStore((s) => s.user) as any;
    const [mini, setMini] = useState<MiniPassport | null>(null);
    const [expanded, setExpanded] = useState(false);
    const isAnon = !user;
    const ownPassportHref = user?.handle ? `#/u/${user.handle}` : '#/register';

    useEffect(() => {
        if (!user?.handle) { setMini(null); return; }
        let cancelled = false;
        (async () => {
            try {
                const res: any = await api.getPassport(user.handle);
                if (!cancelled && res && !res.error) setMini(res);
            } catch {}
        })();
        return () => { cancelled = true; };
    }, [user?.handle]);

    const renderItem = (s: ShortcutItem) => {
        if (s.creatorOnly && mini?.role !== 'creator' && user?.role !== 'admin') return null;
        const href = s.isPassport ? ownPassportHref : s.href!;
        return (
            <a key={s.id} href={href} className="feed-shortcut">
                <span className="feed-shortcut-icon">{s.icon}</span>
                <span className="feed-shortcut-label">{s.label}</span>
            </a>
        );
    };

    return (
        <aside className="feed-shortcuts">
            {isAnon ? (
                <a className="feed-mini-card feed-mini-cta" href="#/register">
                    <div className="feed-mini-cta-emoji">🇹🇳</div>
                    <strong>Get your Tunisia Passport</strong>
                    <span>Free. 30 seconds. Track your journey + earn badges.</span>
                    <span className="btn primary sm">Sign up →</span>
                </a>
            ) : (
                <a className="feed-mini-card" href={ownPassportHref}>
                    {mini?.avatar
                        ? <img className="feed-mini-avatar" src={getImageUrl(mini.avatar)} alt="" />
                        : <div className="feed-mini-avatar feed-mini-avatar-fallback">{(user.fullName || '?').slice(0, 1).toUpperCase()}</div>}
                    <div className="feed-mini-meta">
                        <strong>{user.fullName || 'Member'}</strong>
                        {user.handle && <span className="feed-mini-handle">@{user.handle}</span>}
                    </div>
                </a>
            )}

            {!isAnon && mini && (
                <div className="feed-mini-counts">
                    <span><strong>{mini.followersCount}</strong> followers</span>
                    <span><strong>{mini.followingCount}</strong> following</span>
                </div>
            )}

            <nav className="feed-shortcuts-list">
                {PRIMARY.map(renderItem)}
                {expanded && SECONDARY.map(renderItem)}
                <button
                    type="button"
                    className="feed-shortcut feed-shortcut-toggle"
                    onClick={() => setExpanded((v) => !v)}
                >
                    <span className="feed-shortcut-icon">{expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}</span>
                    <span className="feed-shortcut-label">{expanded ? 'See less' : 'See more'}</span>
                </button>
            </nav>

            <hr className="feed-shortcuts-divider" />

            <div className="feed-shortcuts-section-title">Your shortcuts</div>
            <nav className="feed-shortcuts-list">
                <a className="feed-shortcut" href="#/discover-trips">
                    <span className="feed-shortcut-icon" aria-hidden>🧭</span>
                    <span className="feed-shortcut-label">Trip Plans by Travelers</span>
                </a>
                <a className="feed-shortcut" href="#/explore?cat=desert">
                    <span className="feed-shortcut-icon" aria-hidden>🐪</span>
                    <span className="feed-shortcut-label">Sahara &amp; Desert</span>
                </a>
                <a className="feed-shortcut" href="#/explore?cat=beaches">
                    <span className="feed-shortcut-icon" aria-hidden>🏖</span>
                    <span className="feed-shortcut-label">Beaches</span>
                </a>
                <a className="feed-shortcut" href="#/explore?cat=medinas">
                    <span className="feed-shortcut-icon" aria-hidden>🕌</span>
                    <span className="feed-shortcut-label">Medinas</span>
                </a>
                <a className="feed-shortcut" href="#/explore?cat=food">
                    <span className="feed-shortcut-icon" aria-hidden>🍲</span>
                    <span className="feed-shortcut-label">Food &amp; Culture</span>
                </a>
            </nav>

            <footer className="feed-shortcuts-footer">
                <a href="#/about">About</a> · <a href="#/privacy">Privacy</a> · <a href="#/terms">Terms</a> · <a href="#/partner">Partner</a>
                <div>© {new Date().getFullYear()} e-Tunisia</div>
            </footer>
        </aside>
    );
}
