import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, X, ChevronLeft, ChevronRight, Bookmark, BookmarkCheck,
  Eye, Send, Pause, MoreHorizontal, Trash2, Download, Check,
} from 'lucide-react';
import StoryComposer from './StoryComposer';
import { api } from '../../shared/api';
import { currentUserId } from '../../shared/current-user';
import { goTo, absoluteUrl } from '../../router';
import { useAuthStore } from '../stores/auth-store';

/** Must mirror STORY_REACTIONS in backend/src/stories/story-reaction.entity.ts. */
const STORY_REACTIONS = ['❤️', '😂', '😮', '😢', '👏', '🔥'] as const;

const STORY_DURATION_MS = 5000;

interface StoryItem {
  id: string;
  imageUrl: string;
  caption: string | null;
  createdAt: string;
  expiresAt: string;
  isHighlight?: boolean;
  viewCount?: number;
  hasSeen?: boolean;
  reactionCount?: number;
  myReaction?: string | null;
}

interface StoryAuthor {
  authorId: string;
  author: { id: string; fullName: string; avatar: string | null; handle?: string | null } | null;
  items: StoryItem[];
  latestAt: string;
  hasUnseen?: boolean;
}

interface StoryViewerRow {
  id: string;
  fullName: string;
  avatar: string | null;
  handle: string | null;
  reaction: string | null;
  viewedAt: string;
}

/** Server response from react/unreact. */
interface ReactionSummary {
  storyId: string;
  counts: Record<string, number>;
  total: number;
  myReaction: string | null;
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return 'now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

function avatarFor(name: string, avatar?: string | null): string {
  return avatar || `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(name)}`;
}

export function StoriesStrip() {
  const isAuth = useAuthStore((s) => !!s.token || !!localStorage.getItem('etunisia_token'));
  const queryClient = useQueryClient();
  // The composer owns the whole create flow (photo picking included), so the
  // strip only decides whether to open it.
  const [composerOpen, setComposerOpen] = useState(false);

  // The viewer runs on a frozen snapshot taken when it opens. The live query
  // re-sorts (unseen authors first) on every refetch, so indexing into the live
  // array would yank the open story out from under the reader mid-watch.
  const [viewer, setViewer] = useState<
    { groups: StoryAuthor[]; authorIdx: number; itemIdx: number } | null
  >(null);

  const { data, isLoading } = useQuery({
    queryKey: ['stories'],
    queryFn: () => api.getStories() as Promise<StoryAuthor[]>,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  const groups = useMemo(() => (Array.isArray(data) ? data : []), [data]);

  const openYourTile = () => {
    if (!isAuth) { goTo('/login'); return; }
    setComposerOpen(true);
  };

  // Refresh rings/counts once, after the reader is done.
  const closeViewer = useCallback(() => {
    setViewer(null);
    queryClient.invalidateQueries({ queryKey: ['stories'] });
  }, [queryClient]);

  if (isLoading) {
    return (
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex-shrink-0 flex flex-col items-center gap-1.5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-black/5 dark:bg-white/10 animate-pulse" />
            <div className="w-14 h-2 rounded bg-black/5 dark:bg-white/10 animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="stories-v2-wrap">
        <div className="stories-v2-track snap-x">
          {/* "Your story +" tile — always present, opens file picker */}
          <button
            onClick={openYourTile}
            className="stories-v2-tile stories-v2-tile-self snap-start"
            aria-label="Add a story"
          >
            <div className="stories-v2-ring stories-v2-ring-self">
              <div className="stories-v2-add-inner">
                <Plus size={22} />
              </div>
            </div>
            <span className="stories-v2-label">
              Your story
            </span>
          </button>

          {groups.map((g, gi) => {
            const top = g.items[0];
            const name = g.author?.fullName || 'Member';
            // Fully-watched authors get a muted ring, like every other stories UI.
            const seen = g.hasUnseen === false;
            return (
              <button
                key={g.authorId}
                onClick={() => setViewer({ groups, authorIdx: gi, itemIdx: 0 })}
                className="stories-v2-tile snap-start"
              >
                <div className={`stories-v2-ring ${seen ? 'is-seen' : ''}`}>
                  <img
                    src={top?.imageUrl || avatarFor(name, g.author?.avatar)}
                    alt={name}
                    className="stories-v2-image"
                    loading="lazy"
                  />
                  {g.items.length > 1 && (
                    <span className="stories-v2-count">{g.items.length}</span>
                  )}
                </div>
                <span className="stories-v2-label stories-v2-label-muted">{name.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {viewer && viewer.groups[viewer.authorIdx] && (
          <StoryViewer
            groups={viewer.groups}
            authorIdx={viewer.authorIdx}
            itemIdx={viewer.itemIdx}
            onClose={closeViewer}
            onChange={(authorIdx, itemIdx) =>
              setViewer((v) => (v ? { ...v, authorIdx, itemIdx } : v))
            }
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {composerOpen && <StoryComposer onClose={() => setComposerOpen(false)} />}
      </AnimatePresence>
    </>
  );
}

// ────────────────────────────────────────────────────────────
// Full-screen story viewer
// ────────────────────────────────────────────────────────────
function StoryViewer({
  groups, authorIdx, itemIdx, onClose, onChange,
}: {
  groups: StoryAuthor[];
  authorIdx: number;
  itemIdx: number;
  onClose: () => void;
  onChange: (authorIdx: number, itemIdx: number) => void;
}) {
  const group = groups[authorIdx];
  const item = group.items[itemIdx];
  const totalInGroup = group.items.length;

  const storeUserId = useAuthStore((s) => s.user?.id ?? null);
  const me = storeUserId ?? currentUserId();
  // Gate actions on having a session, not on knowing the id — a token-only
  // session must never be bounced to /login from here.
  const isAuth = useAuthStore((s) => !!s.token) || !!localStorage.getItem('etunisia_token');
  const isMine = !!me && group.author?.id === me;

  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replySent, setReplySent] = useState(false);
  const [replyBusy, setReplyBusy] = useState(false);
  const [showViewers, setShowViewers] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleted, setDeleted] = useState<Set<string>>(() => new Set());
  const [burst, setBurst] = useState<string | null>(null);

  // Per-story state owned locally and reconciled from each API response, so a
  // background refetch can never resurrect a stale reaction or double-count.
  const [reactions, setReactions] = useState<Record<string, { myReaction: string | null; total: number }>>({});
  const [highlights, setHighlights] = useState<Record<string, boolean>>({});
  const reactBusy = useRef(false);

  const live = reactions[item?.id ?? ''];
  const myReaction = live ? live.myReaction : (item?.myReaction ?? null);
  const reactionTotal = live ? live.total : (item?.reactionCount ?? 0);
  const highlighted = item ? (highlights[item.id] ?? !!item.isHighlight) : false;

  // The RAF loop reads these through refs so it never restarts mid-story.
  const pausedRef = useRef(false);
  const advanceRef = useRef<(dir: 1 | -1) => void>(() => {});
  const holdPaused = useRef(false);
  const replyFocused = useRef(false);

  const overlayOpen = showViewers || menuOpen;

  const syncPaused = useCallback(() => {
    const p = holdPaused.current || replyFocused.current || overlayOpen || document.hidden;
    pausedRef.current = p;
    setPaused(p);
  }, [overlayOpen]);

  useEffect(() => { syncPaused(); }, [overlayOpen, syncPaused]);

  // Reset per-story transient state.
  useEffect(() => {
    setReplyText('');
    setReplySent(false);
    setMenuOpen(false);
    replyFocused.current = false;
    holdPaused.current = false;
    syncPaused();
  }, [item?.id, syncPaused]);

  const advance = useCallback((dir: 1 | -1) => {
    let a = authorIdx;
    let i = itemIdx + dir;
    if (i >= totalInGroup) { a += 1; i = 0; }
    else if (i < 0) {
      a -= 1;
      i = Math.max(0, (groups[a]?.items.length || 1) - 1);
    }
    if (a < 0 || a >= groups.length) { onClose(); return; }
    onChange(a, i);
  }, [authorIdx, itemIdx, totalInGroup, groups, onChange, onClose]);

  useEffect(() => { advanceRef.current = advance; }, [advance]);

  // Record the view once per story.
  useEffect(() => {
    if (item?.id) api.viewStory(item.id).catch(() => {});
  }, [item?.id]);

  // Preload the next image so advancing doesn't flash an empty frame.
  useEffect(() => {
    const next = group.items[itemIdx + 1] || groups[authorIdx + 1]?.items[0];
    if (next?.imageUrl) {
      const img = new Image();
      img.src = next.imageUrl;
    }
  }, [authorIdx, itemIdx, group.items, groups]);

  // Leaving the tab should pause, not silently burn through someone's stories.
  useEffect(() => {
    const onVis = () => syncPaused();
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [syncPaused]);

  // Progress timer — pausable, unlike the old fixed 5s setTimeout.
  useEffect(() => {
    setProgress(0);
    let raf = 0;
    let last = performance.now();
    let elapsed = 0;

    const tick = (now: number) => {
      const dt = now - last;
      last = now;
      if (!pausedRef.current) elapsed += dt;
      const p = Math.min(1, elapsed / STORY_DURATION_MS);
      setProgress(p);
      if (p >= 1) { advanceRef.current(1); return; }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [authorIdx, itemIdx]);

  // Keyboard nav — inert while typing a reply.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (replyFocused.current) return;
      if (e.key === 'ArrowRight') advanceRef.current(1);
      if (e.key === 'ArrowLeft') advanceRef.current(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const startHold = () => { holdPaused.current = true; syncPaused(); };
  const endHold = () => { holdPaused.current = false; syncPaused(); };

  const toggleHighlight = async () => {
    const id = item.id;
    try {
      const res: any = await api.toggleStoryHighlight(id);
      // Reconcile locally — invalidating the query here re-sorts the strip and
      // would tear the open story out of the frozen snapshot.
      setHighlights((h) => ({ ...h, [id]: !!res?.isHighlight }));
      (window as any).showToast?.({
        message: res?.isHighlight ? 'Pinned to your highlights' : 'Removed from highlights',
        type: 'success',
      });
    } catch {
      (window as any).showToast?.({ message: 'Could not update highlight', type: 'error' });
    }
    setMenuOpen(false);
  };

  const react = async (emoji: string) => {
    if (!isAuth) { goTo('/login'); return; }
    if (reactBusy.current) return; // one in flight at a time — no double-counting
    reactBusy.current = true;

    const id = item.id;
    const wasMine = myReaction;
    const next = wasMine === emoji ? null : emoji;

    // Optimistic; the server response below is authoritative.
    setReactions((r) => ({
      ...r,
      [id]: {
        myReaction: next,
        total: Math.max(0, reactionTotal + (next && !wasMine ? 1 : !next && wasMine ? -1 : 0)),
      },
    }));
    if (next) { setBurst(next); setTimeout(() => setBurst(null), 550); }

    try {
      const res = (next
        ? await api.reactToStory(id, next)
        : await api.unreactStory(id)) as ReactionSummary;
      setReactions((r) => ({ ...r, [id]: { myReaction: res.myReaction, total: res.total } }));
    } catch {
      setReactions((r) => ({ ...r, [id]: { myReaction: wasMine, total: reactionTotal } }));
      (window as any).showToast?.({ message: 'Could not react', type: 'error' });
    } finally {
      reactBusy.current = false;
    }
  };

  const sendReply = async () => {
    const text = replyText.trim();
    if (!text || replyBusy) return;
    if (!isAuth) { goTo('/login'); return; }
    setReplyBusy(true);
    try {
      await api.replyToStory(item.id, text);
      setReplyText('');
      setReplySent(true);
      setTimeout(() => setReplySent(false), 2200);
    } catch {
      (window as any).showToast?.({ message: 'Could not send reply', type: 'error' });
    } finally {
      setReplyBusy(false);
    }
  };

  // No /story/:id route exists (stories are ephemeral), so there is nothing to
  // copy a link to — offer the image itself, like Instagram's "Save photo".
  const savePhoto = () => {
    const a = document.createElement('a');
    a.href = item.imageUrl;
    a.download = `story-${item.id}.jpg`;
    a.rel = 'noopener';
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setMenuOpen(false);
  };

  const removeStory = async () => {
    const id = item.id;
    setMenuOpen(false);
    if (!window.confirm('Delete this story? This cannot be undone.')) return;
    try {
      await api.deleteStory(id);
      setDeleted((d) => new Set(d).add(id));
      (window as any).showToast?.({ message: 'Story deleted', type: 'success' });
      advance(1); // move on; the strip refreshes when the viewer closes
    } catch {
      (window as any).showToast?.({ message: 'Could not delete story', type: 'error' });
    }
  };

  const name = group.author?.fullName || 'Member';
  const avatar = avatarFor(name, group.author?.avatar);
  // Clean path — the router is History-API backed, so a bare "#/x" href would
  // only append a hash instead of navigating. Real href keeps ctrl/middle-click.
  const profileHref = group.author?.handle
    ? `/u/${encodeURIComponent(group.author.handle)}`
    : `/user/${encodeURIComponent(group.author?.id || '')}`;
  const openProfile = (e: React.MouseEvent) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return; // let the browser handle it
    e.preventDefault();
    onClose();
    goTo(profileHref);
  };

  const isDeleted = deleted.has(item.id);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="story-viewer-scrim"
      onClick={onClose}
    >
      <button
        onClick={(e) => { e.stopPropagation(); advance(-1); }}
        className="story-nav story-nav-prev"
        aria-label="Previous story"
      >
        <ChevronLeft size={28} />
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); advance(1); }}
        className="story-nav story-nav-next"
        aria-label="Next story"
      >
        <ChevronRight size={28} />
      </button>
      <button onClick={onClose} className="story-nav story-nav-close" aria-label="Close">
        <X size={22} />
      </button>

      {/* Drag down to dismiss, like the native apps. */}
      <motion.div
        className="story-stage"
        onClick={(e) => e.stopPropagation()}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.6 }}
        onDragStart={startHold}
        onDragEnd={(_, info) => {
          endHold();
          if (info.offset.y > 120) onClose();
        }}
      >
        {/* Progress bars */}
        <div className="story-progress-row">
          {group.items.map((_, idx) => (
            <div key={idx} className="story-progress-track">
              <div
                className="story-progress-fill"
                style={{
                  width: idx < itemIdx ? '100%' : idx === itemIdx ? `${progress * 100}%` : '0%',
                }}
              />
            </div>
          ))}
        </div>

        {/* Author header */}
        <div className="story-head">
          <a href={profileHref} onClick={openProfile} className="story-head-link">
            <img
              src={avatar}
              alt=""
              className="story-head-avatar"
              data-user-id={group.author?.id || undefined}
              data-user-name={name}
              data-user-avatar={group.author?.avatar || undefined}
              data-user-handle={group.author?.handle || undefined}
            />
            <span className="story-head-name">{name}</span>
          </a>
          <span className="story-head-time">{timeAgo(item.createdAt)}</span>
          {paused && <Pause size={13} className="story-head-paused" aria-label="Paused" />}
          {isMine && (
            <div className="story-head-actions">
              <button
                onClick={(e) => { e.stopPropagation(); setMenuOpen((o) => !o); }}
                className="story-head-more"
                aria-label="Story options"
                aria-expanded={menuOpen}
              >
                <MoreHorizontal size={18} />
              </button>
              {menuOpen && (
                <div className="story-menu" role="menu" onClick={(e) => e.stopPropagation()}>
                  <button role="menuitem" onClick={toggleHighlight}>
                    {highlighted ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
                    {highlighted ? 'Remove from highlights' : 'Add to highlights'}
                  </button>
                  <button role="menuitem" onClick={savePhoto}>
                    <Download size={15} /> Save photo
                  </button>
                  <button role="menuitem" className="story-menu-danger" onClick={removeStory}>
                    <Trash2 size={15} /> Delete story
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <img src={item.imageUrl} alt={item.caption || 'story'} className="story-image" />

        {isDeleted && <div className="story-deleted-veil">Deleted</div>}

        {burst && <span className="story-burst" aria-hidden="true">{burst}</span>}

        {/* Hold-to-pause + tap zones. Holding freezes the timer instead of skipping. */}
        <button
          className="story-tap story-tap-prev"
          onClick={(e) => { e.stopPropagation(); advance(-1); }}
          onPointerDown={startHold}
          onPointerUp={endHold}
          onPointerLeave={endHold}
          onPointerCancel={endHold}
          aria-label="Previous story"
        />
        <button
          className="story-tap story-tap-next"
          onClick={(e) => { e.stopPropagation(); advance(1); }}
          onPointerDown={startHold}
          onPointerUp={endHold}
          onPointerLeave={endHold}
          onPointerCancel={endHold}
          aria-label="Next story"
        />

        {item.caption && <div className="story-caption">{item.caption}</div>}

        {/* Footer: owner sees who watched; everyone else can react + reply. */}
        <div className="story-foot" onPointerDown={(e) => e.stopPropagation()}>
          {isMine ? (
            <button className="story-seen-btn" onClick={() => setShowViewers(true)}>
              <Eye size={16} />
              <span>{item.viewCount || 0} {item.viewCount === 1 ? 'view' : 'views'}</span>
              {!!reactionTotal && <span className="story-seen-reacts">· {reactionTotal} reactions</span>}
            </button>
          ) : (
            <>
              <div className="story-reactions" role="group" aria-label="React to this story">
                {STORY_REACTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    className={`story-react ${myReaction === emoji ? 'is-active' : ''}`}
                    onClick={() => react(emoji)}
                    aria-label={`React ${emoji}`}
                    aria-pressed={myReaction === emoji}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              <form
                className="story-reply"
                onSubmit={(e) => { e.preventDefault(); void sendReply(); }}
              >
                <input
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onFocus={() => { replyFocused.current = true; syncPaused(); }}
                  onBlur={() => { replyFocused.current = false; syncPaused(); }}
                  placeholder={replySent ? 'Sent — it went to their inbox' : `Reply to ${name.split(' ')[0]}…`}
                  className="story-reply-input"
                  maxLength={1000}
                  aria-label={`Reply to ${name}`}
                />
                <button
                  type="submit"
                  className="story-reply-send"
                  disabled={!replyText.trim() || replyBusy}
                  aria-label="Send reply"
                >
                  {replySent && !replyText ? <Check size={16} /> : <Send size={16} />}
                </button>
              </form>
            </>
          )}
        </div>
      </motion.div>

      {showViewers && (
        <ViewersSheet storyId={item.id} onClose={() => setShowViewers(false)} />
      )}
    </motion.div>
  );
}

// ────────────────────────────────────────────────────────────
// Author-only "seen by" sheet
// ────────────────────────────────────────────────────────────
function ViewersSheet({ storyId, onClose }: { storyId: string; onClose: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ['story-viewers', storyId],
    queryFn: () => api.getStoryViewers(storyId) as Promise<{ total: number; viewers: StoryViewerRow[] }>,
    staleTime: 10_000,
  });

  const viewers = data?.viewers || [];

  return (
    <div className="story-sheet-scrim" onClick={(e) => { e.stopPropagation(); onClose(); }}>
      <div className="story-sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Story viewers">
        <header className="story-sheet-head">
          <strong>Viewed by {data?.total ?? 0}</strong>
          <button onClick={onClose} aria-label="Close viewers"><X size={18} /></button>
        </header>

        {isLoading && <p className="story-sheet-empty">Loading…</p>}
        {!isLoading && !viewers.length && (
          <p className="story-sheet-empty">No views yet. Give it a minute.</p>
        )}

        <ul className="story-sheet-list">
          {viewers.map((v) => (
            <li key={v.id} className="story-sheet-row">
              <img
                src={avatarFor(v.fullName, v.avatar)}
                alt=""
                data-user-id={v.id}
                data-user-name={v.fullName}
                data-user-avatar={v.avatar || undefined}
                data-user-handle={v.handle || undefined}
              />
              <span className="story-sheet-name">
                {v.fullName}
                {v.handle && <small>@{v.handle}</small>}
              </span>
              {v.reaction && <span className="story-sheet-react">{v.reaction}</span>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
