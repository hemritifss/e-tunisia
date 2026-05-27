import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as api from '../../api';
import { MessageCircle, UserPlus, UserMinus, ExternalLink, Link2, Sparkles, Check } from 'lucide-react';

/**
 * Facebook-style context menu for any user avatar / byline.
 *
 * Triggered by:
 *   - Right-click on any element with `data-user-id="<id>"`
 *   - Long-press (≥450ms) on the same on touch devices
 *   - Programmatically: `window.openUserMenu({ id, fullName, avatar, handle, plan, anchor })`
 *
 * Actions: Send message (opens chat popup), View profile, Follow/Unfollow, Copy profile link.
 *
 * Globally mounted alongside ChatPopupManager — see mount-messenger.tsx.
 */

interface UserMenuPayload {
    id: string;
    fullName?: string | null;
    avatar?: string | null;
    handle?: string | null;
    plan?: string | null;
    /** Either a DOMRect (preferred) or {x,y} pointer coords. */
    anchor: DOMRect | { x: number; y: number };
}

interface Position {
    x: number;
    y: number;
}

const MENU_WIDTH = 240;
const MENU_HEIGHT_EST = 240;
const LONG_PRESS_MS = 450;

function isPro(plan?: string | null): boolean {
    return plan === 'premium' || plan === 'business' || plan === 'admin';
}

function profileHref(user: UserMenuPayload): string {
    if (user.handle) return `#/u/${encodeURIComponent(user.handle)}`;
    return `#/user/${encodeURIComponent(user.id)}`;
}

function profileUrl(user: UserMenuPayload): string {
    return `${location.origin}${location.pathname}${profileHref(user)}`;
}

function clamp(x: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, x));
}

function positionFromAnchor(a: UserMenuPayload['anchor']): Position {
    let x: number;
    let y: number;
    if ('x' in a && 'y' in a && !('width' in a)) {
        x = a.x;
        y = a.y;
    } else {
        const rect = a as DOMRect;
        x = rect.left;
        y = rect.bottom + 6;
    }
    x = clamp(x, 8, window.innerWidth - MENU_WIDTH - 8);
    y = clamp(y, 8, window.innerHeight - MENU_HEIGHT_EST - 8);
    return { x, y };
}

// ─────────── Menu UI ───────────
function MenuPanel({ user, position, onClose }: { user: UserMenuPayload; position: Position; onClose: () => void }) {
    const [following, setFollowing] = useState<boolean | null>(null);
    const [followBusy, setFollowBusy] = useState(false);
    const [copied, setCopied] = useState(false);
    const ref = useRef<HTMLDivElement | null>(null);
    const me = (() => {
        try { return JSON.parse(localStorage.getItem('etunisia_user') || localStorage.getItem('auth_user') || 'null')?.id ?? null; } catch { return null; }
    })();
    const isSelf = me === user.id;
    const authed = api.isLoggedIn();
    const pro = isPro(user.plan);

    useEffect(() => {
        if (isSelf || !authed) return;
        api.isFollowing(user.id)
            .then((r: any) => setFollowing(typeof r === 'boolean' ? r : !!r?.isFollowing))
            .catch(() => setFollowing(false));
    }, [user.id, isSelf, authed]);

    // Close on outside click, ESC, or scroll
    useEffect(() => {
        const onDocPointer = (e: PointerEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) onClose();
        };
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        const onScroll = () => onClose();
        // Slight delay so the triggering pointerup doesn't immediately close us
        const t = setTimeout(() => {
            document.addEventListener('pointerdown', onDocPointer, true);
        }, 0);
        document.addEventListener('keydown', onKey);
        window.addEventListener('scroll', onScroll, true);
        return () => {
            clearTimeout(t);
            document.removeEventListener('pointerdown', onDocPointer, true);
            document.removeEventListener('keydown', onKey);
            window.removeEventListener('scroll', onScroll, true);
        };
    }, [onClose]);

    // Focus first focusable on mount for keyboard users
    useEffect(() => {
        const firstBtn = ref.current?.querySelector<HTMLElement>('button, a');
        firstBtn?.focus();
    }, []);

    const sendMessage = useCallback(() => {
        const fn = (window as any).openChatPopup;
        if (typeof fn === 'function') fn(user.id);
        else location.hash = `#/messages/user/${encodeURIComponent(user.id)}`;
        onClose();
    }, [user.id, onClose]);

    const toggleFollow = useCallback(async () => {
        if (followBusy || following === null) return;
        setFollowBusy(true);
        const next = !following;
        setFollowing(next); // optimistic
        try {
            if (next) await api.followUser(user.id);
            else await api.unfollowUser(user.id);
        } catch {
            setFollowing(!next);
        } finally {
            setFollowBusy(false);
        }
    }, [followBusy, following, user.id]);

    const copyLink = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(profileUrl(user));
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch {}
    }, [user]);

    return (
        <div
            ref={ref}
            className="user-menu"
            role="menu"
            aria-label={`Actions for ${user.fullName || 'user'}`}
            style={{ top: position.y, left: position.x }}
        >
            <header className="user-menu-head">
                <span className={`user-menu-avatar ${pro ? 'is-pro' : ''}`}>
                    {user.avatar
                        ? <img src={user.avatar} alt="" loading="lazy" />
                        : <span className="user-menu-fallback">{(user.fullName || '?').slice(0, 1).toUpperCase()}</span>}
                </span>
                <div className="user-menu-head-meta">
                    <strong>
                        {user.fullName || 'Traveler'}
                        {pro && <Sparkles size={11} className="user-menu-pro" aria-label="Pro" />}
                    </strong>
                    {user.handle && <small>@{user.handle}</small>}
                </div>
            </header>

            <div className="user-menu-list">
                {!isSelf && authed && (
                    <button type="button" role="menuitem" className="user-menu-item" onClick={sendMessage}>
                        <MessageCircle size={16} /> Send message
                    </button>
                )}
                <a role="menuitem" className="user-menu-item" href={profileHref(user)} onClick={onClose}>
                    <ExternalLink size={16} /> View profile
                </a>
                {!isSelf && authed && following !== null && (
                    <button
                        type="button"
                        role="menuitem"
                        className={`user-menu-item ${following ? 'is-following' : ''}`}
                        onClick={toggleFollow}
                        disabled={followBusy}
                    >
                        {following ? <UserMinus size={16} /> : <UserPlus size={16} />}
                        {following ? 'Unfollow' : 'Follow'}
                    </button>
                )}
                <button type="button" role="menuitem" className="user-menu-item" onClick={copyLink}>
                    {copied ? <Check size={16} /> : <Link2 size={16} />}
                    {copied ? 'Link copied' : 'Copy profile link'}
                </button>
            </div>
        </div>
    );
}

// ─────────── Manager ───────────
export function UserActionMenu() {
    const [open, setOpen] = useState<{ user: UserMenuPayload; position: Position } | null>(null);
    const longPressTimer = useRef<number | null>(null);
    const longPressTarget = useRef<HTMLElement | null>(null);

    useEffect(() => {
        function findUserEl(target: EventTarget | null): HTMLElement | null {
            if (!(target instanceof HTMLElement)) return null;
            return target.closest<HTMLElement>('[data-user-id]');
        }

        function payloadFromEl(el: HTMLElement): UserMenuPayload {
            return {
                id: el.dataset.userId || '',
                fullName: el.dataset.userName || null,
                avatar: el.dataset.userAvatar || null,
                handle: el.dataset.userHandle || null,
                plan: el.dataset.userPlan || null,
                anchor: el.getBoundingClientRect(),
            };
        }

        function onContextMenu(e: MouseEvent) {
            const el = findUserEl(e.target);
            if (!el || !el.dataset.userId) return;
            e.preventDefault();
            const payload = payloadFromEl(el);
            const anchor = { x: e.clientX, y: e.clientY } as DOMRect | { x: number; y: number };
            setOpen({ user: payload, position: positionFromAnchor(anchor) });
        }

        function clearLongPress() {
            if (longPressTimer.current) {
                clearTimeout(longPressTimer.current);
                longPressTimer.current = null;
            }
            longPressTarget.current = null;
        }

        function onPointerDown(e: PointerEvent) {
            if (e.pointerType !== 'touch') return;
            const el = findUserEl(e.target);
            if (!el || !el.dataset.userId) return;
            longPressTarget.current = el;
            longPressTimer.current = window.setTimeout(() => {
                if (!longPressTarget.current) return;
                if ('vibrate' in navigator) try { navigator.vibrate(8); } catch {}
                const payload = payloadFromEl(longPressTarget.current);
                setOpen({ user: payload, position: positionFromAnchor(payload.anchor) });
                longPressTarget.current = null;
            }, LONG_PRESS_MS);
        }

        function onPointerEnd() { clearLongPress(); }
        function onPointerMove() { clearLongPress(); }

        function onProgrammatic(e: Event) {
            const detail: any = (e as CustomEvent).detail;
            if (!detail?.id) return;
            setOpen({
                user: detail,
                position: positionFromAnchor(detail.anchor || { x: window.innerWidth / 2 - MENU_WIDTH / 2, y: window.innerHeight / 2 - 100 }),
            });
        }

        document.addEventListener('contextmenu', onContextMenu);
        document.addEventListener('pointerdown', onPointerDown);
        document.addEventListener('pointerup', onPointerEnd);
        document.addEventListener('pointercancel', onPointerEnd);
        document.addEventListener('pointermove', onPointerMove);
        window.addEventListener('etunisia:open-user-menu', onProgrammatic);
        (window as any).openUserMenu = (payload: UserMenuPayload) => {
            setOpen({ user: payload, position: positionFromAnchor(payload.anchor) });
        };

        return () => {
            document.removeEventListener('contextmenu', onContextMenu);
            document.removeEventListener('pointerdown', onPointerDown);
            document.removeEventListener('pointerup', onPointerEnd);
            document.removeEventListener('pointercancel', onPointerEnd);
            document.removeEventListener('pointermove', onPointerMove);
            window.removeEventListener('etunisia:open-user-menu', onProgrammatic);
            delete (window as any).openUserMenu;
            clearLongPress();
        };
    }, []);

    if (!open) return null;
    return <MenuPanel user={open.user} position={open.position} onClose={() => setOpen(null)} />;
}

export default UserActionMenu;
