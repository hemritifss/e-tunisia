// ============================================
// Realtime socket client — connects to /events on the backend.
// Re-broadcasts inbound socket messages as DOM `etunisia:*` events
// so any page/component can subscribe without touching socket.io directly.
// ============================================

import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;
let currentToken: string | null = null;

// In-memory snapshot of who's online (userIds). Kept in sync with `presence:update` events.
const onlineUsers = new Set<string>();

function getSocketUrl(): string {
  // Same-origin in production behind the proxy; explicit when same-origin fails.
  // The Nest gateway lives on namespace `/events`.
  return '/events';
}

function isLoggedIn(): boolean {
  return !!localStorage.getItem('etunisia_token');
}

/** (Re)connect using the current token. Idempotent — call after login or on app boot. */
export function connectRealtime() {
  if (typeof window === 'undefined') return;
  const token = localStorage.getItem('etunisia_token');
  if (!token) {
    disconnectRealtime();
    return;
  }
  // Same token, same socket → reuse
  if (socket && socket.connected && currentToken === token) return;
  // Different token → drop the old socket cleanly
  if (socket) {
    try { socket.disconnect(); } catch {}
    socket = null;
  }
  currentToken = token;

  socket = io(getSocketUrl(), {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1500,
    reconnectionDelayMax: 8000,
    timeout: 8000,
  });

  socket.on('connect', () => {
    // Subscribe to per-user channels
    socket?.emit('notif:subscribe');
    socket?.emit('feed:subscribe');
    // Pull a snapshot of who's online right now
    socket?.emit('presence:list', null, (ids: any) => {
      if (Array.isArray(ids)) {
        onlineUsers.clear();
        for (const id of ids) onlineUsers.add(String(id));
        window.dispatchEvent(new CustomEvent('etunisia:presence-snapshot', { detail: ids }));
      }
    });
    window.dispatchEvent(new CustomEvent('etunisia:realtime-connected'));
  });

  socket.on('disconnect', () => {
    window.dispatchEvent(new CustomEvent('etunisia:realtime-disconnected'));
  });

  socket.on('connect_error', () => {
    // Silent — reconnection handles it. We just don't want the console spam in dev.
  });

  // ── Live notification (server pushes after NotificationsService.create) ──
  socket.on('notification:new', (n: any) => {
    window.dispatchEvent(new CustomEvent('etunisia:notification-new', { detail: n }));
  });

  // ── Live DM new-message (server pushes after MessagesService.saveMessage) ──
  socket.on('dm:new-message', (payload: any) => {
    window.dispatchEvent(new CustomEvent('etunisia:dm-new-message', { detail: payload }));
  });

  // ── Presence updates (someone came online or went offline) ──
  socket.on('presence:update', (payload: { userId: string; online: boolean }) => {
    if (!payload?.userId) return;
    if (payload.online) onlineUsers.add(payload.userId);
    else onlineUsers.delete(payload.userId);
    window.dispatchEvent(new CustomEvent('etunisia:presence-update', { detail: payload }));
  });

  // ── DM typing relay from the other participant ──
  socket.on('dm:typing', (payload: any) => {
    window.dispatchEvent(new CustomEvent('etunisia:dm-typing', { detail: payload }));
  });

  // ── DM read receipt — the other user saw the messages ──
  socket.on('dm:read', (payload: any) => {
    window.dispatchEvent(new CustomEvent('etunisia:dm-read', { detail: payload }));
  });
}

/** Snapshot of currently online user-ids (frontend cache, kept in sync via `presence:update`). */
export function getOnlineUsers(): Set<string> {
  return onlineUsers;
}

export function isUserOnline(userId: string): boolean {
  return onlineUsers.has(userId);
}

/** Tell the server I'm typing (or stopped) in a specific DM room. */
export function emitDmTyping(roomId: string, participantIds: string[], isTyping: boolean) {
  if (!socket?.connected) return;
  socket.emit('dm:typing', { roomId, participantIds, isTyping });
}

export function disconnectRealtime() {
  if (socket) {
    try { socket.disconnect(); } catch {}
    socket = null;
  }
  currentToken = null;
}

export function isRealtimeConnected(): boolean {
  return !!(socket && socket.connected);
}

// Re-attempt on token change (login/logout in another tab)
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === 'etunisia_token') {
      if (isLoggedIn()) connectRealtime();
      else disconnectRealtime();
    }
  });
}
