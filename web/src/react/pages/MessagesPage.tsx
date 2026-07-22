import '../../styles/messages-search.css';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Mail, MessageCircle, Info, Send, Trash2, XCircle } from 'lucide-react';
import * as api from '../../api';
import { currentPath, replace, onRouteChange } from '../../router';
import { requireAuth, showToast } from '../../ui-utils';
import { emitDmTyping, isUserOnline } from '../../realtime';
import { openSafetyMenu } from '../../safety-menu';
import { formatTime, formatDayLabel, formatShortDate } from '../../shared/dates';
import { t } from '../../i18n';
import { useT } from '../../i18n/useT';

// Migrated from vanilla pages/messages.ts — realtime DM inbox + thread (Socket.IO bridge).

function timeAgo(d: string | Date): string {
  if (!d) return '';
  const ms = Date.now() - new Date(d).getTime();
  const m = Math.floor(ms / 60_000);
  if (m < 1) return 'now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days}d`;
  return formatShortDate(d);
}

function avatarFor(name: string, raw?: string): string {
  const seed = encodeURIComponent(name);
  return raw && (raw.startsWith('data:') || raw.startsWith('http')) ? raw : `https://api.dicebear.com/9.x/thumbs/svg?seed=${seed}`;
}

function subRouteOf(): { kind: 'inbox' | 'thread' | 'open-user'; id?: string } {
  const path = currentPath();
  const open = path.match(/^\/messages\/user\/([0-9a-fA-F-]+)/);
  if (open) return { kind: 'open-user', id: open[1] };
  const m = path.match(/^\/messages\/([0-9a-fA-F-]+)/);
  if (m) return { kind: 'thread', id: m[1] };
  return { kind: 'inbox' };
}

function groupByDay(messages: any[]) {
  const fmtKey = (d: Date) => d.toDateString();
  const groups: { key: string; label: string; items: any[] }[] = [];
  for (const m of messages) {
    const d = new Date(m.createdAt);
    const key = fmtKey(d);
    let g = groups[groups.length - 1];
    if (!g || g.key !== key) { g = { key, label: formatDayLabel(d), items: [] }; groups.push(g); }
    g.items.push(m);
  }
  return groups;
}

function Bubble({ m, myId, otherAvatar, onUnsend }: { m: any; myId: string | null; otherAvatar: string; onUnsend?: (id: string) => void }) {
  const mine = m.senderId === myId;
  // Two-tap unsend: first tap arms a "Remove?" pill in place, second commits.
  // Auto-disarms after 3s so a stray click never destroys anything.
  const [confirming, setConfirming] = useState(false);
  const confirmTimer = useRef<number | null>(null);
  useEffect(() => () => { if (confirmTimer.current) window.clearTimeout(confirmTimer.current); }, []);
  const time = m.createdAt ? formatTime(m.createdAt) : '';

  if (m.isDeleted) {
    return (
      <div className={`dm-bubble-row ${mine ? 'mine' : 'theirs'}`} data-msg-id={m.id}>
        {!mine && <img className="dm-bubble-avatar" src={otherAvatar} alt="" />}
        <div className="dm-bubble is-removed">
          <p>{mine ? t('dm.removedYou') : t('dm.removedOther')}</p>
          <span className="dm-bubble-time">{time}</span>
        </div>
      </div>
    );
  }

  const askUnsend = () => {
    if (confirming) {
      if (confirmTimer.current) window.clearTimeout(confirmTimer.current);
      setConfirming(false);
      onUnsend?.(m.id);
      return;
    }
    setConfirming(true);
    confirmTimer.current = window.setTimeout(() => setConfirming(false), 3000);
  };

  return (
    <div className={`dm-bubble-row ${mine ? 'mine' : 'theirs'}`} data-msg-id={m.id}>
      {!mine && <img className="dm-bubble-avatar" src={otherAvatar} alt="" />}
      <div className={`dm-bubble ${m._optimistic ? 'pending' : ''}`}>
        <p>{m.content}</p>
        <span className="dm-bubble-time">{time}{m._optimistic ? ` · ${t('dm.sending')}` : ''}</span>
        {mine && onUnsend && !m._optimistic && !String(m.id).startsWith('tmp-') && (
          <button
            type="button"
            className={`dm-unsend${confirming ? ' is-confirming' : ''}`}
            onClick={askUnsend}
            aria-label={confirming ? t('dm.removeConfirmLabel') : t('dm.removeLabel')}
          >
            {confirming ? t('dm.removeAsk') : <Trash2 size={12} aria-hidden="true" />}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Inbox list ──
function InboxList({ myId, activeRoom }: { myId: string | null; activeRoom: string | null }) {
  const { data: items, isLoading } = useQuery({
    queryKey: ['dm-rooms'],
    queryFn: async () => {
      const rooms = (await api.getMyRooms().catch(() => [])) || [];
      return Promise.all(rooms.map(async (r: any) => {
        const otherId = (r.participantIds || []).find((id: string) => id !== myId);
        let other = null;
        if (otherId) { try { other = await api.getPublicUser(otherId); } catch { /* ignore */ } }
        return { room: r, other };
      }));
    },
  });

  if (isLoading) {
    return <div className="messages-skeleton">{[0, 1, 2, 3].map((i) => (
      <div className="sk-convo" key={i}><div className="sk-convo-avatar skeleton-block" /><div className="sk-convo-lines"><div className="sk-convo-line name skeleton-block" /><div className="sk-convo-line msg skeleton-block" /></div></div>
    ))}</div>;
  }
  if (!items || items.length === 0) {
    return <div className="dm-inbox-empty"><Mail /><p>{t('dm.noConversations')}</p><p className="text-xs text-muted">{t('dm.visitProfile')}</p></div>;
  }
  return (
    <>
      {items.map(({ room, other }: any) => {
        const name = other?.fullName || room.name || 'Conversation';
        const avatar = avatarFor(name, other?.avatar);
        const lm = room.lastMessage;
        const preview = lm?.content || t('dm.newConversation');
        const mineLast = lm?.senderId === myId;
        const otherId = other?.id || '';
        const online = otherId ? isUserOnline(otherId) : false;
        return (
          <a key={room.id} className={`dm-inbox-row ${activeRoom === room.id ? 'active' : ''}`} href={`#/messages/${room.id}`}
             data-room={room.id} data-user-id={otherId} data-hover-card="off" data-user-name={name} data-user-avatar={avatar} data-user-handle={other?.handle || ''} data-user-plan={other?.plan || ''}>
            {/* Hover card only from the avatar — on the whole row it pops while
                you're just mousing toward a conversation. */}
            <span className="dm-inbox-avatar-wrap" data-user-id={otherId} data-user-name={name} data-user-avatar={avatar} data-user-handle={other?.handle || ''} data-user-plan={other?.plan || ''}>
              <img src={avatar} alt="" className="dm-inbox-avatar" loading="lazy" />
              <span className={`dm-inbox-presence-dot${online ? ' is-online' : ''}`} data-presence-for={otherId} aria-hidden="true" />
            </span>
            <div className="dm-inbox-info">
              <div className="dm-inbox-name-row"><strong>{name}</strong><span className="dm-inbox-time">{timeAgo(lm?.timestamp || room.updatedAt)}</span></div>
              <div className="dm-inbox-preview">{mineLast && <span className="dm-inbox-you">{t('dm.youPrefix')}</span>}{preview}</div>
            </div>
          </a>
        );
      })}
    </>
  );
}

// ── Thread pane ──
function ThreadPane({ roomId, myId }: { roomId: string; myId: string | null }) {
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<any[]>([]);
  const [other, setOther] = useState<any>(null);
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading] = useState(true);
  const [typing, setTyping] = useState(false);
  const [seen, setSeen] = useState(false);
  const [online, setOnline] = useState(false);
  const [draft, setDraft] = useState('');
  const [showInfo, setShowInfo] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const otherIdRef = useRef<string | null>(null);

  const scrollToBottom = () => { const b = bodyRef.current; if (b) b.scrollTop = b.scrollHeight; };

  // Memoised so effects can depend on it without rebuilding themselves each render.
  const addMessage = useCallback((m: any) => setMessages((prev) => {
    if (prev.some((x) => x.id === m.id)) return prev;
    if (m.senderId === myId) {
      const idx = prev.findIndex((x) => x._optimistic && x.content === m.content);
      if (idx >= 0) { const copy = [...prev]; copy[idx] = m; return copy; }
    }
    return [...prev, m];
  }), [myId]);

  // Initial load: messages + resolve other participant.
  useEffect(() => {
    let cancelled = false;
    setLoading(true); setLoadError(''); setSeen(false); setTyping(false);
    (async () => {
      let msgs: any[] = [];
      try { msgs = await api.getRoomMessages(roomId, 1, 100); }
      catch (e: any) { if (!cancelled) { setLoadError(e?.message || 'Cannot load chat'); setLoading(false); } return; }
      const asc = [...msgs].reverse();
      if (cancelled) return;
      setMessages(asc);

      let otherId: string | null = asc.find((m) => m.senderId !== myId)?.senderId || null;
      if (!otherId) {
        try { const rooms = await api.getMyRooms(); otherId = (rooms?.find((r: any) => r.id === roomId)?.participantIds || []).find((id: string) => id !== myId) || null; } catch { /* ignore */ }
      }
      otherIdRef.current = otherId;
      let o: any = null;
      if (otherId) { try { o = await api.getPublicUser(otherId); } catch { /* ignore */ } }
      if (cancelled) return;
      setOther(o);
      setOnline(otherId ? isUserOnline(otherId) : false);
      setLoading(false);
      api.markRoomRead(roomId).catch(() => {});
      const lastMine = [...asc].reverse().find((m) => m.senderId === myId);
      if (lastMine && lastMine.isRead) setSeen(true);
    })();
    return () => { cancelled = true; };
  }, [roomId, myId]);

  useEffect(scrollToBottom, [messages, typing]);

  // Realtime listeners (Socket.IO → window CustomEvents).
  useEffect(() => {
    let hideTimer: number | null = null;
    const onNew = (e: Event) => {
      const p = (e as CustomEvent).detail;
      if (!p) return;
      if (p.roomId !== roomId) { queryClient.invalidateQueries({ queryKey: ['dm-rooms'] }); return; }
      if (p.message) { addMessage(p.message); api.markRoomRead(roomId).catch(() => {}); }
    };
    const onTyping = (e: Event) => {
      const p = (e as CustomEvent).detail;
      if (!p || p.roomId !== roomId || p.userId === myId) return;
      setTyping(!!p.isTyping);
      if (p.isTyping) { if (hideTimer) window.clearTimeout(hideTimer); hideTimer = window.setTimeout(() => setTyping(false), 5000); }
    };
    const onRead = (e: Event) => {
      const p = (e as CustomEvent).detail;
      if (!p || p.roomId !== roomId || p.readerId === myId) return;
      setSeen(true);
    };
    const onPresence = (e: Event) => {
      const p = (e as CustomEvent).detail;
      if (!p || !otherIdRef.current || p.userId !== otherIdRef.current) return;
      setOnline(!!p.online);
    };
    // The other side unsent something — tombstone it live (mirrors ChatPopupManager).
    const onDeleted = (e: Event) => {
      const p = (e as CustomEvent).detail;
      if (!p || p.roomId !== roomId) return;
      setMessages((prev) => prev.map((x) => (x.id === p.messageId ? { ...x, isDeleted: true, content: '' } : x)));
    };
    window.addEventListener('etunisia:dm-new-message', onNew);
    window.addEventListener('etunisia:dm-typing', onTyping);
    window.addEventListener('etunisia:dm-read', onRead);
    window.addEventListener('etunisia:presence-update', onPresence);
    window.addEventListener('etunisia:dm-message-deleted', onDeleted);
    return () => {
      if (hideTimer) window.clearTimeout(hideTimer);
      window.removeEventListener('etunisia:dm-new-message', onNew);
      window.removeEventListener('etunisia:dm-typing', onTyping);
      window.removeEventListener('etunisia:dm-read', onRead);
      window.removeEventListener('etunisia:presence-update', onPresence);
      window.removeEventListener('etunisia:dm-message-deleted', onDeleted);
    };
  }, [roomId, myId]);

  // Fallback polling (20s). `messages` is read through a ref rather than listed
  // as a dep — depending on it tore down and rebuilt the interval on every
  // message, so the timer kept resetting and the fallback rarely fired.
  const messagesRef = useRef(messages);
  useEffect(() => { messagesRef.current = messages; }, [messages]);

  // Optimistic unsend with full-snapshot rollback (the optimistic update blanks
  // `content`, so restoring only `isDeleted` would resurrect it empty).
  const unsend = useCallback(async (messageId: string) => {
    const original = messagesRef.current.find((x) => x.id === messageId);
    setMessages((prev) => prev.map((x) => (x.id === messageId ? { ...x, isDeleted: true, content: '' } : x)));
    try {
      await api.deleteMessage(messageId);
    } catch {
      if (original) setMessages((prev) => prev.map((x) => (x.id === messageId ? original : x)));
      showToast(t('dm.couldNotRemove'), { type: 'error' });
    }
  }, []);

  useEffect(() => {
    const poll = window.setInterval(async () => {
      if (document.hidden) return; // don't poll a backgrounded tab
      try {
        const latest = await api.getRoomMessages(roomId, 1, 50);
        const have = new Set(messagesRef.current.map((m) => m.id));
        const fresh = (latest || []).slice().reverse().filter((m: any) => !have.has(m.id) && !String(m.id).startsWith('tmp-'));
        if (fresh.length) { fresh.forEach(addMessage); api.markRoomRead(roomId).catch(() => {}); }
      } catch { /* ignore */ }
    }, 20000);
    return () => window.clearInterval(poll);
  }, [roomId, addMessage]);

  const lastEmit = useRef(0);
  const typingTimer = useRef<number | null>(null);
  const onInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDraft(e.target.value);
    const ta = e.target;
    ta.style.height = 'auto';
    ta.style.height = Math.min(120, ta.scrollHeight) + 'px';
    const otherId = otherIdRef.current;
    if (!otherId) return;
    const now = Date.now();
    if (now - lastEmit.current > 2000) { emitDmTyping(roomId, [myId!, otherId], true); lastEmit.current = now; }
    if (typingTimer.current) window.clearTimeout(typingTimer.current);
    typingTimer.current = window.setTimeout(() => { emitDmTyping(roomId, [myId!, otherId], false); lastEmit.current = 0; }, 3000);
  };

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = draft.trim();
    if (!value) return;
    setDraft('');
    if (taRef.current) taRef.current.style.height = 'auto';
    addMessage({ id: 'tmp-' + Date.now(), senderId: myId, content: value, createdAt: new Date().toISOString(), _optimistic: true });
    try {
      await api.sendMessage(roomId, value);
      queryClient.invalidateQueries({ queryKey: ['dm-rooms'] });
    } catch (err: any) {
      showToast(err?.message || 'Failed to send', { type: 'error' });
    }
  };

  if (loadError) {
    return <div className="dm-thread-empty"><XCircle /><h3>{t('dm.cannotLoad')}</h3><p>{loadError}</p></div>;
  }
  if (loading) {
    return <div className="messages-skeleton" style={{ height: '100%' }}><div className="sk-chat" style={{ height: '100%' }}><div className="sk-chat-header"><div className="sk-chat-avatar skeleton-block" /><div className="sk-chat-name skeleton-block" /></div><div className="sk-chat-bubble-left skeleton-block" /><div className="sk-chat-bubble-right skeleton-block" /><div className="sk-input skeleton-block" /></div></div>;
  }

  const name = other?.fullName || 'Conversation';
  const avatar = avatarFor(name, other?.avatar);
  const otherId = otherIdRef.current;
  const firstName = name.split(' ')[0];

  return (
    <>
      <header className="dm-thread-head">
        <a href="#/messages" className="dm-icon-btn dm-mobile-only" aria-label={t('dm.backToInbox')}><ArrowLeft /></a>
        <a className="dm-thread-user" href={other?.handle ? `#/u/${other.handle}` : (otherId ? `#/user/${otherId}` : '#')}
           data-user-id={otherId || ''} data-user-name={name} data-user-avatar={avatar} data-user-handle={other?.handle || ''} data-user-plan={other?.plan || ''}>
          <span className="dm-avatar-wrap">
            <img src={avatar} alt="" loading="lazy" />
            <span className={`dm-presence-dot ${online ? 'is-online' : ''}`} data-presence-for={otherId || ''} title={online ? t('dm.online') : t('dm.offline')} aria-hidden="true" />
          </span>
          <div className="dm-thread-user-meta">
            <strong>{name}</strong>
            <span className="dm-thread-substatus">{online ? t('dm.online') : (other?.country || t('dm.offline'))}</span>
          </div>
        </a>
        <button
          type="button"
          className={`dm-icon-btn dm-info-toggle${showInfo ? ' is-active' : ''}`}
          aria-label={t('dm.details')}
          aria-expanded={showInfo}
          onClick={() => setShowInfo((v) => !v)}
        >
          <Info aria-hidden="true" />
        </button>
      </header>

      {showInfo && otherId && (
        <aside className="dm-info-drawer" aria-label={`About ${name}`}>
          <img className="dm-info-avatar" src={avatar} alt="" />
          <strong className="dm-info-name">{name}</strong>
          {other?.handle && <span className="dm-info-handle">@{other.handle}</span>}
          <span className={`dm-info-status${online ? ' is-online' : ''}`}>{online ? t('dm.online') : t('dm.offline')}</span>
          <div className="dm-info-actions">
            <a className="dm-info-btn" href={other?.handle ? `#/u/${other.handle}` : `#/user/${otherId}`}>{t('dm.viewProfile')}</a>
            <button
              type="button"
              className="dm-info-btn dm-info-btn-danger"
              onClick={(e) => openSafetyMenu(e.currentTarget, {
                target: { type: 'user', id: otherId, name },
                onAfterBlock: () => replace('/messages'),
              })}
            >
              {t('dm.blockReport')}
            </button>
          </div>
        </aside>
      )}

      <div className="dm-thread-body" ref={bodyRef}>
        {messages.length === 0 ? (
          <div className="dm-thread-empty-inline"><MessageCircle /><p>{t('dm.sayHi')} {firstName}!</p></div>
        ) : (
          groupByDay(messages).map((group) => (
            <React.Fragment key={group.key}>
              <div className="dm-day-divider"><span>{group.label}</span></div>
              {group.items.map((m: any) => <Bubble key={m.id} m={m} myId={myId} otherAvatar={avatar} onUnsend={unsend} />)}
            </React.Fragment>
          ))
        )}
        {seen && messages.some((m) => m.senderId === myId) && <div className="dm-seen-marker">{t('dm.seen')}</div>}
        <div className="dm-typing-row" hidden={!typing}>
          <img src={avatar} alt="" />
          <div className="dm-typing-bubble"><span /><span /><span /></div>
        </div>
      </div>

      <form className="dm-composer" autoComplete="off" onSubmit={send}>
        <textarea
          ref={taRef} className="dm-composer-input" rows={1} placeholder={`${t('dm.messageVerb')} ${firstName}…`} maxLength={2000}
          aria-label={`${t('dm.messageVerb')} ${firstName}`} enterKeyHint="send"
          value={draft} onChange={onInput}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(e); } }}
        />
        <button type="submit" className="dm-send-btn" aria-label={t('dm.send')}><Send /></button>
      </form>
    </>
  );
}

export default function MessagesPage() {
  useT(); // re-render the whole thread/inbox subtree when the locale changes
  const [myId, setMyId] = useState<string | null>(null);
  const [sub, setSub] = useState(subRouteOf());
  const [resolvedRoom, setResolvedRoom] = useState<string | null>(null);

  useEffect(() => {
    if (!requireAuth('use messages')) return;
    api.getMyProfile().then((me: any) => setMyId(me?.id || null)).catch(() => {});
  }, []);

  useEffect(() => onRouteChange(() => setSub(subRouteOf())), []);

  // /messages/user/:id → open-or-create a room, then rewrite the URL to /messages/:roomId
  useEffect(() => {
    if (sub.kind !== 'open-user' || !sub.id) return;
    let cancelled = false;
    api.openDirectRoom(sub.id).then((room: any) => {
      if (cancelled) return;
      setResolvedRoom(room.id);
      replace(`/messages/${room.id}`);
    }).catch((e: any) => showToast(e?.message || 'Could not open chat', { type: 'error' }));
    return () => { cancelled = true; };
  }, [sub.kind, sub.id]);

  const roomId = sub.kind === 'thread' ? sub.id! : (sub.kind === 'open-user' ? resolvedRoom : null);

  return (
    <div className="dm-page page-enter" data-design="sleek" id="dm-root">
      <aside className="dm-inbox">
        <header className="dm-inbox-head">
          <a href="#/" className="dm-icon-btn" aria-label={t('dm.back')}><ArrowLeft /></a>
          <h2>{t('dm.title')}</h2>
          {/* Spacer keeps the title centered; a fake compose "button" here
              looked clickable but did nothing. */}
          <span className="dm-icon-btn dm-icon-spacer" aria-hidden="true" />
        </header>
        <div className="dm-inbox-list"><InboxList myId={myId} activeRoom={roomId} /></div>
      </aside>
      <section className="dm-thread">
        {roomId ? (
          <ThreadPane key={roomId} roomId={roomId} myId={myId} />
        ) : (
          <div className="dm-thread-empty">
            <MessageCircle />
            <h3>{t('dm.yourMessages')}</h3>
            <p>{t('dm.pickConversation')}</p>
          </div>
        )}
      </section>
    </div>
  );
}
