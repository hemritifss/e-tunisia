// ============================================
// PROFILE PAGE — Own profile (logged-in user)
// Cover banner + identity + XP + stats + quick links + Pro flair.
// Per design-system/pages/profile.md.
// ============================================

import * as api from '../api';
import { replaceIcons } from '../icons';

/**
 * Tier → Lucide icon name + label. Replaces the legacy emoji tier markers
 * (🏆⭐🧭🌱) per MASTER.md §4 `no-emoji-icons`.
 */
function tierFor(level: number): { iconName: string; label: string } {
  if (level >= 10) return { iconName: 'crown', label: 'Legend' };
  if (level >= 7)  return { iconName: 'star',  label: 'Veteran' };
  if (level >= 4)  return { iconName: 'compass', label: 'Explorer' };
  return { iconName: 'sprout', label: 'Newcomer' };
}

function isProPlan(plan: string | null | undefined): boolean {
  return plan === 'premium' || plan === 'business' || plan === 'admin';
}

export function renderProfilePage(): string {
  return `
    <div class="profile-page-v2 page-enter" data-design="sleek" id="profile-page-root">
      <div class="up-loading" style="padding-top: 120px;">
        <div class="spinner"></div>
        <p>Loading profile…</p>
      </div>
    </div>
  `;
}

function esc(s: string): string {
  return (s || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

export async function initProfilePage() {
  const root = document.getElementById('profile-page-root');
  if (!root) return;

  let user: any = null;
  let points: any = { total: 0, level: 1 };
  let rank: any = { rank: '–' };

  try {
    user = await api.getMyProfile();
  } catch {}

  if (!user) {
    root.innerHTML = `
      <div class="pp-empty-state">
        <i class="lucide-user-x"></i>
        <h2>Could not load profile</h2>
        <p>Something went wrong. Please try again.</p>
        <a href="#/" class="btn btn-primary"><i class="lucide-home"></i> Go home</a>
      </div>`;
    replaceIcons(root);
    return;
  }

  try { points = await api.getMyPoints(); } catch {}
  try { rank = await api.getMyRank(); } catch {}

  const seed = encodeURIComponent(user.fullName || user.name || user.id);
  const avatar = user.avatar
    ? api.getImageUrl(user.avatar, 'avatar')
    : `https://api.dicebear.com/9.x/thumbs/svg?seed=${seed}`;
  const name = user.fullName || user.name || 'Explorer';
  const level = points.level || user.level || 1;
  const xp = (points.total || 0).toLocaleString();
  const rankNum = rank.rank || '–';
  const bio = user.bio || '';
  const country = user.country || '';
  const handle = user.handle || '';
  const website = user.website || '';
  const joinDate = user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '';

  // Level progress (simple approximation)
  const xpForLevel = (lvl: number) => lvl * lvl * 500;
  const currentLevelXp = xpForLevel(level - 1);
  const nextLevelXp = xpForLevel(level);
  const progressPct = Math.min(100, Math.round(((points.total || 0) - currentLevelXp) / Math.max(1, nextLevelXp - currentLevelXp) * 100));

  // Level tier (Lucide icons, never emoji)
  const tier = tierFor(level);
  const plan = user.plan || null;
  const isPro = isProPlan(plan);
  const userId = user.id || '';

  root.innerHTML = `
    <!-- Cover banner with mesh gradient + tier badge -->
    <header class="pp-cover${isPro ? ' is-pro' : ''}">
      <div class="pp-cover-gradient" aria-hidden="true"></div>
      <div class="pp-cover-pattern" aria-hidden="true"></div>
      <div class="pp-cover-orbs" aria-hidden="true">
        <span class="pp-cover-orb"></span>
        <span class="pp-cover-orb"></span>
      </div>
      <div class="pp-cover-level-badge" data-tier="${tier.iconName}">
        <span class="pp-tier-icon" aria-hidden="true"><i class="lucide-${tier.iconName}"></i></span>
        <span class="pp-level-text">Level ${level} ${tier.label}</span>
      </div>
    </header>

    <!-- Identity section -->
    <section class="pp-identity">
      <div class="pp-avatar-wrap${isPro ? ' is-pro' : ''}"
           ${userId ? `data-user-id="${esc(userId)}" data-user-name="${esc(name)}" data-user-avatar="${esc(avatar)}" data-user-handle="${esc(handle)}" data-user-plan="${esc(plan || '')}"` : ''}>
        <img src="${esc(avatar)}" alt="${esc(name)}" class="pp-avatar" />
        <span class="pp-avatar-ring" aria-hidden="true"></span>
        ${isPro ? `<span class="pp-avatar-pro-mark" title="${plan === 'business' ? 'Verified Business' : 'Pro Traveler'}" aria-label="${plan === 'business' ? 'Verified Business' : 'Pro Traveler'}"><i class="lucide-sparkles"></i></span>` : ''}
      </div>
      <div class="pp-actions-row">
        <a href="#/profile-edit" class="btn btn-primary pp-edit-btn">
          <i class="lucide-edit-3"></i> Edit profile
        </a>
        <a href="#/settings" class="btn btn-outline pp-settings-btn" aria-label="Settings">
          <i class="lucide-settings"></i>
        </a>
      </div>
    </section>

    <!-- Bio block -->
    <section class="pp-bio">
      <h1 class="pp-name">${esc(name)}</h1>
      ${handle ? `<span class="pp-handle">@${esc(handle)}</span>` : ''}
      ${bio ? `<p class="pp-bio-text">${esc(bio)}</p>` : ''}
      <div class="pp-meta">
        ${country ? `<span><i class="lucide-map-pin"></i> ${esc(country)}</span>` : ''}
        ${website ? `<span><i class="lucide-link"></i> <a href="${esc(website)}" target="_blank" rel="noopener">${esc(website.replace(/^https?:\/\//, ''))}</a></span>` : ''}
        ${joinDate ? `<span><i class="lucide-calendar"></i> Joined ${joinDate}</span>` : ''}
      </div>
    </section>

    <!-- XP Progress bar -->
    <section class="pp-xp-progress">
      <div class="pp-xp-header">
        <span class="pp-xp-label">Level ${level} Progress</span>
        <span class="pp-xp-value">${xp} XP</span>
      </div>
      <div class="pp-xp-bar">
        <div class="pp-xp-fill" style="width: ${progressPct}%"></div>
      </div>
      <div class="pp-xp-footer">
        <span>${progressPct}% to Level ${level + 1}</span>
        <span>${(nextLevelXp - (points.total || 0)).toLocaleString()} XP needed</span>
      </div>
    </section>

    <!-- Stats grid (4 tiles, tabular-num counters) -->
    <section class="pp-stats">
      <div class="pp-stat">
        <div class="pp-stat-icon pp-stat-icon-xp"><i class="lucide-zap"></i></div>
        <strong>${xp}</strong>
        <span>XP Points</span>
      </div>
      <div class="pp-stat">
        <div class="pp-stat-icon pp-stat-icon-rank"><i class="lucide-trophy"></i></div>
        <strong>#${rankNum}</strong>
        <span>Ranking</span>
      </div>
      <div class="pp-stat">
        <div class="pp-stat-icon pp-stat-icon-level"><i class="lucide-flame"></i></div>
        <strong>${level}</strong>
        <span>Level</span>
      </div>
      <div class="pp-stat">
        <div class="pp-stat-icon pp-stat-icon-tier"><i class="lucide-${tier.iconName}"></i></div>
        <strong class="pp-stat-tier-label">${tier.label}</strong>
        <span>Tier</span>
      </div>
    </section>

    ${isPro ? `
    <!-- Pro flair card (visible only for premium/business/admin) -->
    <section class="pp-pro-card${plan === 'business' ? ' is-business' : ''}">
      <div class="pp-pro-icon" aria-hidden="true"><i class="lucide-sparkles"></i></div>
      <div class="pp-pro-body">
        <strong>${plan === 'business' ? 'Verified Business' : 'Pro Traveler'}</strong>
        <p>Thanks for keeping e-Tunisia running. ${plan === 'business' ? 'Your dashboard is unlocked end-to-end.' : 'Every Pro feature is unlocked for you.'}</p>
      </div>
      <a href="#/premium" class="pp-pro-cta">Manage <i class="lucide-arrow-right"></i></a>
    </section>
    ` : ''}

    <!-- Quick links grid (tinted with brand tokens, no HSL hue hacks) -->
    <section class="pp-quick-links">
      <h3 class="pp-section-title"><i class="lucide-compass"></i> Quick Access</h3>
      <div class="pp-links-grid">
        <a href="#/favorites" class="pp-quick-link-card" data-tint="rose">
          <div class="pp-ql-icon"><i class="lucide-heart"></i></div>
          <div class="pp-ql-content">
            <strong>Saved Places</strong>
            <span>Your favorite spots</span>
          </div>
          <i class="lucide-chevron-right pp-ql-arrow"></i>
        </a>
        <a href="#/badges" class="pp-quick-link-card" data-tint="gold">
          <div class="pp-ql-icon"><i class="lucide-award"></i></div>
          <div class="pp-ql-content">
            <strong>Badges</strong>
            <span>Achievements earned</span>
          </div>
          <i class="lucide-chevron-right pp-ql-arrow"></i>
        </a>
        <a href="#/credits" class="pp-quick-link-card" data-tint="olive">
          <div class="pp-ql-icon"><i class="lucide-coins"></i></div>
          <div class="pp-ql-content">
            <strong>Credits</strong>
            <span>Wallet &amp; donations</span>
          </div>
          <i class="lucide-chevron-right pp-ql-arrow"></i>
        </a>
        <a href="#/leaderboard" class="pp-quick-link-card" data-tint="mediterranean">
          <div class="pp-ql-icon"><i class="lucide-bar-chart-3"></i></div>
          <div class="pp-ql-content">
            <strong>Leaderboard</strong>
            <span>Your ranking</span>
          </div>
          <i class="lucide-chevron-right pp-ql-arrow"></i>
        </a>
        ${!isPro ? `
        <a href="#/premium" class="pp-quick-link-card pp-ql-premium" data-tint="gold">
          <div class="pp-ql-icon"><i class="lucide-crown"></i></div>
          <div class="pp-ql-content">
            <strong>Go Premium</strong>
            <span>Unlock exclusive features</span>
          </div>
          <i class="lucide-chevron-right pp-ql-arrow"></i>
        </a>
        ` : ''}
        <a href="#/itineraries" class="pp-quick-link-card" data-tint="cyan">
          <div class="pp-ql-icon"><i class="lucide-map"></i></div>
          <div class="pp-ql-content">
            <strong>Trip Plans</strong>
            <span>Curated itineraries</span>
          </div>
          <i class="lucide-chevron-right pp-ql-arrow"></i>
        </a>
        <a href="#/collections" class="pp-quick-link-card" data-tint="violet">
          <div class="pp-ql-icon"><i class="lucide-layers"></i></div>
          <div class="pp-ql-content">
            <strong>Collections</strong>
            <span>Themed place sets</span>
          </div>
          <i class="lucide-chevron-right pp-ql-arrow"></i>
        </a>
        <a href="#/settings" class="pp-quick-link-card" data-tint="neutral">
          <div class="pp-ql-icon"><i class="lucide-settings"></i></div>
          <div class="pp-ql-content">
            <strong>Settings</strong>
            <span>Account preferences</span>
          </div>
          <i class="lucide-chevron-right pp-ql-arrow"></i>
        </a>
      </div>
    </section>

    ${handle ? `
    <section class="pp-passport-cta">
      <div class="pp-passport-icon"><i class="lucide-globe-2"></i></div>
      <div>
        <strong>View your public Passport</strong>
        <p>See how other travelers see you</p>
      </div>
      <a href="#/u/${esc(handle)}" class="btn btn-outline">View <i class="lucide-external-link"></i></a>
    </section>
    ` : ''}

    ${api.isLoggedIn() ? `
      <button class="btn btn-outline pp-logout-btn" id="profile-logout-btn">
        <i class="lucide-log-out"></i> Log Out
      </button>
    ` : `
      <a href="#/login" class="btn btn-primary" style="width:100%;margin-top:var(--space-4);">
        <i class="lucide-log-in"></i> Sign In
      </a>
    `}
  `;

  replaceIcons(root);

  // Logout handler
  document.getElementById('profile-logout-btn')?.addEventListener('click', () => {
    api.logout();
    location.hash = '#/login';
    location.reload();
  });
}
