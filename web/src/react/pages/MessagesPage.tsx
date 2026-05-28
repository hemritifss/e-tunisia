import React, { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Edit, Mail, MessageCircle, Info, Send, XCircle } from 'lucide-react';
import * as api from '../../api';
import { currentPath, replace, onRouteChange } from '../../router';
import { requireAuth, showToast } from '../../ui-utils';
import { emitDmTyping, isUserOnline } from '../../realtime';

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
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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
  const fmtKey = (d: Date) => d.toISOString().slice(0, 10);
  const fmtLabel = (d: Date) => {
    const today = new Date();
    const y = new Date(); y.setDate(today.getDate() - 1);
    if (fmtKey(d) === fmtKey(today)) return 'Today';
    if (fmtKey(d) === fmtKey(y)) return 'Yesterday';
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  };
  const groups: { key: string; label: string; items: any[] }[] = [];
  for (const m of messages) {
    const d = new Date(m.createdAt);
    const key = fmtKey(d);
    let g = groups[groups.length - 1];
    if (!g || g.key !== key) { g = { key, label: fmtLabel(d), items: [] }; groups.push(g); }
    g.items.push(m);
  }
  return groups;
}

function Bubble({ m, myId, otherAvatar }: { m: any; myId: string | null; otherAvatar: string }) {
  const mine = m.senderId === myId;
  const time = m.createdAt ? new Date(m.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '';
  return (
    <div className={`dm-bubble-row ${mine ? 'mine' : 'theirs'}`} data-msg-id={m.id}>
      {!mine && <img className="dm-bubble-avatar" src={otherAvatar} alt="" />}
      <div className={`dm-bubble ${m._optimistic ? 'pending' : ''}`}>
        <p>{m.content}</p>
        <span className="dm-bubble-time">{time}{m._optimistic ? ' · sending…' : ''}</span>
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
    return <div className="dm-inbox-empty"><Mail /><p>No conversations yet.</p><p className="text-xs text-muted">Visit any profile and tap <strong>Message</strong> to start one.</p></div>;
  }
  return (
    <>
      {items.map(({ room, other }: any) => {
        const name = other?.fullName || room.name || 'Conversation';
        const avatar = avatarFor(name, other?.avatar);
        const lm = room.lastMessage;
        const preview = lm?.content || 'New conversation';
        const mineLast = lm?.senderId === myId;
        const otherId = other?.id || '';
        const online = otherId ? isUserOnline(otherId) : false;
        return (
          <a key={room.id} className={`dm-inbox-row ${activeRoom === room.id ? 'active' : ''}`} href={`#/messages/${room.id}`}
             data-room={room.id} data-user-id={otherId} data-user-name={name} data-user-avatar={avatar} data-user-handle={other?.handle || ''} data-user-plan={other?.plan || ''}>
            <span className="dm-inbox-avatar-wrap">
              <img src={avatar} alt="" className="dm-inbox-avatar" loading="lazy" />
              <span className={`dm-inbox-presence-dot${online ? ' is-online' : ''}`} data-presence-for={otherId} aria-hidden="true" />
            </span>
            <div className="dm-inbox-info">
              <div className="dm-inbox-name-row"><strong>{name}</strong><span className="dm-inbox-time">{timeAgo(lm?.timestamp || room.updatedAt)}</span></div>
              <div className="dm-inbox-preview">{mineLast && <span className="dm-inbox-you">You: </span>}{preview}</div>
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
  const bodyRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const otherIdRef = useRef<string | null>(null);

  const scrollToBottom = () => { const b = bodyRef.current; if (b) b.scrollTop = b.scrollHeight; };

  const addMessage = (m: any) => setMessages((prev) => {
    if (prev.some((x) => x.id === m.id)) return prev;
    if (m.senderId === myId) {
      const idx = prev.findIndex((x) => x._optimistic && x.content === m.content);
      if (idx >= 0) { const copy = [...prev]; copy[idx] = m; return copy; }
    }
    return [...prev, m];
  });

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
    window.addEventListener('etunisia:dm-new-message', onNew);
    window.addEventListener('etunisia:dm-typing', onTyping);
    window.addEventListener('etunisia:dm-read', onRead);
    window.addEventListener('etunisia:presence-update', onPresence);
    return () => {
      if (hideTimer) window.clearTimeout(hideTimer);
      window.removeEventListener('etunisia:dm-new-message', onNew);
      window.removeEventListener('etunisia:dm-typing', onTyping);
      window.removeEventListener('etunisia:dm-read', onRead);
      window.removeEventListener('etunisia:presence-update', onPresence);
    };
  }, [roomId, myId]);

  // Fallback polling (20s).
  useEffect(() => {
    const t = window.setInterval(async () => {
      try {
        const latest = await api.getRoomMessages(roomId, 1, 50);
        const have = new Set(messages.map((m) => m.id));
        const fresh = (latest || []).slice().reverse().filter((m: any) => !have.has(m.id) && !String(m.id).startsWith('tmp-'));
        if (fresh.length) { fresh.forEach(addMessage); api.markRoomRead(roomId).catch(() => {}); }
      } catch { /* ignore */ }
    }, 20000);
    return () => window.clearInterval(t);
  }, [roomId, messages]);

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
    return <div className="dm-thread-empty"><XCircle /><h3>Cannot load chat</h3><p>{loadError}</p></div>;
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
        <a href="#/messages" className="dm-icon-btn dm-mobile-only" aria-label="Back to inbox"><ArrowLeft /></a>
        <a className="dm-thread-user" href={other?.handle ? `#/u/${other.handle}` : (otherId ? `#/user/${otherId}` : '#')}
           data-user-id={otherId || ''} data-user-name={name} data-user-avatar={avatar} data-user-handle={other?.handle || ''} data-user-plan={other?.plan || ''}>
          <span className="dm-avatar-wrap">
            <img src={avatar} alt="" loading="lazy" />
            <span className={`dm-presence-dot ${online ? 'is-online' : ''}`} data-presence-for={otherId || ''} title={online ? 'Online' : 'Offline'} aria-hidden="true" />
          </span>
          <div className="dm-thread-user-meta">
            <strong>{name}</strong>
            <span className="dm-thread-substatus">{online ? 'Online now' : (other?.country || 'Offline')}</span>
          </div>
        </a>
        <span className="dm-icon-btn" aria-hidden="true"><Info /></span>
      </header>

      <div className="dm-thread-body" ref={bodyRef}>
        {messages.length === 0 ? (
          <div className="dm-thread-empty-inline"><MessageCircle /><p>Say hi to {firstName}!</p></div>
        ) : (
          groupByDay(messages).map((group) => (
            <React.Fragment key={group.key}>
              <div className="dm-day-divider"><span>{group.label}</span></div>
              {group.items.map((m: any) => <Bubble key={m.id} m={m} myId={myId} otherAvatar={avatar} />)}
            </React.Fragment>
          ))
        )}
        {seen && messages.some((m) => m.senderId === myId) && <div className="dm-seen-marker">Seen</div>}
        <div className="dm-typing-row" hidden={!typing}>
          <img src={avatar} alt="" />
          <div className="dm-typing-bubble"><span /><span /><span /></div>
        </div>
      </div>

      <form className="dm-composer" autoComplete="off" onSubmit={send}>
        <textarea
          ref={taRef} className="dm-composer-input" rows={1} placeholder={`Message ${firstName}…`} maxLength={2000}
          value={draft} onChange={onInput}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(e); } }}
        />
        <button type="submit" className="dm-send-btn" aria-label="Send"><Send /></button>
      </form>
    </>
  );
}

export default function MessagesPage() {
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
          <a href="#/" className="dm-icon-btn" aria-label="Back"><ArrowLeft /></a>
          <h2>Messages</h2>
          <span className="dm-icon-btn" aria-hidden="true"><Edit /></span>
        </header>
        <div className="dm-inbox-list"><InboxList myId={myId} activeRoom={roomId} /></div>
      </aside>
      <section className="dm-thread">
        {roomId ? (
          <ThreadPane key={roomId} roomId={roomId} myId={myId} />
        ) : (
          <div className="dm-thread-empty">
            <MessageCircle />
            <h3>Your messages</h3>
            <p>Pick a conversation from the inbox, or visit a profile and tap <strong>Message</strong>.</p>
          </div>
        )}
      </section>
    </div>
  );
}
