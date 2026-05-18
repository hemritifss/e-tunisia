// ============================================
// DIRECT MESSAGES — Instagram-style inbox + thread
// Routes:
//   /#/messages                  → inbox (conversation list)
//   /#/messages/:roomId          → thread view
//   /#/messages/user/:userId     → open-or-create direct with that user, then redirect
// ============================================

import * as api from '../api';
import { replaceIcons } from '../icons';
import { requireAuth, showToast } from '../ui-utils';

// ───────── Shell ─────────
export function renderMessagesPage(): string {
  return `
    <div class="dm-page page-enter" data-design="sleek" id="dm-root">
      <aside class="dm-inbox" id="dm-inbox">
        <header class="dm-inbox-head">
          <a href="#/" class="dm-icon-btn" aria-label="Back"><i class="lucide-arrow-left"></i></a>
          <h2>Messages</h2>
          <span class="dm-icon-btn" aria-hidden="true"><i class="lucide-edit"></i></span>
        </header>
        <div class="dm-inbox-list" id="dm-inbox-list">
          <div class="dm-loading"><div class="spinner"></div><p>Loading…</p></div>
        </div>
      </aside>
      <section class="dm-thread" id="dm-thread">
        <div class="dm-thread-empty">
          <i class="lucide-message-circle"></i>
          <h3>Your messages</h3>
          <p>Pick a conversation from the inbox, or visit a profile and tap <strong>Message</strong>.</p>
        </div>
      </section>
    </div>
  `;
}

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

function escapeHtml(s: string): string {
  return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function getSubRoute(): { kind: 'inbox' | 'thread' | 'open-user'; id?: string } {
  const hash = location.hash || '#/messages';
  const path = hash.replace(/^#/, '').split('?')[0];
  // /messages/user/<userId>
  const openMatch = path.match(/^\/messages\/user\/([0-9a-fA-F-]+)/);
  if (openMatch) return { kind: 'open-user', id: openMatch[1] };
  // /messages/<roomId>
  const m = path.match(/^\/messages\/([0-9a-fA-F-]+)/);
  if (m) return { kind: 'thread', id: m[1] };
  return { kind: 'inbox' };
}

let myId: string | null = null;

// ───────── Bootstrap ─────────
export async function initMessagesPage() {
  if (!requireAuth('use messages')) return;
  const me = await api.getMyProfile().catch(() => null);
  myId = me?.id || null;

  const sub = getSubRoute();

  if (sub.kind === 'open-user' && sub.id) {
    try {
      const room = await api.openDirectRoom(sub.id);
      history.replaceState(null, '', `#/messages/${room.id}`);
      await renderInbox();
      await renderThread(room.id);
    } catch (e: any) {
      showToast(e?.message || 'Could not open chat', { type: 'error' });
      await renderInbox();
    }
    return;
  }

  await renderInbox();
  if (sub.kind === 'thread' && sub.id) {
    await renderThread(sub.id);
  }
}

// ───────── Inbox ─────────
async function renderInbox() {
  const list = document.getElementById('dm-inbox-list');
  if (!list) return;
  let rooms: any[] = [];
  try { rooms = (await api.getMyRooms()) || []; } catch { rooms = []; }

  if (rooms.length === 0) {
    list.innerHTML = `
      <div class="dm-inbox-empty">
        <i class="lucide-mail"></i>
        <p>No conversations yet.</p>
        <p class="text-xs text-muted">Visit any profile and tap <strong>Message</strong> to start one.</p>
      </div>`;
    replaceIcons(list);
    return;
  }

  const currentRoom = location.hash.match(/^#\/messages\/([0-9a-fA-F-]+)/)?.[1];

  // Resolve other-participant info per room
  const items = await Promise.all(rooms.map(async (r) => {
    const otherId = (r.participantIds || []).find((id: string) => id !== myId);
    let other = null;
    if (otherId) {
      try { other = await api.getPublicUser(otherId); } catch {}
    }
    return { room: r, other };
  }));

  list.innerHTML = items.map(({ room, other }) => {
    const name = other?.fullName || room.name || 'Conversation';
    const seed = encodeURIComponent(name);
    const avatar = other?.avatar
      ? (other.avatar.startsWith('data:') || other.avatar.startsWith('http')
          ? other.avatar
          : `https://api.dicebear.com/9.x/thumbs/svg?seed=${seed}`)
      : `https://api.dicebear.com/9.x/thumbs/svg?seed=${seed}`;
    const lm = room.lastMessage;
    const preview = lm?.content ? escapeHtml(lm.content) : 'New conversation';
    const mineLastMsg = lm?.senderId === myId;
    return `
      <a class="dm-inbox-row ${currentRoom === room.id ? 'active' : ''}" href="#/messages/${room.id}" data-room="${room.id}">
        <img src="${avatar}" alt="${escapeHtml(name)}" class="dm-inbox-avatar" />
        <div class="dm-inbox-info">
          <div class="dm-inbox-name-row">
            <strong>${escapeHtml(name)}</strong>
            <span class="dm-inbox-time">${timeAgo(lm?.timestamp || room.updatedAt)}</span>
          </div>
          <div class="dm-inbox-preview">${mineLastMsg ? '<span class="text-muted">You: </span>' : ''}${preview}</div>
        </div>
      </a>
    `;
  }).join('');
  replaceIcons(list);
}

// ───────── Thread ─────────
async function renderThread(roomId: string) {
  const pane = document.getElementById('dm-thread');
  if (!pane) return;
  pane.innerHTML = `
    <div class="dm-thread-loading">
      <div class="spinner"></div>
      <p>Loading conversation…</p>
    </div>
  `;
  replaceIcons(pane);

  let messages: any[] = [];
  try {
    messages = await api.getRoomMessages(roomId, 1, 100);
  } catch (e: any) {
    pane.innerHTML = `<div class="dm-thread-empty"><i class="lucide-x-circle"></i><h3>Cannot load chat</h3><p>${escapeHtml(e?.message || '')}</p></div>`;
    replaceIcons(pane);
    return;
  }

  // We don't have a `getRoom` helper — fall back to deriving other participant from messages
  let otherId: string | null = null;
  for (const m of messages) {
    if (m.senderId !== myId) { otherId = m.senderId; break; }
  }
  // If thread is empty, fetch one room from inbox cheaply
  if (!otherId) {
    try {
      const rooms = await api.getMyRooms();
      const found = rooms?.find((r: any) => r.id === roomId);
      otherId = (found?.participantIds || []).find((id: string) => id !== myId) || null;
    } catch {}
  }

  let other: any = null;
  if (otherId) { try { other = await api.getPublicUser(otherId); } catch {} }

  const name = other?.fullName || 'Conversation';
  const seed = encodeURIComponent(name);
  const avatar = other?.avatar
    ? (other.avatar.startsWith('data:') || other.avatar.startsWith('http')
        ? other.avatar
        : `https://api.dicebear.com/9.x/thumbs/svg?seed=${seed}`)
    : `https://api.dicebear.com/9.x/thumbs/svg?seed=${seed}`;

  // Messages come DESC from API — flip to ASC for display
  const asc = [...messages].reverse();

  pane.innerHTML = `
    <header class="dm-thread-head">
      <a href="#/messages" class="dm-icon-btn dm-mobile-only" aria-label="Back to inbox"><i class="lucide-arrow-left"></i></a>
      <a class="dm-thread-user" href="${otherId ? `#/user/${otherId}` : '#'}">
        <img src="${avatar}" alt="" />
        <div>
          <strong>${escapeHtml(name)}</strong>
          ${other?.country ? `<span class="text-xs text-muted">${escapeHtml(other.country)}</span>` : ''}
        </div>
      </a>
      <span class="dm-icon-btn" aria-hidden="true"><i class="lucide-info"></i></span>
    </header>

    <div class="dm-thread-body" id="dm-thread-body">
      ${asc.length === 0
        ? `<div class="dm-thread-empty-inline"><i class="lucide-message-circle"></i><p>Say hi to ${escapeHtml(name.split(' ')[0])}!</p></div>`
        : groupByDay(asc).map(group => `
            <div class="dm-day-divider"><span>${group.label}</span></div>
            ${group.items.map((m: any) => renderBubble(m, avatar)).join('')}
          `).join('')}
    </div>

    <form class="dm-composer" id="dm-composer" autocomplete="off">
      <textarea id="dm-composer-input" class="dm-composer-input" rows="1" placeholder="Message ${escapeHtml(name.split(' ')[0])}…" maxlength="2000"></textarea>
      <button type="submit" class="dm-send-btn" aria-label="Send" id="dm-send-btn">
        <i class="lucide-send"></i>
      </button>
    </form>
  `;
  replaceIcons(pane);

  scrollToBottom();

  // Mark as read (fire-and-forget)
  api.markRoomRead(roomId).catch(() => {});

  // Autosize textarea
  const ta = document.getElementById('dm-composer-input') as HTMLTextAreaElement;
  const autosize = () => {
    ta.style.height = 'auto';
    ta.style.height = Math.min(120, ta.scrollHeight) + 'px';
  };
  ta?.addEventListener('input', autosize);

  // Submit
  document.getElementById('dm-composer')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const value = (ta.value || '').trim();
    if (!value) return;
    ta.value = '';
    autosize();
    // Optimistic append
    appendBubble({
      id: 'tmp-' + Date.now(),
      senderId: myId!,
      content: value,
      createdAt: new Date().toISOString(),
      _optimistic: true,
    }, avatar);
    scrollToBottom();
    try {
      await api.sendMessage(roomId, value);
      // Refresh inbox last-message preview
      renderInbox();
    } catch (err: any) {
      showToast(err?.message || 'Failed to send', { type: 'error' });
    }
  });

  // Enter-to-send (Shift+Enter = newline)
  ta?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      (document.getElementById('dm-composer') as HTMLFormElement).requestSubmit();
    }
  });

  // Light polling — fetch new messages every 5 s while thread is open
  startThreadPolling(roomId, avatar);

  setTimeout(() => ta?.focus(), 50);
}

function renderBubble(m: any, otherAvatar: string): string {
  const mine = m.senderId === myId;
  const sideClass = mine ? 'mine' : 'theirs';
  const time = m.createdAt ? new Date(m.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '';
  const seed = encodeURIComponent(m.senderId || 'user');
  const avatar = mine ? '' : `<img class="dm-bubble-avatar" src="${otherAvatar || `https://api.dicebear.com/9.x/thumbs/svg?seed=${seed}`}" alt="" />`;
  return `
    <div class="dm-bubble-row ${sideClass}" data-msg-id="${m.id}">
      ${avatar}
      <div class="dm-bubble ${m._optimistic ? 'pending' : ''}">
        <p>${escapeHtml(m.content)}</p>
        <span class="dm-bubble-time">${time}${m._optimistic ? ' · sending…' : ''}</span>
      </div>
    </div>
  `;
}

function appendBubble(m: any, otherAvatar: string) {
  const body = document.getElementById('dm-thread-body');
  if (!body) return;
  // remove the empty-inline placeholder if present
  body.querySelector('.dm-thread-empty-inline')?.remove();
  body.insertAdjacentHTML('beforeend', renderBubble(m, otherAvatar));
}

function scrollToBottom() {
  const body = document.getElementById('dm-thread-body');
  if (body) body.scrollTop = body.scrollHeight;
}

function groupByDay(messages: any[]) {
  const fmtKey = (d: Date) => d.toISOString().slice(0, 10);
  const fmtLabel = (d: Date) => {
    const today = new Date();
    const yesterday = new Date(); yesterday.setDate(today.getDate() - 1);
    if (fmtKey(d) === fmtKey(today))     return 'Today';
    if (fmtKey(d) === fmtKey(yesterday)) return 'Yesterday';
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  };
  const groups: { key: string; label: string; items: any[] }[] = [];
  for (const m of messages) {
    const d = new Date(m.createdAt);
    const key = fmtKey(d);
    let g = groups[groups.length - 1];
    if (!g || g.key !== key) {
      g = { key, label: fmtLabel(d), items: [] };
      groups.push(g);
    }
    g.items.push(m);
  }
  return groups;
}

// ───────── Polling ─────────
let pollTimer: number | null = null;
function startThreadPolling(roomId: string, otherAvatar: string) {
  if (pollTimer) window.clearInterval(pollTimer);
  pollTimer = window.setInterval(async () => {
    // Stop polling if user navigated away
    if (!location.hash.startsWith(`#/messages/${roomId}`)) {
      if (pollTimer) window.clearInterval(pollTimer);
      return;
    }
    try {
      const latest = await api.getRoomMessages(roomId, 1, 50);
      const have = new Set(Array.from(document.querySelectorAll<HTMLElement>('.dm-bubble-row')).map(el => el.dataset.msgId));
      const fresh = (latest || []).slice().reverse().filter((m: any) => !have.has(m.id) && !String(m.id).startsWith('tmp-'));
      if (fresh.length === 0) return;
      // Drop optimistic placeholders if their content matches any fresh server-saved one from me
      document.querySelectorAll<HTMLElement>('.dm-bubble-row.mine[data-msg-id^="tmp-"]').forEach(el => {
        const text = el.querySelector('.dm-bubble p')?.textContent || '';
        const matched = fresh.find((m: any) => m.senderId === myId && m.content === text);
        if (matched) el.remove();
      });
      for (const m of fresh) appendBubble(m, otherAvatar);
      scrollToBottom();
      api.markRoomRead(roomId).catch(() => {});
    } catch {}
  }, 5000);
}
