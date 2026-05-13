import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './query-client';

const rootMap = new Map<HTMLElement, Root>();

export function mountIsland(
  Component: React.ComponentType,
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
      <Component {...props} />
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
