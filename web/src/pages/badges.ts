import { badges } from '../data';

export function renderBadgesPage(): string {
  const earned = badges.filter(b => b.earned);
  const locked = badges.filter(b => !b.earned);

  return `
    <div class="badges-page page-enter">
      <a href="#/profile" class="btn btn-ghost" style="margin-bottom: var(--space-4);">
        <i class="lucide-arrow-left"></i> Back
      </a>

      <h2>Badges</h2>
      <p class="text-secondary text-sm" style="margin-bottom: var(--space-6);">
        ${earned.length} of ${badges.length} earned
      </p>

      <div class="tabs">
        <button class="tab active" data-tab="all">All (${badges.length})</button>
        <button class="tab" data-tab="earned">Earned (${earned.length})</button>
        <button class="tab" data-tab="locked">Locked (${locked.length})</button>
      </div>

      <div class="badges-grid stagger-children" id="badges-list">
        ${badges.map(b => `
          <div class="badge-item ${b.earned ? '' : 'locked-badge'}" data-earned="${b.earned}">
            <div class="badge-icon ${b.earned ? 'earned' : 'locked'}">
              <i class="${b.icon}"></i>
            </div>
            <div class="badge-info">
              <div class="badge-name">${b.name}</div>
              <div class="badge-desc">${b.description}</div>
              <div class="text-xs" style="margin-top: 2px; color: ${b.earned ? 'var(--success)' : 'var(--text-muted)'}; font-weight: 600;">
                ${b.earned ? 'Earned' : b.category}
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

export function initBadgesPage() {
  document.querySelectorAll('.badges-page .tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.badges-page .tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const filter = (tab as HTMLElement).dataset.tab;
      const items = document.querySelectorAll('.badge-item') as NodeListOf<HTMLElement>;
      items.forEach(item => {
        const isEarned = item.dataset.earned === 'true';
        if (filter === 'all' || (filter === 'earned' && isEarned) || (filter === 'locked' && !isEarned)) {
          item.style.display = '';
        } else {
          item.style.display = 'none';
        }
      });
    });
  });
}
