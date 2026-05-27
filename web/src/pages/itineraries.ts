// ============================================
// ITINERARIES PAGE — Curated multi-day plans
// Per design-system/pages/itineraries.md.
// ============================================

import * as api from '../api';
import { replaceIcons } from '../icons';
import { showToast } from '../ui-utils';

// Mock fallback
const mockItineraries = [
  { id: '1', title: '3-Day Tunis & Carthage Discovery', description: 'Explore the capital city, visit the ancient Carthage ruins, and wander through Sidi Bou Said. Perfect for first-time visitors wanting to experience the cultural heart of Tunisia.', duration: 3, difficulty: 'easy', isPremium: false, image: 'https://images.unsplash.com/photo-1680600855512-441b69ef3d18?w=600&q=80' },
  { id: '2', title: 'Sahara Desert Adventure', description: 'Journey from Tozeur to Douz, experience a desert camp under the stars, ride camels across dunes, and visit the mountain oases of Chebika, Tamerza, and Mides.', duration: 5, difficulty: 'moderate', isPremium: true, image: 'https://images.unsplash.com/photo-1689742855019-a09e208930e8?w=600&q=80' },
  { id: '3', title: 'Coastal Tunisia: Beaches & Medinas', description: "From Bizerte to Sousse, discover Tunisia's stunning Mediterranean coast. Visit Tabarka's coral reefs, Hammamet's resorts, and the UNESCO medina of Sousse.", duration: 7, difficulty: 'easy', isPremium: false, image: 'https://images.unsplash.com/photo-1598554200951-b9f36526ecd9?w=600&q=80' },
  { id: '4', title: 'Ancient Heritage Trail', description: "Visit El Jem's colossal amphitheatre, Dougga's complete Roman city, Bulla Regia's underground villas, and Kairouan's Great Mosque. A journey through 3,000 years of history.", duration: 4, difficulty: 'moderate', isPremium: true, image: 'https://images.unsplash.com/photo-1611094184403-df84cdcc7523?w=600&q=80' },
  { id: '5', title: 'Djerba Island Escape', description: "Relax on pristine beaches, explore Erriadh's street art, visit the ancient El Ghriba synagogue, and taste the freshest seafood in North Africa.", duration: 3, difficulty: 'easy', isPremium: false, image: 'https://images.unsplash.com/photo-1653173449794-09b4ec96a17f?w=600&q=80' },
];

function esc(v: unknown): string {
  return String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const DIFF_TINT: Record<string, string> = {
  easy: 'var(--success)',
  moderate: 'var(--amber)',
  hard: 'var(--coral)',
  challenging: 'var(--coral)',
};

function renderItineraryCard(it: any): string {
  const diff = (it.difficulty || 'easy').toLowerCase();
  const tint = DIFF_TINT[diff] || 'var(--success)';
  const cover = api.getImageUrl(it.coverImage || it.image || (it.images && it.images[0]) || '');
  return `
    <article class="itinerary-card reveal-on-scroll" style="--diff-tint: ${tint}">
      <div class="itinerary-card-cover" style="background-image: url('${esc(cover)}');">
        <div class="itinerary-card-cover-overlay" aria-hidden="true"></div>
        <div class="itinerary-card-cover-tags">
          <span class="itinerary-duration-tag"><i class="lucide-calendar-days"></i> ${it.duration} day${it.duration === 1 ? '' : 's'}</span>
          ${it.isPremium ? '<span class="itinerary-pro-tag"><i class="lucide-crown"></i> Pro</span>' : ''}
        </div>
        <h3 class="itinerary-card-title">${esc(it.title)}</h3>
      </div>
      <div class="itinerary-card-body">
        <div class="itinerary-difficulty">
          <i class="lucide-mountain"></i>
          ${esc(diff)}
        </div>
        <p class="itinerary-desc">${esc(it.description)}</p>
        <button type="button" class="btn btn-outline btn-sm itinerary-view-btn" data-itin="${esc(it.id)}">
          <i class="lucide-eye"></i> View full itinerary
        </button>
      </div>
    </article>
  `;
}

export function renderItinerariesPage(): string {
  return `
    <div class="itineraries-page page-enter">
      <section class="itineraries-hero">
        <div class="itineraries-hero-bg" aria-hidden="true"></div>
        <div class="itineraries-hero-mesh" aria-hidden="true"></div>
        <div class="itineraries-hero-orbs" aria-hidden="true">
          <span class="itineraries-hero-orb"></span>
          <span class="itineraries-hero-orb"></span>
        </div>
        <div class="itineraries-hero-content">
          <span class="itineraries-eyebrow"><i class="lucide-map"></i> Curated journeys</span>
          <h1>Trip <span class="itineraries-accent">itineraries</span></h1>
          <p>Multi-day plans designed by local experts and seasoned travelers — from Sahara nights to coastal road trips.</p>
        </div>
      </section>
      <div class="itineraries-grid" id="itineraries-grid">
        <div class="itineraries-loading"><div class="spinner"></div><p>Loading itineraries…</p></div>
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

  grid.innerHTML = itineraries.map(renderItineraryCard).join('');
  replaceIcons(grid);

  document.querySelectorAll<HTMLButtonElement>('.itinerary-view-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.itin;
      const it = itineraries.find((x) => String(x.id) === String(id));
      if (it) openItineraryModal(it);
    });
  });
}

function openItineraryModal(it: any) {
  document.getElementById('itinerary-modal')?.remove();

  const diff = (it.difficulty || 'easy').toLowerCase();
  const tint = DIFF_TINT[diff] || 'var(--success)';
  const cover = api.getImageUrl(it.coverImage || it.image || (it.images && it.images[0]) || '');

  const modal = document.createElement('div');
  modal.id = 'itinerary-modal';
  modal.className = 'itinerary-modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.style.setProperty('--diff-tint', tint);
  modal.innerHTML = `
    <div class="itinerary-modal-overlay"></div>
    <div class="itinerary-modal-card" role="document">
      <button type="button" class="itinerary-modal-close" aria-label="Close">
        <i class="lucide-x"></i>
      </button>
      <div class="itinerary-modal-cover" style="background-image: url('${esc(cover)}');">
        <div class="itinerary-modal-cover-overlay" aria-hidden="true"></div>
        <div class="itinerary-modal-cover-tags">
          <span class="itinerary-duration-tag"><i class="lucide-calendar-days"></i> ${it.duration} day${it.duration === 1 ? '' : 's'}</span>
          ${it.isPremium ? '<span class="itinerary-pro-tag"><i class="lucide-crown"></i> Pro</span>' : ''}
        </div>
        <h2>${esc(it.title)}</h2>
      </div>
      <div class="itinerary-modal-body">
        <div class="itinerary-modal-meta">
          <span class="itinerary-modal-meta-chip"><i class="lucide-mountain"></i> ${esc(diff)}</span>
          <span class="itinerary-modal-meta-chip"><i class="lucide-calendar-days"></i> ${it.duration} day${it.duration === 1 ? '' : 's'}</span>
        </div>
        <p class="itinerary-modal-desc">${esc(it.description)}</p>
        <div class="itinerary-modal-actions">
          ${it.isPremium
            ? '<a href="#/premium" class="btn btn-primary itinerary-modal-cta"><i class="lucide-crown"></i> Unlock with Pro</a>'
            : '<a href="#/explore" class="btn btn-primary itinerary-modal-cta"><i class="lucide-compass"></i> Start exploring</a>'}
          <button type="button" class="btn btn-outline itinerary-modal-save" data-itin="${esc(it.id)}">
            <i class="lucide-bookmark"></i> Save
          </button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  replaceIcons(modal);
  requestAnimationFrame(() => modal.classList.add('open'));
  document.body.style.overflow = 'hidden';

  const close = () => {
    modal.classList.remove('open');
    document.body.style.overflow = '';
    setTimeout(() => modal.remove(), 240);
  };
  modal.querySelector('.itinerary-modal-overlay')?.addEventListener('click', close);
  modal.querySelector('.itinerary-modal-close')?.addEventListener('click', close);
  modal.querySelector('.itinerary-modal-save')?.addEventListener('click', () => {
    showToast('Itinerary saved');
  });
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') { close(); document.removeEventListener('keydown', onKey); }
  };
  document.addEventListener('keydown', onKey);
}
