import React, { Suspense } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { MotionConfig } from 'framer-motion';
import { queryClient } from './query-client';
import { ErrorBoundary } from './ErrorBoundary';
import TunisiaLoader from '../components/TunisiaLoader';

const rootMap = new Map<HTMLElement, Root>();

function IslandFallback() {
  return (
    <div style={{ padding: '72px 24px', display: 'flex', justifyContent: 'center' }}>
      <TunisiaLoader size={64} label="Loading…" />
    </div>
  );
}

// Sometimes hold the loader for a short minimum so the Tunisia trace is actually
// seen instead of flashing for a few ms on a fast (cached) navigation. Not every
// time, and the floor varies, so the app almost never feels deliberately slow.
function pickMinHold(): number {
  const r = Math.random();
  if (r < 0.65) return 0;    // most navigations: no artificial floor
  if (r < 0.92) return 750;  // sometimes: 0.75s
  return 1000;               // occasionally: 1s
}

function IslandHost({
  Component,
  islandProps,
}: {
  Component: React.ComponentType | React.LazyExoticComponent<React.ComponentType>;
  islandProps?: Record<string, unknown>;
}) {
  const holdRef = React.useRef<number | null>(null);
  if (holdRef.current === null) holdRef.current = pickMinHold();
  const [holding, setHolding] = React.useState(holdRef.current > 0);
  React.useEffect(() => {
    if (!holdRef.current) return;
    const t = window.setTimeout(() => setHolding(false), holdRef.current);
    return () => window.clearTimeout(t);
  }, []);
  if (holding) return <IslandFallback />;
  return (
    <Suspense fallback={<IslandFallback />}>
      <Component {...islandProps} />
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
          <IslandHost Component={Component} islandProps={props} />
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
