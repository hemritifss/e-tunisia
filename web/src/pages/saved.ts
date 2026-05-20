// ============================================
// SAVED POSTS — /#/saved
// Bookmarked posts pulled from the backend (posts/saved).
// ============================================

import * as api from '../api';
import { replaceIcons } from '../icons';
import { showToast } from '../ui-utils';

export function renderSavedPage(): string {
  return `
    <div class="saved-page page-enter" data-design="sleek" id="saved-root">
      <div class="favorites-header">
        <h1><i class="lucide-bookmark"></i> Saved Posts</h1>
        <p>Posts you've bookmarked to revisit. They stay here until you unsave them.</p>
      </div>
      <div id="saved-grid">
        <div class="favorites-loading">
          <div class="spinner"></div>
          <p>Loading your saved posts…</p>
        </div>
      </div>
    </div>
  `;
}

function timeAgo(d: string | Date): string {
  const ms = Date.now() - new Date(d).getTime();
  const m = Math.floor(ms / 60_000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function esc(s: string): string {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c] as string));
}

export async function initSavedPage() {
  const grid = document.getElementById('saved-grid');
  if (!grid) return;

  let posts: any[] = [];
  try {
    const res = await api.listSavedPosts(1, 30);
    posts = Array.isArray(res?.data) ? res.data : [];
  } catch (err) {
    grid.innerHTML = `
      <div class="empty-state">
        <i class="lucide-alert-circle" style="font-size: 3rem; color: var(--text-muted);"></i>
        <h3>Couldn't load saved posts</h3>
        <p>Sign in and try again.</p>
        <a href="#/login" class="btn btn-primary">Sign in</a>
      </div>`;
    replaceIcons(grid);
    return;
  }

  if (posts.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <i class="lucide-bookmark" style="font-size: 3rem; color: var(--text-muted);"></i>
        <h3>Nothing saved yet</h3>
        <p>Tap the bookmark on any post to keep it here.</p>
        <a href="#/" class="btn btn-primary"><i class="lucide-rss"></i> Browse the feed</a>
      </div>`;
    replaceIcons(grid);
    return;
  }

  grid.innerHTML = `
    <div class="saved-list" style="display:flex; flex-direction:column; gap: var(--space-4);">
      ${posts.map(renderCard).join('')}
    </div>
  `;
  replaceIcons(grid);

  // Wire unsave buttons
  grid.querySelectorAll<HTMLButtonElement>('button[data-unsave]').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const id = btn.dataset.unsave!;
      const card = btn.closest('.saved-card') as HTMLElement | null;
      if (card) card.style.opacity = '0.5';
      try {
        await api.unsavePost(id);
        if (card) card.remove();
        showToast('Removed from saved');
        if (grid.querySelectorAll('.saved-card').length === 0) {
          await initSavedPage();
        }
      } catch {
        if (card) card.style.opacity = '1';
        showToast('Could not unsave — try again');
      }
    });
  });
}

function renderCard(p: any): string {
  const author = p.author || {};
  const avatar = author.avatar
    ? api.getImageUrl(author.avatar)
    : `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(author.fullName || 'M')}`;
  const firstImage = Array.isArray(p.images) && p.images[0] ? api.getImageUrl(p.images[0]) : '';
  return `
    <article class="saved-card card" style="overflow:hidden;">
      <a href="#/post/${esc(p.id)}" class="saved-card-link" style="display:flex; flex-direction:column; text-decoration:none; color:inherit;">
        ${firstImage ? `<img src="${esc(firstImage)}" alt="" style="width:100%; max-height:260px; object-fit:cover;" loading="lazy" />` : ''}
        <div style="padding: var(--space-4); display:flex; flex-direction:column; gap: var(--space-2);">
          <div style="display:flex; align-items:center; gap: var(--space-2);">
            <img src="${esc(avatar)}" alt="${esc(author.fullName || '')}" style="width:34px; height:34px; border-radius:50%; object-fit:cover;" />
            <div style="flex:1; min-width:0;">
              <div style="font-weight:600; font-size:0.95rem; line-height:1.1;">${esc(author.fullName || 'Member')}</div>
              <div style="font-size:0.78rem; color: var(--text-muted);">Saved ${timeAgo(p.savedAt || p.createdAt)} · ${timeAgo(p.createdAt)}</div>
            </div>
            <button data-unsave="${esc(p.id)}" class="btn btn-ghost" style="padding:6px 10px;" aria-label="Remove from saved" title="Remove from saved">
              <i class="lucide-bookmark-x"></i>
            </button>
          </div>
          <h3 style="margin:0; font-size:1.05rem; line-height:1.25;">${esc(p.title || '')}</h3>
          ${p.body ? `<p style="margin:0; color: var(--text-muted); font-size:0.92rem; display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden;">${esc(p.body)}</p>` : ''}
          <div style="display:flex; gap: var(--space-3); font-size:0.82rem; color: var(--text-muted);">
            <span><i class="lucide-heart"></i> ${Number(p.upvotes) || 0}</span>
            <span><i class="lucide-message-circle"></i> ${Number(p.commentCount) || 0}</span>
            ${p.category ? `<span><i class="lucide-tag"></i> ${esc(p.category)}</span>` : ''}
            ${p.location ? `<span><i class="lucide-map-pin"></i> ${esc(p.location)}</span>` : ''}
          </div>
        </div>
      </a>
    </article>
  `;
}
