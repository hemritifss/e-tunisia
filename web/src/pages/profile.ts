// ============================================
// PROFILE PAGE — Connected to backend
// ============================================

import * as api from '../api';
import { replaceIcons } from '../icons';

export function renderProfilePage(): string {
  return `
    <div class="profile-page page-enter">
      <div class="profile-card" id="profile-card">
        <div class="profile-loading">
          <div class="spinner"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    </div>
  `;
}

export async function initProfilePage() {
  const card = document.getElementById('profile-card');
  if (!card) return;

  let user: any = {
    name: 'Ahmed Ben Ali',
    email: 'ahmed@etunisia.com',
    avatar: 'https://api.dicebear.com/9.x/thumbs/svg?seed=Tunisia',
    level: 5,
    country: 'Tunisia',
  };
  let points: any = { total: 2800, level: 5 };
  let rank: any = { rank: 6 };

  try {
    const profile = await api.getMyProfile();
    if (profile?.name) user = profile;
  } catch {}

  try {
    points = await api.getMyPoints();
  } catch {}

  try {
    rank = await api.getMyRank();
  } catch {}

  card.innerHTML = `
    <div class="profile-header">
      <img src="${user.avatar || 'https://api.dicebear.com/9.x/thumbs/svg?seed=' + user.name}" alt="${user.name}" class="profile-avatar" />
      <h2 class="profile-name">${user.name}</h2>
      <span class="profile-level">Level ${points.level || user.level || 1} Explorer</span>
      ${user.country ? `<span class="profile-country"><i class="lucide-map-pin"></i> ${user.country}</span>` : ''}
    </div>

    <div class="profile-stats">
      <div class="profile-stat">
        <strong>${(points.total || 0).toLocaleString()}</strong>
        <span>XP Points</span>
      </div>
      <div class="profile-stat">
        <strong>#${rank.rank || '–'}</strong>
        <span>Ranking</span>
      </div>
      <div class="profile-stat">
        <strong>${points.level || user.level || 1}</strong>
        <span>Level</span>
      </div>
    </div>

    <div class="profile-actions">
      <a href="#/badges" class="btn btn-outline">
        <i class="lucide-award"></i> My Badges
      </a>
      <a href="#/leaderboard" class="btn btn-outline">
        <i class="lucide-trophy"></i> Leaderboard
      </a>
      <a href="#/favorites" class="btn btn-outline">
        <i class="lucide-heart"></i> Saved Places
      </a>
    </div>

    <div class="profile-section">
      <h3><i class="lucide-compass"></i> Quick Links</h3>
      <div class="profile-links">
        <a href="#/premium" class="profile-link">
          <i class="lucide-crown"></i>
          <div>
            <strong>Go Premium</strong>
            <span>Unlock exclusive features</span>
          </div>
          <i class="lucide-chevron-right"></i>
        </a>
        <a href="#/partner" class="profile-link">
          <i class="lucide-handshake"></i>
          <div>
            <strong>Become a Partner</strong>
            <span>Join our sponsor network</span>
          </div>
          <i class="lucide-chevron-right"></i>
        </a>
        <a href="#/itineraries" class="profile-link">
          <i class="lucide-map"></i>
          <div>
            <strong>Trip Itineraries</strong>
            <span>Curated travel plans</span>
          </div>
          <i class="lucide-chevron-right"></i>
        </a>
        <a href="#/collections" class="profile-link">
          <i class="lucide-layers"></i>
          <div>
            <strong>Collections</strong>
            <span>Themed place sets</span>
          </div>
          <i class="lucide-chevron-right"></i>
        </a>
        <a href="#/settings" class="profile-link">
          <i class="lucide-settings"></i>
          <div>
            <strong>Settings</strong>
            <span>Account preferences</span>
          </div>
          <i class="lucide-chevron-right"></i>
        </a>
      </div>
    </div>

    ${api.isLoggedIn() ? `
      <button class="btn btn-outline text-danger profile-logout" id="profile-logout-btn" style="width:100%;margin-top:var(--space-4);">
        <i class="lucide-log-out"></i> Log Out
      </button>
    ` : `
      <a href="#/login" class="btn btn-primary" style="width:100%;margin-top:var(--space-4);">
        <i class="lucide-log-in"></i> Sign In
      </a>
    `}
  `;

  replaceIcons(card);

  // Logout
  document.getElementById('profile-logout-btn')?.addEventListener('click', () => {
    api.logout();
    location.hash = '#/login';
    location.reload();
  });
}
