// ============================================
// EXPLORE PAGE — Connected to backend
// ============================================

import { places as mockPlaces, categories as mockCategories, type Place } from '../data';
import * as api from '../api';
import { replaceIcons } from '../icons';

function renderPlaceCard(p: any): string {
  const catName = typeof p.category === 'object' && p.category ? p.category.name : (p.category || '');
  return `
    <div class="place-card reveal-on-scroll" data-category="${p.categoryClass || 'cat-' + (catName).toLowerCase().replace(/\s+/g, '-')}">
      <a href="#/place/${p.id}" class="place-card-link">
        <img src="${p.image || p.imageUrl || ''}" alt="${p.name}" class="place-card-img" loading="lazy"
             onerror="this.style.background='linear-gradient(135deg, var(--terracotta-pale), var(--mediterranean-pale))'; this.style.objectFit='contain'; this.alt=''" />
        <div class="place-card-body">
          <div class="place-card-category">${catName}</div>
          <h4 class="place-card-title">${p.name}</h4>
          <div class="place-card-location">
            <i class="lucide-map-pin"></i>
            ${p.location || p.city || ''}
          </div>
          <p class="text-sm text-secondary" style="margin-bottom: var(--space-3); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
            ${p.description || ''}
          </p>
          <div class="place-card-footer">
            <div class="place-card-rating">
              <i class="lucide-star" style="font-size: 0.875rem;"></i>
              ${p.rating || '4.5'}
              <span class="place-card-reviews">(${p.reviewCount || 0})</span>
            </div>
            <button class="place-card-save ${p.saved ? 'saved' : ''}" data-place="${p.id}" aria-label="${p.saved ? 'Unsave' : 'Save'}">
              <i class="lucide-heart"></i>
            </button>
          </div>
        </div>
      </a>
    </div>
  `;
}

export function renderPlaceSkeleton(): string {
  return `
    <div class="place-card skeleton-card">
      <div class="skeleton skeleton-image" style="height: 200px; width: 100%; border-radius: 0;"></div>
      <div class="place-card-body" style="padding: var(--space-4);">
        <div class="skeleton skeleton-text" style="width: 60px; height: 16px; margin-bottom: var(--space-2);"></div>
        <div class="skeleton skeleton-text" style="width: 80%; height: 20px; margin-bottom: var(--space-2);"></div>
        <div class="skeleton skeleton-text" style="width: 50%; margin-bottom: var(--space-3);"></div>
        <div class="skeleton skeleton-text" style="width: 100%;"></div>
        <div class="skeleton skeleton-text w-75" style="margin-bottom: var(--space-4);"></div>
        <div class="place-card-footer" style="display: flex; justify-content: space-between; align-items: center;">
          <div class="skeleton" style="width: 60px; height: 20px; border-radius: var(--radius-full);"></div>
          <div class="skeleton" style="width: 32px; height: 32px; border-radius: var(--radius-full);"></div>
        </div>
      </div>
    </div>
  `;
}

export function renderExplorePage(): string {
  return `
    <div class="explore-page page-enter">
      <div class="explore-hero">
        <div class="explore-hero-bg"></div>
        <div class="explore-hero-content">
          <h1>Explore Tunisia</h1>
          <p>Discover ancient ruins, pristine beaches, vibrant medinas, and the vast Sahara. Your next adventure awaits.</p>
        </div>
      </div>

      <div class="explore-categories" id="explore-categories">
        <button class="tag active" data-cat="all">All</button>
      </div>

      <div class="explore-grid stagger-children" id="explore-grid">
        ${[1, 2, 3, 4, 5, 6].map(() => renderPlaceSkeleton()).join('')}
      </div>
    </div>
  `;
}

let allPlaces: any[] = [];

export async function initExplorePage() {
  const catContainer = document.getElementById('explore-categories');
  const grid = document.getElementById('explore-grid');
  if (!grid) return;

  // Load categories
  let categories = mockCategories;
  try {
    const apiCats = await api.getCategories();
    if (apiCats?.length) {
      categories = [{ id: 'all', name: 'All', class: '' }, ...apiCats.map((c: any) => ({
        id: c.id || c.slug || c.name?.toLowerCase(),
        name: c.name,
        class: `cat-${(c.name || '').toLowerCase().replace(/\s+/g, '-')}`,
      }))];
    }
  } catch {}

  // Render category buttons
  if (catContainer) {
    catContainer.innerHTML = categories.map(c =>
      `<button class="tag ${c.id === 'all' ? 'active' : ''}" data-cat="${c.id}">${c.name}</button>`
    ).join('');
  }

  // Load places
  try {
    const data = await api.getPlaces({ limit: '50' });
    allPlaces = data?.data || data || [];
    if (!allPlaces.length) allPlaces = mockPlaces;
  } catch {
    allPlaces = mockPlaces;
  }

  grid.innerHTML = allPlaces.map(p => renderPlaceCard(p)).join('');
  replaceIcons(grid);

  // Category filter
  document.querySelectorAll('.explore-categories .tag').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.explore-categories .tag').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const cat = (btn as HTMLElement).dataset.cat;
      const cards = document.querySelectorAll('.place-card') as NodeListOf<HTMLElement>;
      cards.forEach(card => {
        if (cat === 'all' || card.dataset.category?.includes(cat || '')) {
          card.style.display = '';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });

  // Save buttons
  document.querySelectorAll('.place-card-save').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      btn.classList.toggle('saved');
      const placeId = (btn as HTMLElement).dataset.place;
      if (placeId) try { api.toggleFavorite(placeId); } catch {}
    });
  });
}
