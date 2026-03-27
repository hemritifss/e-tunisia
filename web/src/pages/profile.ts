import { badges, places } from '../data';

export function renderProfilePage(): string {
  const earnedBadges = badges.filter(b => b.earned);
  const savedPlaces = places.filter(p => p.saved);

  return `
    <div class="profile-page page-enter">
      <div class="profile-header">
        <img src="https://api.dicebear.com/9.x/thumbs/svg?seed=Tunisia" alt="Ahmed Ben Ali" class="profile-avatar" />
        <div class="profile-info">
          <h2 class="profile-name">Ahmed Ben Ali</h2>
          <span class="profile-level">
            <i class="lucide-trophy" style="font-size: 0.75rem;"></i>
            Level 5 Explorer
          </span>
          <p class="text-sm text-secondary">Passionate about discovering hidden gems in Tunisia. Based in Tunis, exploring every corner of this beautiful country.</p>
          <div style="margin-top: var(--space-3);">
            <div class="flex items-center gap-2" style="margin-bottom: var(--space-2);">
              <span class="text-xs text-muted">2,800 / 4,000 XP to Level 6</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" style="width: 70%;"></div>
            </div>
          </div>
        </div>
      </div>

      <div class="profile-stats">
        <div class="stat-card">
          <div class="stat-value">2.8k</div>
          <div class="stat-label">Points</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">12</div>
          <div class="stat-label">Places Visited</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${earnedBadges.length}</div>
          <div class="stat-label">Badges</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">8</div>
          <div class="stat-label">Reviews</div>
        </div>
      </div>

      <div class="profile-section">
        <h3 class="profile-section-title">
          <i class="lucide-award" style="font-size: 1.25rem; color: var(--accent);"></i>
          Earned Badges
        </h3>
        <div class="badges-grid">
          ${earnedBadges.map(b => `
            <div class="badge-item">
              <div class="badge-icon earned">
                <i class="${b.icon}"></i>
              </div>
              <div class="badge-info">
                <div class="badge-name">${b.name}</div>
                <div class="badge-desc">${b.description}</div>
              </div>
            </div>
          `).join('')}
        </div>
        <a href="#/badges" class="btn btn-ghost text-sm" style="margin-top: var(--space-3);">
          View all badges <i class="lucide-arrow-right" style="font-size: 0.875rem;"></i>
        </a>
      </div>

      <div class="profile-section">
        <h3 class="profile-section-title">
          <i class="lucide-heart" style="font-size: 1.25rem; color: var(--error);"></i>
          Saved Places
        </h3>
        ${savedPlaces.length > 0 ? `
          <div class="explore-grid">
            ${savedPlaces.map(p => `
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
                    </div>
                    <button class="place-card-save saved"><i class="lucide-heart"></i></button>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        ` : `
          <div class="empty-state" style="padding: var(--space-8);">
            <i class="lucide-heart"></i>
            <h3>No saved places yet</h3>
            <p>Start exploring and save places you love</p>
          </div>
        `}
      </div>

      <div class="profile-section">
        <h3 class="profile-section-title">
          <i class="lucide-settings" style="font-size: 1.25rem;"></i>
          Quick Links
        </h3>
        <div style="display: flex; flex-wrap: wrap; gap: var(--space-2);">
          <a href="#/leaderboard" class="btn btn-secondary"><i class="lucide-trophy"></i> Leaderboard</a>
          <a href="#/badges" class="btn btn-secondary"><i class="lucide-award"></i> All Badges</a>
          <a href="#/settings" class="btn btn-secondary"><i class="lucide-settings"></i> Settings</a>
          <a href="#/favorites" class="btn btn-secondary"><i class="lucide-heart"></i> Favorites</a>
        </div>
      </div>
    </div>
  `;
}

export function initProfilePage() {
  // Profile interactions
}
