// ============================================
// TIPS PAGE — Community travel wisdom
// ============================================

import { tips as mockTips, type Tip } from '../data';
import * as api from '../api';
import { replaceIcons } from '../icons';
import { shareUrl } from '../ui-utils';

const categoryMeta: Record<string, { label: string; icon: string; color: string }> = {
  cultural: { label: 'Cultural', icon: 'landmark', color: 'var(--coral)' },
  transport: { label: 'Transport', icon: 'bus', color: 'var(--mediterranean)' },
  money: { label: 'Money', icon: 'banknote', color: 'var(--olive)' },
  safety: { label: 'Safety', icon: 'shield-check', color: 'var(--gold)' },
  food: { label: 'Food', icon: 'utensils', color: 'var(--accent)' },
  general: { label: 'General', icon: 'compass', color: 'var(--primary)' },
};

function getCategoryMeta(cat: string) {
  return categoryMeta[cat?.toLowerCase()] || categoryMeta.general;
}

function renderTipCard(tip: any): string {
  const meta = getCategoryMeta(tip.category);
  const date = tip.createdAt ? new Date(tip.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';

  return `
    <div class="tip2-card reveal-on-scroll">
      <div class="tip2-header">
        <img src="${api.getImageUrl(tip.author?.avatar) || 'https://api.dicebear.com/9.x/thumbs/svg?seed=' + (tip.author?.name || 'user')}" alt="" class="tip2-avatar" />
        <div class="tip2-meta">
          <strong class="tip2-author">${tip.author?.name || tip.userName || 'Anonymous'}</strong>
          <span class="tip2-date">${date}</span>
        </div>
        <span class="tip2-badge" style="--badge-color: ${meta.color}">
          <i class="lucide-${meta.icon}"></i>
          ${meta.label}
        </span>
      </div>
      <h4 class="tip2-title">${tip.title}</h4>
      <p class="tip2-content">${tip.content}</p>
      <div class="tip2-footer">
        <button class="tip2-like-btn ${tip.liked ? 'liked' : ''}" data-tip="${tip.id}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
          <span>${tip.likes || 0}</span>
        </button>
        <button class="tip2-share-btn" data-tip="${tip.id}" data-title="${(tip.title || '').replace(/"/g, '&quot;')}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
          Share
        </button>
      </div>
    </div>
  `;
}

export function renderTipSkeleton(): string {
  return `
    <div class="tip2-card tip2-skeleton">
      <div class="tip2-header">
        <div class="skeleton" style="width: 40px; height: 40px; border-radius: 50%;"></div>
        <div style="flex: 1;">
          <div class="skeleton skeleton-text" style="width: 100px; height: 14px; margin-bottom: 6px;"></div>
          <div class="skeleton skeleton-text" style="width: 60px; height: 12px;"></div>
        </div>
        <div class="skeleton" style="width: 80px; height: 24px; border-radius: 100px;"></div>
      </div>
      <div class="skeleton skeleton-text" style="width: 70%; height: 18px; margin: 1rem 0;"></div>
      <div class="skeleton skeleton-text w-100"></div>
      <div class="skeleton skeleton-text w-100"></div>
      <div class="skeleton skeleton-text w-75"></div>
      <div style="display: flex; gap: 0.75rem; margin-top: 1rem; padding-top: 1rem; border-top: 1px solid rgba(255,255,255,0.05);">
        <div class="skeleton" style="width: 60px; height: 28px; border-radius: 100px;"></div>
        <div class="skeleton" style="width: 70px; height: 28px; border-radius: 100px;"></div>
      </div>
    </div>
  `;
}

export function renderTipsPage(): string {
  return `
    <div class="tips-page page-enter" data-design="sleek">
      <!-- Hero -->
      <section class="tips2-hero">
        <div class="tips2-hero-bg"></div>
        <div class="tips2-hero-content">
          <span class="tips2-eyebrow">Community Wisdom</span>
          <h1>Travel <span class="tips2-accent">Smarter</span></h1>
          <p>Insider knowledge from experienced travelers and locals. Real tips, tested in the real Tunisia.</p>
          <button class="hero2-btn-cta" id="tips-open-submit">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Share Your Tip
          </button>
        </div>
      </section>

      <!-- Categories -->
      <div class="tips2-categories-wrapper">
        <div class="tips2-categories" id="tips-categories">
          <button class="tips2-tag active" data-cat="all">All Tips</button>
          <button class="tips2-tag" data-cat="cultural">Cultural</button>
          <button class="tips2-tag" data-cat="transport">Transport</button>
          <button class="tips2-tag" data-cat="money">Money</button>
          <button class="tips2-tag" data-cat="safety">Safety</button>
          <button class="tips2-tag" data-cat="food">Food</button>
        </div>
      </div>

      <!-- Grid -->
      <div class="tips2-grid" id="tips-grid">
        ${[1, 2, 3, 4, 5, 6].map(() => renderTipSkeleton()).join('')}
      </div>

      <!-- Submit Modal -->
      <div class="tips2-modal" id="tips-modal">
        <div class="tips2-modal-overlay" id="tips-modal-overlay"></div>
        <div class="tips2-modal-content">
          <div class="tips2-modal-header">
            <h3>Share Your Tip</h3>
            <button class="tips2-modal-close" id="tips-modal-close">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <form id="tips-submit-form" class="tips2-modal-form">
            <div class="input-group">
              <label class="input-label">Category</label>
              <select id="tip-category" class="input" required>
                <option value="cultural">Cultural</option>
                <option value="transport">Transport</option>
                <option value="money">Money</option>
                <option value="safety">Safety</option>
                <option value="food">Food</option>
                <option value="general">General</option>
              </select>
            </div>
            <div class="input-group">
              <label class="input-label">Title</label>
              <input type="text" id="tip-title" class="input" placeholder="e.g. How to haggle in the Medina" required maxlength="120" />
            </div>
            <div class="input-group">
              <label class="input-label">Your Tip</label>
              <textarea id="tip-content" class="input" rows="5" placeholder="Share your experience and advice..." required maxlength="1000"></textarea>
            </div>
            <button type="submit" class="hero2-pricing-btn hero2-pricing-btn-primary">Post Tip</button>
          </form>
        </div>
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

  // Category filter — FIXED: normalize to lowercase
  document.querySelectorAll('.tips2-categories .tips2-tag').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tips2-categories .tips2-tag').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const cat = (btn as HTMLElement).dataset.cat;
      const filtered = cat === 'all' ? allTips : allTips.filter(t => (t.category || '').toLowerCase() === cat);
      grid.innerHTML = filtered.map(t => renderTipCard(t)).join('');
      replaceIcons(grid);
      bindTipLikes();
    });
  });

  // Modal
  const modal = document.getElementById('tips-modal');
  const openBtn = document.getElementById('tips-open-submit');
  const closeBtn = document.getElementById('tips-modal-close');
  const overlay = document.getElementById('tips-modal-overlay');

  openBtn?.addEventListener('click', () => modal?.classList.add('active'));
  closeBtn?.addEventListener('click', () => modal?.classList.remove('active'));
  overlay?.addEventListener('click', () => modal?.classList.remove('active'));

  // Submit form
  const form = document.getElementById('tips-submit-form') as HTMLFormElement;
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const category = (document.getElementById('tip-category') as HTMLSelectElement).value;
    const title = (document.getElementById('tip-title') as HTMLInputElement).value.trim();
    const content = (document.getElementById('tip-content') as HTMLTextAreaElement).value.trim();

    if (!title || !content) return;

    const newTip = {
      id: 'tip_' + Date.now(),
      title,
      content,
      category,
      likes: 0,
      liked: false,
      author: { name: 'You' },
      createdAt: new Date().toISOString(),
    };

    allTips.unshift(newTip);
    grid.innerHTML = allTips.map(t => renderTipCard(t)).join('');
    replaceIcons(grid);
    bindTipLikes();
    form.reset();
    modal?.classList.remove('active');

    try { api.addTip(title, content, category); } catch {}
  });

  bindTipLikes();
}

function bindTipLikes() {
  document.querySelectorAll('.tip2-like-btn').forEach(btn => {
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

  document.querySelectorAll('.tip2-share-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const el = btn as HTMLElement;
      const title = el.dataset.title || 'Travel tip from e-Tunisia';
      shareUrl({ title, url: `${location.origin}${location.pathname}#/tips` });
    });
  });
}
