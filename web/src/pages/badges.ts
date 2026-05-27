// ============================================
// BADGES PAGE — Gamification surface
// Per design-system/pages/badges.md.
// ============================================

import { badges as mockBadges } from '../data';
import * as api from '../api';
import { replaceIcons } from '../icons';

function esc(v: unknown): string {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function renderBadgesPage(): string {
  return `
    <div class="badges-page page-enter">
      <header class="badges-hero">
        <div class="badges-hero-bg" aria-hidden="true"></div>
        <div class="badges-hero-mesh" aria-hidden="true"></div>
        <div class="badges-hero-orbs" aria-hidden="true">
          <span class="badges-hero-orb"></span>
          <span class="badges-hero-orb"></span>
        </div>
        <div class="badges-hero-content">
          <span class="badges-eyebrow">
            <i class="lucide-award"></i> Achievements
          </span>
          <h1>Badges &amp; <span class="badges-accent">milestones</span></h1>
          <p>Explore Tunisia and earn badges for your adventures. Complete challenges to unlock new achievements.</p>
        </div>
      </header>

      <section class="badges-stats" id="badges-stats" aria-label="Badge progress"></section>

      <section class="badges-grid-section">
        <div class="badges-grid" id="badges-grid">
          <div class="badges-loading">
            <div class="spinner"></div>
            <p>Loading badges…</p>
          </div>
        </div>
      </section>
    </div>
  `;
}

function badgeCard(b: any): string {
  const earned = !!b.earned;
  const icon = b.icon || 'lucide-award';
  const cat = (b.category || '').toLowerCase();
  return `
    <article class="badge-card ${earned ? 'is-earned' : 'is-locked'}" data-cat="${esc(cat)}">
      <div class="badge-icon">
        ${earned ? '' : '<span class="badge-lock-overlay" aria-hidden="true"><i class="lucide-lock"></i></span>'}
        <i class="${esc(icon)}"></i>
      </div>
      <h4 class="badge-name">${esc(b.name)}</h4>
      <p class="badge-desc">${esc(b.description || '')}</p>
      ${b.category ? `<span class="badge-cat" data-cat="${esc(cat)}">${esc(b.category)}</span>` : ''}
      ${earned
        ? '<span class="badge-status is-earned"><i class="lucide-check-circle"></i> Earned</span>'
        : '<span class="badge-status is-locked"><i class="lucide-lock"></i> Locked</span>'}
    </article>
  `;
}

export async function initBadgesPage() {
  const grid = document.getElementById('badges-grid');
  const statsEl = document.getElementById('badges-stats');
  if (!grid) return;

  let badges: any[];
  try {
    badges = await api.getAllBadges();
    if (!badges?.length) badges = mockBadges as any[];
  } catch {
    badges = mockBadges as any[];
  }

  const earned = badges.filter((b) => b.earned).length;
  const total = badges.length || 1;
  const pct = Math.round((earned / total) * 100);

  if (statsEl) {
    statsEl.innerHTML = `
      <div class="badges-progress-card">
        <div class="badges-progress-head">
          <div>
            <strong>${earned} of ${total} badges earned</strong>
            <span>Keep exploring to unlock more</span>
          </div>
          <div class="badges-progress-pct">${pct}%</div>
        </div>
        <div class="badges-progress-bar"><span style="width:${pct}%"></span></div>
      </div>
      <div class="badges-stat-tiles">
        <div class="badges-stat-card is-earned">
          <div class="badges-stat-icon"><i class="lucide-check-circle"></i></div>
          <strong>${earned}</strong>
          <span>Earned</span>
        </div>
        <div class="badges-stat-card is-locked">
          <div class="badges-stat-icon"><i class="lucide-lock"></i></div>
          <strong>${total - earned}</strong>
          <span>Locked</span>
        </div>
        <div class="badges-stat-card is-progress">
          <div class="badges-stat-icon"><i class="lucide-trending-up"></i></div>
          <strong>${pct}%</strong>
          <span>Complete</span>
        </div>
      </div>
    `;
    replaceIcons(statsEl);
  }

  // Sort earned-first so unlocked badges read as headline content.
  const sorted = [...badges].sort((a, b) => Number(!!b.earned) - Number(!!a.earned));
  grid.innerHTML = sorted.map(badgeCard).join('');
  replaceIcons(grid);
}
