import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '../../api';
import { isUserOnline, emitDmTyping } from '../../realtime';
import { X, Minus, Maximize2, Send, Sparkles } from 'lucide-react';
import { goTo, currentPath, onRouteChange } from '../../router';

/**
 * Messenger-style floating chat popups.
 *
 * Mounted once globally; renders a stack of mini-chat windows in the bottom
 * area of the viewport. Hidden when the user is on /#/messages (no duplication).
 *
 * Public API:
 *   window.openChatPopup(userId)         // open or focus a popup for a user
 *   window.dispatchEvent('etunisia:open-chat', { detail: { userId } })
 *
 * Persists open chats to localStorage so they survive route changes.
 */

const STORAGE_KEY = 'etunisia_open_chats';
const MAX_DESKTOP = 3;
const MAX_MOBILE = 1;

interface OpenChat {
    roomId: string;
    userId: string;
    fullName: string;
    avatar: string | null;
    plan?: string | null;
    minimized: boolean;
    unread: number;
}

interface ChatMessage {
    id: string;
    content: string;
    senderId: string;
    createdAt: string;
}

// ─────────── Persistence ───────────
function loadOpen(): OpenChat[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const arr = JSON.parse(raw);
        return Array.isArray(arr) ? arr : [];
    } catch { return []; }
}
function saveOpen(chats: OpenChat[]) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(chats)); } catch {}
}

// ─────────── Helpers ───────────
function isMessagesRoute(): boolean {
    return currentPath().startsWith('/messages');
}

function myId(): string | null {
    try {
        const raw = localStorage.getItem('etunisia_user') || localStorage.getItem('auth_user');
        if (!raw) return null;
        const u = JSON.parse(raw);
        return u?.id ?? null;
    } catch { return null; }
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

// ─────────── Single popup window ───────────
function ChatWindow({
    chat,
    onClose,
    onMinimize,
    onExpand,
    onClear,
}: {
    chat: OpenChat;
    onClose: () => void;
    onMinimize: () => void;
    onExpand: () => void;
    onClear: () => void;
}) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [draft, setDraft] = useState('');
    const [sending, setSending] = useState(false);
    const [theirTyping, setTheirTyping] = useState(false);
    const listRef = useRef<HTMLDivElement | null>(null);
    const typingTimer = useRef<number | null>(null);
    const me = myId();
    const isPro = chat.plan === 'premium' || chat.plan === 'business' || chat.plan === 'admin';
    const online = isUserOnline(chat.userId);

    const scrollToBottom = useCallback(() => {
        requestAnimationFrame(() => {
            if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
        });
    }, []);

    useEffect(() => {
        let cancelled = false;
        if (chat.minimized) return;
        api.getRoomMessages(chat.roomId, 1, 50)
            .then((msgs: any) => {
                if (cancelled) return;
                const arr = Array.isArray(msgs) ? msgs : (msgs?.data ?? []);
                setMessages(arr.slice().reverse());
                scrollToBottom();
            })
            .catch(() => {});
        api.markRoomRead(chat.roomId).then(onClear).catch(() => {});
        return () => { cancelled = true; };
    }, [chat.roomId, chat.minimized, scrollToBottom, onClear]);

    useEffect(() => {
        function onNew(e: Event) {
            const detail: any = (e as CustomEvent).detail;
            if (!detail || detail.roomId !== chat.roomId) return;
            const m: ChatMessage = {
                id: detail.id ?? Math.random().toString(36),
                content: detail.content,
                senderId: detail.senderId,
                createdAt: detail.createdAt ?? new Date().toISOString(),
            };
            setMessages((prev) => [...prev, m]);
            scrollToBottom();
            if (!chat.minimized) api.markRoomRead(chat.roomId).then(onClear).catch(() => {});
        }
        function onTyping(e: Event) {
            const detail: any = (e as CustomEvent).detail;
            if (!detail || detail.roomId !== chat.roomId || detail.userId === me) return;
            setTheirTyping(!!detail.isTyping);
        }
        window.addEventListener('etunisia:dm-new-message', onNew);
        window.addEventListener('etunisia:dm-typing', onTyping);
        return () => {
            window.removeEventListener('etunisia:dm-new-message', onNew);
            window.removeEventListener('etunisia:dm-typing', onTyping);
        };
    }, [chat.roomId, chat.minimized, me, scrollToBottom, onClear]);

    const send = useCallback(async () => {
        const text = draft.trim();
        if (!text || sending) return;
        setSending(true);
        try {
            const m = await api.sendMessage(chat.roomId, text);
            const msg: ChatMessage = {
                id: m?.id ?? Math.random().toString(36),
                content: text,
                senderId: me ?? '',
                createdAt: m?.createdAt ?? new Date().toISOString(),
            };
            setMessages((prev) => [...prev, msg]);
            setDraft('');
            scrollToBottom();
            emitDmTyping(chat.roomId, [chat.userId], false);
        } finally {
            setSending(false);
        }
    }, [draft, sending, chat.roomId, chat.userId, me, scrollToBottom]);

    const onDraftChange = (v: string) => {
        setDraft(v);
        emitDmTyping(chat.roomId, [chat.userId], true);
        if (typingTimer.current) clearTimeout(typingTimer.current);
        typingTimer.current = window.setTimeout(() => {
            emitDmTyping(chat.roomId, [chat.userId], false);
        }, 1800);
    };

    if (chat.minimized) {
        return (
            <button
                type="button"
                className={`chat-pop chat-pop-mini ${isPro ? 'is-pro' : ''}`}
                onClick={onMinimize}
                aria-label={`Open chat with ${chat.fullName}${chat.unread ? `, ${chat.unread} unread` : ''}`}
                title={chat.fullName}
            >
                <span className={`chat-pop-avatar ${isPro ? 'chat-pop-avatar-pro' : ''}`}>
                    {chat.avatar
                        ? <img src={chat.avatar} alt="" loading="lazy" />
                        : <span className="chat-pop-fallback">{chat.fullName.slice(0, 1).toUpperCase()}</span>}
                    {online && <span className="chat-pop-presence" aria-hidden="true" />}
                </span>
                {chat.unread > 0 && (
                    <span className="chat-pop-unread" aria-hidden="true">{chat.unread > 9 ? '9+' : chat.unread}</span>
                )}
            </button>
        );
    }

    return (
        <section
            className={`chat-pop chat-pop-open ${isPro ? 'is-pro' : ''}`}
            role="dialog"
            aria-label={`Chat with ${chat.fullName}`}
        >
            <header className="chat-pop-head">
                <a className="chat-pop-head-user" href={`#/u/${encodeURIComponent(chat.userId)}`}>
                    <span className={`chat-pop-avatar sm ${isPro ? 'chat-pop-avatar-pro' : ''}`}>
                        {chat.avatar
                            ? <img src={chat.avatar} alt="" loading="lazy" />
                            : <span className="chat-pop-fallback">{chat.fullName.slice(0, 1).toUpperCase()}</span>}
                        {online && <span className="chat-pop-presence" aria-hidden="true" />}
                    </span>
                    <span className="chat-pop-head-meta">
                        <strong>
                            {chat.fullName}
                            {isPro && <Sparkles size={12} className="chat-pop-pro-spark" aria-label="Pro" />}
                        </strong>
                        <small>{online ? 'Active now' : 'Offline'}</small>
                    </span>
                </a>
                <div className="chat-pop-head-actions">
                    <button
                        type="button"
                        className="chat-pop-icon-btn"
                        onClick={onExpand}
                        aria-label="Open in full messages"
                        title="Open in Messages"
                    >
                        <Maximize2 size={14} />
                    </button>
                    <button
                        type="button"
                        className="chat-pop-icon-btn"
                        onClick={onMinimize}
                        aria-label="Minimize chat"
                        title="Minimize"
                    >
                        <Minus size={14} />
                    </button>
                    <button
                        type="button"
                        className="chat-pop-icon-btn"
                        onClick={onClose}
                        aria-label={`Close chat with ${chat.fullName}`}
                        title="Close"
                    >
                        <X size={14} />
                    </button>
                </div>
            </header>

            <div className="chat-pop-list" ref={listRef} role="log" aria-live="polite">
                {messages.length === 0 ? (
                    <div className="chat-pop-empty">Say hi to {chat.fullName.split(' ')[0]} 👋</div>
                ) : (
                    messages.map((m, i) => {
                        const mine = m.senderId === me;
                        const prev = messages[i - 1];
                        const grouped = prev && prev.senderId === m.senderId;
                        return (
                            <div key={m.id} className={`chat-pop-bubble ${mine ? 'mine' : 'theirs'} ${grouped ? 'grouped' : ''}`}>
                                <span>{m.content}</span>
                                {!grouped && <em>{timeAgoShort(m.createdAt)}</em>}
                            </div>
                        );
                    })
                )}
                {theirTyping && (
                    <div className="chat-pop-typing" aria-label={`${chat.fullName} is typing`}>
                        <span /><span /><span />
                    </div>
                )}
            </div>

            <form
                className="chat-pop-input"
                onSubmit={(e) => { e.preventDefault(); send(); }}
            >
                <input
                    type="text"
                    value={draft}
                    onChange={(e) => onDraftChange(e.target.value)}
                    placeholder={`Message ${chat.fullName.split(' ')[0]}…`}
                    aria-label="Type a message"
                    maxLength={2000}
                />
                <button
                    type="submit"
                    className="chat-pop-send"
                    disabled={!draft.trim() || sending}
                    aria-label="Send message"
                >
                    <Send size={14} />
                </button>
            </form>
        </section>
    );
}

// ─────────── Manager ───────────
export function ChatPopupManager() {
    const [openChats, setOpenChats] = useState<OpenChat[]>(() => loadOpen());
    const [hidden, setHidden] = useState<boolean>(() => isMessagesRoute() || !api.isLoggedIn());
    const queryClient = useQueryClient();

    useEffect(() => { saveOpen(openChats); }, [openChats]);

    useEffect(() => {
        function onHash() { setHidden(isMessagesRoute() || !api.isLoggedIn()); }
        const unsub = onRouteChange(onHash);
        window.addEventListener('storage', onHash);
        return () => {
            unsub();
            window.removeEventListener('storage', onHash);
        };
    }, []);

    const upsert = useCallback((chat: OpenChat) => {
        setOpenChats((prev) => {
            const idx = prev.findIndex((c) => c.roomId === chat.roomId);
            const limit = window.innerWidth < 768 ? MAX_MOBILE : MAX_DESKTOP;
            if (idx >= 0) {
                const next = prev.slice();
                next[idx] = { ...next[idx], ...chat, minimized: false };
                return next;
            }
            const next = [{ ...chat, minimized: false }, ...prev];
            return next.slice(0, limit);
        });
    }, []);

    const openByUser = useCallback(async (userId: string) => {
        if (!userId || !api.isLoggedIn()) {
            goTo('/login');
            return;
        }
        try {
            const room: any = await api.openDirectRoom(userId);
            const other = (room.participants || []).find((p: any) => p.id !== myId()) || {};
            upsert({
                roomId: room.id,
                userId: other.id || userId,
                fullName: other.fullName || 'Traveler',
                avatar: other.avatar || null,
                plan: other.plan || null,
                minimized: false,
                unread: 0,
            });
            queryClient.invalidateQueries({ queryKey: ['my-rooms'] });
        } catch (e) {
            console.warn('Could not open chat popup', e);
        }
    }, [upsert, queryClient]);

    // Wire global hooks
    useEffect(() => {
        (window as any).openChatPopup = openByUser;
        function onOpen(e: Event) {
            const detail: any = (e as CustomEvent).detail;
            if (detail?.userId) openByUser(detail.userId);
            if (detail?.roomId && detail?.user) {
                upsert({
                    roomId: detail.roomId,
                    userId: detail.user.id,
                    fullName: detail.user.fullName || 'Traveler',
                    avatar: detail.user.avatar || null,
                    plan: detail.user.plan || null,
                    minimized: false,
                    unread: 0,
                });
            }
        }
        function onNew(e: Event) {
            const detail: any = (e as CustomEvent).detail;
            if (!detail) return;
            setOpenChats((prev) => {
                const i = prev.findIndex((c) => c.roomId === detail.roomId);
                if (i < 0) return prev;
                if (!prev[i].minimized && !isMessagesRoute()) return prev;
                const next = prev.slice();
                next[i] = { ...next[i], unread: next[i].unread + 1 };
                return next;
            });
        }
        window.addEventListener('etunisia:open-chat', onOpen);
        window.addEventListener('etunisia:dm-new-message', onNew);
        return () => {
            window.removeEventListener('etunisia:open-chat', onOpen);
            window.removeEventListener('etunisia:dm-new-message', onNew);
            delete (window as any).openChatPopup;
        };
    }, [openByUser, upsert]);

    if (hidden || openChats.length === 0) return null;

    return (
        <div className="chat-pop-stack" aria-label="Chat popups">
            {openChats.map((c) => (
                <ChatWindow
                    key={c.roomId}
                    chat={c}
                    onClose={() => setOpenChats((prev) => prev.filter((x) => x.roomId !== c.roomId))}
                    onMinimize={() => setOpenChats((prev) =>
                        prev.map((x) => x.roomId === c.roomId ? { ...x, minimized: !x.minimized, unread: x.minimized ? 0 : x.unread } : x)
                    )}
                    onExpand={() => { goTo(`/messages/${c.roomId}`); }}
                    onClear={() => setOpenChats((prev) =>
                        prev.map((x) => x.roomId === c.roomId ? { ...x, unread: 0 } : x)
                    )}
                />
            ))}
        </div>
    );
}

export default ChatPopupManager;
