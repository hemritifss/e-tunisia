import { QueryClient } from '@tanstack/react-query';
import { onRouteChange } from '../../router';

/**
 * Defaults tuned for a "feels live" social/travel app — NOT for a static catalogue.
 *
 *  - staleTime 30s: most surfaces (passport, activity, leaderboard) can change at any
 *    moment as other users act. 30s is the visible-content recency contract.
 *  - refetchOnWindowFocus + refetchOnReconnect: coming back to a tab refreshes.
 *  - refetchOnMount 'always': navigating into a route re-fetches even if data is fresh,
 *    so /#/u/<handle> after an endorse/follow elsewhere reflects the change.
 *  - retry 1 (down from 2): faster failure when the API is down — users notice.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 1000 * 60 * 30,
      // Never retry 4xx — a 400/401/403/404 won't fix itself, and retrying a 429
      // (rate limit) just digs the hole deeper. Only transient 5xx/network errors
      // get a single retry.
      retry: (failureCount, error) => {
        const status = (error as any)?.status;
        if (typeof status === 'number' && status >= 400 && status < 500) return false;
        return failureCount < 1;
      },
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      refetchOnMount: 'always',
    },
    mutations: {
      retry: 0,
    },
  },
});

/**
 * Coarse "something changed across the platform" invalidator.
 * Pages can listen to `window.dispatchEvent(new Event('etunisia:refresh-feeds'))`
 * and force-fetch. Used by realtime push, manual refresh buttons, and the
 * hashchange listener that runs on every in-app nav.
 */
if (typeof window !== 'undefined') {
  window.addEventListener('etunisia:refresh-feeds', () => {
    queryClient.invalidateQueries();
  });

  // Invalidate the things most likely to be stale when the user comes back.
  window.addEventListener('focus', () => {
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
    queryClient.invalidateQueries({ queryKey: ['activity-feed'] });
    queryClient.invalidateQueries({ queryKey: ['passport'] });
  });

  // Realtime notification push → invalidate the notification + activity caches.
  window.addEventListener('etunisia:notification-new', () => {
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
    queryClient.invalidateQueries({ queryKey: ['unread-count'] });
    queryClient.invalidateQueries({ queryKey: ['activity-feed'] });
  });

  // Navigating to a new hash route — refetch the few global widgets that depend
  // on it (passport stats when landing on /#/u/<handle>, etc.).
  onRouteChange(() => {
    queryClient.invalidateQueries({ queryKey: ['passport'] });
  });
}
