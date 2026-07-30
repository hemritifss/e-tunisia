import React, { useEffect, useState } from 'react';
import { api } from '../../shared/api';
import { useAuthStore } from '../stores/auth-store';
import { MapPin, PenLine } from 'lucide-react';

function greeting(): string {
    const h = new Date().getHours();
    if (h < 5) return 'Late-night planning?';
    if (h < 12) return 'Sbah el khir';
    if (h < 18) return 'Ahla w sahla';
    return 'Good evening';
}

/**
 * Mono eyebrow above the greeting. Mono is reserved for values that are
 * actually true, so this carries the weekday and date: the app has no
 * reliable location or temperature signal for the signed-in user.
 */
function eyebrow(): string {
    const now = new Date();
    const weekday = now.toLocaleDateString(undefined, { weekday: 'long' });
    const date = now.toLocaleDateString(undefined, { day: 'numeric', month: 'long' });
    return `${weekday} · ${date}`;
}

/**
 * The AI line renders as the italic clause of the greeting — if the model
 * prepends its own salutation ("Good evening, traveler — Tunisia is calling")
 * the masthead greets twice in a row. Drop the salutation, keep the substance.
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
 * Top-of-feed masthead.
 *
 * Registered: a mono eyebrow, an editorial greeting whose second clause is the
 *   personalised AI line, and two actions. Passport numbers moved to the right
 *   rail, so this surface stays a headline and nothing else.
 *
 * Anonymous: the editorial hero — headline, sub, and a single primary CTA.
 */
export function WelcomeStrip() {
    const user = useAuthStore((s) => s.user) as any;
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
            } catch { /* keep the static clause */ }
        })();
        return () => { cancelled = true; };
    }, [user?.id]);

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
    const openComposer = () =>
        document.dispatchEvent(new CustomEvent('etunisia:open-post-modal'));

    return (
        <section className="feed-masthead">
            <div className="feed-masthead-text">
                <span className="feed-masthead-eyebrow">{eyebrow()}</span>
                <h2 className="feed-masthead-greeting">
                    {greeting()}, {firstName}.
                    <em>{aiGreeting || 'Tunisia is waiting.'}</em>
                </h2>
            </div>
            <div className="feed-masthead-actions">
                <button type="button" className="feed-masthead-btn is-primary" onClick={openComposer}>
                    <PenLine size={15} /> Share a moment
                </button>
                <a className="feed-masthead-btn" href="#/discover-trips">Plan a trip</a>
            </div>
        </section>
    );
}
