import { enqueuePopup, usePopupStore } from '../../stores/popup-store';
import { TUTORIAL_DONE_KEY } from './TutorialPopup';
import { BADGES } from '../badge-definitions';
import * as api from '../../../api';
import { currentPath, onRouteChange } from '../../../router';

/**
 * Wires the events that surface popups. Call once at app boot.
 *
 * Event-driven (realtime notifications):
 *   • Tip received    → celebration  (`donation` ≥ threshold)
 *   • Badge earned    → badge        (`badge` notification)
 *
 * Session-driven (evaluated on boot / login, one "ambient" popup per session):
 *   • Level increased → levelup      (compared against last-known level)
 *   • Returned after gap → welcome   (last-seen older than N days)
 *   • First run       → tutorial
 *   • Otherwise       → daily nudge  (once per calendar day)
 */

/** A tip at or above this (TND) earns the full-screen celebration. */
const HIGH_TIP_THRESHOLD = 10;
/** Show the welcome-back popup after this many days away. */
const WELCOME_BACK_DAYS = 3;

/** Check-in streak lengths worth celebrating, with their reward copy. */
const STREAK_MILESTONES: Array<{ days: number; reward: string }> = [
  { days: 3, reward: 'Explorer Badge' },
  { days: 7, reward: 'Week Warrior Badge + 100 XP' },
  { days: 14, reward: 'Dedicated Traveler Badge + 250 XP' },
  { days: 30, reward: 'Legend Badge + 1000 XP' },
  { days: 100, reward: 'Tunisia Master Badge + 5000 XP' },
];

const DAILY_SEEN_KEY = 'etunisia_daily_popup_seen';
const LAST_SEEN_KEY = 'etunisia_last_seen';
const LAST_LEVEL_KEY = 'etunisia_last_level';
const STREAK_MILESTONE_KEY = 'etunisia_streak_milestone';

let wired = false;

function isLoggedIn(): boolean {
  try {
    return !!localStorage.getItem('etunisia_token');
  } catch {
    return false;
  }
}

/**
 * Routes where ambient popups must stay silent: the onboarding wizard is
 * already a guided flow (stacking the tutorial popup on top of it shows two
 * competing onboardings at once), and auth/landing pages are pre-session.
 */
const QUIET_ROUTES = ['/onboarding', '/login', '/register', '/forgot-password', '/password-reset', '/hero'];

function onQuietRoute(): boolean {
  const path = (currentPath() || '/').toLowerCase();
  return QUIET_ROUTES.some((p) => path === p || path.startsWith(p + '/'));
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

/** Whole days since the last recorded visit, or null if never recorded. */
function daysSinceLastSeen(): number | null {
  try {
    const v = localStorage.getItem(LAST_SEEN_KEY);
    if (!v) return null;
    const last = Number(v);
    if (!Number.isFinite(last)) return null;
    return Math.floor((Date.now() - last) / (24 * 60 * 60 * 1000));
  } catch {
    return null;
  }
}

function touchLastSeen() {
  try {
    localStorage.setItem(LAST_SEEN_KEY, String(Date.now()));
  } catch {}
}

// ── Event-driven ──────────────────────────────────────────

/** From "Amine sent you a tip" → "Amine"; anonymous/other → "Someone". */
function parseSender(title: unknown): string {
  const m = String(title || '').match(/^(.+?)\s+sent you a tip/i);
  return m ? m[1].trim() : 'Someone';
}

/** Look up a badge's emoji/description from the frontend catalog by display name. */
function resolveBadge(name: string): { emoji: string; description?: string } {
  const lower = name.toLowerCase();
  const hit = Object.values(BADGES).find(
    (b) => b.label.toLowerCase() === lower || b.id.toLowerCase() === lower,
  );
  return { emoji: hit?.emoji || '🏅', description: hit?.description };
}

function onNotification(e: Event) {
  const n: any = (e as CustomEvent).detail || {};
  const type = String(n.type || '').toLowerCase();

  if (type === 'donation') {
    // Donations also carry referral rewards — only celebrate actual tips.
    const title = String(n.title || '');
    if (!/tip/i.test(title)) return;
    const amount = Number(n.data?.amount) || 0;
    if (amount < HIGH_TIP_THRESHOLD) return;
    enqueuePopup({
      kind: 'celebration',
      priority: 20,
      data: { amount, fromName: parseSender(title), message: n.data?.message },
    });
    return;
  }

  if (type === 'badge') {
    const name =
      n.data?.badge || n.data?.name || String(n.title || '').replace(/^.*?:\s*/, '') || 'New badge';
    const resolved = resolveBadge(name);
    enqueuePopup({
      kind: 'badge',
      priority: 18,
      dedupeKey: `badge:${name}`,
      data: {
        name,
        emoji: n.data?.emoji || resolved.emoji,
        description: n.data?.description || resolved.description,
      },
    });
  }
}

// ── Session-driven ────────────────────────────────────────

/** Enqueue a level-up popup if the user's level rose since last seen. */
async function checkLevelUp(): Promise<boolean> {
  let level = 0;
  let points = 0;
  let nextLevelPoints = 0;
  try {
    const r: any = await api.getMyPoints();
    const d = r?.data || r || {};
    level = Number(d.level) || 0;
    points = Number(d.points) || 0;
    nextLevelPoints = Number(d.nextLevelPoints) || 0;
  } catch {
    return false;
  }
  if (!level) return false;

  let stored = 0;
  try {
    stored = Number(localStorage.getItem(LAST_LEVEL_KEY) || '0');
    localStorage.setItem(LAST_LEVEL_KEY, String(level));
  } catch {}

  if (stored > 0 && level > stored) {
    enqueuePopup({
      kind: 'levelup',
      priority: 15,
      dedupeKey: 'levelup',
      data: { level, points, nextLevelPoints },
    });
    return true;
  }
  return false;
}

/**
 * Enqueue a streak-milestone popup if the current check-in streak has crossed
 * a new reward tier since we last celebrated. Exported so the daily check-in
 * can fire it the moment a streak grows.
 *
 * Uses a `null` baseline sentinel: the first observation only records the
 * current tier (so existing streaks don't retro-fire), later crossings pop.
 */
export async function checkStreakMilestone(): Promise<boolean> {
  let streak = 0;
  try {
    const r: any = await api.getMyStreak();
    const d = r?.data || r || {};
    streak = Number(d.currentStreak) || 0;
  } catch {
    return false;
  }

  const reachedTier = STREAK_MILESTONES.filter((m) => streak >= m.days).pop();
  const reached = reachedTier?.days || 0;

  let baseline: number | null = null;
  try {
    const raw = localStorage.getItem(STREAK_MILESTONE_KEY);
    baseline = raw === null ? null : Number(raw);
    localStorage.setItem(STREAK_MILESTONE_KEY, String(reached));
  } catch {}

  // First observation → record baseline only, never retro-celebrate.
  if (baseline === null) return false;
  if (reached > baseline && reachedTier) {
    enqueuePopup({
      kind: 'streak',
      priority: 16,
      dedupeKey: 'streak',
      data: { streak, milestone: reached, reward: reachedTier.reward },
    });
    return true;
  }
  return false;
}

/**
 * Decide the one ambient popup for this session. Idempotent across reconnects:
 * the localStorage guards (last-seen, daily-seen, last-level) prevent re-firing.
 */
export async function runSessionPopups() {
  if (!isLoggedIn() || onQuietRoute()) return;

  // First run → the guided tour, nothing else competes.
  if (!tutorialDone()) {
    enqueuePopup({ kind: 'tutorial', priority: 10, dedupeKey: 'tutorial' });
    touchLastSeen();
    return;
  }

  // Read the absence gap before refreshing the baseline.
  const days = daysSinceLastSeen();
  touchLastSeen();

  // 1) Level-up wins — most rewarding moment.
  if (await checkLevelUp()) {
    markDailySeen();
    return;
  }

  // 2) Streak milestone (7 / 14 / 30 … day check-in run).
  if (await checkStreakMilestone()) {
    markDailySeen();
    return;
  }

  // 3) Welcome back after an absence.
  if (days !== null && days >= WELCOME_BACK_DAYS) {
    const added = enqueuePopup({ kind: 'welcome', priority: 8, dedupeKey: 'welcome', data: { days } });
    if (added) {
      markDailySeen();
      return;
    }
  }

  // 4) Otherwise the daily nudge, once per day — but never at t=0. Wait for
  //    the first scroll (or 8s), so the user sees the feed before we ask for
  //    anything. Big moments above (level-up, streak) still fire immediately.
  if (!dailySeenToday()) {
    await afterFirstScrollOr(8000);
    if (onQuietRoute() || !isLoggedIn() || dailySeenToday()) return;
    const added = enqueuePopup({ kind: 'daily', priority: 5, dedupeKey: 'daily' });
    if (added) markDailySeen();
  }
}

/** Resolves on the user's first scroll, or after `ms` — whichever comes first. */
function afterFirstScrollOr(ms: number): Promise<void> {
  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      window.removeEventListener('scroll', finish);
      resolve();
    };
    window.addEventListener('scroll', finish, { once: true, passive: true });
    window.setTimeout(finish, ms);
  });
}

export function initPopupTriggers() {
  if (wired) return;
  wired = true;

  window.addEventListener('etunisia:notification-new', onNotification);
  // Re-evaluate when a (re)connection confirms an authenticated session — this
  // also covers logging in mid-session. The guards above prevent spam.
  window.addEventListener('etunisia:realtime-connected', () => { void runSessionPopups(); });

  // When the user leaves a quiet route (finished onboarding, logged in), the
  // session popups they were spared become eligible again.
  let wasQuiet = onQuietRoute();
  onRouteChange(() => {
    const quiet = onQuietRoute();
    if (wasQuiet && !quiet) void runSessionPopups();
    wasQuiet = quiet;
  });

  // First pass for an already-logged-in boot.
  void runSessionPopups();
}

/** Drop any queued/visible popups — call on logout. */
export function clearPopups() {
  usePopupStore.getState().clear();
}
