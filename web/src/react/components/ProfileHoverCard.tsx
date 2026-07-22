import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as api from '../../api';
import type { ProfileOverview } from '../../api';
import { MessageCircle, UserPlus, UserCheck, MapPin, Sparkles, MoreHorizontal, ShieldOff } from 'lucide-react';
import { goTo } from '../../router';
import { openSafetyMenu } from '../../safety-menu';
import { plural } from '../../shared/plural';

/**
 * Facebook-style profile preview that opens on hover over any element
 * carrying `data-user-id` — the same delegation contract UserActionMenu
 * uses for right-click / long-press, so every existing byline and avatar
 * in the app gets a card with no per-call-site changes.
 *
 * Pointer-only: touch devices keep the long-press menu instead.
 *
 * Mounted once globally — see mount-messenger.tsx.
 */

const CARD_WIDTH = 320;
const CARD_HEIGHT_EST = 290;
const OPEN_DELAY_MS = 420;   // hover intent — long enough to survive a mouse crossing the element
const CLOSE_DELAY_MS = 240;  // grace period so the pointer can travel into the card

interface Seed {
    id: string;
    fullName?: string | null;
    avatar?: string | null;
    handle?: string | null;
    plan?: string | null;
}

interface OpenState {
    seed: Seed;
    position: { x: number; y: number; flipped: boolean };
}

// ─────────── Overview cache ───────────
// Survives unmounts so a second hover over the same person is instant.
const overviewCache = new Map<string, ProfileOverview>();
const inflight = new Map<string, Promise<ProfileOverview | null>>();

function fetchOverview(userId: string): Promise<ProfileOverview | null> {
    const cached = overviewCache.get(userId);
    if (cached) return Promise.resolve(cached);

    const existing = inflight.get(userId);
    if (existing) return existing;

    const p = api.getProfileOverview(userId)
        .then((data) => {
            overviewCache.set(userId, data);
            return data;
        })
        .catch(() => null)
        .finally(() => { inflight.delete(userId); });

    inflight.set(userId, p);
    return p;
}

/** Drop a cached entry so the next hover reflects a follow we just performed. */
function invalidateOverview(userId: string) {
    overviewCache.delete(userId);
}

function isPro(plan?: string | null): boolean {
    return plan === 'premium' || plan === 'business' || plan === 'admin';
}

/**
 * Clean path — the router is History-API backed, so a bare "#/x" href only
 * appends a hash instead of navigating. Kept as a real href (not a button) so
 * ctrl/middle-click still opens the profile in a new tab.
 */
function profileHref(seed: { handle?: string | null; id: string }): string {
    if (seed.handle) return `/u/${encodeURIComponent(seed.handle)}`;
    return `/user/${encodeURIComponent(seed.id)}`;
}

function clamp(v: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, v));
}

function positionFor(rect: DOMRect): OpenState['position'] {
    const spaceBelow = window.innerHeight - rect.bottom;
    const flipped = spaceBelow < CARD_HEIGHT_EST + 16 && rect.top > CARD_HEIGHT_EST + 16;
    const y = flipped ? rect.top - CARD_HEIGHT_EST - 8 : rect.bottom + 8;
    return {
        x: clamp(rect.left, 8, window.innerWidth - CARD_WIDTH - 8),
        y: clamp(y, 8, Math.max(8, window.innerHeight - CARD_HEIGHT_EST - 8)),
        flipped,
    };
}

function compact(n: number): string {
    if (n < 1000) return String(n);
    if (n < 1_000_000) return `${(n / 1000).toFixed(n < 10_000 ? 1 : 0).replace(/\.0$/, '')}k`;
    return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
}

function mutualLabel(m: ProfileOverview['mutuals']): string | null {
    if (!m || m.count < 1) return null;
    const first = m.sample[0]?.fullName?.split(' ')[0];
    if (!first) return `${m.count} mutual${m.count === 1 ? '' : 's'}`;
    if (m.count === 1) return `Followed by ${first}`;
    return `Followed by ${first} and ${m.count - 1} other${m.count - 1 === 1 ? '' : 's'}`;
}

// ─────────── Card ───────────
function CardPanel({
    seed, position, onEnter, onLeave, onClose,
}: {
    seed: Seed;
    position: OpenState['position'];
    onEnter: () => void;
    onLeave: () => void;
    onClose: () => void;
}) {
    const [data, setData] = useState<ProfileOverview | null>(() => overviewCache.get(seed.id) ?? null);
    const [following, setFollowing] = useState<boolean | null>(
        () => overviewCache.get(seed.id)?.isFollowing ?? null,
    );
    const [followBusy, setFollowBusy] = useState(false);
    const [unblockBusy, setUnblockBusy] = useState(false);
    const authed = api.isLoggedIn();

    // Hydrate stats behind the seed we already rendered from.
    useEffect(() => {
        let alive = true;
        fetchOverview(seed.id).then((d) => {
            if (!alive || !d) return;
            setData(d);
            setFollowing(d.isFollowing);
        });
        return () => { alive = false; };
    }, [seed.id]);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    const name = data?.fullName || seed.fullName || 'Traveler';
    const handle = data?.handle ?? seed.handle ?? null;
    const avatar = data?.avatar || seed.avatar || null;
    const pro = isPro(data?.plan ?? seed.plan);
    const isSelf = !!data?.isSelf;

    const sendMessage = useCallback(() => {
        const fn = (window as any).openChatPopup;
        if (typeof fn === 'function') fn(seed.id);
        else goTo(`/messages/user/${encodeURIComponent(seed.id)}`);
        onClose();
    }, [seed.id, onClose]);

    const toggleFollow = useCallback(async () => {
        if (followBusy || following === null) return;
        setFollowBusy(true);
        const next = !following;
        setFollowing(next); // optimistic
        try {
            if (next) await api.followUser(seed.id);
            else await api.unfollowUser(seed.id);
            invalidateOverview(seed.id);
        } catch {
            setFollowing(!next);
        } finally {
            setFollowBusy(false);
        }
    }, [followBusy, following, seed.id]);

    const mutuals = data?.mutuals;
    const mutualText = mutuals ? mutualLabel(mutuals) : null;

    const href = profileHref({ handle, id: seed.id });
    const openProfile = (e: React.MouseEvent) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return; // let the browser handle it
        e.preventDefault();
        onClose();
        goTo(href);
    };

    const unblock = useCallback(async () => {
        if (unblockBusy) return;
        setUnblockBusy(true);
        try {
            await api.unblockUser(seed.id);
            invalidateOverview(seed.id);
            onClose();
        } catch {
            setUnblockBusy(false);
        }
    }, [unblockBusy, seed.id, onClose]);

    // Either direction of a block: no stats/bio ever reach this component (the
    // server already stripped them), so just render an unavailable state
    // instead of a card that looks broken with everything blank.
    if (data && (data.isBlockedByMe || data.hasBlockedMe)) {
        return (
            <div
                className="phc phc-blocked"
                style={{ top: position.y, left: position.x }}
                onPointerEnter={onEnter}
                onPointerLeave={onLeave}
                role="dialog"
                aria-label={`Profile unavailable: ${name}`}
            >
                <div className="phc-head">
                    <span className="phc-avatar">
                        <span className="phc-avatar-fallback">{name.slice(0, 1).toUpperCase()}</span>
                    </span>
                    <span className="phc-identity">
                        <strong className="phc-name">{name}</strong>
                        {handle && <small className="phc-handle">@{handle}</small>}
                    </span>
                </div>
                <p className="phc-blocked-note">
                    <ShieldOff size={13} aria-hidden="true" />
                    {data.hasBlockedMe ? "This profile isn't available to you." : "You've blocked this person."}
                </p>
                {data.isBlockedByMe && (
                    <div className="phc-actions">
                        <button
                            type="button"
                            className="phc-btn phc-btn-primary"
                            onClick={unblock}
                            disabled={unblockBusy}
                        >
                            {unblockBusy ? '…' : 'Unblock'}
                        </button>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div
            className={`phc ${position.flipped ? 'is-flipped' : ''}`}
            style={{ top: position.y, left: position.x }}
            onPointerEnter={onEnter}
            onPointerLeave={onLeave}
            role="dialog"
            aria-label={`Profile preview for ${name}`}
        >
            <a className="phc-head" href={href} onClick={openProfile}>
                <span className={`phc-avatar ${pro ? 'is-pro' : ''}`}>
                    {avatar
                        ? <img src={avatar} alt="" loading="lazy" />
                        : <span className="phc-avatar-fallback">{name.slice(0, 1).toUpperCase()}</span>}
                </span>
                <span className="phc-identity">
                    <strong className="phc-name">
                        {name}
                        {pro && <Sparkles size={12} className="phc-pro" aria-label="Pro" />}
                    </strong>
                    {handle && <small className="phc-handle">@{handle}</small>}
                    {data?.founderNumber != null && (
                        <small className="phc-founder">Founder #{String(data.founderNumber).padStart(4, '0')}</small>
                    )}
                </span>
            </a>

            {data?.bio && <p className="phc-bio">{data.bio}</p>}

            {data?.country && (
                <p className="phc-meta">
                    <MapPin size={12} aria-hidden="true" /> {data.country}
                </p>
            )}

            <div className="phc-stats" aria-busy={!data}>
                <span className="phc-stat">
                    <b>{data ? compact(data.followers) : '—'}</b> followers
                </span>
                <span className="phc-stat">
                    <b>{data ? compact(data.following) : '—'}</b> following
                </span>
                {!!data?.placesVisited && (
                    <span className="phc-stat"><b>{compact(data.placesVisited)}</b> {plural(data.placesVisited, 'place')}</span>
                )}
            </div>

            {mutualText && mutuals && (
                <div className="phc-mutuals">
                    <span className="phc-mutual-avatars">
                        {mutuals.sample.map((m) => (
                            m.avatar
                                ? <img key={m.id} src={m.avatar} alt="" loading="lazy" />
                                : <span key={m.id} className="phc-mutual-fallback">{(m.fullName || '?').slice(0, 1)}</span>
                        ))}
                    </span>
                    <small>{mutualText}</small>
                </div>
            )}

            {data?.followsYou && !isSelf && <span className="phc-badge-followsyou">Follows you</span>}

            {!isSelf && authed && (
                <div className="phc-actions">
                    <button
                        type="button"
                        className={`phc-btn phc-btn-primary ${following ? 'is-following' : ''}`}
                        onClick={toggleFollow}
                        disabled={followBusy || following === null}
                    >
                        {following ? <UserCheck size={15} /> : <UserPlus size={15} />}
                        {following === null ? '…' : following ? 'Following' : 'Follow'}
                    </button>
                    <button type="button" className="phc-btn" onClick={sendMessage}>
                        <MessageCircle size={15} /> Message
                    </button>
                    {/* Block / report already exist app-wide (safety module) but were
                        only reachable from UserProfilePage — reuse that menu here. */}
                    <button
                        type="button"
                        className="phc-btn phc-btn-more"
                        aria-label={`More options for ${name}`}
                        onClick={(e) => {
                            openSafetyMenu(e.currentTarget, {
                                target: { type: 'user', id: seed.id, name },
                                onAfterBlock: onClose,
                            });
                        }}
                    >
                        <MoreHorizontal size={15} />
                    </button>
                </div>
            )}
        </div>
    );
}

// ─────────── Manager ───────────
export function ProfileHoverCard() {
    const [open, setOpen] = useState<OpenState | null>(null);
    const openTimer = useRef<number | null>(null);
    const closeTimer = useRef<number | null>(null);
    const overCard = useRef(false);

    const cancelTimers = useCallback(() => {
        if (openTimer.current) { clearTimeout(openTimer.current); openTimer.current = null; }
        if (closeTimer.current) { clearTimeout(closeTimer.current); closeTimer.current = null; }
    }, []);

    const scheduleClose = useCallback(() => {
        if (closeTimer.current) clearTimeout(closeTimer.current);
        closeTimer.current = window.setTimeout(() => {
            if (!overCard.current) setOpen(null);
        }, CLOSE_DELAY_MS);
    }, []);

    useEffect(() => {
        // Pointer-only surface: coarse pointers keep the long-press menu.
        if (!window.matchMedia?.('(hover: hover) and (pointer: fine)').matches) return;

        function triggerFrom(target: EventTarget | null): HTMLElement | null {
            if (!(target instanceof HTMLElement)) return null;
            const el = target.closest<HTMLElement>('[data-user-id]');
            if (!el || !el.dataset.userId) return null;
            if (el.dataset.hoverCard === 'off') return null;
            if (el.closest('.phc')) return null; // never chain off our own card
            return el;
        }

        function onOver(e: PointerEvent) {
            if (e.pointerType !== 'mouse') return;
            const el = triggerFrom(e.target);
            if (!el) return;

            const id = el.dataset.userId!;
            if (open?.seed.id === id) { cancelTimers(); return; } // already showing this person

            cancelTimers();
            void fetchOverview(id); // warm the cache during the intent delay

            const rect = el.getBoundingClientRect();
            const seed: Seed = {
                id,
                fullName: el.dataset.userName || null,
                avatar: el.dataset.userAvatar || null,
                handle: el.dataset.userHandle || null,
                plan: el.dataset.userPlan || null,
            };
            openTimer.current = window.setTimeout(() => {
                setOpen({ seed, position: positionFor(rect) });
            }, OPEN_DELAY_MS);
        }

        function onOut(e: PointerEvent) {
            if (e.pointerType !== 'mouse') return;
            if (!triggerFrom(e.target)) return;
            if (openTimer.current) { clearTimeout(openTimer.current); openTimer.current = null; }
            scheduleClose();
        }

        // Any touch means the user is not driving with a mouse — get out of the way.
        function onTouch() { cancelTimers(); setOpen(null); }
        function onScroll() { cancelTimers(); setOpen(null); }

        document.addEventListener('pointerover', onOver);
        document.addEventListener('pointerout', onOut);
        document.addEventListener('touchstart', onTouch, { passive: true });
        window.addEventListener('scroll', onScroll, true);
        return () => {
            document.removeEventListener('pointerover', onOver);
            document.removeEventListener('pointerout', onOut);
            document.removeEventListener('touchstart', onTouch);
            window.removeEventListener('scroll', onScroll, true);
            cancelTimers();
        };
    }, [open?.seed.id, cancelTimers, scheduleClose]);

    if (!open) return null;
    return (
        <CardPanel
            seed={open.seed}
            position={open.position}
            onEnter={() => { overCard.current = true; cancelTimers(); }}
            onLeave={() => { overCard.current = false; scheduleClose(); }}
            onClose={() => { overCard.current = false; cancelTimers(); setOpen(null); }}
        />
    );
}

export default ProfileHoverCard;
