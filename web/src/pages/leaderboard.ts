import { leaderboard } from '../data';

export function renderLeaderboardPage(): string {
  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  return `
    <div class="leaderboard-page page-enter">
      <a href="#/profile" class="btn btn-ghost" style="margin-bottom: var(--space-4);">
        <i class="lucide-arrow-left"></i> Back
      </a>

      <h2 style="text-align: center; margin-bottom: var(--space-2);">Leaderboard</h2>
      <p class="text-secondary text-sm" style="text-align: center; margin-bottom: var(--space-6);">Top explorers of Tunisia this month</p>

      <div class="leaderboard-podium">
        ${top3[1] ? `
          <div class="podium-item second">
            <div style="position: relative;">
              <img src="${top3[1].avatar}" alt="${top3[1].name}" class="podium-avatar" style="border-color: #a8a8a8;" />
              <span style="position: absolute; bottom: -4px; left: 50%; transform: translateX(-50%); background: #a8a8a8; color: white; width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.625rem; font-weight: 800;">2</span>
            </div>
            <div class="podium-name">${top3[1].name}</div>
            <div class="podium-points">${top3[1].points.toLocaleString()} pts</div>
          </div>
        ` : ''}
        ${top3[0] ? `
          <div class="podium-item first">
            <div style="position: relative;">
              <img src="${top3[0].avatar}" alt="${top3[0].name}" class="podium-avatar" />
              <span style="position: absolute; bottom: -4px; left: 50%; transform: translateX(-50%); background: #d4a017; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: 800;">1</span>
            </div>
            <div class="podium-name">${top3[0].name}</div>
            <div class="podium-points">${top3[0].points.toLocaleString()} pts</div>
          </div>
        ` : ''}
        ${top3[2] ? `
          <div class="podium-item third">
            <div style="position: relative;">
              <img src="${top3[2].avatar}" alt="${top3[2].name}" class="podium-avatar" style="border-color: #cd7f32;" />
              <span style="position: absolute; bottom: -4px; left: 50%; transform: translateX(-50%); background: #cd7f32; color: white; width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.625rem; font-weight: 800;">3</span>
            </div>
            <div class="podium-name">${top3[2].name}</div>
            <div class="podium-points">${top3[2].points.toLocaleString()} pts</div>
          </div>
        ` : ''}
      </div>

      <div class="leaderboard-list">
        ${rest.map(u => `
          <div class="leaderboard-row">
            <div class="leaderboard-rank">${u.rank}</div>
            <img src="${u.avatar}" alt="${u.name}" class="leaderboard-avatar" />
            <div class="leaderboard-info">
              <div class="leaderboard-name">${u.name}</div>
              <div class="leaderboard-level">Level ${u.level}</div>
            </div>
            <div class="leaderboard-points">${u.points.toLocaleString()} pts</div>
          </div>
        `).join('')}
      </div>

      <div style="text-align: center; margin-top: var(--space-6); padding: var(--space-4); background: var(--surface); border: 1px solid var(--border-light); border-radius: var(--radius-lg);">
        <p class="text-sm text-secondary">Your rank: <strong class="text-accent">#6</strong> with <strong>2,800 points</strong></p>
      </div>
    </div>
  `;
}

export function initLeaderboardPage() {}
