import React, { useEffect, useState } from 'react';
import { api, getImageUrl } from '../../shared/api';
import { useAuthStore } from '../stores/auth-store';
import { Compass, MapPin, Sparkles, ArrowRight, Stamp, Route, PenLine } from 'lucide-react';
import { useT } from '../../i18n/useT';
import { plural } from '../../shared/plural';

interface MiniProfile {
    handle: string | null;
    fullName: string;
    avatar: string | null;
    passportLevel?: string;
    stats?: { citiesVisited: number; tripsPlanned: number; reviewsCount: number; savesCount: number };
    badges?: string[];
}

function greeting(): string {
    const h = new Date().getHours();
    if (h < 5) return 'Late-night planning?';
    if (h < 12) return 'Sbah el khir';
    if (h < 18) return 'Ahla w sahla';
    return 'Good evening';
}

/**
 * The AI line renders directly under "<greeting>, <name>" — if the model
 * prepends its own salutation ("Good evening, traveler — Tunisia is calling")
 * the strip greets twice in a row. Drop the salutation, keep the substance.
 */
function stripSalutation(text: string): string {
    const stripped = text.replace(
        /^(good\s+(morning|afternoon|evening|night)|sbah el khir|ahla w sahla|hello|hey|hi|salut|bonjour|marhba|aslema)[\s,!.]*(traveler|voyageur|there|friend)?[\s,—–\-:!.]*/i,
        '',
    );
    if (stripped.trim().length < 8) return text; // nothing meaningful left — keep as-is
    return stripped.charAt(0).toUpperCase() + stripped.slice(1);
}

/**
 * Top-of-feed welcome strip.
 *
 * Registered: a warm personal status strip. NO passport jargon, no "claim"
 *   CTAs — the user's already in. Just: greeting, name, level chip, three
 *   stat tiles, two quick actions.
 *
 * Anonymous: an editorial hero — full-width image, headline, sub, and a
 *   single primary CTA. Tunisia visual identity, not generic.
 */
export function WelcomeStrip() {
    const t = useT();
    const user = useAuthStore((s) => s.user) as any;
    const [profile, setProfile] = useState<MiniProfile | null>(null);
    const [aiGreeting, setAiGreeting] = useState<string>('');
    const isAnon = !user;

    // Personalized AI greeting (cached server-side per day — cheap to fetch).
    useEffect(() => {
        if (!user) { setAiGreeting(''); return; }
        let cancelled = false;
        (async () => {
            try {
                const r: any = await api.aiGreeting();
                if (!cancelled && r?.text) setAiGreeting(stripSalutation(r.text));
            } catch { /* keep the static sub */ }
        })();
        return () => { cancelled = true; };
    }, [user?.id]);

    useEffect(() => {
        if (!user?.handle) { setProfile(null); return; }
        let cancelled = false;
        (async () => {
            try {
                const r: any = await api.getPassport(user.handle);
                if (!cancelled && r && !r.error) setProfile(r);
            } catch {}
        })();
        return () => { cancelled = true; };
    }, [user?.handle]);

    if (isAnon) {
        return (
            <section className="hero-anon">
                <div className="hero-anon-overlay" />
                <div className="hero-anon-inner">
                    <span className="hero-anon-kicker">🇹🇳 e-Tunisia</span>
                    <h1>Tunisia, told by the people who live it.</h1>
                    <p>Discover hidden medinas, plan a trip in five minutes, and follow real travelers across the country.</p>
                    <div className="hero-anon-cta">
                        <a className="btn primary lg" href="#/register">Start your journey →</a>
                        <a className="btn ghost lg" href="#/activity">Peek inside</a>
                    </div>
                    <div className="hero-anon-meta">
                        <span><MapPin size={14} /> 14 cities</span>
                        <span>·</span>
                        <span>Free to join</span>
                        <span>·</span>
                        <span>No ads in the feed</span>
                    </div>
                </div>
            </section>
        );
    }

    const firstName = (user.fullName || '').split(' ')[0] || 'traveler';
    const stats = profile?.stats;
    const level = profile?.passportLevel;
    const ownHref = user.handle ? `#/u/${user.handle}` : '#';

    return (
        <section className="welcome-strip">
            <div className="welcome-strip-row">
                <a className="welcome-strip-avatar" href={ownHref} title="Your profile">
                    {profile?.avatar
                        ? <img src={getImageUrl(profile.avatar)} alt="" />
                        : <span className="welcome-strip-avatar-fallback">{firstName.slice(0, 1).toUpperCase()}</span>}
                </a>
                <div className="welcome-strip-text">
                    <div className="welcome-strip-greeting">
                        {greeting()}, <strong>{firstName}</strong>
                        {level && <span className={`welcome-level welcome-level-${level.toLowerCase()}`}>{level}</span>}
                    </div>
                    <p className="welcome-strip-sub">
                        {aiGreeting || 'Tunisia is waiting. Where are you headed next?'}
                    </p>
                </div>
                <div className="welcome-strip-actions">
                    <a className="welcome-action-pill primary" href="#/explore">
                        <Compass size={14} /> Explore
                    </a>
                    <a className="welcome-action-pill" href="#/discover-trips">
                        <Sparkles size={14} /> Trip ideas
                    </a>
                </div>
            </div>

            {stats && (
                (stats.citiesVisited || stats.tripsPlanned || stats.reviewsCount || profile?.badges?.length)
                    ? (
                        <div className="welcome-strip-stats">
                            <a href={ownHref} className="welcome-stat"><strong>{stats.citiesVisited}</strong><span>{plural(stats.citiesVisited, 'City', 'Cities')}</span></a>
                            <a href={ownHref} className="welcome-stat"><strong>{stats.tripsPlanned}</strong><span>{plural(stats.tripsPlanned, 'Trip')}</span></a>
                            <a href={ownHref} className="welcome-stat"><strong>{stats.reviewsCount}</strong><span>{plural(stats.reviewsCount, 'Review')}</span></a>
                            <a href={ownHref} className="welcome-stat welcome-stat-badges"><strong>{profile?.badges?.length || 0}</strong><span>{plural(profile?.badges?.length || 0, 'Badge')}</span></a>
                            <a href={ownHref} className="welcome-stat-link">
                                Your travel profile <ArrowRight size={14} />
                            </a>
                        </div>
                    ) : (
                        /* A row of zeros is a morgue — brand-new explorers get their
                           first missions instead. Each completes in one tap-flow and
                           starts the passport loop. */
                        <div className="welcome-strip-missions">
                            <span className="welcome-missions-label">{t('missions.label')}</span>
                            <a className="welcome-mission" href="#/explore">
                                <Stamp size={15} />
                                <span>{t('missions.visit')}</span>
                                <ArrowRight size={13} />
                            </a>
                            <a className="welcome-mission" href="#/ai-planner">
                                <Route size={15} />
                                <span>{t('missions.plan')}</span>
                                <ArrowRight size={13} />
                            </a>
                            <a className="welcome-mission" href="#/explore">
                                <PenLine size={15} />
                                <span>{t('missions.review')}</span>
                                <ArrowRight size={13} />
                            </a>
                        </div>
                    )
            )}
        </section>
    );
}
