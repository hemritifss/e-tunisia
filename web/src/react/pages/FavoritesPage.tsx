import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Heart, MapPin, Star, Compass } from 'lucide-react';
import * as api from '../../api';
import { toggleFlag, isFlagged } from '../../ui-utils';
import TunisiaLoader from '../components/TunisiaLoader';

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

function placeImage(p: any): string {
  return api.getImageUrl(p.coverImage || p.image || p.imageUrl || (p.images && p.images[0]) || '');
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
    if (isFlagged('place:' + placeId + ':fav')) toggleFlag('place:' + placeId + ':fav');
    try {
      api.toggleFavorite(placeId);
    } catch {
      /* best-effort */
    }
    queryClient.setQueryData<any[]>(['favorites', 'places'], (old) =>
      (old || []).filter((p) => p.id !== placeId),
    );
  };

  return (
    <div className="favorites-page page-enter" data-design="sleek">
      <div className="favorites-header">
        <h1><Heart /> Saved Places</h1>
        <p>Your personally curated collection of must-visit places in Tunisia.</p>
      </div>
      <div className="favorites-grid">
        {isLoading ? (
          <div className="favorites-loading">
            <TunisiaLoader size={52} label="Loading saved places…" />
          </div>
        ) : !saved || saved.length === 0 ? (
          <Empty />
        ) : (
          saved.map((p) => (
            <div key={p.id} className="place-card reveal-on-scroll">
              <a href={`#/place/${p.id}`} className="place-card-link">
                <img src={placeImage(p)} alt={p.name} className="place-card-img" loading="lazy" />
                <div className="place-card-body">
                  <div className="place-card-category">{p.category?.name || p.category || ''}</div>
                  <h4 className="place-card-title">{p.name}</h4>
                  <div className="place-card-location">
                    <MapPin />
                    {p.location || p.city || ''}
                  </div>
                  <div className="place-card-footer">
                    <div className="place-card-rating">
                      <Star />
                      {p.rating || '4.5'}
                    </div>
                    <button
                      className="place-card-save saved"
                      data-place={p.id}
                      aria-label="Unsave"
                      onClick={(e) => unsave(e, p.id)}
                    >
                      <Heart />
                    </button>
                  </div>
                </div>
              </a>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
