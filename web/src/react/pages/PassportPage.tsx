import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, getImageUrl } from '../../shared/api';
import { TunisiaMap } from '../components/TunisiaMap';
import { BadgeGrid } from '../components/BadgeGrid';
import { PassportStats } from '../components/PassportStats';
import { SharePassport } from '../components/SharePassport';
import { PassportTabs } from '../components/PassportTabs';
import { SignupGate } from '../components/SignupGate';
import { PassportOnboarding } from '../components/PassportOnboarding';
import { Pencil, UserPlus, UserCheck } from 'lucide-react';

function handleFromHash(): string {
    const m = (window.location.hash || '').match(/^#\/u\/([^/?]+)/);
    return m ? decodeURIComponent(m[1]).toLowerCase() : '';
}

function currentUser(): { id: string; handle: string | null; fullName: string } | null {
    try {
        const raw = localStorage.getItem('auth_user');
        if (!raw) return null;
        const u = JSON.parse(raw);
        return u && u.id ? { id: u.id, handle: u.handle ?? null, fullName: u.fullName || u.name || u.email || 'You' } : null;
    } catch { return null; }
}

export default function PassportPage() {
    const [handle, setHandle] = useState<string>(handleFromHash());

    // Re-read when the hash changes (in-app nav between passports).
    useEffect(() => {
        const onHash = () => setHandle(handleFromHash());
        window.addEventListener('hashchange', onHash);
        return () => window.removeEventListener('hashchange', onHash);
    }, []);

    const me = currentUser();
    const isOwner = !!me && me.handle === handle;
    const isAnon = !me;

    const [signupOpen, setSignupOpen] = useState(false);
    const [onboardingUser, setOnboardingUser] = useState<{ handle: string; fullName: string } | null>(null);

    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['passport', handle],
        queryFn: () => api.getPassport(handle),
        staleTime: 60_000,
        enabled: !!handle,
    });

    // Inject OG meta tags client-side as a fallback (crawlers that run JS will see these).
    useEffect(() => {
        if (!data || (data as any).error) return;
        const p: any = data;
        document.title = `${p.fullName} — Tunisia Passport`;
        const versioned = api.getPassportOgUrl(p.handle, new Date(p.joinedAt).getTime());
        const ogUrl = window.location.origin + versioned;
        setMeta('og:title', `${p.fullName}'s Tunisia Passport`);
        setMeta('og:description', `🇹🇳 ${p.stats.citiesVisited} cities · ${p.stats.tripsPlanned} trips · ${p.badges.length} badges`);
        setMeta('og:image', ogUrl);
        setMeta('og:url', `${window.location.origin}/#/u/${p.handle}`);
        setMeta('og:type', 'profile');
        setMeta('twitter:card', 'summary_large_image');
        setMeta('twitter:image', ogUrl);
    }, [data]);

    if (!handle) {
        return <main className="passport-page passport-loading">Loading…</main>;
    }
    if (isLoading) return <main className="passport-page passport-loading">Loading passport…</main>;

    const notFound = error || !data || (data as any).error === 'passport_not_found';
    if (notFound) {
        return (
            <main className="passport-page passport-404">
                <h2>This passport hasn't been claimed.</h2>
                <p>The handle <code>@{handle}</code> is available.</p>
                <button className="btn primary" onClick={() => setSignupOpen(true)}>Claim @{handle} →</button>
                <SignupGate
                    open={signupOpen}
                    onClose={() => setSignupOpen(false)}
                    initialHandle={handle}
                    onSuccess={(u) => { setSignupOpen(false); setOnboardingUser({ handle: u.handle, fullName: u.fullName || u.handle }); }}
                />
                {onboardingUser && (
                    <PassportOnboarding
                        handle={onboardingUser.handle}
                        fullName={onboardingUser.fullName}
                        onDone={() => { setOnboardingUser(null); refetch(); }}
                    />
                )}
            </main>
        );
    }

    const p: any = data;

    return (
        <main className="passport-page">
            <section className="passport-hero">
                <div className="passport-hero-bg" />
                <div className="passport-hero-content">
                    <div className="passport-hero-left">
                        {p.avatar
                            ? <img className="passport-avatar" src={getImageUrl(p.avatar)} alt="" />
                            : <div className="passport-avatar passport-avatar-fallback">{(p.fullName || '?').slice(0, 1).toUpperCase()}</div>}
                        <div className="passport-hero-text">
                            <div className="passport-handle">@{p.handle}</div>
                            <h1>{p.fullName}</h1>
                            <div className="passport-meta">
                                {p.country && <span>🇹🇳 {p.country}</span>}
                                <span className={`passport-level passport-level-${p.passportLevel.toLowerCase()}`}>{p.passportLevel} Explorer</span>
                                {p.role === 'creator' && <span className="passport-verified">✓ Local Guide</span>}
                            </div>
                            <div className="passport-meta passport-followmeta">
                                <strong>{p.followersCount ?? 0}</strong> followers
                                <span className="passport-followmeta-sep">·</span>
                                <strong>{p.followingCount ?? 0}</strong> following
                            </div>
                            {p.bio && <p className="passport-bio">{p.bio}</p>}
                        </div>
                    </div>
                    <div className="passport-hero-right">
                        {isOwner && <a className="btn ghost" href="#/profile-edit"><Pencil size={14} /> Edit</a>}
                        {!isOwner && !isAnon && (
                            <FollowButton handle={p.handle} initiallyFollowing={!!p.viewerIsFollowing} onChange={refetch} />
                        )}
                        {isAnon && (
                            <button className="btn primary" onClick={() => setSignupOpen(true)}>Claim your passport →</button>
                        )}
                        <SharePassport handle={p.handle} fullName={p.fullName} />
                    </div>
                </div>
            </section>

            <section className="passport-section">
                <PassportStats {...p.stats} />
            </section>

            <section className="passport-section">
                <h2 className="passport-section-title">Tunisia journey</h2>
                <TunisiaMap
                    visited={p.visitedCities}
                    emptyCta={isOwner ? { label: 'Start exploring', href: '#/explore' } : undefined}
                />
            </section>

            <section className="passport-section">
                <h2 className="passport-section-title">Badges</h2>
                <BadgeGrid earned={p.badges} />
            </section>

            <section className="passport-section">
                <PassportTabs handle={p.handle} />
            </section>

            {isAnon && <AnonPill onClaim={() => setSignupOpen(true)} />}

            <SignupGate
                open={signupOpen}
                onClose={() => setSignupOpen(false)}
                initialHandle={isAnon ? undefined : undefined}
                onSuccess={(u) => { setSignupOpen(false); setOnboardingUser({ handle: u.handle, fullName: u.fullName || u.handle }); }}
            />
            {onboardingUser && (
                <PassportOnboarding
                    handle={onboardingUser.handle}
                    fullName={onboardingUser.fullName}
                    onDone={() => { setOnboardingUser(null); window.location.hash = `#/u/${onboardingUser.handle}`; refetch(); }}
                />
            )}
        </main>
    );
}

function setMeta(name: string, content: string) {
    const key = name.startsWith('og:') || name.startsWith('twitter:') ? 'property' : 'name';
    let el = document.head.querySelector<HTMLMetaElement>(`meta[${key}="${name}"]`);
    if (!el) {
        el = document.createElement('meta');
        el.setAttribute(key, name);
        document.head.appendChild(el);
    }
    el.setAttribute('content', content);
}

function FollowButton({ handle, initiallyFollowing, onChange }: { handle: string; initiallyFollowing: boolean; onChange?: () => void }) {
    const [following, setFollowing] = useState(initiallyFollowing);
    const [busy, setBusy] = useState(false);

    useEffect(() => { setFollowing(initiallyFollowing); }, [initiallyFollowing, handle]);

    const toggle = async () => {
        if (busy) return;
        const next = !following;
        setFollowing(next); // optimistic
        setBusy(true);
        try {
            if (next) await api.followHandle(handle);
            else await api.unfollowHandle(handle);
            onChange?.();
        } catch {
            setFollowing(!next); // rollback
        } finally {
            setBusy(false);
        }
    };

    return (
        <button
            className={`btn ${following ? 'ghost' : 'primary'} passport-follow-btn`}
            onClick={toggle}
            disabled={busy}
            aria-pressed={following}
        >
            {following ? <><UserCheck size={14} /> Following</> : <><UserPlus size={14} /> Follow</>}
        </button>
    );
}

function AnonPill({ onClaim }: { onClaim: () => void }) {
    const [dismissed, setDismissed] = useState(() => sessionStorage.getItem('passport-pill-dismissed') === '1');
    if (dismissed) return null;
    return (
        <div className="passport-anon-pill">
            <span>🇹🇳 <strong>Get your own Tunisia Passport.</strong> Free, takes 30 seconds.</span>
            <button className="btn primary sm" onClick={onClaim}>Sign up</button>
            <button aria-label="Dismiss" className="passport-anon-pill-x" onClick={() => { sessionStorage.setItem('passport-pill-dismissed', '1'); setDismissed(true); }}>×</button>
        </div>
    );
}

