// ============================================
// FAVORITES PAGE — Connected to backend
// ============================================

import { places as mockPlaces } from '../data';
import * as api from '../api';
import { replaceIcons } from '../icons';
import { toggleFlag, isFlagged } from '../ui-utils';

// Read every place id the user has hearted in this browser
// (key shape used by Explore + place-detail: 'place:<id>:fav').
function getLocallySavedPlaceIds(): string[] {
  try {
    const raw = localStorage.getItem('etunisia_flags') || '{}';
    const map = JSON.parse(raw) as Record<string, true>;
    return Object.keys(map)
      .filter(k => k.startsWith('place:') && k.endsWith(':fav'))
      .map(k => k.slice('place:'.length, -':fav'.length));
  } catch { return []; }
}

export function renderFavoritesPage(): string {
  return `
    <div class="favorites-page page-enter" data-design="sleek">
      <div class="favorites-header">
        <h1><i class="lucide-heart"></i> Saved Places</h1>
        <p>Your personally curated collection of must-visit places in Tunisia.</p>
      </div>
      <div class="favorites-grid" id="favorites-grid">
        <div class="favorites-loading">
          <div class="spinner"></div>
          <p>Loading saved places...</p>
        </div>
      </div>
    </div>
  `;
}

export async function initFavoritesPage() {
  const grid = document.getElementById('favorites-grid');
  if (!grid) return;

  // Pull from both: server-side user.favoriteIds AND any local-only saves.
  const serverIds: string[] = [];
  try {
    const profile = await api.getMyProfile();
    if (Array.isArray(profile?.favoriteIds)) serverIds.push(...profile.favoriteIds);
  } catch {}

  const localIds = getLocallySavedPlaceIds();
  const allIds = Array.from(new Set([...serverIds, ...localIds]));

  let saved: any[] = [];
  if (allIds.length > 0) {
    try {
      const fetched = await api.getFavoritePlaces(allIds);
      if (Array.isArray(fetched) && fetched.length) saved = fetched;
    } catch {}
  }
  // Final fallback — anything tagged saved in mock data, only if nothing else.
  if (saved.length === 0 && serverIds.length === 0 && localIds.length === 0) {
    saved = mockPlaces.filter(p => p.saved);
  }

  if (saved.length === 0) {
    grid.innerHTML = `
      <div class="favorites-empty">
        <i class="lucide-heart" style="font-size: 3rem; color: var(--text-muted);"></i>
        <h3>No saved places yet</h3>
        <p>Start exploring and save places you want to visit!</p>
        <a href="#/explore" class="btn btn-primary"><i class="lucide-compass"></i> Explore Now</a>
      </div>
    `;
    replaceIcons(grid);
    return;
  }

  grid.innerHTML = saved.map(p => `
    <div class="place-card reveal-on-scroll">
      <a href="#/place/${p.id}" class="place-card-link">
        <img src="${api.getImageUrl((p as any).coverImage || (p as any).image || (p as any).imageUrl || ((p as any).images && (p as any).images[0]) || '')}" alt="${p.name}" class="place-card-img" loading="lazy" />
        <div class="place-card-body">
          <div class="place-card-category">${(p as any).category || ''}</div>
          <h4 class="place-card-title">${p.name}</h4>
          <div class="place-card-location">
            <i class="lucide-map-pin"></i>
            ${(p as any).location || (p as any).city || ''}
          </div>
          <div class="place-card-footer">
            <div class="place-card-rating">
              <i class="lucide-star"></i>
              ${(p as any).rating || '4.5'}
            </div>
            <button class="place-card-save saved" data-place="${p.id}" aria-label="Unsave">
              <i class="lucide-heart"></i>
            </button>
          </div>
        </div>
      </a>
    </div>
  `).join('');

  replaceIcons(grid);

  // Unsave buttons — also clear the local flag so it doesn't reappear after refresh.
  document.querySelectorAll('.place-card-save').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const card = btn.closest('.place-card');
      const placeId = (btn as HTMLElement).dataset.place;
      if (placeId) {
        if (isFlagged('place:' + placeId + ':fav')) toggleFlag('place:' + placeId + ':fav');
        try { api.toggleFavorite(placeId); } catch {}
      }
      card?.remove();
      // Check if empty
      if (grid.children.length === 0) {
        grid.innerHTML = `
          <div class="favorites-empty">
            <i class="lucide-heart" style="font-size: 3rem; color: var(--text-muted);"></i>
            <h3>No saved places yet</h3>
            <p>Start exploring and save places you want to visit!</p>
            <a href="#/explore" class="btn btn-primary"><i class="lucide-compass"></i> Explore Now</a>
          </div>
        `;
        replaceIcons(grid);
      }
    });
  });
}
