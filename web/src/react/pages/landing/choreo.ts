// "Paper physics" — the landing's shared motion vocabulary.
// Two grammars (see design-system/pages/landing-ultra.md §3):
//   enter-once  — settle / deal / thunk, play a single time on viewport entry
//   scrubbed    — position-mapped to scroll, play as fast as the reader scrolls
// Rotation stays on the CSS `rotate` property (--tilt) so these transforms
// compose with it instead of fighting it.
import { useEffect, useState } from 'react';
import type { Variants } from 'framer-motion';

export const EASE_SETTLE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export const SPRING_SOFT = { type: 'spring' as const, stiffness: 260, damping: 26, mass: 0.9 };
export const SPRING_THUNK = { type: 'spring' as const, stiffness: 520, damping: 27, mass: 0.8 };
export const SPRING_SCRUB = { stiffness: 90, damping: 24, mass: 0.4 };

export const VIEWPORT_ONCE = { once: true, amount: 0.2 } as const;

/** Element settles onto the page — rises + fades. `custom` = delay in s. */
export const settle: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: (delay: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: EASE_SETTLE, delay },
  }),
};

/** Card dealt onto the desk — a longer drop with a faint scale pop. */
export const deal: Variants = {
  hidden: { opacity: 0, y: 38, scale: 0.985 },
  show: (delay: number = 0) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.55, ease: EASE_SETTLE, delay },
  }),
};

/** Headline line rising out of an overflow mask. */
export const lineRise: Variants = {
  hidden: { y: '112%' },
  show: (delay: number = 0) => ({
    y: '0%',
    transition: { duration: 0.7, ease: EASE_SETTLE, delay },
  }),
};

/** Rubber-stamp slam. Rotation here is a transform *offset* on top of the
    CSS `rotate` property, so the stamp lands back on its printed tilt. */
export const thunk: Variants = {
  hidden: { opacity: 0, scale: 1.45, rotate: 7 },
  show: (delay: number = 0) => ({
    opacity: 1,
    scale: 1,
    rotate: 0,
    transition: { ...SPRING_THUNK, delay },
  }),
};

/** SVG stroke drawing itself. */
export const draw: Variants = {
  hidden: { pathLength: 0, opacity: 0 },
  show: (delay: number = 0) => ({
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: { duration: 0.9, ease: 'easeInOut', delay },
      opacity: { duration: 0.2, delay },
    },
  }),
};

/** The hero intro plays once per tab; repeat visits render instantly.
    The flag is written in an effect so StrictMode's double initializer
    can't mark the intro as seen before it ever played. */
export function useIntroPlayed(): boolean {
  const [played] = useState(() => {
    try {
      return sessionStorage.getItem('ej-ultra-intro') === '1';
    } catch {
      return false;
    }
  });
  useEffect(() => {
    try { sessionStorage.setItem('ej-ultra-intro', '1'); } catch { /* private mode */ }
  }, []);
  return played;
}

/** Media-query hook — used to swap pinned scenes for touch-idiomatic layouts. */
export function useMedia(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false,
  );
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setMatches(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [query]);
  return matches;
}
