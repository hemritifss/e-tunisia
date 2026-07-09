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
let lastRoute = '';

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

/** Restore scroll position for a route (if we have one). */
export function restoreScroll(path: string): void {
  const y = scrollMemory.get(path);
  if (typeof y === 'number') {
    window.scrollTo({ top: y, behavior: 'instant' as ScrollBehavior });
  } else {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }
}

/** Called by the router before leaving a route. Saves current scroll. */
export function beforeLeave(): void {
  const path = currentRoute();
  if (path) scrollMemory.set(path, window.scrollY);
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
