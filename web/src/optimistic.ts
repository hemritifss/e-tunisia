// ============================================================================
// Optimistic actions with undo.
//
// The complaint behind this file is "did my tap register?". Saving a place used
// to mean: tap → nothing → network round-trip → the heart finally fills. On a
// patchy Tunisian 3G connection that gap is seconds long, so people tapped
// twice, which toggled it back off, which read as the app being broken.
//
// The model here is the one people already know from Gmail's "Undo send":
//
//   1. Apply the change locally, immediately. The UI never waits.
//   2. Show a toast with an Undo button.
//   3. Hold the network call for a grace window.
//      → Undo pressed  : revert locally, never call the server at all.
//      → Window elapses: send it. On failure, revert and say so.
//
// Holding the request is what makes undo honest: there is no "unsend" to race,
// and a user who immediately corrects themselves costs zero requests. It also
// collapses rapid toggling on the same key into a single final call.
// ============================================================================

import { showToast } from './toasts';

export interface OptimisticAction {
  /**
   * Stable key for the thing being acted on, e.g. `save:place:123`. Repeated
   * actions on the same key supersede each other instead of queueing.
   */
  key: string;
  /** Apply the change locally. Runs synchronously, before anything else. */
  apply: () => void;
  /** Put local state back exactly as it was. Must be safe to call once. */
  revert: () => void;
  /** The real network call. Only runs if the grace window elapses. */
  commit: () => Promise<unknown>;
  /** Toast copy, e.g. "Saved to your places". */
  message: string;
  /** Label on the undo button. */
  undoLabel?: string;
  /** How long the user has to undo. Default 5s. */
  graceMs?: number;
  /** Shown if the commit fails. Defaults to a generic message. */
  errorMessage?: string;
}

interface Pending {
  timer: number;
  revert: () => void;
  /** Kept so flushOptimistic() can send the change when the page goes away. */
  commit: () => Promise<unknown>;
}

const pending = new Map<string, Pending>();

/** Flush a pending action's timer without running its commit. */
function clearPending(key: string): Pending | undefined {
  const p = pending.get(key);
  if (p) {
    window.clearTimeout(p.timer);
    pending.delete(key);
  }
  return p;
}

/**
 * Run an action optimistically. Returns immediately — the UI is already updated
 * by the time this resolves.
 */
export function optimistic(action: OptimisticAction): void {
  const {
    key,
    apply,
    revert,
    commit,
    message,
    undoLabel = 'Undo',
    graceMs = 5000,
    errorMessage = "That didn't save — check your connection.",
  } = action;

  // A second action on the same key while one is in flight: drop the earlier
  // one's pending commit. Its local change already happened and this new
  // action's apply() is about to run on top of it.
  clearPending(key);

  apply();

  let undone = false;

  const timer = window.setTimeout(() => {
    pending.delete(key);
    if (undone) return;
    void commit().catch(() => {
      // The server said no — put the UI back so it stops lying, and tell them.
      try {
        revert();
      } finally {
        showToast({ message: errorMessage, type: 'error' });
      }
    });
  }, graceMs);

  pending.set(key, { timer, revert, commit });

  showToast({
    message,
    type: 'success',
    duration: graceMs,
    action: {
      label: undoLabel,
      onClick: () => {
        undone = true;
        clearPending(key);
        revert();
      },
    },
  });
}

/**
 * Commit every pending action right now. Called when the page is being hidden
 * or unloaded — otherwise closing the tab inside the grace window would
 * silently discard a change the user believes they made.
 */
export function flushOptimistic(): void {
  // Snapshot first: commit() implementations may touch the map.
  const keys = [...pending.keys()];
  for (const key of keys) {
    const p = pending.get(key);
    if (!p) continue;
    window.clearTimeout(p.timer);
    pending.delete(key);
    // Fire and forget — the page is going away, we cannot await or report.
    try {
      void p.commit();
    } catch { /* nothing useful to do during unload */ }
  }
}

export function initOptimistic(): void {
  // `visibilitychange` is the reliable mobile signal; `pagehide` covers the
  // desktop close/navigate-away case. `beforeunload` is not fired on iOS.
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushOptimistic();
  });
  window.addEventListener('pagehide', flushOptimistic);
}
