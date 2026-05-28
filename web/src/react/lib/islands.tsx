import React, { Suspense } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './query-client';
import { ErrorBoundary } from './ErrorBoundary';

const rootMap = new Map<HTMLElement, Root>();

function IslandFallback() {
  return (
    <div style={{ padding: '48px 24px', textAlign: 'center', color: '#888' }}>
      <div className="spinner" style={{
        width: 32, height: 32, border: '3px solid #eee',
        borderTopColor: '#C65D3B', borderRadius: '50%',
        animation: 'spin 0.8s linear infinite', margin: '0 auto 16px',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      Loading...
    </div>
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
      <ErrorBoundary>
        <Suspense fallback={<IslandFallback />}>
          <Component {...props} />
        </Suspense>
      </ErrorBoundary>
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
