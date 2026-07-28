// ============================================================================
// Route progress bar — the "something is happening" signal for navigation.
//
// Replaces the app's old habit of throwing a full-screen spinner at the user on
// every route change. A 2px ink line at the top of the viewport is enough to say
// "I heard you, the page is coming" without blanking the content they're still
// reading.
//
// Two rules keep it from becoming noise itself:
//
//   1. It never appears for fast navigations. Nothing renders for the first
//      SHOW_DELAY ms — a cached route that resolves in 80ms shows no bar at all,
//      because a bar that flashes and vanishes reads as a glitch.
//   2. It never pretends to be finished. The fill eases toward 90% and waits
//      there; only finish() takes it to 100%. A bar that hits 100% and keeps
//      sitting there teaches people to distrust it.
//
//   startNavProgress()  called on every route change (main.ts)
//   finishNavProgress() called when the route's island actually commits
//                       (islands.tsx) — i.e. real content is on screen
// ============================================================================

/** Don't render anything until a navigation has been slow enough to notice. */
const SHOW_DELAY = 180;
/** Ceiling for the indeterminate crawl; only finish() goes past it. */
const CRAWL_CEILING = 90;

/** If a route never signals completion (failed chunk, thrown render), give up. */
const FAILSAFE_MS = 10_000;

let bar: HTMLDivElement | null = null;
let showTimer = 0;
let crawlTimer = 0;
let hideTimer = 0;
let failsafeTimer = 0;
let progress = 0;
let running = false;

function ensureBar(): HTMLDivElement {
  if (bar && bar.isConnected) return bar;
  bar = document.createElement('div');
  bar.id = 'nav-progress';
  bar.className = 'nav-progress';
  // Decorative: screen readers get route changes announced by the page itself.
  bar.setAttribute('aria-hidden', 'true');
  document.body.appendChild(bar);
  return bar;
}

function paint(): void {
  if (!bar) return;
  bar.style.transform = `scaleX(${progress / 100})`;
}

function clearTimers(): void {
  window.clearTimeout(showTimer);
  window.clearTimeout(hideTimer);
  window.clearTimeout(failsafeTimer);
  window.clearInterval(crawlTimer);
  showTimer = 0;
  hideTimer = 0;
  failsafeTimer = 0;
  crawlTimer = 0;
}

/**
 * Begin a navigation. Safe to call repeatedly — a second call while running
 * restarts the crawl rather than stacking bars.
 */
export function startNavProgress(): void {
  clearTimers();
  running = true;
  progress = 0;

  // A route that never reports back (failed chunk, crashed render) must not
  // leave a bar crawling forever.
  failsafeTimer = window.setTimeout(() => finishNavProgress(), FAILSAFE_MS);

  showTimer = window.setTimeout(() => {
    const el = ensureBar();
    el.classList.remove('is-done');
    progress = 8;
    paint();
    el.classList.add('is-active');

    // Decelerating crawl: fast at first, asymptotic near the ceiling, so a slow
    // route still looks like it is making headway without ever lying.
    crawlTimer = window.setInterval(() => {
      const remaining = CRAWL_CEILING - progress;
      if (remaining <= 0.5) return;
      progress += Math.max(0.4, remaining * 0.12);
      paint();
    }, 120);
  }, SHOW_DELAY);
}

/** The route's content is on screen — complete and fade out. */
export function finishNavProgress(): void {
  if (!running) return;
  running = false;
  clearTimers();

  // Never shown (fast navigation) → nothing to complete.
  if (!bar || !bar.classList.contains('is-active')) {
    if (bar) bar.classList.remove('is-active');
    progress = 0;
    return;
  }

  progress = 100;
  paint();
  bar.classList.add('is-done');

  hideTimer = window.setTimeout(() => {
    if (!bar) return;
    bar.classList.remove('is-active', 'is-done');
    progress = 0;
    // Reset without animating back across the screen.
    bar.style.transition = 'none';
    paint();
    void bar.offsetWidth; // flush, so the next run animates from 0
    bar.style.transition = '';
  }, 260);
}
