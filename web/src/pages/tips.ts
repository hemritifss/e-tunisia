// ============================================
// TIPS PAGE — Community travel wisdom
// Cinematic hero + Lucide-iconed filters + tinted tip cards.
// Per design-system/pages/tips.md.
// ============================================

import { tips as mockTips } from '../data';
import * as api from '../api';
import { replaceIcons } from '../icons';
import { shareUrl, isFlagged, toggleFlag, requireAuth } from '../ui-utils';

interface CategoryMeta {
  id: string;
  label: string;
  /** lucide-* name without prefix */
  icon: string;
  /** Brand token reference (resolves via inline --cat-tint). */
  tint: string;
}

const CATEGORIES: CategoryMeta[] = [
  { id: 'all',       label: 'All Tips',  icon: 'sparkles',     tint: 'var(--text-secondary)' },
  { id: 'cultural',  label: 'Cultural',  icon: 'landmark',     tint: 'var(--coral)' },
  { id: 'transport', label: 'Transport', icon: 'bus',          tint: 'var(--mediterranean)' },
  { id: 'money',     label: 'Money',     icon: 'banknote',     tint: 'var(--olive)' },
  { id: 'safety',    label: 'Safety',    icon: 'shield-check', tint: 'var(--gold)' },
  { id: 'food',      label: 'Food',      icon: 'utensils',     tint: 'var(--accent)' },
  { id: 'general',   label: 'General',   icon: 'compass',      tint: 'var(--violet)' },
];

const CATEGORY_BY_ID: Record<string, CategoryMeta> = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c]),
);

function getCategoryMeta(cat: string): CategoryMeta {
  return CATEGORY_BY_ID[(cat || '').toLowerCase()] || CATEGORY_BY_ID.general;
}

function esc(s: string): string {
  return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function timeAgo(iso: string): string {
  if (!iso) return '';
  const ms = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(ms)) return '';
  const m = Math.floor(ms / 60_000);
  if (m < 1) return 'now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function renderTipCard(tip: any): string {
  const meta = getCategoryMeta(tip.category);
  const date = timeAgo(tip.createdAt);
  const liked = !!tip.liked || isFlagged('tip:' + tip.id + ':like');
  const baseLikes = Number(tip.likes) || 0;
  const displayLikes = baseLikes + (liked && !tip.liked ? 1 : 0);
  const authorName = tip.author?.name || tip.userName || 'Anonymous';
  const authorId = tip.author?.id || '';
  const authorAvatar = api.getImageUrl(tip.author?.avatar)
    || `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(authorName)}`;

  return `
    <article class="tip2-card reveal-on-scroll" data-tip-id="${esc(tip.id)}" style="--cat-tint: ${meta.tint}">
      <header class="tip2-header">
        <span class="tip2-avatar-wrap"
              ${authorId ? `data-user-id="${esc(authorId)}" data-user-name="${esc(authorName)}" data-user-avatar="${esc(authorAvatar)}"` : ''}>
          <img src="${esc(authorAvatar)}" alt="" loading="lazy" class="tip2-avatar" />
        </span>
        <div class="tip2-meta">
          <strong class="tip2-author">${esc(authorName)}</strong>
          ${date ? `<span class="tip2-date">${esc(date)}</span>` : ''}
        </div>
        <span class="tip2-badge">
          <i class="lucide-${meta.icon}"></i>
          ${esc(meta.label)}
        </span>
      </header>
      <h3 class="tip2-title">${esc(tip.title)}</h3>
      <p class="tip2-content">${esc(tip.content)}</p>
      <footer class="tip2-footer">
        <button
          type="button"
          class="tip2-like-btn ${liked ? 'is-liked' : ''}"
          data-tip="${esc(tip.id)}"
          aria-pressed="${liked ? 'true' : 'false'}"
          aria-label="${liked ? 'Unlike this tip' : 'Like this tip'}"
        >
          <i class="lucide-${liked ? 'heart' : 'heart'}"></i>
          <span data-likes>${displayLikes}</span>
        </button>
        <button
          type="button"
          class="tip2-share-btn"
          data-tip="${esc(tip.id)}"
          data-title="${esc(tip.title || '')}"
        >
          <i class="lucide-share-2"></i>
          <span>Share</span>
        </button>
      </footer>
    </article>
  `;
}

export function renderTipSkeleton(): string {
  return `
    <div class="tip2-card tip2-skeleton" aria-hidden="true">
      <div class="tip2-skel-header">
        <div class="tip2-skel-avatar"></div>
        <div class="tip2-skel-meta">
          <div class="tip2-skel-line w-50"></div>
          <div class="tip2-skel-line w-30"></div>
        </div>
        <div class="tip2-skel-badge"></div>
      </div>
      <div class="tip2-skel-line w-70 lg"></div>
      <div class="tip2-skel-line w-100"></div>
      <div class="tip2-skel-line w-100"></div>
      <div class="tip2-skel-line w-75"></div>
      <div class="tip2-skel-footer">
        <div class="tip2-skel-pill"></div>
        <div class="tip2-skel-pill"></div>
      </div>
    </div>
  `;
}

export function renderTipsPage(): string {
  return `
    <div class="tips-page page-enter">
      <!-- Hero -->
      <section class="tips2-hero">
        <div class="tips2-hero-gradient" aria-hidden="true"></div>
        <div class="tips2-hero-mesh" aria-hidden="true"></div>
        <div class="tips2-hero-orbs" aria-hidden="true">
          <span class="tips2-hero-orb"></span>
          <span class="tips2-hero-orb"></span>
        </div>
        <div class="tips2-hero-content">
          <span class="tips2-eyebrow">
            <i class="lucide-sparkles"></i>
            Community wisdom
          </span>
          <h1>Travel <span class="tips2-accent">smarter</span></h1>
          <p>Insider knowledge from experienced travelers and locals. Real tips, tested in the real Tunisia.</p>
          <button type="button" class="tips2-share-cta" id="tips-open-submit">
            <i class="lucide-plus"></i>
            Share your tip
          </button>
        </div>
      </section>

      <!-- Category filters -->
      <nav class="tips2-categories-wrapper" aria-label="Tip category filter">
        <div class="tips2-categories" id="tips-categories" role="tablist">
          ${CATEGORIES.filter((c) => c.id !== 'general').map((c, i) => `
            <button
              type="button"
              role="tab"
              class="tips2-tag${i === 0 ? ' active' : ''}"
              data-cat="${esc(c.id)}"
              style="--cat-tint: ${c.tint}"
              aria-selected="${i === 0 ? 'true' : 'false'}"
            >
              <span class="tips2-tag-icon"><i class="lucide-${c.icon}"></i></span>
              ${esc(c.label)}
            </button>
          `).join('')}
        </div>
      </nav>

      <!-- Grid -->
      <div class="tips2-grid" id="tips-grid">
        ${[1, 2, 3, 4, 5, 6].map(() => renderTipSkeleton()).join('')}
      </div>

      <!-- Submit Modal -->
      <div class="tips2-modal" id="tips-modal" role="dialog" aria-modal="true" aria-labelledby="tips-modal-title">
        <div class="tips2-modal-overlay" id="tips-modal-overlay"></div>
        <div class="tips2-modal-content">
          <header class="tips2-modal-header">
            <h3 id="tips-modal-title">Share your tip</h3>
            <button type="button" class="tips2-modal-close" id="tips-modal-close" aria-label="Close">
              <i class="lucide-x"></i>
            </button>
          </header>
          <form id="tips-submit-form" class="tips2-modal-form">
            <div class="tips2-modal-field">
              <label for="tip-category" class="tips2-modal-label">Category</label>
              <select id="tip-category" class="tips2-modal-input" required>
                ${CATEGORIES.filter((c) => c.id !== 'all').map((c) => `
                  <option value="${esc(c.id)}">${esc(c.label)}</option>
                `).join('')}
              </select>
            </div>
            <div class="tips2-modal-field">
              <label for="tip-title" class="tips2-modal-label">Title</label>
              <input
                type="text"
                id="tip-title"
                class="tips2-modal-input"
                placeholder="e.g. How to haggle in the Medina"
                required
                maxlength="120"
              />
            </div>
            <div class="tips2-modal-field">
              <label for="tip-content" class="tips2-modal-label">Your tip</label>
              <textarea
                id="tip-content"
                class="tips2-modal-input"
                rows="5"
                placeholder="Share your experience and advice…"
                required
                maxlength="1000"
              ></textarea>
              <span class="tips2-modal-helper" id="tip-content-counter">0 / 1000</span>
            </div>
            <button type="submit" class="tips2-modal-submit">
              <i class="lucide-send"></i> Post tip
            </button>
          </form>
        </div>
      </div>
    </div>
  `;
}

let allTips: any[] = [];

function renderEmpty(activeLabel: string): string {
  return `
    <div class="tips2-empty">
      <div class="tips2-empty-icon"><i class="lucide-sparkles"></i></div>
      <h3>No ${esc(activeLabel.toLowerCase())} tips yet</h3>
      <p>Be the first to share one — your tip helps the next traveler.</p>
      <div class="tips2-empty-actions">
        <button type="button" class="btn btn-primary" data-share-tip>
          <i class="lucide-plus"></i> Share your tip
        </button>
        <button type="button" class="btn btn-outline" data-clear-filter>
          <i class="lucide-rotate-ccw"></i> Show all tips
        </button>
      </div>
    </div>
  `;
}

function paintGrid(grid: HTMLElement, list: any[], opts: { activeLabel?: string } = {}) {
  if (!list.length) {
    grid.innerHTML = renderEmpty(opts.activeLabel || 'matching');
    replaceIcons(grid);
    grid.querySelector<HTMLButtonElement>('[data-clear-filter]')?.addEventListener('click', () => {
      document.querySelector<HTMLButtonElement>('.tips2-tag[data-cat="all"]')?.click();
    });
    grid.querySelector<HTMLButtonElement>('[data-share-tip]')?.addEventListener('click', () => {
      document.getElementById('tips-modal')?.classList.add('active');
    });
    return;
  }
  grid.innerHTML = list.map((t) => renderTipCard(t)).join('');
  replaceIcons(grid);
  bindTipActions();
}

export async function initTipsPage() {
  const grid = document.getElementById('tips-grid');
  if (!grid) return;

  try {
    allTips = await api.getTips();
    if (!allTips?.length) allTips = mockTips as any[];
  } catch {
    allTips = mockTips as any[];
  }

  paintGrid(grid, allTips);

  // Category filter
  document.querySelectorAll<HTMLButtonElement>('.tips2-categories .tips2-tag').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll<HTMLButtonElement>('.tips2-categories .tips2-tag').forEach((b) => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      const cat = btn.dataset.cat || 'all';
      const filtered = cat === 'all'
        ? allTips
        : allTips.filter((t) => (t.category || '').toLowerCase() === cat);
      const meta = CATEGORY_BY_ID[cat];
      paintGrid(grid, filtered, { activeLabel: meta?.label || 'matching' });
    });
  });

  // Modal wiring
  const modal = document.getElementById('tips-modal');
  const openBtn = document.getElementById('tips-open-submit');
  const closeBtn = document.getElementById('tips-modal-close');
  const overlay = document.getElementById('tips-modal-overlay');
  const openModal = () => {
    if (!requireAuth('share tips')) return;
    modal?.classList.add('active');
    document.body.style.overflow = 'hidden';
    setTimeout(() => (document.getElementById('tip-title') as HTMLInputElement | null)?.focus(), 80);
  };
  const closeModal = () => {
    modal?.classList.remove('active');
    document.body.style.overflow = '';
  };
  openBtn?.addEventListener('click', openModal);
  closeBtn?.addEventListener('click', closeModal);
  overlay?.addEventListener('click', closeModal);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal?.classList.contains('active')) closeModal();
  });

  // Counter
  const contentEl = document.getElementById('tip-content') as HTMLTextAreaElement | null;
  const counterEl = document.getElementById('tip-content-counter');
  contentEl?.addEventListener('input', () => {
    if (counterEl) counterEl.textContent = `${contentEl.value.length} / 1000`;
  });

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
    paintGrid(grid, allTips);
    form.reset();
    if (counterEl) counterEl.textContent = '0 / 1000';
    closeModal();

    try { api.addTip(title, content, category); } catch {}
  });
}

function bindTipActions() {
  document.querySelectorAll<HTMLButtonElement>('.tip2-like-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const tipId = btn.dataset.tip;
      if (!tipId) return;
      if (!requireAuth('like tips')) return;
      const nowLiked = toggleFlag('tip:' + tipId + ':like');
      btn.classList.toggle('is-liked', nowLiked);
      btn.setAttribute('aria-pressed', nowLiked ? 'true' : 'false');
      btn.setAttribute('aria-label', nowLiked ? 'Unlike this tip' : 'Like this tip');
      const countEl = btn.querySelector<HTMLSpanElement>('[data-likes]');
      if (countEl) {
        const current = parseInt(countEl.textContent || '0', 10);
        countEl.textContent = String(nowLiked ? current + 1 : Math.max(0, current - 1));
      }
      // Brief celebration on like; cleared so resting state is calm.
      if (nowLiked) {
        btn.classList.add('is-celebrating');
        window.setTimeout(() => btn.classList.remove('is-celebrating'), 600);
      }
      try { api.likeTip(tipId); } catch {}
    });
  });

  document.querySelectorAll<HTMLButtonElement>('.tip2-share-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const title = btn.dataset.title || 'Travel tip from e-Tunisia';
      shareUrl({ title, url: `${location.origin}${location.pathname}#/tips` });
    });
  });
}
