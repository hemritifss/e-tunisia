import { places } from '../data';

export function renderFavoritesPage(): string {
  const saved = places.filter(p => p.saved);

  return `
    <div class="favorites-page page-enter">
      <h2>Saved Places</h2>
      <p class="text-secondary text-sm" style="margin-bottom: var(--space-6);">Your curated collection of Tunisian destinations</p>

      <div class="tabs">
        <button class="tab active">Favorites (${saved.length})</button>
        <button class="tab">Visited (2)</button>
      </div>

      ${saved.length > 0 ? `
        <div class="explore-grid stagger-children">
          ${saved.map(p => `
            <div class="place-card">
              <img src="${p.image}" alt="${p.name}" class="place-card-img" loading="lazy" />
              <div class="place-card-body">
                <div class="place-card-category">${p.category}</div>
                <h4 class="place-card-title">${p.name}</h4>
                <div class="place-card-location">
                  <i class="lucide-map-pin"></i>
                  ${p.location}
                </div>
                <div class="place-card-footer">
                  <div class="place-card-rating">
                    <i class="lucide-star" style="font-size: 0.875rem;"></i>
                    ${p.rating}
                    <span class="place-card-reviews">(${p.reviewCount})</span>
                  </div>
                  <button class="place-card-save saved"><i class="lucide-heart"></i></button>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      ` : `
        <div class="empty-state">
          <i class="lucide-heart"></i>
          <h3>No saved places yet</h3>
          <p>Explore Tunisia and save places you love</p>
          <a href="#/explore" class="btn btn-primary" style="margin-top: var(--space-4);">Start Exploring</a>
        </div>
      `}
    </div>
  `;
}

export function initFavoritesPage() {}
