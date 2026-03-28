// ============================================
// TIPS PAGE — Connected to backend
// ============================================

import { tips as mockTips, type Tip } from '../data';
import * as api from '../api';
import { replaceIcons } from '../icons';

function renderTipCard(tip: any): string {
  return `
    <div class="tip-card reveal-on-scroll">
      <div class="tip-header">
        <img src="${tip.author?.avatar || 'https://api.dicebear.com/9.x/thumbs/svg?seed=user'}" alt="" class="tip-avatar" />
        <div>
          <strong class="tip-author">${tip.author?.name || tip.userName || 'Anonymous'}</strong>
          <span class="tip-category ${tip.categoryClass || ''}">${tip.category || ''}</span>
        </div>
      </div>
      <h4 class="tip-title">${tip.title}</h4>
      <p class="tip-content">${tip.content}</p>
      <div class="tip-footer">
        <button class="tip-like-btn ${tip.liked ? 'liked' : ''}" data-tip="${tip.id}">
          <i class="lucide-heart"></i>
          <span>${tip.likes || 0}</span>
        </button>
        <button class="post-action-btn">
          <i class="lucide-share-2"></i> Share
        </button>
      </div>
    </div>
  `;
}

export function renderTipSkeleton(): string {
  return `
    <div class="tip-card skeleton-card">
      <div class="tip-header" style="display: flex; gap: var(--space-2); margin-bottom: var(--space-3);">
        <div class="skeleton" style="width: 40px; height: 40px; border-radius: var(--radius-full);"></div>
        <div>
          <div class="skeleton skeleton-text" style="width: 100px; height: 16px; margin-bottom: 4px;"></div>
          <div class="skeleton skeleton-text" style="width: 60px;"></div>
        </div>
      </div>
      <div class="skeleton skeleton-text" style="width: 70%; height: 20px; margin-bottom: var(--space-3);"></div>
      <div class="skeleton skeleton-text w-100"></div>
      <div class="skeleton skeleton-text w-100"></div>
      <div class="skeleton skeleton-text w-75" style="margin-bottom: var(--space-4);"></div>
      <div class="tip-footer" style="padding-top: var(--space-3); border-top: 1px solid var(--border-light); display: flex; justify-content: space-between;">
        <div class="skeleton" style="width: 50px; height: 24px; border-radius: var(--radius-full);"></div>
        <div class="skeleton" style="width: 80px; height: 24px; border-radius: var(--radius-full);"></div>
      </div>
    </div>
  `;
}

export function renderTipsPage(): string {
  return `
    <div class="tips-page page-enter">
      <div class="tips-header">
        <h1><i class="lucide-lightbulb"></i> Travel Tips</h1>
        <p>Insider knowledge from experienced travelers and locals to help you make the most of your Tunisia trip.</p>
      </div>
      <div class="tips-categories" id="tips-categories">
        <button class="tag active" data-cat="all">All</button>
        <button class="tag" data-cat="Cultural">Cultural</button>
        <button class="tag" data-cat="Transport">Transport</button>
        <button class="tag" data-cat="Money">Money</button>
        <button class="tag" data-cat="Safety">Safety</button>
        <button class="tag" data-cat="Food">Food</button>
      </div>
      <div class="tips-grid" id="tips-grid">
        ${[1, 2, 3, 4, 5, 6].map(() => renderTipSkeleton()).join('')}
      </div>
    </div>
  `;
}

let allTips: any[] = [];

export async function initTipsPage() {
  const grid = document.getElementById('tips-grid');
  if (!grid) return;

  try {
    allTips = await api.getTips();
    if (!allTips?.length) allTips = mockTips;
  } catch {
    allTips = mockTips;
  }

  grid.innerHTML = allTips.map(t => renderTipCard(t)).join('');
  replaceIcons(grid);

  // Category filter
  document.querySelectorAll('.tips-categories .tag').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tips-categories .tag').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const cat = (btn as HTMLElement).dataset.cat;
      const filtered = cat === 'all' ? allTips : allTips.filter(t => t.category === cat);
      grid.innerHTML = filtered.map(t => renderTipCard(t)).join('');
      replaceIcons(grid);
      bindTipLikes();
    });
  });

  bindTipLikes();
}

function bindTipLikes() {
  document.querySelectorAll('.tip-like-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const el = btn as HTMLElement;
      el.classList.toggle('liked');
      const countEl = el.querySelector('span');
      if (countEl) {
        const current = parseInt(countEl.textContent || '0');
        countEl.textContent = String(el.classList.contains('liked') ? current + 1 : current - 1);
      }
      const tipId = el.dataset.tip;
      if (tipId) try { api.likeTip(tipId); } catch {}
    });
  });
}
