// ============================================
// BADGES PAGE — Connected to backend
// ============================================

import { badges as mockBadges, type Badge } from '../data';
import * as api from '../api';
import { replaceIcons } from '../icons';

export function renderBadgesPage(): string {
  return `
    <div class="badges-page page-enter">
      <div class="badges-header">
        <h1><i class="lucide-award"></i> Badges & Achievements</h1>
        <p>Explore Tunisia and earn badges for your adventures. Complete challenges to unlock new achievements.</p>
      </div>
      <div class="badges-stats" id="badges-stats"></div>
      <div class="badges-grid" id="badges-grid">
        <div class="badges-loading">
          <div class="spinner"></div>
          <p>Loading badges...</p>
        </div>
      </div>
    </div>
  `;
}

export async function initBadgesPage() {
  const grid = document.getElementById('badges-grid');
  const statsEl = document.getElementById('badges-stats');
  if (!grid) return;

  let badges: any[];
  try {
    badges = await api.getAllBadges();
    if (!badges?.length) badges = mockBadges;
  } catch {
    badges = mockBadges;
  }

  const earned = badges.filter(b => b.earned).length;
  if (statsEl) {
    statsEl.innerHTML = `
      <div class="badges-stat-card">
        <strong>${earned}</strong>
        <span>Earned</span>
      </div>
      <div class="badges-stat-card">
        <strong>${badges.length - earned}</strong>
        <span>Locked</span>
      </div>
      <div class="badges-stat-card">
        <strong>${Math.round((earned / badges.length) * 100)}%</strong>
        <span>Complete</span>
      </div>
    `;
  }

  grid.innerHTML = badges.map(b => `
    <div class="badge-card ${b.earned ? 'earned' : 'locked'}">
      <div class="badge-icon">
        <i class="${b.icon || 'lucide-award'}"></i>
      </div>
      <h4 class="badge-name">${b.name}</h4>
      <p class="badge-desc">${b.description}</p>
      ${b.earned
        ? '<span class="badge-status earned"><i class="lucide-check-circle"></i> Earned</span>'
        : '<span class="badge-status locked"><i class="lucide-lock"></i> Locked</span>'}
    </div>
  `).join('');
  replaceIcons(grid);
  if (statsEl) replaceIcons(statsEl);
}
