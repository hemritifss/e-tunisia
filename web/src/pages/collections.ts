// ============================================
// COLLECTIONS PAGE — Curated themed place sets
// Per design-system/pages/collections.md.
// ============================================

import * as api from '../api';
import { replaceIcons } from '../icons';

const mockCollections = [
  { id: '1', title: 'Best Beach Destinations', placeIds: ['3', '7', '8'], coverImage: 'https://images.unsplash.com/photo-1598554200951-b9f36526ecd9?w=600&q=80', description: "Crystal-clear waters and golden sand along Tunisia's Mediterranean coast." },
  { id: '2', title: 'UNESCO World Heritage Sites', placeIds: ['2', '4', '6'], coverImage: 'https://images.unsplash.com/photo-1770712857881-2133f72fcab7?w=600&q=80', description: "Explore Tunisia's 8 UNESCO-listed treasures spanning millennia of history." },
  { id: '3', title: 'Top Food Experiences', placeIds: ['1', '4'], coverImage: 'https://images.unsplash.com/photo-1742806418170-f051cb880314?w=600&q=80', description: 'From street food to fine dining, the best culinary stops in Tunisia.' },
  { id: '4', title: 'Desert & Oasis Adventures', placeIds: ['5'], coverImage: 'https://images.unsplash.com/photo-1689742855019-a09e208930e8?w=600&q=80', description: 'Journey into the Sahara and discover hidden oases.' },
  { id: '5', title: 'Architecture & Medinas', placeIds: ['1', '4', '8'], coverImage: 'https://images.unsplash.com/photo-1677942269665-1a08bf81d362?w=600&q=80', description: 'Centuries of Islamic, Ottoman, and colonial architecture.' },
  { id: '6', title: 'Hidden Gems', placeIds: ['7'], coverImage: 'https://images.unsplash.com/photo-1653173449794-09b4ec96a17f?w=600&q=80', description: 'Off-the-beaten-path destinations most tourists never find.' },
];

function esc(v: unknown): string {
  return String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function renderCollectionCard(col: any): string {
  const count = col.placeIds?.length || 0;
  const cover = api.getImageUrl(col.coverImage || col.image || (col.images && col.images[0]) || '');
  return `
    <article class="collection-card reveal-on-scroll" data-col-id="${esc(col.id)}">
      <button type="button" class="collection-card-link" aria-label="Open ${esc(col.title)}">
        <div class="collection-card-image">
          <img src="${esc(cover)}" alt="" loading="lazy" />
          <div class="collection-card-overlay" aria-hidden="true"></div>
          <div class="collection-card-info">
            <h3>${esc(col.title)}</h3>
            <span class="collection-card-count">
              <i class="lucide-map-pin"></i>
              ${count} place${count === 1 ? '' : 's'}
            </span>
          </div>
        </div>
      </button>
      ${col.description ? `<p class="collection-card-desc">${esc(col.description)}</p>` : ''}
    </article>
  `;
}

export function renderCollectionsPage(): string {
  return `
    <div class="collections-page page-enter">
      <section class="collections-hero">
        <div class="collections-hero-bg" aria-hidden="true"></div>
        <div class="collections-hero-mesh" aria-hidden="true"></div>
        <div class="collections-hero-orbs" aria-hidden="true">
          <span class="collections-hero-orb"></span>
          <span class="collections-hero-orb"></span>
        </div>
        <div class="collections-hero-content">
          <span class="collections-eyebrow"><i class="lucide-layers"></i> Editor's picks</span>
          <h1>Curated <span class="collections-accent">collections</span></h1>
          <p>Hand-picked sets of places grouped by theme — UNESCO sites, hidden beaches, food trails, and more.</p>
        </div>
      </section>
      <div class="collections-grid" id="collections-grid">
        <div class="collections-loading"><div class="spinner"></div><p>Loading collections…</p></div>
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

  grid.innerHTML = collections.map(renderCollectionCard).join('');
  replaceIcons(grid);

  grid.querySelectorAll<HTMLElement>('.collection-card').forEach((card) => {
    card.querySelector<HTMLButtonElement>('.collection-card-link')?.addEventListener('click', () => {
      const id = card.dataset.colId;
      const col = collections.find((c) => String(c.id) === String(id));
      if (col) openCollectionModal(col);
    });
  });
}

function openCollectionModal(col: any) {
  document.getElementById('collection-modal')?.remove();
  const count = col.placeIds?.length || 0;
  const cover = api.getImageUrl(col.coverImage || col.image || '');

  const modal = document.createElement('div');
  modal.id = 'collection-modal';
  modal.className = 'collection-modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.innerHTML = `
    <div class="collection-modal-overlay"></div>
    <div class="collection-modal-card" role="document">
      <button type="button" class="collection-modal-close" aria-label="Close">
        <i class="lucide-x"></i>
      </button>
      <div class="collection-modal-cover" style="background-image: url('${esc(cover)}');">
        <div class="collection-modal-cover-overlay" aria-hidden="true"></div>
        <div class="collection-modal-cover-tags">
          <span class="collection-modal-count-tag"><i class="lucide-map-pin"></i> ${count} place${count === 1 ? '' : 's'}</span>
        </div>
        <h2>${esc(col.title)}</h2>
      </div>
      <div class="collection-modal-body">
        <p class="collection-modal-desc">${esc(col.description || '')}</p>
        <div class="collection-modal-actions">
          <a href="#/explore" class="btn btn-primary collection-modal-cta">
            <i class="lucide-compass"></i> Explore places
          </a>
          <a href="#/map" class="btn btn-outline">
            <i class="lucide-map"></i> View on map
          </a>
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
  modal.querySelector('.collection-modal-overlay')?.addEventListener('click', close);
  modal.querySelector('.collection-modal-close')?.addEventListener('click', close);
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') { close(); document.removeEventListener('keydown', onKey); }
  };
  document.addEventListener('keydown', onKey);
}
