import React, { useEffect, useRef, useState } from 'react';
import { Heart } from 'lucide-react';
import { api } from '../../shared/api';
import { useAuthStore } from '../stores/auth-store';
import { goTo } from '../../router';
import { RollingNumber } from './RollingNumber';
import { track } from '../../analytics';

export type ReactionType =
  | 'like' | 'love' | 'celebrate' | 'insightful' | 'laugh' | 'wow' | 'support';

/**
 * The seven reactions are content, not chrome: they stay emoji. What used to
 * sit here as a per-reaction accent colour was the six-accent rainbow the
 * system retired, so the chrome around them is now the one blue accent.
 */
export const REACTIONS: Array<{ id: ReactionType; emoji: string; label: string }> = [
  { id: 'like',       emoji: '👍', label: 'Like' },
  { id: 'love',       emoji: '❤️', label: 'Love' },
  { id: 'celebrate',  emoji: '🎉', label: 'Celebrate' },
  { id: 'insightful', emoji: '💡', label: 'Insightful' },
  { id: 'laugh',      emoji: '😂', label: 'Laugh' },
  { id: 'wow',        emoji: '😮', label: 'Wow' },
  { id: 'support',    emoji: '🤝', label: 'Support' },
];

const REACTION_BY_ID = Object.fromEntries(REACTIONS.map(r => [r.id, r] as const));

interface Props {
  postId: string;
  /** Server-provided initial state — comes from the feed payload. */
  initialMine?: ReactionType | null;
  initialBreakdown?: Record<string, number>;
  /** Total reactions count to display. */
  initialTotal?: number;
  /** Optional render-as-link instead of button (rare). */
  className?: string;
}

export function ReactionPicker({
  postId,
  initialMine = null,
  initialBreakdown = {},
  initialTotal = 0,
  className = '',
}: Props) {
  const isAuth = useAuthStore((s) => !!s.token) || !!localStorage.getItem('etunisia_token');
  const [mine, setMine] = useState<ReactionType | null>(initialMine);
  const [breakdown, setBreakdown] = useState<Record<string, number>>(initialBreakdown);
  const [total, setTotal] = useState<number>(initialTotal);
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<number | null>(null);

  // Top 3 reactions by count, for the compact preview row
  const topThree = Object.entries(breakdown)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([id]) => id as ReactionType)
    .filter(id => REACTION_BY_ID[id]);

  const current = mine ? REACTION_BY_ID[mine] : null;

  const triggerLabel = current ? current.label : 'React';

  const scheduleClose = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setOpen(false), 200);
  };
  const cancelClose = () => {
    if (closeTimer.current) { window.clearTimeout(closeTimer.current); closeTimer.current = null; }
  };

  useEffect(() => () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
  }, []);

  const send = async (type: ReactionType | null) => {
    if (!isAuth) {
      goTo('/login');
      return;
    }
    setOpen(false);
    // Optimistic update
    setBreakdown(prev => {
      const next = { ...prev };
      if (mine) next[mine] = Math.max(0, (next[mine] || 1) - 1);
      if (type) next[type] = (next[type] || 0) + 1;
      return next;
    });
    setTotal(prev => Math.max(0, prev + (mine ? -1 : 0) + (type ? 1 : 0)));
    setMine(type);
    try {
      const res: any = await api.reactToPost(postId, type);
      if (type) track('react', { type });
      if (res && typeof res.total === 'number') {
        setTotal(res.total);
        setBreakdown(res.breakdown || {});
      }
    } catch {
      // Server failure — revert
      setMine(initialMine);
      setBreakdown(initialBreakdown);
      setTotal(initialTotal);
    }
  };

  // Click trigger → toggle Like (default reaction) if no current pick; else clear.
  const handleQuickClick = () => {
    if (current) send(null);
    else send('like');
  };

  return (
    <div
      className={`reaction-picker ${className}`}
      onMouseEnter={cancelClose}
      onMouseLeave={scheduleClose}
    >
      <button
        type="button"
        className={`reaction-trigger ${current ? 'is-active' : ''}`}
        onClick={handleQuickClick}
        aria-label={triggerLabel}
      >
        <span className="reaction-trigger-icon" aria-hidden="true">
          {/* Outline heart until the user picks — emoji is reserved for a chosen reaction */}
          {current ? current.emoji : <Heart size={17} strokeWidth={2} />}
        </span>
        {total > 0 && <RollingNumber value={total} className="reaction-trigger-count" />}
      </button>

      {/* Top-3 preview (always visible when there are reactions) */}
      {topThree.length > 0 && (
        <a
          href={`#/post/${postId}`}
          className="reaction-bar"
          aria-label={`${total} reactions`}
          title={Object.entries(breakdown)
            .map(([k, v]) => `${REACTION_BY_ID[k]?.emoji || ''} ${v}`).join('  ')}
        >
          {topThree.map(id => (
            <span key={id} className="reaction-bar-emoji" aria-hidden="true">
              {REACTION_BY_ID[id]?.emoji}
            </span>
          ))}
        </a>
      )}

      {/* Hover/long-press picker. Use `inert` instead of `aria-hidden`: aria-hidden
          throws a console warning when a focused descendant exists (we keep the
          active reaction button focused for keyboard users), while `inert` cleanly
          removes the subtree from a11y AND blurs focus inside it. */}
      <div
        className={`reaction-popover ${open ? 'open' : ''}`}
        onMouseEnter={cancelClose}
        onMouseLeave={scheduleClose}
        role="menu"
        {...(!open ? ({ inert: true } as any) : {})}
      >
        {REACTIONS.map(r => (
          <button
            key={r.id}
            type="button"
            className={`reaction-chip ${mine === r.id ? 'is-active' : ''}`}
            onClick={() => send(r.id)}
            title={r.label}
            aria-label={r.label}
          >
            <span aria-hidden="true">{r.emoji}</span>
          </button>
        ))}
      </div>

      {/* Invisible hover-zone above the trigger to open the popover */}
      <button
        type="button"
        className="reaction-trigger-hot"
        onMouseEnter={() => { cancelClose(); setOpen(true); }}
        onFocus={() => { cancelClose(); setOpen(true); }}
        onMouseLeave={scheduleClose}
        aria-label="Pick a reaction"
        tabIndex={-1}
      />
    </div>
  );
}
