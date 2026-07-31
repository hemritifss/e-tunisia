import React, { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

/**
 * Skeleton -> content crossfade (Bled motion spec: 180ms, no layout shift).
 *
 * While `loading` is true the skeleton renders in normal flow, so the host box
 * is sized by the skeleton and nothing jumps. When `loading` flips false the
 * content takes the flow and the skeleton is kept mounted for one 180ms beat as
 * an absolutely-positioned layer fading out on top of it. Because the outgoing
 * layer is out of flow, the host never resizes mid-swap.
 *
 * `children` is whatever the non-loading branch resolved to, so error and empty
 * states crossfade on exactly the same path as content. Wrapping a ternary
 * chain in <Swap> does not change which branch wins, only how it arrives.
 *
 * The fade uses CSS animations rather than transitions on purpose: an element
 * that mounts already carrying its end state has no transition to run, and the
 * usual double-rAF class flip is a race that shows up as a dropped frame under
 * load. A mount-time animation always plays.
 */

// Mirrors --duration-fast in tokens.css and the .bled-swap-out animation in
// skeletons.css. Only used to unmount the ghost, so a few ms of slack is fine.
const FADE_MS = 180;

type Props = {
  loading: boolean;
  skeleton: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

export function Swap({ loading, skeleton, children, className }: Props) {
  const reduce = useReducedMotion();
  const [ghost, setGhost] = useState(false);
  const wasLoading = useRef(loading);

  useEffect(() => {
    const finishedLoading = wasLoading.current && !loading;
    wasLoading.current = loading;
    if (!finishedLoading || reduce) return;
    setGhost(true);
    const t = window.setTimeout(() => setGhost(false), FADE_MS);
    return () => window.clearTimeout(t);
  }, [loading, reduce]);

  // Wrap the container, not the items inside it: this host is a plain block, so
  // placing it between a grid and its children would collapse the grid.
  const hostClass = className ? `bled-swap ${className}` : 'bled-swap';

  if (loading) {
    return (
      <div className={hostClass}>
        <div className="bled-swap-layer">{skeleton}</div>
      </div>
    );
  }

  return (
    <div className={hostClass}>
      {/* Only fade the incoming layer when a swap actually happened. Rendering
          straight from cache should be instant, not a pointless 180ms fade. */}
      <div className={ghost ? 'bled-swap-layer is-in' : 'bled-swap-layer'}>{children}</div>
      {ghost && (
        <div className="bled-swap-layer is-out" aria-hidden="true">{skeleton}</div>
      )}
    </div>
  );
}
