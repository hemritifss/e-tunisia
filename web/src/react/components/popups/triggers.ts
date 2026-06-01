import { enqueuePopup, usePopupStore } from '../../stores/popup-store';
import { TUTORIAL_DONE_KEY } from './TutorialPopup';

/**
 * Wires the events that surface popups. Call once at app boot.
 *
 *  • Tip received  → celebration  (realtime `donation` notification ≥ threshold)
 *  • First run     → tutorial     (no TUTORIAL_DONE flag)
 *  • Otherwise     → daily nudge  (once per calendar day)
 */

/** A tip at or above this (TND) earns the full-screen celebration. */
const HIGH_TIP_THRESHOLD = 10;
const DAILY_SEEN_KEY = 'etunisia_daily_popup_seen';

let wired = false;

function isLoggedIn(): boolean {
  try {
    return !!localStorage.getItem('etunisia_token');
  } catch {
    return false;
  }
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

function tutorialDone(): boolean {
  try {
    return !!localStorage.getItem(TUTORIAL_DONE_KEY);
  } catch {
    return false;
  }
}

function dailySeenToday(): boolean {
  try {
    return localStorage.getItem(DAILY_SEEN_KEY) === todayKey();
  } catch {
    return false;
  }
}

function markDailySeen() {
  try {
    localStorage.setItem(DAILY_SEEN_KEY, todayKey());
  } catch {}
}

/** From "Amine sent you a tip" → "Amine"; anonymous/other → "Someone". */
function parseSender(title: unknown): string {
  const t = String(title || '');
  const m = t.match(/^(.+?)\s+sent you a tip/i);
  if (m) return m[1].trim();
  return 'Someone';
}

function onNotification(e: Event) {
  const n: any = (e as CustomEvent).detail || {};
  const type = String(n.type || '').toLowerCase();
  if (type !== 'donation') return;
  // Donations also carry referral rewards — only celebrate actual tips.
  const title = String(n.title || '');
  if (!/tip/i.test(title)) return;

  const amount = Number(n.data?.amount) || 0;
  if (amount < HIGH_TIP_THRESHOLD) return;

  enqueuePopup({
    kind: 'celebration',
    priority: 20,
    data: {
      amount,
      fromName: parseSender(title),
      message: n.data?.message,
    },
  });
}

/** Decide the once-per-session popup (tutorial first, else daily). */
export function runSessionPopups() {
  if (!isLoggedIn()) return;

  if (!tutorialDone()) {
    enqueuePopup({ kind: 'tutorial', priority: 10, dedupeKey: 'tutorial' });
    return;
  }

  if (!dailySeenToday()) {
    const added = enqueuePopup({ kind: 'daily', priority: 5, dedupeKey: 'daily' });
    if (added) markDailySeen();
  }
}

export function initPopupTriggers() {
  if (wired) return;
  wired = true;

  window.addEventListener('etunisia:notification-new', onNotification);
  // Re-evaluate when a (re)connection confirms an authenticated session — this
  // also covers logging in mid-session. The once/day + done guards prevent spam.
  window.addEventListener('etunisia:realtime-connected', runSessionPopups);

  // First pass for an already-logged-in boot.
  runSessionPopups();
}

/** Drop any queued/visible popups — call on logout. */
export function clearPopups() {
  usePopupStore.getState().clear();
}
