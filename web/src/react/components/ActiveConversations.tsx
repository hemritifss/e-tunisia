import React, { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import * as api from '../../api';
import { getOnlineUsers, isUserOnline } from '../../realtime';
import { MessageCircle, Search, X, Sparkles } from 'lucide-react';
import { goTo, currentPath, onRouteChange } from '../../router';

/**
 * Active conversations & online friends.
 *
 * Two surfaces:
 *  - Desktop: a rail card embedded in FeedRightRail (`<ActiveConversationsRail />`)
 *  - Mobile : a floating launcher button (`<ActiveConversationsLauncher />`) that
 *             opens a bottom sheet with the same content.
 *
 * Clicks open the global chat popup via `window.openChatPopup(userId)` rather
 * than navigating away — this is how Facebook keeps the user "in feed" while
 * messaging.
 */

interface Room {
    id: string;
    participants: Array<{ id: string; fullName: string; avatar?: string | null; plan?: string | null }>;
    lastMessage?: { content: string; createdAt: string; senderId: string } | null;
    unreadCount?: number;
}

interface OtherUser {
    id: string;
    fullName: string;
    avatar: string | null;
    plan: string | null;
}

function myId(): string | null {
    try {
        const raw = localStorage.getItem('etunisia_user') || localStorage.getItem('auth_user');
        if (!raw) return null;
        return JSON.parse(raw)?.id ?? null;
    } catch { return null; }
}

function otherOf(room: Room, me: string | null): OtherUser {
    const p = (room.participants || []).find((x) => x.id !== me) || room.participants?.[0];
    return {
        id: p?.id ?? '',
        fullName: p?.fullName || 'Traveler',
        avatar: p?.avatar ?? null,
        plan: p?.plan ?? null,
    };
}

function isPro(plan: string | null | undefined): boolean {
    return plan === 'premium' || plan === 'business' || plan === 'admin';
}

function timeAgoShort(d: string): string {
    if (!d) return '';
    const ms = Date.now() - new Date(d).getTime();
    const m = Math.floor(ms / 60_000);
    if (m < 1) return 'now';
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h`;
    const days = Math.floor(h / 24);
    if (days < 7) return `${days}d`;
    return new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function openChat(userId: string) {
    const fn = (window as any).openChatPopup;
    if (typeof fn === 'function') fn(userId);
    else goTo(`/messages/user/${encodeURIComponent(userId)}`);
}

// ─────────── Hook: rooms + presence ───────────
function useRoomsWithPresence() {
    const me = myId();
    const { data, isLoading } = useQuery({
        queryKey: ['my-rooms'],
        queryFn: () => api.getMyRooms(),
        enabled: api.isLoggedIn(),
        staleTime: 30_000,
    });
    const rooms: Room[] = useMemo(
        () => (Array.isArray(data) ? data : []).slice(0, 20),
        [data],
    );

    // Re-render on presence change so badges flip live.
    const [, setTick] = useState(0);
    useEffect(() => {
        const bump = () => setTick((t) => t + 1);
        window.addEventListener('etunisia:presence-update', bump);
        window.addEventListener('etunisia:presence-snapshot', bump);
        window.addEventListener('etunisia:dm-new-message', bump);
        return () => {
            window.removeEventListener('etunisia:presence-update', bump);
            window.removeEventListener('etunisia:presence-snapshot', bump);
            window.removeEventListener('etunisia:dm-new-message', bump);
        };
    }, []);

    const activeRooms = rooms.filter((r) => isUserOnline(otherOf(r, me).id));
    const otherRooms = rooms.filter((r) => !isUserOnline(otherOf(r, me).id));
    const totalUnread = rooms.reduce((s, r) => s + (r.unreadCount || 0), 0);

    return { rooms, activeRooms, otherRooms, totalUnread, isLoading, me };
}

// ─────────── Avatar with presence + Pro ring ───────────
function PresenceAvatar({ user, online, size = 36 }: { user: OtherUser; online: boolean; size?: number }) {
    const pro = isPro(user.plan);
    return (
        <span
            className={`active-conv-avatar ${pro ? 'is-pro' : ''}`}
            style={{ width: size, height: size }}
        >
            {user.avatar
                ? <img src={user.avatar} alt="" loading="lazy" />
                : <span className="active-conv-fallback">{user.fullName.slice(0, 1).toUpperCase()}</span>}
            {online && <span className="active-conv-presence" aria-label="Active now" />}
        </span>
    );
}

// ─────────── Row ───────────
function ConversationRow({
    room,
    me,
    online,
    onPick,
    showPreview,
}: {
    room: Room;
    me: string | null;
    online: boolean;
    onPick: (userId: string) => void;
    showPreview: boolean;
}) {
    const other = otherOf(room, me);
    const last = room.lastMessage;
    const unread = room.unreadCount || 0;
    const lastMine = last && last.senderId === me;
    return (
        <button
            type="button"
            className={`active-conv-row ${unread ? 'has-unread' : ''}`}
            onClick={() => onPick(other.id)}
            data-user-id={other.id}
            data-user-name={other.fullName}
            data-user-avatar={other.avatar || undefined}
            data-user-plan={other.plan || undefined}
        >
            <PresenceAvatar user={other} online={online} />
            <span className="active-conv-meta">
                <strong>
                    {other.fullName}
                    {isPro(other.plan) && <Sparkles size={11} className="active-conv-pro" aria-label="Pro" />}
                </strong>
                {showPreview && last && (
                    <span className="active-conv-preview">
                        {lastMine ? 'You: ' : ''}{last.content}
                    </span>
                )}
                {showPreview && !last && (
                    <span className="active-conv-preview muted">Start a conversation</span>
                )}
            </span>
            {showPreview && last && (
                <span className="active-conv-time">{timeAgoShort(last.createdAt)}</span>
            )}
            {unread > 0 && <span className="active-conv-badge" aria-label={`${unread} unread`}>{unread > 9 ? '9+' : unread}</span>}
        </button>
    );
}

// ─────────── Inner content (shared between rail + sheet) ───────────
function ConversationsList({ compact = false }: { compact?: boolean }) {
    const { activeRooms, otherRooms, isLoading, me } = useRoomsWithPresence();

    if (isLoading) {
        return (
            <div className="active-conv-list">
                <div className="active-conv-skel" />
                <div className="active-conv-skel" />
                <div className="active-conv-skel" />
            </div>
        );
    }

    if (activeRooms.length === 0 && otherRooms.length === 0) {
        return (
            <div className="active-conv-empty">
                <MessageCircle size={20} />
                <p>No conversations yet.</p>
                <a className="btn ghost sm" href="#/explore">Find travelers</a>
            </div>
        );
    }

    return (
        <div className="active-conv-list">
            {activeRooms.length > 0 && (
                <>
                    <h4 className="active-conv-section">
                        <span className="active-conv-section-dot" /> Active now · {activeRooms.length}
                    </h4>
                    {activeRooms.slice(0, compact ? 5 : 8).map((r) => (
                        <ConversationRow
                            key={r.id}
                            room={r}
                            me={me}
                            online={true}
                            onPick={openChat}
                            showPreview={!compact || (r.unreadCount || 0) > 0}
                        />
                    ))}
                </>
            )}
            {otherRooms.length > 0 && (
                <>
                    <h4 className="active-conv-section">Recent</h4>
                    {otherRooms.slice(0, compact ? 4 : 10).map((r) => (
                        <ConversationRow
                            key={r.id}
                            room={r}
                            me={me}
                            online={false}
                            onPick={openChat}
                            showPreview
                        />
                    ))}
                </>
            )}
        </div>
    );
}

// ─────────── Desktop: rail card ───────────
export function ActiveConversationsRail() {
    if (!api.isLoggedIn()) return null;
    return (
        <section className="rail-card active-conv-rail">
            <header className="rail-card-head">
                <h3><MessageCircle size={14} /> Conversations</h3>
                <a href="#/messages">See all</a>
            </header>
            <ConversationsList compact />
        </section>
    );
}

// ─────────── Mobile: floating launcher + bottom sheet ───────────
export function ActiveConversationsLauncher() {
    const [open, setOpen] = useState(false);
    const { totalUnread, activeRooms } = useRoomsWithPresence();
    const [hidden, setHidden] = useState<boolean>(() => isMessagesRoute() || !api.isLoggedIn());

    useEffect(() => {
        function onHash() { setHidden(isMessagesRoute() || !api.isLoggedIn()); }
        return onRouteChange(onHash);
    }, []);

    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
        document.addEventListener('keydown', onKey);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = '';
        };
    }, [open]);

    if (hidden) return null;

    return (
        <>
            <button
                type="button"
                className="active-conv-fab"
                onClick={() => setOpen(true)}
                aria-label={`Conversations${totalUnread ? `, ${totalUnread} unread` : ''}`}
            >
                <MessageCircle size={20} />
                {totalUnread > 0 && (
                    <span className="active-conv-fab-badge" aria-hidden="true">{totalUnread > 9 ? '9+' : totalUnread}</span>
                )}
                {activeRooms.length > 0 && totalUnread === 0 && (
                    <span className="active-conv-fab-dot" aria-hidden="true" />
                )}
            </button>

            {open && (
                <div className="active-conv-sheet-root" role="dialog" aria-modal="true" aria-label="Conversations">
                    <div className="active-conv-sheet-scrim" onClick={() => setOpen(false)} />
                    <div className="active-conv-sheet">
                        <header className="active-conv-sheet-head">
                            <h3><MessageCircle size={16} /> Conversations</h3>
                            <div className="active-conv-sheet-actions">
                                <a href="#/search" className="active-conv-icon-btn" aria-label="Search travelers" onClick={() => setOpen(false)}>
                                    <Search size={16} />
                                </a>
                                <button type="button" className="active-conv-icon-btn" onClick={() => setOpen(false)} aria-label="Close">
                                    <X size={16} />
                                </button>
                            </div>
                        </header>
                        <ConversationsList />
                        <footer className="active-conv-sheet-foot">
                            <a href="#/messages" onClick={() => setOpen(false)}>Open full Messages →</a>
                        </footer>
                    </div>
                </div>
            )}
        </>
    );
}

function isMessagesRoute(): boolean {
    return currentPath().startsWith('/messages');
}

export default ActiveConversationsLauncher;
