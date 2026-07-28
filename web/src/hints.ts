// ============================================================================
// Contextual hints — a margin note pinned to the thing it describes.
//
// The app's only guidance was a one-shot modal tutorial on first run: shown
// once, before the user had any context for it, then never again. By the time
// someone actually wondered "what does this button do", the explanation was
// long gone.
//
// These hints work the opposite way: each one waits until its anchor is
// genuinely on screen, explains that one control, and never returns once
// acknowledged. Rules that keep them from becoming the next annoyance:
//
//   • One hint on screen at a time, ever.
//   • At most one hint per page visit — no chains, no "next" buttons.
//   • Never on the first 4 seconds of a session; people orient themselves first.
//   • Dismissed (or acted on) = gone forever, stored per hint id.
//   • Anchor must be visible and reasonably sized, or the hint is skipped.
//
//   registerHint({...})  declare a hint
//   maybeShowHints()     called on each route change by main.ts
//   resetHints()         dev/QA escape hatch (window.__resetHints())
// ============================================================================

export interface Hint {
  /** Stable id — the dismissal is remembered under this. Never reuse. */
  id: string;
  /** CSS selector for the element being explained. */
  anchor: string;
  /** Short handwritten-style heading. */
  title: string;
  /** One sentence. If it needs two, the UI is the problem, not the hint. */
  body: string;
  /**
   * Routes this hint may appear on. A prefix match on the pathname, or '*'
   * for anywhere. Keeps a hint about the map from firing on the feed.
   */
  routes: string[];
  /** Lower numbers win when several hints are eligible at once. */
  priority?: number;
}

const STORAGE_KEY = 'etunisia_hints_seen';
/** Don't interrupt the first moments of a session. */
const SESSION_GRACE_MS = 4000;
/** Let the route settle (islands mount async) before hunting for anchors. */
const SETTLE_MS = 900;

const hints: Hint[] = [];
const sessionStart = Date.now();

let current: HTMLElement | null = null;
let currentAnchor: HTMLElement | null = null;
let shownThisRoute = false;
let settleTimer = 0;

function seen(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'));
  } catch {
    return new Set();
  }
}

function markSeen(id: string): void {
  try {
    const s = seen();
    s.add(id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...s]));
  } catch {
    /* storage full or blocked — the hint just reappears next session */
  }
}

export function registerHint(hint: Hint): void {
  if (!hints.some((h) => h.id === hint.id)) hints.push(hint);
}

/** Tear down the visible hint, if any. */
export function dismissHint(remember = true): void {
  if (!current) return;
  const el = current;
  if (remember && el.dataset.hintId) markSeen(el.dataset.hintId);

  currentAnchor?.classList.remove('hint-anchor-lit');
  currentAnchor = null;

  el.classList.remove('is-shown');
  window.setTimeout(() => el.remove(), 220);
  current = null;

  window.removeEventListener('scroll', reposition);
  window.removeEventListener('resize', reposition);
}

/** Keep the slip glued to its anchor while the page moves under it. */
function reposition(): void {
  if (!current || !currentAnchor) return;

  const a = currentAnchor.getBoundingClientRect();
  // Anchor scrolled out of view — the note has nothing to point at.
  if (a.bottom < 0 || a.top > window.innerHeight) {
    dismissHint(false);
    return;
  }

  const pop = current.getBoundingClientRect();
  const margin = 10;

  // Prefer below the anchor; flip above when there isn't room.
  const below = a.bottom + margin;
  const fitsBelow = below + pop.height < window.innerHeight - 8;
  const top = fitsBelow ? below : Math.max(8, a.top - pop.height - margin);
  current.dataset.placement = fitsBelow ? 'bottom' : 'top';

  // Horizontally: align to the anchor, clamped inside the viewport.
  let left = a.left;
  left = Math.min(left, window.innerWidth - pop.width - 8);
  left = Math.max(8, left);

  current.style.top = `${top}px`;
  current.style.left = `${left}px`;
  // Point the arrow at the anchor's centre, even after clamping.
  const arrowX = Math.max(12, Math.min(a.left + a.width / 2 - left, pop.width - 20));
  current.style.setProperty('--hint-arrow-x', `${arrowX}px`);
}

function render(hint: Hint, anchor: HTMLElement): void {
  const pop = document.createElement('div');
  pop.className = 'hint-pop';
  pop.dataset.hintId = hint.id;
  pop.setAttribute('role', 'status');

  const title = document.createElement('span');
  title.className = 'hint-pop-title';
  title.textContent = hint.title;

  const body = document.createElement('span');
  body.className = 'hint-pop-body';
  body.textContent = hint.body;

  const actions = document.createElement('div');
  actions.className = 'hint-pop-actions';

  const ok = document.createElement('button');
  ok.type = 'button';
  ok.className = 'hint-pop-btn';
  ok.textContent = 'Got it';
  ok.addEventListener('click', () => dismissHint(true));

  actions.append(ok);
  pop.append(title, body, actions);
  document.body.appendChild(pop);

  current = pop;
  currentAnchor = anchor;
  anchor.classList.add('hint-anchor-lit');

  reposition();
  requestAnimationFrame(() => pop.classList.add('is-shown'));

  window.addEventListener('scroll', reposition, { passive: true });
  window.addEventListener('resize', reposition);

  // Interacting with the thing the hint describes is the best possible
  // dismissal — the user has understood it, so stop explaining.
  anchor.addEventListener('click', () => dismissHint(true), { once: true });
}

/** Is this element actually on screen and big enough to point at? */
function anchorUsable(el: Element | null): el is HTMLElement {
  if (!(el instanceof HTMLElement)) return false;
  const r = el.getBoundingClientRect();
  if (r.width < 16 || r.height < 16) return false;
  return r.top >= 0 && r.bottom <= window.innerHeight && r.left >= 0 && r.right <= window.innerWidth;
}

/** Live pathname, so a deferred hint can tell it is still on the right page. */
function currentPathname(): string {
  return location.pathname || '/';
}

function routeMatches(hint: Hint, path: string): boolean {
  return hint.routes.some((r) => r === '*' || path === r || path.startsWith(r === '/' ? '/' : r + '/') || (r === '/' && path === '/'));
}

/**
 * Called after each navigation. Picks at most one eligible hint, once the page
 * has settled enough for its anchor to exist.
 */
export function maybeShowHints(path: string): void {
  window.clearTimeout(settleTimer);
  dismissHint(false); // a hint from the previous page has no business here
  shownThisRoute = false;

  // Wait for the page to settle AND for the session grace to elapse — whichever
  // is later. Bailing out when inside the grace window would mean the landing
  // route never gets a hint at all: maybeShowHints only runs per navigation, so
  // a user who opens the feed and stays there (the common case) would get one
  // check at t≈0, fail the grace test, and never be reconsidered.
  const graceLeft = Math.max(0, SESSION_GRACE_MS - (Date.now() - sessionStart));
  const delay = Math.max(SETTLE_MS, graceLeft);

  settleTimer = window.setTimeout(() => {
    if (shownThisRoute || current) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    // The route may have changed while we waited out the grace period.
    if (currentPathname() !== path) return;

    const dismissed = seen();
    const eligible = hints
      .filter((h) => !dismissed.has(h.id) && routeMatches(h, path))
      .sort((a, b) => (a.priority ?? 50) - (b.priority ?? 50));

    for (const hint of eligible) {
      const anchor = document.querySelector(hint.anchor);
      if (anchorUsable(anchor)) {
        shownThisRoute = true;
        render(hint, anchor);
        return;
      }
    }
  }, delay);
}

/** Clear every dismissal — exposed as window.__resetHints() for QA. */
export function resetHints(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch { /* nothing to clear */ }
}

/**
 * The app's hints. Deliberately few: each one costs the user attention, so a
 * hint has to earn its place by explaining something genuinely non-obvious.
 */
export function initHints(): void {
  registerHint({
    id: 'you-tab-v1',
    anchor: '.mobile-nav-item[data-page="you"]',
    title: 'Everything of yours is here',
    body: 'Saved places, carnets, passport, badges and settings all live under You.',
    routes: ['*'],
    priority: 10,
  });

  registerHint({
    id: 'create-button-v1',
    anchor: '#mobile-nav-create',
    title: 'Share a spot',
    body: 'Post a photo, a tip, or a place you just discovered.',
    routes: ['/'],
    priority: 20,
  });

  registerHint({
    id: 'cmdk-v1',
    anchor: '.nav-search-trigger',
    title: 'Search anything',
    body: 'Places, people, trips and pages — press Ctrl+K from anywhere.',
    routes: ['*'],
    priority: 30,
  });

  registerHint({
    id: 'city-filter-v1',
    anchor: '.nav-city',
    title: 'Filter the whole app',
    body: 'Pick a city and every page narrows to it until you clear it.',
    routes: ['/explore', '/map'],
    priority: 25,
  });

  (window as any).__resetHints = resetHints;
}
