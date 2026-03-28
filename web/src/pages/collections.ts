// ============================================
// COLLECTIONS PAGE
// Mirrors Flutter CollectionsScreen
// ============================================

import * as api from '../api';
import { replaceIcons } from '../icons';

// Mock fallback data
const mockCollections = [
  {
    id: '1', title: 'Best Beach Destinations', placeIds: ['3', '7', '8'],
    coverImage: 'https://images.unsplash.com/photo-1598554200951-b9f36526ecd9?w=600&q=80',
    description: 'Crystal-clear waters and golden sand along Tunisia\'s Mediterranean coast.',
  },
  {
    id: '2', title: 'UNESCO World Heritage Sites', placeIds: ['2', '4', '6'],
    coverImage: 'https://images.unsplash.com/photo-1770712857881-2133f72fcab7?w=600&q=80',
    description: 'Explore Tunisia\'s 8 UNESCO-listed treasures spanning millennia of history.',
  },
  {
    id: '3', title: 'Top Food Experiences', placeIds: ['1', '4'],
    coverImage: 'https://images.unsplash.com/photo-1742806418170-f051cb880314?w=600&q=80',
    description: 'From street food to fine dining, the best culinary stops in Tunisia.',
  },
  {
    id: '4', title: 'Desert & Oasis Adventures', placeIds: ['5'],
    coverImage: 'https://images.unsplash.com/photo-1689742855019-a09e208930e8?w=600&q=80',
    description: 'Journey into the Sahara and discover hidden oases.',
  },
  {
    id: '5', title: 'Architecture & Medinas', placeIds: ['1', '4', '8'],
    coverImage: 'https://images.unsplash.com/photo-1677942269665-1a08bf81d362?w=600&q=80',
    description: 'Centuries of Islamic, Ottoman, and colonial architecture.',
  },
  {
    id: '6', title: 'Hidden Gems', placeIds: ['7'],
    coverImage: 'https://images.unsplash.com/photo-1653173449794-09b4ec96a17f?w=600&q=80',
    description: 'Off-the-beaten-path destinations most tourists never find.',
  },
];

function renderCollectionCard(col: any): string {
  const count = col.placeIds?.length || 0;
  return `
    <div class="collection-card reveal-on-scroll">
      <div class="collection-card-image">
        <img src="${col.coverImage || ''}" alt="${col.title}" loading="lazy"
             onerror="this.style.background='linear-gradient(135deg, var(--terracotta-pale), var(--mediterranean-pale))'; this.style.objectFit='contain'; this.alt=''" />
        <div class="collection-card-overlay"></div>
        <div class="collection-card-info">
          <h3>${col.title}</h3>
          <span>${count} places</span>
        </div>
      </div>
      ${col.description ? `<p class="collection-card-desc">${col.description}</p>` : ''}
    </div>
  `;
}

export function renderCollectionsPage(): string {
  return `
    <div class="collections-page page-enter">
      <div class="collections-header">
        <h1><i class="lucide-layers"></i> Curated Collections</h1>
        <p>Hand-picked sets of places grouped by theme, curated by our editorial team.</p>
      </div>
      <div class="collections-grid" id="collections-grid">
        <div class="collections-loading">
          <div class="spinner"></div>
          <p>Loading collections...</p>
        </div>
      </div>
    </div>
  `;
}

export async function initCollectionsPage() {
  const grid = document.getElementById('collections-grid');
  if (!grid) return;

  let collections: any[];
  try {
    collections = await api.getCollections();
    if (!collections.length) collections = mockCollections;
  } catch {
    collections = mockCollections;
  }

  grid.innerHTML = collections.map(col => renderCollectionCard(col)).join('');
  replaceIcons(grid);
}
