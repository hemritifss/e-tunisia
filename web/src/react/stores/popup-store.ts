import { create } from 'zustand';

/**
 * Central popup orchestrator.
 *
 * One queue, one popup visible at a time. Each "moment" in the app (a received
 * tip, the first-run tutorial, the daily check-in nudge, …) enqueues a
 * `PopupItem`; the host renders the highest-priority item and advances when it
 * closes. New popup kinds only need: a `PopupKind` entry, a component branch in
 * PopupHost, and (optionally) an enqueue call in triggers.ts.
 */

export type PopupKind = 'celebration' | 'tutorial' | 'daily';

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

interface PopupState {
  queue: PopupItem[];
  current: PopupItem | null;
  /** Add a popup. Returns false if it was de-duped away. */
  enqueue: (input: EnqueueInput) => boolean;
  /** Close the current popup and promote the next one. */
  dismiss: () => void;
  /** Drop everything (e.g. on logout). */
  clear: () => void;
}

let seq = 0;
const nextId = () => `popup_${Date.now()}_${++seq}`;

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

  enqueue: (input) => {
    const item: PopupItem = {
      id: input.id ?? nextId(),
      kind: input.kind,
      priority: input.priority ?? 0,
      dedupeKey: input.dedupeKey,
      data: input.data,
    };

    const { current, queue } = get();
    if (item.dedupeKey) {
      const clashes =
        (current?.dedupeKey === item.dedupeKey) ||
        queue.some((q) => q.dedupeKey === item.dedupeKey);
      if (clashes) return false;
    }

    if (!current) {
      const { current: next, queue: rest } = promote([item]);
      set({ current: next, queue: rest });
    } else {
      set({ queue: [...queue, item] });
    }
    return true;
  },

  dismiss: () => {
    const { queue } = get();
    const { current, queue: rest } = promote(queue);
    set({ current, queue: rest });
  },

  clear: () => set({ queue: [], current: null }),
}));

/** Imperative helper for non-React callers (triggers, vanilla code). */
export function enqueuePopup(input: EnqueueInput): boolean {
  return usePopupStore.getState().enqueue(input);
}
