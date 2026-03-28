// ============================================
// FAVORITES PAGE — Connected to backend
// ============================================

import { places as mockPlaces } from '../data';
import * as api from '../api';
import { replaceIcons } from '../icons';

export function renderFavoritesPage(): string {
  return `
    <div class="favorites-page page-enter">
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

  // Get saved places — try backend first, fallback to mock
  let saved = mockPlaces.filter(p => p.saved);

  try {
    const profile = await api.getMyProfile();
    if (profile?.favoriteIds?.length) {
      const fetched = await api.getFavoritePlaces(profile.favoriteIds);
      if (fetched?.length) saved = fetched;
    }
  } catch {}

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
        <img src="${(p as any).image || (p as any).imageUrl || ''}" alt="${p.name}" class="place-card-img" loading="lazy" />
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

  // Unsave buttons
  document.querySelectorAll('.place-card-save').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const card = btn.closest('.place-card');
      const placeId = (btn as HTMLElement).dataset.place;
      if (placeId) try { api.toggleFavorite(placeId); } catch {}
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
