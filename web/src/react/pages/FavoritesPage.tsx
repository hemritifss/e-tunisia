import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Heart, Compass } from 'lucide-react';
import * as api from '../../api';
import { toggleFlag, isFlagged } from '../../ui-utils';
import { optimistic } from '../../optimistic';
import { CardGridSkeleton } from '../components/RouteSkeleton';
import { Carte } from '../components/Carte';

// Migrated from vanilla pages/favorites.ts — same classes, same data merge
// (server favoriteIds + local flags), same mock fallback.

function getLocallySavedPlaceIds(): string[] {
  try {
    const raw = localStorage.getItem('etunisia_flags') || '{}';
    const map = JSON.parse(raw) as Record<string, true>;
    return Object.keys(map)
      .filter((k) => k.startsWith('place:') && k.endsWith(':fav'))
      .map((k) => k.slice('place:'.length, -':fav'.length));
  } catch {
    return [];
  }
}

async function loadFavorites(): Promise<any[]> {
  const serverIds: string[] = [];
  try {
    const profile = await api.getMyProfile();
    if (Array.isArray(profile?.favoriteIds)) serverIds.push(...profile.favoriteIds);
  } catch {
    /* ignore */
  }
  const localIds = getLocallySavedPlaceIds();
  const allIds = Array.from(new Set([...serverIds, ...localIds]));

  let saved: any[] = [];
  if (allIds.length > 0) {
    try {
      const fetched = await api.getFavoritePlaces(allIds);
      if (Array.isArray(fetched) && fetched.length) saved = fetched;
    } catch {
      /* ignore */
    }
  }
  // No mock fallback: a user with nothing saved sees the real empty state.
  return saved;
}

function Empty() {
  return (
    <div className="favorites-empty">
      <Heart style={{ width: '3rem', height: '3rem', color: 'var(--text-muted)' }} />
      <h3>No saved places yet</h3>
      <p>Start exploring and save places you want to visit!</p>
      <a href="#/explore" className="btn btn-primary"><Compass /> Explore Now</a>
    </div>
  );
}

export default function FavoritesPage() {
  const queryClient = useQueryClient();
  const { data: saved, isLoading } = useQuery({
    queryKey: ['favorites', 'places'],
    queryFn: loadFavorites,
  });

  const unsave = (e: React.MouseEvent, placeId: string) => {
    e.preventDefault();
    e.stopPropagation();

    const flagKey = 'place:' + placeId + ':fav';
    const wasFlagged = isFlagged(flagKey);
    // Snapshot the list so undo can restore the card in its original position
    // rather than appending it to the end.
    const before = queryClient.getQueryData<any[]>(['favorites', 'places']);

    optimistic({
      key: `save:place:${placeId}`,
      apply: () => {
        if (wasFlagged) toggleFlag(flagKey);
        queryClient.setQueryData<any[]>(['favorites', 'places'], (old) =>
          (old || []).filter((p) => p.id !== placeId),
        );
      },
      revert: () => {
        if (wasFlagged) toggleFlag(flagKey);
        queryClient.setQueryData<any[]>(['favorites', 'places'], before);
      },
      commit: () => api.toggleFavorite(placeId),
      message: 'Removed from your places',
      errorMessage: "Couldn't remove that — check your connection.",
    });
  };

  return (
    <div className="favorites-page page-enter" data-design="sleek">
      <div className="favorites-header">
        <h1><Heart /> Saved Places</h1>
        <p>Your personally curated collection of must-visit places in Tunisia.</p>
      </div>
      <div className="favorites-grid">
        {isLoading ? (
          <CardGridSkeleton count={6} label="Loading saved places" />
        ) : !saved || saved.length === 0 ? (
          <Empty />
        ) : (
          saved.map((p, i) => (
            <Carte
              key={p.id}
              place={p}
              index={i}
              isSaved
              onToggleSave={(e) => unsave(e, p.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
