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
import { FollowList } from '../components/FollowList';
import { EndorseModal, TopEndorsementsStrip } from '../components/EndorseModal';
import { Award, Trophy, Sparkles, X } from 'lucide-react';
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
    const [followListMode, setFollowListMode] = useState<'followers' | 'following' | null>(null);
    const [endorseOpen, setEndorseOpen] = useState(false);

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
                                {p.topCityRank && (
                                    <span className="passport-cityrank" title={`Out of ${p.topCityRank.total} reviewers`}>
                                        <Trophy size={12} /> #{p.topCityRank.rank} in {p.topCityRank.city}
                                    </span>
                                )}
                            </div>
                            <div className="passport-meta passport-followmeta">
                                <button type="button" className="passport-followmeta-btn" onClick={() => setFollowListMode('followers')}>
                                    <strong>{p.followersCount ?? 0}</strong> followers
                                </button>
                                <span className="passport-followmeta-sep">·</span>
                                <button type="button" className="passport-followmeta-btn" onClick={() => setFollowListMode('following')}>
                                    <strong>{p.followingCount ?? 0}</strong> following
                                </button>
                            </div>
                            {p.bio && <p className="passport-bio">{p.bio}</p>}
                        </div>
                    </div>
                    <div className="passport-hero-right">
                        {isOwner && p.role !== 'creator' && p.role !== 'admin' && (
                            <LocalGuideButton onPromoted={refetch} />
                        )}
                        {isOwner && <a className="btn ghost" href="#/profile-edit"><Pencil size={14} /> Edit</a>}
                        {!isOwner && !isAnon && (
                            <>
                                <FollowButton handle={p.handle} initiallyFollowing={!!p.viewerIsFollowing} onChange={refetch} />
                                <button className="btn ghost passport-endorse-btn" onClick={() => setEndorseOpen(true)}>
                                    <Award size={14} /> Endorse
                                </button>
                            </>
                        )}
                        {isAnon && (
                            <button className="btn primary" onClick={() => setSignupOpen(true)}>Claim your passport →</button>
                        )}
                        <SharePassport handle={p.handle} fullName={p.fullName} />
                    </div>
                </div>
            </section>

            {isOwner && <ProfileCompletion passport={p} />}

            {p.topEndorsements?.length > 0 && (
                <section className="passport-section passport-section-tight">
                    <TopEndorsementsStrip topEndorsements={p.topEndorsements} />
                </section>
            )}

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

            {followListMode && (
                <FollowList handle={p.handle} mode={followListMode} onClose={() => setFollowListMode(null)} />
            )}

            {endorseOpen && (
                <EndorseModal
                    handle={p.handle}
                    fullName={p.fullName}
                    avatar={p.avatar}
                    initiallyEndorsed={p.viewerEndorsedTopics || []}
                    onClose={() => { setEndorseOpen(false); refetch(); }}
                />
            )}

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

interface ProfileCompletionField { label: string; done: boolean; cta?: string; href?: string; }

function ProfileCompletion({ passport }: { passport: any }) {
    const fields: ProfileCompletionField[] = [
        { label: 'Add an avatar', done: !!passport.avatar, cta: 'Upload', href: '#/profile-edit' },
        { label: 'Write a bio', done: !!passport.bio && passport.bio.length > 10, cta: 'Add bio', href: '#/profile-edit' },
        { label: 'Set your country', done: !!passport.country, cta: 'Add country', href: '#/profile-edit' },
        { label: 'Pick at least 3 interests', done: (passport.interests?.length || 0) >= 3, cta: 'Choose', href: '#/profile-edit' },
        { label: 'Plan your first trip', done: passport.stats?.tripsPlanned > 0, cta: 'Plan', href: '#/explore' },
        { label: 'Mark a place visited', done: passport.stats?.citiesVisited > 0, cta: 'Explore', href: '#/explore' },
    ];
    const done = fields.filter((f) => f.done).length;
    const pct = Math.round((done / fields.length) * 100);
    const [dismissed, setDismissed] = useState(() => localStorage.getItem('passport-completion-dismissed') === '1');

    if (pct === 100 || dismissed) return null;

    const next = fields.find((f) => !f.done);

    return (
        <section className="passport-completion">
            <div className="passport-completion-head">
                <div>
                    <strong>Your passport is {pct}% complete</strong>
                    <span>The more you fill in, the more people discover you.</span>
                </div>
                <button
                    className="passport-completion-dismiss"
                    aria-label="Dismiss"
                    onClick={() => { localStorage.setItem('passport-completion-dismissed', '1'); setDismissed(true); }}
                >
                    <X size={16} />
                </button>
            </div>
            <div className="passport-completion-bar"><span style={{ width: `${pct}%` }} /></div>
            <ul className="passport-completion-list">
                {fields.map((f) => (
                    <li key={f.label} className={f.done ? 'done' : ''}>
                        <span className="passport-completion-check">{f.done ? '✓' : ''}</span>
                        <span className="passport-completion-label">{f.label}</span>
                        {!f.done && f.href && next === f && (
                            <a className="btn ghost sm passport-completion-cta" href={f.href}>{f.cta} →</a>
                        )}
                    </li>
                ))}
            </ul>
        </section>
    );
}

function LocalGuideButton({ onPromoted }: { onPromoted?: () => void }) {
    const [busy, setBusy] = useState(false);
    const [hint, setHint] = useState<string | null>(null);

    const apply = async () => {
        if (busy) return;
        setBusy(true);
        setHint(null);
        try {
            const res: any = await api.applyLocalGuide();
            if (res?.ok) {
                onPromoted?.();
            } else if (res?.reason === 'gate_not_met') {
                const p = res.progress || {};
                setHint(
                    `Almost there — need one of: ${p.pointsRequired}+ pts (you have ${p.points ?? 0}), ` +
                    `${p.reviewsRequired}+ reviews (you have ${p.reviewsCount ?? 0}), ` +
                    `or ${p.tripsRequired}+ trips (you have ${p.tripsCount ?? 0}).`
                );
            } else {
                setHint('Could not apply right now.');
            }
        } catch {
            setHint('Network error.');
        } finally {
            setBusy(false);
        }
    };

    return (
        <>
            <button className="btn primary passport-local-guide-btn" onClick={apply} disabled={busy}>
                <Sparkles size={14} /> {busy ? 'Applying…' : 'Become a Local Guide'}
            </button>
            {hint && <div className="passport-local-guide-hint">{hint}</div>}
        </>
    );
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

