import { places, categories } from '../data';

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

      <div class="explore-categories">
        ${categories.map(c => `
          <button class="tag ${c.id === 'all' ? 'active' : ''}" data-cat="${c.id}">${c.name}</button>
        `).join('')}
      </div>

      <div class="explore-grid stagger-children" id="explore-grid">
        ${places.map(p => `
          <div class="place-card reveal-on-scroll" data-category="${p.categoryClass}">
            <img src="${p.image}" alt="${p.name}" class="place-card-img" loading="lazy" onerror="this.style.background='linear-gradient(135deg, var(--terracotta-pale), var(--mediterranean-pale))'; this.style.objectFit='contain'; this.alt=''" />
            <div class="place-card-body">
              <div class="place-card-category">${p.category}</div>
              <h4 class="place-card-title">${p.name}</h4>
              <div class="place-card-location">
                <i class="lucide-map-pin"></i>
                ${p.location}
              </div>
              <p class="text-sm text-secondary" style="margin-bottom: var(--space-3); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                ${p.description}
              </p>
              <div class="place-card-footer">
                <div class="place-card-rating">
                  <i class="lucide-star" style="font-size: 0.875rem;"></i>
                  ${p.rating}
                  <span class="place-card-reviews">(${p.reviewCount})</span>
                </div>
                <button class="place-card-save ${p.saved ? 'saved' : ''}" data-place="${p.id}" aria-label="${p.saved ? 'Unsave' : 'Save'}">
                  <i class="lucide-heart"></i>
                </button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

export function initExplorePage() {
  // Category filter
  document.querySelectorAll('.explore-categories .tag').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.explore-categories .tag').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const cat = (btn as HTMLElement).dataset.cat;
      const cards = document.querySelectorAll('.place-card') as NodeListOf<HTMLElement>;
      cards.forEach(card => {
        if (cat === 'all' || card.dataset.category === `cat-${cat}`) {
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
      e.stopPropagation();
      btn.classList.toggle('saved');
    });
  });
}
