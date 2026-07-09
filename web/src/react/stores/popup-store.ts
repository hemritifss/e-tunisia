import { create } from 'zustand';
import { useUIStore } from './ui-store';

/**
 * Central popup orchestrator.
 *
 * One queue, one popup visible at a time. Each "moment" in the app (a received
 * tip, the first-run tutorial, the daily check-in nudge, …) enqueues a
 * `PopupItem`; the host renders the highest-priority item and advances when it
 * closes. New popup kinds only need: a `PopupKind` entry, a component branch in
 * PopupHost, and (optionally) an enqueue call in triggers.ts.
 */

export type PopupKind =
  | 'celebration'
  | 'tutorial'
  | 'daily'
  | 'badge'
  | 'levelup'
  | 'welcome'
  | 'streak';

export interface PopupItem {
  /** Stable id — auto-generated when omitted. */
  id: string;
  kind: PopupKind;
  /** Higher shows first. Default 0. */
  priority: number;
  /** If set, an enqueue is ignored when an item with the same key is already queued or showing. */
  dedupeKey?: string;
  /** Free-form payload passed to the popup component (amount, sender name, …). */
  data?: Record<string, any>;
}

export type EnqueueInput = Partial<Omit<PopupItem, 'kind'>> & { kind: PopupKind };

/** A moment that overflowed the interrupt budget — surfaced in the activity feed as unread. */
export interface MissedMoment {
  id: string;
  kind: PopupKind;
  summary: string;
  at: number;
  read: boolean;
  data?: Record<string, any>;
}

/**
 * Interrupt budget: at most this many modal popups per browsing session. Anything
 * beyond it that's worth keeping becomes an unread "missed moment" instead of a
 * second interruption — honouring the roadmap rule "every interrupt added takes
 * one away." Resets on a full reload (a new session).
 */
const MAX_INTERRUPTS_PER_SESSION = 1;
const MISSED_KEY = 'etunisia_missed_moments';

interface PopupState {
  queue: PopupItem[];
  current: PopupItem | null;
  /** Overflow moments (unread until viewed in the activity feed). Persisted. */
  missed: MissedMoment[];
  /** Modal popups actually shown this session (budget counter). */
  interruptsShown: number;
  /** Add a popup. Returns false if it was de-duped away. */
  enqueue: (input: EnqueueInput) => boolean;
  /** Close the current popup and promote the next one. */
  dismiss: () => void;
  /** Mark all missed moments as read (called when the activity feed is opened). */
  markMissedRead: () => void;
  /** Drop everything (e.g. on logout). */
  clear: () => void;
}

let seq = 0;
const nextId = () => `popup_${Date.now()}_${++seq}`;

/** Load persisted missed moments (best-effort). */
function loadMissed(): MissedMoment[] {
  try {
    const raw = localStorage.getItem(MISSED_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}
function saveMissed(missed: MissedMoment[]) {
  try { localStorage.setItem(MISSED_KEY, JSON.stringify(missed.slice(0, 30))); } catch { /* quota */ }
}

/**
 * One-line summary for an overflowed moment. Returns null for ephemeral UI nudges
 * (tutorial/daily/welcome) that aren't worth persisting — those are simply dropped
 * when the budget is spent.
 */
function summarizeMoment(item: PopupItem): string | null {
  const d = item.data || {};
  switch (item.kind) {
    case 'badge':      return `You earned the “${d.name || d.title || 'new'}” badge`;
    case 'levelup':    return `You reached level ${d.level ?? d.newLevel ?? ''}`.trim();
    case 'streak':     return `${d.days ?? d.streak ?? ''}-day streak milestone`.replace(/^-day/, 'Streak milestone');
    case 'celebration':return d.message || d.title || 'Something worth celebrating';
    default:           return null; // tutorial / daily / welcome — ephemeral
  }
}

function promote(queue: PopupItem[]): { current: PopupItem | null; queue: PopupItem[] } {
  if (queue.length === 0) return { current: null, queue: [] };
  // Highest priority first; ties keep insertion order (stable).
  const sorted = [...queue].sort((a, b) => b.priority - a.priority);
  const [head, ...rest] = sorted;
  return { current: head, queue: rest };
}

export const usePopupStore = create<PopupState>((set, get) => ({
  queue: [],
  current: null,
  missed: loadMissed(),
  interruptsShown: 0,

  enqueue: (input) => {
    const item: PopupItem = {
      id: input.id ?? nextId(),
      kind: input.kind,
      priority: input.priority ?? 0,
      dedupeKey: input.dedupeKey,
      data: input.data,
    };

    const { current, queue, missed, interruptsShown } = get();
    if (item.dedupeKey) {
      const clashes =
        (current?.dedupeKey === item.dedupeKey) ||
        queue.some((q) => q.dedupeKey === item.dedupeKey) ||
        missed.some((m) => (m.data as any)?.dedupeKey === item.dedupeKey);
      if (clashes) return false;
    }

    // Budget: show at most one modal interrupt per session. The first one shows;
    // everything after overflows to the activity feed as an unread "missed moment"
    // (or is dropped, if it's an ephemeral UI nudge with no summary).
    const budgetLeft = !current && interruptsShown < MAX_INTERRUPTS_PER_SESSION;
    if (budgetLeft) {
      set({ current: item, interruptsShown: interruptsShown + 1 });
      return true;
    }

    const summary = summarizeMoment(item);
    if (!summary) return false; // ephemeral nudge, budget spent → just drop it

    const moment: MissedMoment = {
      id: item.id,
      kind: item.kind,
      summary,
      at: Date.now(),
      read: false,
      data: { ...item.data, dedupeKey: item.dedupeKey },
    };
    const nextMissed = [moment, ...missed].slice(0, 30);
    saveMissed(nextMissed);
    set({ missed: nextMissed });
    // Gentle, non-modal acknowledgement so the moment isn't invisible.
    try { useUIStore.getState().showToast(summary, 'success'); } catch { /* ui-store not ready */ }
    return true;
  },

  dismiss: () => {
    const { queue } = get();
    const { current, queue: rest } = promote(queue);
    set({ current, queue: rest });
  },

  markMissedRead: () => {
    const { missed } = get();
    if (!missed.some((m) => !m.read)) return;
    const next = missed.map((m) => (m.read ? m : { ...m, read: true }));
    saveMissed(next);
    set({ missed: next });
  },

  clear: () => {
    saveMissed([]);
    set({ queue: [], current: null, missed: [], interruptsShown: 0 });
  },
}));

/** Imperative helper for non-React callers (triggers, vanilla code). */
export function enqueuePopup(input: EnqueueInput): boolean {
  return usePopupStore.getState().enqueue(input);
}
