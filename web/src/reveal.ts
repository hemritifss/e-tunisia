/**
 * Arch reveal — the single driver for every `[data-arch-reveal]` element.
 *
 * The visual half lives in styles/animations.css: the attribute alone puts the
 * element in a pre-state (`clip-path: inset(100% 0 0 0)` + `scale(1.06)`) and
 * `.is-in` releases it over 700ms. This module is the half that decides *when*
 * `.is-in` lands.
 *
 * Why this is not an IntersectionObserver
 * ---------------------------------------
 * It cannot be. IntersectionObserver measures *painted* visibility, and it
 * applies the target's own clip. An element sitting in the arch-reveal
 * pre-state is clipped to zero height, so it reports `intersectionRatio: 0` and
 * `isIntersecting: false` forever, at every scroll position — an observer aimed
 * at it never fires and the image never appears. Measured on /explore with a
 * 1280x800 viewport: a `.carte-photo` spanning y 702–902 reported ratio 0 while
 * its unclipped parent, same position, reported 0.212. Setting `clip-path:
 * none` on that same element flipped it to 0.291; clearing the `scale(1.06)`
 * changed nothing. The clip is the whole story.
 *
 * Observing an unclipped ancestor instead would fire on the wrong geometry (a
 * feed post is several times taller than its media), so the trigger is computed
 * from the target's own rect. The geometry is exactly the one the motion
 * library documents — 10% of the box visible, with the viewport's bottom edge
 * pulled up 40px — just measured by hand rather than by the observer.
 *
 * The rect pass is rAF-coalesced and runs only while something is still
 * pending; targets leave the set the moment they resolve, and the listeners
 * detach when the set empties. A page whose images have all arrived costs
 * nothing.
 *
 * Registration is a MutationObserver, and that part is not optional. Every
 * image grid in this app renders its cards after a fetch resolves and the feed
 * appends more on scroll, so a one-shot sweep at island mount would see an
 * empty container and leave every card that arrives later clipped to nothing,
 * permanently. Watching the document for insertions is what makes the utility
 * safe to sprinkle on any component without per-component plumbing.
 *
 * Fail-visible contract. The pre-state is a plain attribute selector, so an
 * element carrying the attribute with nobody to add `.is-in` is an invisible
 * element. Three things keep that from happening:
 *
 *   1. Every `[data-arch-reveal]` in the app is written by React. React only
 *      renders because react/lib/islands.tsx mounted it, and islands.tsx
 *      *statically imports this module*. ES module evaluation order means that
 *      if this file ever throws, islands.tsx never evaluates either, so no
 *      island mounts and the attribute never reaches the DOM. No JS, or broken
 *      JS, therefore means no hidden content rather than invisible content.
 *   2. The mechanism below needs no platform feature beyond
 *      `getBoundingClientRect`. MutationObserver and requestAnimationFrame are
 *      both feature-detected, and their absence downgrades to revealing on
 *      sight rather than to hiding.
 *   3. The DOM watcher runs in every mode, reduced motion included, so a node
 *      inserted at any point in the session still gets resolved.
 */

/** Only ever look at elements that still need resolving. */
const PENDING_SELECTOR = '[data-arch-reveal]:not(.is-in)';

/** Fraction of the target's area that must be inside the fold to trigger. */
const THRESHOLD = 0.1;

/** The fold sits this far above the viewport's bottom edge. */
const BOTTOM_INSET = 40;

/**
 * matchMedia is absent outside a browser (tests, SSR probes). Absent means
 * "no stated preference", which is the animating default.
 */
const reducedMotion =
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Under reduced motion, or without rAF to coalesce on, nothing is scheduled:
 * targets land in their end state the moment we see them.
 */
const scrollGated = !reducedMotion && typeof requestAnimationFrame === 'function';

const pending = new Set<Element>();

/**
 * The visible fraction of `rect`, matching how IntersectionObserver derives
 * `intersectionRatio` — area of the clipped box over area of the full box.
 *
 * Ancestor overflow is deliberately not walked. A card scrolled sideways out of
 * a narrow strip can still sit inside the viewport's bounds and will resolve
 * early, which costs the effect on that one card and never hides anything.
 */
function visibleRatio(rect: DOMRect, vh: number, vw: number): number {
  if (rect.width <= 0 || rect.height <= 0) return 0;
  const h = Math.min(rect.bottom, vh - BOTTOM_INSET) - Math.max(rect.top, 0);
  const w = Math.min(rect.right, vw) - Math.max(rect.left, 0);
  if (h <= 0 || w <= 0) return 0;
  return (h * w) / (rect.height * rect.width);
}

function viewport(): [number, number] {
  return [
    window.innerHeight || document.documentElement.clientHeight,
    window.innerWidth || document.documentElement.clientWidth,
  ];
}

function flush(): void {
  if (pending.size === 0) return;
  const [vh, vw] = viewport();

  // Every rect is read before a single class is written. Interleaving the two
  // would invalidate style between reads and force a reflow per card.
  const resolved: Element[] = [];
  for (const el of pending) {
    if (!el.isConnected || visibleRatio(el.getBoundingClientRect(), vh, vw) >= THRESHOLD) {
      resolved.push(el);
    }
  }

  for (const el of resolved) {
    pending.delete(el);
    if (el.isConnected) el.classList.add('is-in');
  }
  if (pending.size === 0) listen(false);
}

let frame = 0;

function schedule(): void {
  if (frame || pending.size === 0) return;
  frame = requestAnimationFrame(() => {
    frame = 0;
    flush();
  });
}

let listening = false;
let pageWatcher: ResizeObserver | null = null;

function listen(on: boolean): void {
  if (on === listening) return;
  listening = on;

  if (on) {
    // Capture phase so scrolling a nested scroller counts, not just the page.
    window.addEventListener('scroll', schedule, { passive: true, capture: true });
    window.addEventListener('resize', schedule, { passive: true });
    // Content settling above the fold (images arriving, a section expanding)
    // pushes pending cards into view without any scroll event.
    if (!pageWatcher && typeof ResizeObserver !== 'undefined') {
      pageWatcher = new ResizeObserver(schedule);
    }
    pageWatcher?.observe(document.documentElement);
  } else {
    window.removeEventListener('scroll', schedule, { capture: true });
    window.removeEventListener('resize', schedule);
    pageWatcher?.disconnect();
  }
}

function collect(root: ParentNode): Element[] {
  const found: Element[] =
    root instanceof Element && root.matches(PENDING_SELECTOR) ? [root] : [];
  found.push(...root.querySelectorAll(PENDING_SELECTOR));
  return found;
}

function resolve(targets: Element[]): void {
  if (targets.length === 0) return;

  if (!scrollGated) {
    for (const el of targets) el.classList.add('is-in');
    return;
  }

  const [vh, vw] = viewport();
  const rects = targets.map((el) => el.getBoundingClientRect());

  targets.forEach((el, i) => {
    const r = rects[i];
    const whole = r.top >= 0 && r.left >= 0 && r.bottom <= vh && r.right <= vw;
    if (whole) {
      // Already entirely in the viewport the first time we see it: this is first
      // paint, not a scroll-in. Wiping the above-the-fold image up from nothing
      // would push out the largest contentful paint and read as a glitch rather
      // than a reveal, so it lands finished. Adding the class in the same task
      // as the insertion also means the browser computes one style for the
      // element instead of two, so there is no transition to run.
      el.classList.add('is-in');
    } else {
      pending.add(el);
    }
  });

  if (pending.size > 0) {
    listen(true);
    // Anything already past the fold on arrival resolves on the next frame.
    schedule();
  }
}

let domWatcher: MutationObserver | null = null;

function watchDocument(): void {
  if (domWatcher || typeof MutationObserver === 'undefined') return;
  const host = document.body || document.documentElement;
  if (!host) return;

  domWatcher = new MutationObserver((records) => {
    let added: Element[] | null = null;

    for (const record of records) {
      record.addedNodes.forEach((node) => {
        if (!(node instanceof Element)) return;
        const found = collect(node);
        if (found.length > 0) (added ??= []).push(...found);
      });

      // Cards torn down before they were ever seen — a route change while the
      // fold is full — would otherwise sit in the pending set being measured
      // every frame.
      record.removedNodes.forEach((node) => {
        if (!(node instanceof Element) || pending.size === 0) return;
        for (const el of collect(node)) pending.delete(el);
      });
    }

    if (added) resolve(added);
    if (pending.size === 0) listen(false);
  });

  domWatcher.observe(host, { childList: true, subtree: true });
}

/**
 * Resolve every pending `[data-arch-reveal]` under `root`, and make sure the
 * document watcher is running.
 *
 * Callers only need this for markup that is already in the DOM when they call;
 * anything rendered later is picked up by the watcher.
 */
export function observeReveals(root: ParentNode = document): void {
  watchDocument();
  resolve(collect(root));
}

watchDocument();
