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
import { goTo, currentRoute, onRouteChange, absoluteUrl } from '../../router';
import { FollowList } from '../components/FollowList';
import { EndorseModal, TopEndorsementsStrip } from '../components/EndorseModal';
import { Award, Trophy, Sparkles, X, Check, MapPin } from 'lucide-react';
import { TierBadge } from '../components/TierBadge';
import { Skeleton } from '../components/Skeleton';
import { ProGate } from '../components/ProGate';
import { TUNISIA_CITIES } from '../components/tunisia-cities';
import { Pencil, UserPlus, UserCheck, Stamp } from 'lucide-react';

function handleFromHash(): string {
    const m = currentRoute().match(/^\/u\/([^/?]+)/);
    return m ? decodeURIComponent(m[1]).toLowerCase() : '';
}

function currentUser(): { id: string; handle: string | null; fullName: string } | null {
    try {
        const raw = localStorage.getItem('etunisia_user') || localStorage.getItem('auth_user');
        if (!raw) return null;
        const u = JSON.parse(raw);
        return u && u.id ? { id: u.id, handle: u.handle ?? null, fullName: u.fullName || u.name || u.email || 'You' } : null;
    } catch { return null; }
}

const THEMES: { id: string; label: string }[] = [
    { id: '', label: 'Default' },
    { id: 'sahara', label: 'Sahara' },
    { id: 'mediterranean', label: 'Mediterranean' },
    { id: 'medina', label: 'Medina' },
];

/** Pro-only hero theme picker (rendered inside <ProGate feature="passport-themes">). */
function PassportThemePicker({ current, onChange }: { current: string | null; onChange: () => void }) {
    const [busy, setBusy] = useState<string | null>(null);
    const pick = async (id: string) => {
        setBusy(id || 'default');
        try {
            await api.updateProfile({ passportTheme: id || null });
            (window as any).showToast?.({ message: id ? `Theme set to ${id}` : 'Theme reset', type: 'success' });
            onChange();
        } catch (e: any) {
            (window as any).showToast?.({ message: e?.message || 'Could not save theme', type: 'error' });
        } finally { setBusy(null); }
    };
    return (
        <div className="passport-theme-picker">
            <div className="passport-theme-picker-head"><Sparkles size={14} /> <strong>Passport theme</strong></div>
            <div className="passport-theme-swatches">
                {THEMES.map((t) => (
                    <button
                        key={t.id || 'default'}
                        type="button"
                        className={`passport-theme-swatch theme-${t.id || 'default'}${(current || '') === t.id ? ' active' : ''}`}
                        onClick={() => pick(t.id)}
                        disabled={busy !== null}
                        title={t.label}
                    >
                        <span className="passport-theme-swatch-dot" aria-hidden="true" />
                        {t.label}
                    </button>
                ))}
            </div>
        </div>
    );
}

/** Pro-only "who viewed your passport" panel (rendered inside <ProGate feature="passport-analytics">). */
function PassportAnalytics() {
    const { data, isLoading } = useQuery({
        queryKey: ['passport-analytics'],
        queryFn: () => api.getPassportAnalytics(),
        staleTime: 5 * 60_000,
    });
    const a: any = data || {};
    const viewers: any[] = a.recentViewers || [];
    const countries: any[] = a.topCountries || [];
    return (
        <div className="passport-analytics">
            <div className="passport-analytics-head"><Sparkles size={14} /> <strong>Who viewed your passport</strong></div>
            <div className="passport-analytics-tiles">
                <div className="passport-analytics-tile"><strong>{isLoading ? '—' : (a.viewsThisWeek ?? 0)}</strong><span>this week</span></div>
                <div className="passport-analytics-tile"><strong>{isLoading ? '—' : (a.totalViews ?? 0)}</strong><span>total views</span></div>
                <div className="passport-analytics-tile"><strong>{isLoading ? '—' : (a.uniqueViewers ?? 0)}</strong><span>unique viewers</span></div>
            </div>
            {viewers.length > 0 ? (
                <div className="passport-analytics-viewers">
                    {viewers.map((v, i) => (
                        <a key={i} className="passport-analytics-viewer" href={v.handle ? `#/u/${v.handle}` : undefined}>
                            {v.avatar
                                ? <img src={getImageUrl(v.avatar)} alt="" />
                                : <span className="passport-analytics-viewer-fallback">{(v.fullName || '?').slice(0, 1).toUpperCase()}</span>}
                            <span className="passport-analytics-viewer-name">{v.fullName}<TierBadge plan={v.plan} role={v.role} size="xs" /></span>
                        </a>
                    ))}
                </div>
            ) : (
                <p className="passport-analytics-empty">{isLoading ? 'Loading…' : 'No views yet — share your passport to get discovered.'}</p>
            )}
            {countries.length > 0 && (
                <div className="passport-analytics-countries">
                    {countries.map((c) => <span key={c.country} className="passport-analytics-country"><MapPin size={11} /> {c.country} · {c.count}</span>)}
                </div>
            )}
        </div>
    );
}

/** Collectible stamps for the 14 iconic Tunisian destinations — earned from visited cities. */
function PassportStamps({ visited, isOwner, rarity }: { visited: string[]; isOwner: boolean; rarity?: Record<string, number> }) {
    const set = new Set((visited || []).map((c) => c.toLowerCase()));
    const rarityByCity = new Map(Object.entries(rarity || {}).map(([k, v]) => [k.toLowerCase(), v]));
    const count = TUNISIA_CITIES.filter((c) => set.has(c.name.toLowerCase())).length;
    const total = TUNISIA_CITIES.length;
    return (
        <section className="passport-section">
            <div className="passport-stamps-head">
                <h2 className="passport-section-title">Passport stamps</h2>
                <span className="passport-stamps-progress">{count} / {total} iconic destinations</span>
            </div>
            <div className="passport-stamps-grid">
                {TUNISIA_CITIES.map((c) => {
                    const got = set.has(c.name.toLowerCase());
                    const explorers = got ? rarityByCity.get(c.name.toLowerCase()) : undefined;
                    return (
                        <div key={c.name} className={`passport-stamp${got ? ' is-earned' : ''}`} title={got ? `Stamped: ${c.name}` : `Not yet stamped: ${c.name}`}>
                            <span className="passport-stamp-ink"><Stamp size={16} /></span>
                            <span className="passport-stamp-name">{c.name}</span>
                            {got && explorers ? <span className="passport-stamp-rarity">{explorers} explorer{explorers === 1 ? '' : 's'}</span> : null}
                        </div>
                    );
                })}
            </div>
            {isOwner && count < total && (
                <a className="passport-stamps-cta" href="#/explore">Find your next stamp →</a>
            )}
        </section>
    );
}

/** "My Tunisia Journey" — a strip of the user's highlighted (pinned, non-expiring) stories. */
function PassportHighlights({ handle }: { handle: string }) {
    const { data } = useQuery({
        queryKey: ['story-highlights', handle],
        queryFn: () => api.getStoryHighlights(handle),
        staleTime: 5 * 60_000,
        enabled: !!handle,
    });
    const items: any[] = Array.isArray(data) ? data : [];
    const [open, setOpen] = useState<any | null>(null);
    if (items.length === 0) return null;
    return (
        <section className="passport-section passport-section-tight">
            <h2 className="passport-section-title">Highlights</h2>
            <div className="passport-highlights">
                {items.map((h) => (
                    <button key={h.id} type="button" className="passport-highlight" onClick={() => setOpen(h)} title={h.caption || ''}>
                        <img src={getImageUrl(h.imageUrl)} alt={h.caption || 'Highlight'} loading="lazy" />
                        {h.caption ? <span className="passport-highlight-cap">{h.caption}</span> : null}
                    </button>
                ))}
            </div>
            {open && (
                <div className="passport-highlight-overlay" role="dialog" onClick={() => setOpen(null)}>
                    <div className="passport-highlight-overlay-inner" onClick={(e) => e.stopPropagation()}>
                        <button className="passport-highlight-close" onClick={() => setOpen(null)} aria-label="Close"><X size={18} /></button>
                        <img src={getImageUrl(open.imageUrl)} alt={open.caption || 'Highlight'} />
                        {open.caption ? <p className="passport-highlight-overlay-cap">{open.caption}</p> : null}
                    </div>
                </div>
            )}
        </section>
    );
}

export default function PassportPage() {
    const [handle, setHandle] = useState<string>(handleFromHash());

    // Re-read when the hash changes (in-app nav between passports).
    useEffect(() => {
        const onHash = () => setHandle(handleFromHash());
        return onRouteChange(onHash);
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
        setMeta('og:url', absoluteUrl(`/u/${p.handle}`));
        setMeta('og:type', 'profile');
        setMeta('twitter:card', 'summary_large_image');
        setMeta('twitter:image', ogUrl);
    }, [data]);

    if (!handle) {
        return <main className="passport-page passport-loading">Loading…</main>;
    }
    if (isLoading) return (
        <main className="passport-page passport-loading p-6 max-w-3xl mx-auto space-y-6">
            <div className="flex gap-4 items-center">
                <Skeleton variant="circle" width={80} height={80} />
                <div className="space-y-2 flex-1">
                    <Skeleton variant="text" width="40%" />
                    <Skeleton variant="text" width="25%" />
                </div>
            </div>
            <Skeleton variant="rect" height={120} className="w-full" />
            <div className="grid grid-cols-3 gap-4">
                <Skeleton variant="card" height={80} />
                <Skeleton variant="card" height={80} />
                <Skeleton variant="card" height={80} />
            </div>
        </main>
    );

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
    const isPro = p.plan === 'premium' || p.plan === 'business' || p.plan === 'admin';

    return (
        <main className="passport-page">
            <section className={`passport-hero${isPro ? ' is-pro' : ''}${p.passportTheme ? ` passport-theme-${p.passportTheme}` : ''}`}>
                <div className="passport-hero-bg" aria-hidden="true" />
                <div className="passport-hero-mesh" aria-hidden="true" />
                <div className="passport-hero-orbs" aria-hidden="true">
                    <span className="passport-hero-orb" />
                    <span className="passport-hero-orb" />
                </div>
                <div className="passport-hero-content">
                    <div className="passport-hero-left">
                        <span
                            className={`passport-avatar-wrap${isPro ? ' is-pro' : ''}`}
                            data-user-id={p.id || undefined}
                            data-user-name={p.fullName}
                            data-user-avatar={p.avatar ? getImageUrl(p.avatar) : undefined}
                            data-user-handle={p.handle}
                            data-user-plan={p.plan || undefined}
                        >
                            {p.avatar
                                ? <img className="passport-avatar" src={getImageUrl(p.avatar)} alt="" />
                                : <div className="passport-avatar passport-avatar-fallback">{(p.fullName || '?').slice(0, 1).toUpperCase()}</div>}
                            {isPro && (
                                <span className="passport-avatar-pro-mark" aria-label={p.plan === 'business' ? 'Verified Business' : 'Pro Traveler'}>
                                    <Sparkles size={12} />
                                </span>
                            )}
                        </span>
                        <div className="passport-hero-text">
                            <div className="passport-handle">@{p.handle}</div>
                            <h1>{p.fullName}</h1>
                            <div className="passport-meta">
                                {p.country && <span className="passport-meta-chip"><MapPin size={11} /> {p.country}</span>}
                                <span className={`passport-level passport-level-${p.passportLevel.toLowerCase()}`}>{p.passportLevel} Explorer</span>
                                {p.plan === 'premium' && <span className="passport-pro-chip"><Sparkles size={11} /> Pro Traveler</span>}
                                {p.plan === 'business' && <span className="passport-business-chip"><Check size={11} /> Verified Business</span>}
                                {p.role === 'creator' && p.plan !== 'business' && <span className="passport-verified"><Check size={11} /> Local Guide</span>}
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

            <PassportHighlights handle={p.handle} />

            {/* Owner-only: Pro owners get the theme picker; Free owners get the upsell cards. */}
            {isOwner && (
                <section className="passport-section passport-section-tight">
                    <div className="passport-pro-upsell">
                        <ProGate feature="passport-themes">
                            <PassportThemePicker current={p.passportTheme || null} onChange={refetch} />
                        </ProGate>
                        <ProGate feature="passport-analytics"><PassportAnalytics /></ProGate>
                    </div>
                </section>
            )}

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

            <PassportStamps visited={p.visitedCities} isOwner={isOwner} rarity={p.stampRarity} />

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
                    onDone={() => { setOnboardingUser(null); goTo(`/u/${onboardingUser.handle}`); refetch(); }}
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
                        <span className="passport-completion-check" aria-hidden="true">
                            {f.done && <Check size={12} strokeWidth={3} />}
                        </span>
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
        const showToast = (opts: any) => (window as any).showToast?.(opts);
        try {
            const res: any = await api.applyLocalGuide();
            if (res?.ok) {
                onPromoted?.();
                showToast({
                    title: 'Local Guide unlocked',
                    message: "You're now a verified Local Guide. Travelers will see the ✓ on your passport.",
                    type: 'achievement',
                });
            } else if (res?.reason === 'gate_not_met') {
                const p = res.progress || {};
                const hint = `Almost there — need one of: ${p.pointsRequired}+ pts (you have ${p.points ?? 0}), ${p.reviewsRequired}+ reviews (you have ${p.reviewsCount ?? 0}), or ${p.tripsRequired}+ trips (you have ${p.tripsCount ?? 0}).`;
                setHint(hint);
                showToast({ message: hint, type: 'info' });
            } else {
                setHint('Could not apply right now.');
                showToast({ message: 'Could not apply right now.', type: 'error' });
            }
        } catch {
            setHint('Network error.');
            showToast({ message: 'Network error — please try again.', type: 'error' });
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
            const fn = (window as any).showToast;
            if (fn) fn({
                message: next ? `You're now following @${handle}` : `Unfollowed @${handle}`,
                type: next ? 'success' : 'info',
                emoji: next ? '🤝' : undefined,
            });
        } catch {
            setFollowing(!next); // rollback
            const fn = (window as any).showToast;
            if (fn) fn({ message: 'Could not update follow — please try again.', type: 'error' });
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
        <div className="passport-anon-pill" role="region" aria-label="Sign up CTA">
            <span className="passport-anon-pill-icon" aria-hidden="true"><MapPin size={14} /></span>
            <span className="passport-anon-pill-text">
                <strong>Get your own Tunisia Passport.</strong> Free, takes 30 seconds.
            </span>
            <button type="button" className="btn primary sm" onClick={onClaim}>Sign up</button>
            <button
                type="button"
                aria-label="Dismiss"
                className="passport-anon-pill-x"
                onClick={() => { sessionStorage.setItem('passport-pill-dismissed', '1'); setDismissed(true); }}
            >
                <X size={14} />
            </button>
        </div>
    );
}

