import React, { Suspense } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { MotionConfig } from 'framer-motion';
import { queryClient } from './query-client';
import { ErrorBoundary } from './ErrorBoundary';
import TunisiaLoader from '../components/TunisiaLoader';
import { finishNavProgress } from '../../nav-progress';
import { observeReveals } from '../../reveal';

const rootMap = new Map<HTMLElement, Root>();

/**
 * Suspense fallback for a route chunk that is still downloading.
 *
 * Deliberately *delayed*: a chunk that resolves in <200ms (the common case once
 * it is cached) should swap straight to content. Flashing a spinner for 80ms and
 * yanking it away reads as a glitch, so we render nothing at all until the wait
 * is long enough to be worth acknowledging.
 */
function IslandFallback() {
  const [visible, setVisible] = React.useState(false);
  React.useEffect(() => {
    const t = window.setTimeout(() => setVisible(true), 200);
    return () => window.clearTimeout(t);
  }, []);
  if (!visible) return null;
  return (
    <div style={{ padding: '72px 24px', display: 'flex', justifyContent: 'center' }}>
      <TunisiaLoader size={64} label="Loading…" />
    </div>
  );
}

/**
 * Completes the route progress bar. Lives *inside* the Suspense boundary, so it
 * only mounts once the lazy chunk has resolved and the real page is committing
 * — which is the honest definition of "the navigation finished".
 */
function ReadySignal() {
  React.useEffect(() => {
    finishNavProgress();
  }, []);
  return null;
}

/**
 * Kicks the arch-reveal sweep for whatever this island rendered synchronously.
 * Content that arrives later — fetched grids, infinite scroll — is picked up by
 * the document watcher inside reveal.ts, not by this call. The effect runs after
 * the commit and before paint, so the rect reads inside observeReveals see real
 * layout.
 */
function RevealBinding({ container }: { container: HTMLElement }) {
  React.useEffect(() => {
    observeReveals(container);
  }, [container]);
  return null;
}

function IslandHost({
  Component,
  islandProps,
  container,
}: {
  Component: React.ComponentType | React.LazyExoticComponent<React.ComponentType>;
  islandProps?: Record<string, unknown>;
  container: HTMLElement;
}) {
  return (
    <Suspense fallback={<IslandFallback />}>
      <Component {...islandProps} />
      <ReadySignal />
      <RevealBinding container={container} />
    </Suspense>
  );
}

export function mountIsland(
  Component: React.ComponentType | React.LazyExoticComponent<React.ComponentType>,
  container: HTMLElement,
  props?: Record<string, unknown>,
): () => void {
  // Cleanup existing root if present
  const existingRoot = rootMap.get(container);
  if (existingRoot) {
    existingRoot.unmount();
    rootMap.delete(container);
  }

  const root = createRoot(container);
  rootMap.set(container, root);

  root.render(
    <QueryClientProvider client={queryClient}>
      {/* reducedMotion="user" makes every framer-motion animation in the app
          honor the OS "Reduce Motion" setting automatically. */}
      <MotionConfig reducedMotion="user">
        <ErrorBoundary>
          <IslandHost Component={Component} islandProps={props} container={container} />
        </ErrorBoundary>
      </MotionConfig>
    </QueryClientProvider>,
  );

  return () => {
    const r = rootMap.get(container);
    if (r) {
      r.unmount();
      rootMap.delete(container);
    }
  };
}

export function unmountIsland(container: HTMLElement): void {
  const root = rootMap.get(container);
  if (root) {
    root.unmount();
    rootMap.delete(container);
  }
}

export function unmountAllIslands(): void {
  rootMap.forEach((root, container) => {
    root.unmount();
  });
  rootMap.clear();
}
