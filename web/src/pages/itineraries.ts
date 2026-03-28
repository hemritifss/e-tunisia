// ============================================
// ITINERARIES PAGE
// Mirrors Flutter ItinerariesScreen
// ============================================

import * as api from '../api';
import { replaceIcons } from '../icons';

// Mock fallback
const mockItineraries = [
  {
    id: '1', title: '3-Day Tunis & Carthage Discovery', description: 'Explore the capital city, visit the ancient Carthage ruins, and wander through Sidi Bou Said. Perfect for first-time visitors wanting to experience the cultural heart of Tunisia.',
    duration: 3, difficulty: 'easy', isPremium: false,
    image: 'https://images.unsplash.com/photo-1680600855512-441b69ef3d18?w=600&q=80',
  },
  {
    id: '2', title: 'Sahara Desert Adventure', description: 'Journey from Tozeur to Douz, experience a desert camp under the stars, ride camels across dunes, and visit the mountain oases of Chebika, Tamerza, and Mides.',
    duration: 5, difficulty: 'moderate', isPremium: true,
    image: 'https://images.unsplash.com/photo-1689742855019-a09e208930e8?w=600&q=80',
  },
  {
    id: '3', title: 'Coastal Tunisia: Beaches & Medinas', description: 'From Bizerte to Sousse, discover Tunisia\'s stunning Mediterranean coast. Visit Tabarka\'s coral reefs, Hammamet\'s resorts, and the UNESCO medina of Sousse.',
    duration: 7, difficulty: 'easy', isPremium: false,
    image: 'https://images.unsplash.com/photo-1598554200951-b9f36526ecd9?w=600&q=80',
  },
  {
    id: '4', title: 'Ancient Heritage Trail', description: 'Visit El Jem\'s colossal amphitheatre, Dougga\'s complete Roman city, Bulla Regia\'s underground villas, and Kairouan\'s Great Mosque. A journey through 3,000 years of history.',
    duration: 4, difficulty: 'moderate', isPremium: true,
    image: 'https://images.unsplash.com/photo-1611094184403-df84cdcc7523?w=600&q=80',
  },
  {
    id: '5', title: 'Djerba Island Escape', description: 'Relax on pristine beaches, explore Erriadh\'s street art, visit the ancient El Ghriba synagogue, and taste the freshest seafood in North Africa.',
    duration: 3, difficulty: 'easy', isPremium: false,
    image: 'https://images.unsplash.com/photo-1653173449794-09b4ec96a17f?w=600&q=80',
  },
];

function renderItineraryCard(it: any): string {
  const diffColors: Record<string, string> = {
    easy: 'var(--success)',
    moderate: 'var(--amber)',
    hard: 'var(--error)',
  };
  const diffColor = diffColors[it.difficulty] || 'var(--success)';

  return `
    <div class="itinerary-card reveal-on-scroll">
      <div class="itinerary-card-cover" style="background-image: url(${it.image || ''});">
        <div class="itinerary-card-cover-overlay"></div>
        <div class="itinerary-card-cover-tags">
          <span class="itinerary-duration-tag">${it.duration} Days</span>
          ${it.isPremium ? '<span class="itinerary-pro-tag">👑 PRO</span>' : ''}
        </div>
        <h3 class="itinerary-card-title">${it.title}</h3>
      </div>
      <div class="itinerary-card-body">
        <div class="itinerary-difficulty" style="color: ${diffColor};">
          <i class="lucide-mountain" style="font-size: 0.875rem;"></i>
          ${(it.difficulty || 'easy').toUpperCase()}
        </div>
        <p class="itinerary-desc">${it.description}</p>
        <button class="btn btn-outline btn-sm" style="width: 100%;">
          <i class="lucide-eye"></i> View Full Itinerary
        </button>
      </div>
    </div>
  `;
}

export function renderItinerariesPage(): string {
  return `
    <div class="itineraries-page page-enter">
      <div class="itineraries-header">
        <h1><i class="lucide-map"></i> Trip Itineraries</h1>
        <p>Curated multi-day trips designed by local experts and experienced travelers.</p>
      </div>
      <div class="itineraries-grid" id="itineraries-grid">
        <div class="itineraries-loading">
          <div class="spinner"></div>
          <p>Loading itineraries...</p>
        </div>
      </div>
    </div>
  `;
}

export async function initItinerariesPage() {
  const grid = document.getElementById('itineraries-grid');
  if (!grid) return;

  let itineraries: any[];
  try {
    itineraries = await api.getItineraries();
    if (!itineraries.length) itineraries = mockItineraries;
  } catch {
    itineraries = mockItineraries;
  }

  grid.innerHTML = itineraries.map(it => renderItineraryCard(it)).join('');
  replaceIcons(grid);
}
