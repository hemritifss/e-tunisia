// ============================================
// LEADERBOARD PAGE — Connected to backend
// Two modes: global XP ranking + per-city reviewer ranking
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
    <div class="leaderboard-page page-enter" data-design="sleek">
      <div class="leaderboard-header">
        <h1><i class="lucide-trophy"></i> Leaderboard</h1>
        <p>Climb the ranks by exploring, reviewing, and sharing.</p>
        <div class="leaderboard-tabs">
          <button class="leaderboard-tab active" data-mode="global">🌍 Top Explorers</button>
          <button class="leaderboard-tab" data-mode="city">🏙️ Top Reviewers by City</button>
        </div>
        <div class="leaderboard-city-row" id="leaderboard-city-row" hidden>
          <label>City:</label>
          <select id="leaderboard-city-select"></select>
        </div>
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

const MEDALS = ['🥇', '🥈', '🥉'];

function renderGlobalRow(u: any, i: number): string {
  const rank = u.rank || i + 1;
  const isTop3 = rank <= 3;
  const handle = u.handle || u.user?.handle;
  const name = u.name || u.fullName || u.user?.fullName || 'Explorer';
  const avatar = u.avatar || u.user?.avatar;
  const avatarUrl = avatar
    ? api.getImageUrl(avatar)
    : `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(name)}`;
  const profileHref = handle ? `#/u/${encodeURIComponent(handle)}` : '#';
  return `
    <a href="${esc(profileHref)}" class="leaderboard-item ${isTop3 ? 'top-' + rank : ''} reveal-on-scroll" style="text-decoration:none;color:inherit">
      <div class="leaderboard-rank">
        ${isTop3 ? `<span class="leaderboard-medal">${MEDALS[rank - 1]}</span>` : `<span class="leaderboard-rank-num">#${rank}</span>`}
      </div>
      <img src="${esc(avatarUrl)}" alt="${esc(name)}" class="leaderboard-avatar" />
      <div class="leaderboard-info">
        <strong>${esc(name)}</strong>
        <span class="text-muted text-xs">${handle ? '@' + esc(handle) : 'Level ' + (u.level || 1)}</span>
      </div>
      <div class="leaderboard-points">
        <strong>${(u.points || u.user?.points || 0).toLocaleString()}</strong>
        <span class="text-xs text-muted">XP</span>
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
  const avatarUrl = u.avatar
    ? api.getImageUrl(u.avatar)
    : `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(name)}`;
  const profileHref = handle ? `#/u/${encodeURIComponent(handle)}` : '#';
  const guideBadge = u.role === 'creator' ? `<span class="leaderboard-guide-badge" title="Local Guide">✓</span>` : '';
  return `
    <a href="${esc(profileHref)}" class="leaderboard-item ${isTop3 ? 'top-' + rank : ''} reveal-on-scroll" style="text-decoration:none;color:inherit">
      <div class="leaderboard-rank">
        ${isTop3 ? `<span class="leaderboard-medal">${MEDALS[rank - 1]}</span>` : `<span class="leaderboard-rank-num">#${rank}</span>`}
      </div>
      <img src="${esc(avatarUrl)}" alt="${esc(name)}" class="leaderboard-avatar" />
      <div class="leaderboard-info">
        <strong>${esc(name)}${guideBadge}</strong>
        <span class="text-muted text-xs">${handle ? '@' + esc(handle) : ''}${u.country ? ' · ' + esc(u.country) : ''}</span>
      </div>
      <div class="leaderboard-points">
        <strong>${Number(entry.reviews) || 0}</strong>
        <span class="text-xs text-muted">reviews</span>
      </div>
    </a>
  `;
}

async function loadGlobal(list: HTMLElement) {
  list.innerHTML = '<div class="leaderboard-loading"><div class="spinner"></div><p>Loading explorers...</p></div>';
  let leaders: any[];
  try {
    leaders = await api.getLeaderboard(20);
    if (!leaders?.length) leaders = mockLeaderboard as any;
  } catch {
    leaders = mockLeaderboard as any;
  }
  list.innerHTML = leaders.map(renderGlobalRow).join('') || '<div class="passport-empty">No rankings yet.</div>';
  replaceIcons(list);
}

async function loadCity(list: HTMLElement, city: string) {
  list.innerHTML = '<div class="leaderboard-loading"><div class="spinner"></div><p>Loading top reviewers...</p></div>';
  try {
    const res: any = await fetch(`/api/v1/users/leaderboards/city/${encodeURIComponent(city)}?limit=20`).then((r) => r.json());
    const items = Array.isArray(res) ? res : (res?.data ?? []);
    if (!items.length) {
      list.innerHTML = `<div class="passport-empty">No reviews yet in ${esc(city)}.</div>`;
      return;
    }
    list.innerHTML = items.map(renderCityRow).join('');
    replaceIcons(list);
  } catch {
    list.innerHTML = '<div class="passport-empty">Couldn\'t load city rankings.</div>';
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
    tabs.forEach((t) => t.classList.toggle('active', t.dataset.mode === mode));
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
      const current = citySelect?.value || cityCache[0] || '';
      if (current) await loadCity(list, current);
      else list.innerHTML = '<div class="passport-empty">No city rankings yet.</div>';
    }
  };

  tabs.forEach((t) => t.addEventListener('click', () => setMode(t.dataset.mode as any)));
  citySelect?.addEventListener('change', () => {
    if (citySelect.value) loadCity(list, citySelect.value);
  });

  await setMode('global');
}
