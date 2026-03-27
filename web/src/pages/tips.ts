import { tips } from '../data';

export function renderTipsPage(): string {
  return `
    <div class="tips-page page-enter">
      <h2>Travel Tips</h2>
      <p class="text-secondary" style="margin-bottom: var(--space-6);">Practical advice from locals and experienced travelers</p>

      <div class="tabs">
        <button class="tab active" data-tab="all">All</button>
        <button class="tab" data-tab="cultural">Cultural</button>
        <button class="tab" data-tab="food">Food</button>
        <button class="tab" data-tab="transport">Transport</button>
        <button class="tab" data-tab="safety">Safety</button>
        <button class="tab" data-tab="money">Money</button>
      </div>

      <div class="tips-grid stagger-children">
        ${tips.map(tip => `
          <div class="tip-card reveal-on-scroll" data-tip-cat="${tip.categoryClass}">
            <span class="tip-category ${tip.categoryClass}">${tip.category}</span>
            <h4 class="tip-title">${tip.title}</h4>
            <p class="tip-content">${tip.content}</p>
            <div class="tip-footer">
              <div class="tip-author">
                <img src="${tip.author.avatar}" alt="${tip.author.name}" />
                <span>${tip.author.name}</span>
              </div>
              <button class="tip-likes ${tip.liked ? 'liked' : ''}" data-tip="${tip.id}">
                <i class="lucide-heart" style="font-size: 0.875rem;"></i>
                <span class="tip-like-count">${tip.likes}</span>
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

export function initTipsPage() {
  // Tab filter
  document.querySelectorAll('.tips-page .tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tips-page .tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const cat = (tab as HTMLElement).dataset.tab;
      const cards = document.querySelectorAll('.tip-card') as NodeListOf<HTMLElement>;
      cards.forEach(card => {
        if (cat === 'all' || card.dataset.tipCat === cat) {
          card.style.display = '';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });

  // Like buttons
  document.querySelectorAll('.tip-likes').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.classList.toggle('liked');
      const countEl = btn.querySelector('.tip-like-count');
      if (countEl) {
        const current = parseInt(countEl.textContent || '0');
        countEl.textContent = String(btn.classList.contains('liked') ? current + 1 : current - 1);
      }
    });
  });
}
