// ============================================================================
// Central routing API — History API backed (clean URLs: /explore, not /#/explore).
//
// Every routing call in the app goes through here. A global click interceptor
// (see main.ts) turns clicks on internal links into goTo() calls, and legacy
// "#/x" URLs are normalized to "/x" on first load.
//
//   goTo(path)        push a new history entry + notify listeners
//   replace(path)     rewrite the current entry silently (no notify)
//   currentRoute()    pathname + query, e.g. "/search?q=foo"
//   currentPath()     pathname only, e.g. "/search"
//   query()           URLSearchParams of the query string
//   absoluteUrl(path) origin + path, for share / copy-link
//   onRouteChange(fn) subscribe to back/forward + programmatic navigation
//
// Accepts both "/x" and legacy "#/x" targets everywhere (the latter is
// normalized), so call sites and existing href="#/x" anchors keep working.
// ============================================================================

export type RouteListener = () => void;

const ROUTE_EVENT = 'router:change';

/** Scroll position memory per route for back/forward restoration. */
const scrollMemory = new Map<string, number>();

/**
 * The route the user is currently *looking at*.
 *
 * This is NOT the same as `currentRoute()` during a navigation: `goTo()` pushes
 * the new URL onto history *before* notifying listeners, so by the time the app
 * reacts, `location` already describes the destination. Saving scroll against
 * `currentRoute()` therefore filed the departing page's offset under the
 * destination's key — and back-navigation restored that wrong value. We track
 * the outgoing route explicitly instead.
 */
let lastRoute = currentRoute();

/** Pending rAF for an in-flight scroll restore, so a new nav can cancel it. */
let restoreFrame = 0;

/** Normalize any target ('x' | '/x' | '#/x') into a clean path '/x'. */
function normalize(target: string): string {
  let p = target;
  if (p.startsWith('#')) p = p.slice(1); // legacy hash route
  if (!p.startsWith('/')) p = '/' + p;
  return p;
}

function emit(): void {
  window.dispatchEvent(new Event(ROUTE_EVENT));
}

/** Remember the scroll position for a route. */
export function saveScroll(path: string): void {
  scrollMemory.set(path, window.scrollY);
}

/** Abort an in-flight restore (a newer navigation, or the user taking over). */
export function cancelScrollRestore(): void {
  if (restoreFrame) {
    cancelAnimationFrame(restoreFrame);
    restoreFrame = 0;
  }
}

/**
 * Restore the remembered scroll position for a route.
 *
 * The destination's content comes from a lazily-imported React island, so at
 * call time the document is typically still 0px tall and a plain scrollTo()
 * would clamp to the top — which is why "back" always dumped you at the top of
 * the feed. We re-apply the offset across animation frames until the page has
 * grown tall enough to honour it, giving up after ~1.2s so a genuinely short
 * page doesn't retry forever.
 */
export function restoreScroll(path: string): void {
  cancelScrollRestore();

  const y = scrollMemory.get(path);
  if (typeof y !== 'number' || y <= 0) {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    return;
  }

  const deadline = Date.now() + 1200;

  // If the user starts scrolling while content streams in, they win — stop
  // yanking the viewport out from under them.
  const yieldToUser = () => cancelScrollRestore();
  const opts = { passive: true, once: true } as AddEventListenerOptions;
  window.addEventListener('wheel', yieldToUser, opts);
  window.addEventListener('touchstart', yieldToUser, opts);
  window.addEventListener('keydown', yieldToUser, opts);

  const cleanup = () => {
    window.removeEventListener('wheel', yieldToUser);
    window.removeEventListener('touchstart', yieldToUser);
    window.removeEventListener('keydown', yieldToUser);
  };

  const attempt = () => {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo({
      top: Math.min(y, Math.max(0, maxScroll)),
      behavior: 'instant' as ScrollBehavior,
    });
    // Short of the target and still within the budget → the island is probably
    // still rendering. Try again next frame.
    if (maxScroll < y && Date.now() < deadline) {
      restoreFrame = requestAnimationFrame(attempt);
    } else {
      restoreFrame = 0;
      cleanup();
    }
  };

  attempt();
}

/**
 * Called by the router before painting a new route. Files the current scroll
 * offset against the route being *left* (see `lastRoute`), then advances the
 * marker to the destination.
 */
export function beforeLeave(): void {
  if (lastRoute) scrollMemory.set(lastRoute, window.scrollY);
  lastRoute = currentRoute();
}

/** Clear saved scroll for a route (e.g. after form submission). */
export function clearScroll(path: string): void {
  scrollMemory.delete(path);
}

/** The active route: pathname + query string, defaulting to '/'. */
export function currentRoute(): string {
  return (location.pathname + location.search) || '/';
}

/** The active path without the query string. */
export function currentPath(): string {
  return location.pathname || '/';
}

/** Parsed query string of the active route. */
export function query(): URLSearchParams {
  return new URLSearchParams(location.search);
}

/** Absolute URL for a route — use for sharing / copy-link / OG tags. */
export function absoluteUrl(target: string): string {
  return location.origin + normalize(target);
}

/**
 * Navigate to a path, pushing a history entry and notifying listeners.
 * No-op when already on that exact route (mirrors the old `location.hash`
 * semantics, where setting the same hash fired no event).
 */
export function goTo(target: string): void {
  const path = normalize(target);
  if (path === currentRoute()) return;
  (window as any).__routerPush = true;
  history.pushState(null, '', path);
  emit();
}

/**
 * Replace the current entry without adding history and WITHOUT notifying
 * listeners — for silently rewriting the URL while the caller renders itself.
 */
export function replace(target: string): void {
  history.replaceState(null, '', normalize(target));
}

/**
 * Subscribe to route changes: browser back/forward (popstate) and programmatic
 * navigation (goTo). Returns an unsubscribe function.
 */
export function onRouteChange(fn: RouteListener): () => void {
  window.addEventListener('popstate', fn);
  window.addEventListener(ROUTE_EVENT, fn);
  return () => {
    window.removeEventListener('popstate', fn);
    window.removeEventListener(ROUTE_EVENT, fn);
  };
}

/**
 * Normalize a legacy "#/x" URL (old bookmarks, links opened in a new tab) to a
 * clean "/x" path. Call once on app boot, before the first navigate().
 */
export function normalizeLegacyHash(): void {
  if (location.hash.startsWith('#/')) {
    history.replaceState(null, '', location.hash.slice(1));
  }
}
