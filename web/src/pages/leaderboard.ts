// ============================================
// LEADERBOARD PAGE — Connected to backend
// ============================================

import { leaderboard as mockLeaderboard, type LeaderboardUser } from '../data';
import * as api from '../api';
import { replaceIcons } from '../icons';

export function renderLeaderboardPage(): string {
  return `
    <div class="leaderboard-page page-enter">
      <div class="leaderboard-header">
        <h1><i class="lucide-trophy"></i> Leaderboard</h1>
        <p>Top explorers ranked by XP points. Explore, review, and share to climb the ranks!</p>
      </div>
      <div class="leaderboard-list" id="leaderboard-list">
        <div class="leaderboard-loading">
          <div class="spinner"></div>
          <p>Loading rankings...</p>
        </div>
      </div>
    </div>
  `;
}

export async function initLeaderboardPage() {
  const list = document.getElementById('leaderboard-list');
  if (!list) return;

  let leaders: any[];
  try {
    leaders = await api.getLeaderboard(20);
    if (!leaders?.length) leaders = mockLeaderboard;
  } catch {
    leaders = mockLeaderboard;
  }

  const medals = ['🥇', '🥈', '🥉'];

  list.innerHTML = leaders.map((u, i) => {
    const rank = u.rank || i + 1;
    const isTop3 = rank <= 3;
    return `
      <div class="leaderboard-item ${isTop3 ? 'top-' + rank : ''} reveal-on-scroll">
        <div class="leaderboard-rank">
          ${isTop3 ? `<span class="leaderboard-medal">${medals[rank - 1]}</span>` : `<span class="leaderboard-rank-num">#${rank}</span>`}
        </div>
        <img src="${u.avatar || 'https://api.dicebear.com/9.x/thumbs/svg?seed=' + u.name}" alt="${u.name}" class="leaderboard-avatar" />
        <div class="leaderboard-info">
          <strong>${u.name}</strong>
          <span class="text-muted text-xs">Level ${u.level || 1}</span>
        </div>
        <div class="leaderboard-points">
          <strong>${(u.points || 0).toLocaleString()}</strong>
          <span class="text-xs text-muted">XP</span>
        </div>
      </div>
    `;
  }).join('');

  replaceIcons(list);
}
