// ============================================
// LEADERBOARD PAGE — Connected to backend
// Two modes: global XP ranking + per-city reviewer ranking.
// Per design-system/pages/leaderboard.md.
// ============================================

import { leaderboard as mockLeaderboard } from '../data';
import * as api from '../api';
import { replaceIcons } from '../icons';

/** HTML-escape user-controlled strings before template interpolation. */
function esc(v: unknown): string {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function renderLeaderboardPage(): string {
  return `
    <div class="leaderboard-page page-enter">
      <header class="leaderboard-hero">
        <div class="leaderboard-hero-bg" aria-hidden="true"></div>
        <div class="leaderboard-hero-mesh" aria-hidden="true"></div>
        <div class="leaderboard-hero-orbs" aria-hidden="true">
          <span class="leaderboard-hero-orb"></span>
          <span class="leaderboard-hero-orb"></span>
        </div>
        <div class="leaderboard-hero-content">
          <span class="leaderboard-eyebrow">
            <i class="lucide-trophy"></i> Rankings
          </span>
          <h1><span class="leaderboard-accent">Leaderboard</span></h1>
          <p>Climb the ranks by exploring, reviewing, and sharing.</p>
        </div>
      </header>

      <nav class="leaderboard-tabs" role="tablist" aria-label="Leaderboard mode">
        <button type="button" role="tab" class="leaderboard-tab active" data-mode="global" aria-selected="true">
          <i class="lucide-globe"></i>
          <span>Top Explorers</span>
        </button>
        <button type="button" role="tab" class="leaderboard-tab" data-mode="city" aria-selected="false">
          <i class="lucide-building-2"></i>
          <span>Top Reviewers by City</span>
        </button>
      </nav>

      <div class="leaderboard-city-row" id="leaderboard-city-row" hidden>
        <label for="leaderboard-city-select">City</label>
        <select id="leaderboard-city-select" class="leaderboard-city-select"></select>
      </div>

      <div class="leaderboard-list" id="leaderboard-list" role="region" aria-live="polite">
        <div class="leaderboard-loading">
          <div class="spinner"></div>
          <p>Loading rankings…</p>
        </div>
      </div>
    </div>
  `;
}

/**
 * Top-3 rank chip — Lucide trophy with per-rank gradient.
 * Replaces emoji medals (🥇🥈🥉) per MASTER §4 `no-emoji-icons`.
 */
function rankChip(rank: number): string {
  if (rank > 3) return `<span class="leaderboard-rank-num">#${rank}</span>`;
  const tier = rank === 1 ? 'gold' : rank === 2 ? 'silver' : 'bronze';
  return `
    <span class="leaderboard-medal leaderboard-medal-${tier}" aria-label="Rank ${rank}">
      <i class="lucide-trophy"></i>
      <span class="leaderboard-medal-rank">${rank}</span>
    </span>
  `;
}

function tierBadge(u: any): string {
  if (u.plan === 'business') {
    return `<span class="leaderboard-tier leaderboard-tier-business" title="Verified Business" aria-label="Verified Business"><i class="lucide-check"></i></span>`;
  }
  if (u.plan === 'premium' || u.plan === 'admin') {
    return `<span class="leaderboard-tier leaderboard-tier-pro" title="Pro Traveler" aria-label="Pro Traveler"><i class="lucide-sparkles"></i></span>`;
  }
  if (u.role === 'creator') {
    return `<span class="leaderboard-tier leaderboard-tier-guide" title="Local Guide" aria-label="Local Guide"><i class="lucide-badge-check"></i></span>`;
  }
  return '';
}

function renderGlobalRow(u: any, i: number): string {
  const rank = u.rank || i + 1;
  const isTop3 = rank <= 3;
  const handle = u.handle || u.user?.handle;
  const name = u.name || u.fullName || u.user?.fullName || 'Explorer';
  const userId = u.id || u.user?.id || '';
  const plan = u.plan || u.user?.plan || '';
  const avatar = u.avatar || u.user?.avatar;
  const avatarUrl = avatar
    ? api.getImageUrl(avatar)
    : `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(name)}`;
  const profileHref = handle ? `#/u/${encodeURIComponent(handle)}` : '#';
  const dataAttrs = userId
    ? `data-user-id="${esc(userId)}" data-user-name="${esc(name)}" data-user-avatar="${esc(avatarUrl)}" data-user-handle="${esc(handle || '')}" data-user-plan="${esc(plan)}"`
    : '';
  return `
    <a href="${esc(profileHref)}" class="leaderboard-item ${isTop3 ? 'is-top-' + rank : ''} reveal-on-scroll" ${dataAttrs}>
      <div class="leaderboard-rank">${rankChip(rank)}</div>
      <img src="${esc(avatarUrl)}" alt="" class="leaderboard-avatar" loading="lazy" />
      <div class="leaderboard-info">
        <strong>${esc(name)}${tierBadge({ plan, role: u.role || u.user?.role })}</strong>
        <span>${handle ? '@' + esc(handle) : 'Level ' + (u.level || 1)}</span>
      </div>
      <div class="leaderboard-points">
        <strong>${(u.points || u.user?.points || 0).toLocaleString()}</strong>
        <span>XP</span>
      </div>
    </a>
  `;
}

function renderCityRow(entry: any): string {
  const rank = entry.rank;
  const isTop3 = rank <= 3;
  const u = entry.user || {};
  const name = u.fullName || 'Reviewer';
  const handle = u.handle;
  const userId = u.id || '';
  const avatarUrl = u.avatar
    ? api.getImageUrl(u.avatar)
    : `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(name)}`;
  const profileHref = handle ? `#/u/${encodeURIComponent(handle)}` : '#';
  const dataAttrs = userId
    ? `data-user-id="${esc(userId)}" data-user-name="${esc(name)}" data-user-avatar="${esc(avatarUrl)}" data-user-handle="${esc(handle || '')}" data-user-plan="${esc(u.plan || '')}"`
    : '';
  return `
    <a href="${esc(profileHref)}" class="leaderboard-item ${isTop3 ? 'is-top-' + rank : ''} reveal-on-scroll" ${dataAttrs}>
      <div class="leaderboard-rank">${rankChip(rank)}</div>
      <img src="${esc(avatarUrl)}" alt="" class="leaderboard-avatar" loading="lazy" />
      <div class="leaderboard-info">
        <strong>${esc(name)}${tierBadge(u)}</strong>
        <span>${handle ? '@' + esc(handle) : ''}${u.country ? (handle ? ' · ' : '') + esc(u.country) : ''}</span>
      </div>
      <div class="leaderboard-points">
        <strong>${Number(entry.reviews) || 0}</strong>
        <span>reviews</span>
      </div>
    </a>
  `;
}

function renderEmpty(message: string): string {
  return `
    <div class="leaderboard-empty">
      <div class="leaderboard-empty-icon"><i class="lucide-trophy"></i></div>
      <p>${esc(message)}</p>
    </div>
  `;
}

async function loadGlobal(list: HTMLElement) {
  list.innerHTML = '<div class="leaderboard-loading"><div class="spinner"></div><p>Loading explorers…</p></div>';
  let leaders: any[];
  try {
    leaders = await api.getLeaderboard(20);
    if (!leaders?.length) leaders = mockLeaderboard as any;
  } catch {
    leaders = mockLeaderboard as any;
  }
  list.innerHTML = leaders.length
    ? leaders.map(renderGlobalRow).join('')
    : renderEmpty('No rankings yet — be the first to climb.');
  replaceIcons(list);
}

async function loadCity(list: HTMLElement, city: string) {
  list.innerHTML = '<div class="leaderboard-loading"><div class="spinner"></div><p>Loading top reviewers…</p></div>';
  try {
    const res: any = await fetch(`/api/v1/users/leaderboards/city/${encodeURIComponent(city)}?limit=20`).then((r) => r.json());
    const items = Array.isArray(res) ? res : (res?.data ?? []);
    if (!items.length) {
      list.innerHTML = renderEmpty(`No reviews yet in ${city}.`);
      replaceIcons(list);
      return;
    }
    list.innerHTML = items.map(renderCityRow).join('');
    replaceIcons(list);
  } catch {
    list.innerHTML = renderEmpty("Couldn't load city rankings.");
    replaceIcons(list);
  }
}

async function loadCityPicker(): Promise<string[]> {
  try {
    const res: any = await fetch('/api/v1/users/leaderboards/cities?limit=30').then((r) => r.json());
    const arr: any[] = Array.isArray(res) ? res : (res?.data ?? []);
    return arr.map((c) => c.city).filter(Boolean);
  } catch {
    return [];
  }
}

export async function initLeaderboardPage() {
  const list = document.getElementById('leaderboard-list') as HTMLElement | null;
  if (!list) return;

  const tabs = document.querySelectorAll<HTMLButtonElement>('.leaderboard-tab');
  const cityRow = document.getElementById('leaderboard-city-row') as HTMLElement | null;
  const citySelect = document.getElementById('leaderboard-city-select') as HTMLSelectElement | null;

  let cityCache: string[] | null = null;

  const setMode = async (mode: 'global' | 'city') => {
    tabs.forEach((t) => {
      const active = t.dataset.mode === mode;
      t.classList.toggle('active', active);
      t.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    if (mode === 'global') {
      cityRow?.setAttribute('hidden', '');
      await loadGlobal(list);
    } else {
      cityRow?.removeAttribute('hidden');
      if (!cityCache) {
        cityCache = await loadCityPicker();
        if (citySelect) {
          if (cityCache.length) {
            citySelect.innerHTML = cityCache
              .map((c) => `<option value="${esc(c)}">${esc(c)}</option>`)
              .join('');
          } else {
            citySelect.innerHTML = '<option value="">— no cities yet —</option>';
          }
        }
      }
      const current = citySelect?.value || (cityCache && cityCache[0]) || '';
      if (current) await loadCity(list, current);
      else {
        list.innerHTML = renderEmpty('No city rankings yet.');
        replaceIcons(list);
      }
    }
  };

  tabs.forEach((t) => t.addEventListener('click', () => setMode(t.dataset.mode as any)));
  citySelect?.addEventListener('change', () => {
    if (citySelect.value) loadCity(list, citySelect.value);
  });

  await setMode('global');
}
