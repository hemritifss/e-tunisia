// ============================================
// HASHTAG PAGE — /#/tag/:tag
// Lists posts that contain the given hashtag.
// ============================================

import * as api from '../api';
import { replaceIcons } from '../icons';
import { linkifyHashtagsAndMentions } from '../ui-utils';

export function renderTagPage(tag: string): string {
  const safe = String(tag || '').replace(/[^a-zA-Z0-9_-]/g, '');
  return `
    <div class="tag-page page-enter" data-design="sleek" id="tag-root">
      <a href="#/" class="btn btn-ghost" style="margin-bottom: var(--space-4);">
        <i class="lucide-arrow-left"></i> Back
      </a>
      <header class="tag-header" style="display:flex; align-items:center; gap: var(--space-3); margin-bottom: var(--space-4);">
        <div class="tag-icon" style="display:flex; align-items:center; justify-content:center; font-weight:800;">
          #
        </div>
        <div style="flex:1; min-width:0;">
          <h1 style="margin:0; font-size:1.6rem;">#${safe || 'tunisia'}</h1>
          <p id="tag-meta" style="margin:0; color: var(--text-muted); font-size:0.9rem;">Loading posts…</p>
        </div>
      </header>
      <div id="tag-list" style="display:flex; flex-direction:column; gap: var(--space-4);">
        <div class="favorites-loading">
          <div class="spinner"></div>
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

export async function initTagPage(tag: string) {
  const list = document.getElementById('tag-list');
  const meta = document.getElementById('tag-meta');
  if (!list) return;

  const t = String(tag || '').replace(/^#/, '').toLowerCase();

  let items: any[] = [];
  let total = 0;
  try {
    const res = await api.getFeed({ hashtag: t, limit: 30, sort: 'new' });
    items = Array.isArray(res?.data) ? res.data : [];
    total = res?.meta?.total ?? items.length;
  } catch {}

  if (meta) {
    meta.textContent = total > 0
      ? `${total.toLocaleString()} ${total === 1 ? 'post' : 'posts'}`
      : 'No posts yet — be the first.';
  }

  if (items.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <i class="lucide-hash" style="font-size: 3rem; color: var(--text-muted);"></i>
        <h3>No posts with #${esc(t)}</h3>
        <p>Be the first — share something and add <strong>#${esc(t)}</strong> in the body.</p>
        <a href="#/" class="btn btn-primary"><i class="lucide-rss"></i> Back to feed</a>
      </div>
    `;
    replaceIcons(list);
    return;
  }

  list.innerHTML = items.map(renderCard).join('');
  replaceIcons(list);
}

function renderCard(p: any): string {
  const author = p.author || {};
  const avatar = author.avatar
    ? api.getImageUrl(author.avatar)
    : `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(author.fullName || 'M')}`;
  const firstImage = Array.isArray(p.images) && p.images[0] ? api.getImageUrl(p.images[0]) : '';
  const linkedBody = p.body ? linkifyHashtagsAndMentions(esc(p.body)) : '';
  const detail = p.type === 'review' && p.place?.id ? `#/place/${p.place.id}` : `#/post/${p.id}`;
  return `
    <article class="tag-card card" style="overflow:hidden;">
      <a href="${detail}" style="display:flex; flex-direction:column; text-decoration:none; color:inherit;">
        ${firstImage ? `<img src="${esc(firstImage)}" alt="" style="width:100%; max-height:280px; object-fit:cover;" loading="lazy" />` : ''}
        <div style="padding: var(--space-4); display:flex; flex-direction:column; gap: var(--space-2);">
          <div style="display:flex; align-items:center; gap: var(--space-2);">
            <img src="${esc(avatar)}" alt="" style="width:34px; height:34px; border-radius:50%; object-fit:cover;" />
            <div style="flex:1; min-width:0;">
              <div style="font-weight:600; font-size:0.95rem;">${esc(author.fullName || 'Member')}</div>
              <div style="font-size:0.78rem; color: var(--text-muted);">${timeAgo(p.createdAt)}</div>
            </div>
          </div>
          <h3 style="margin:0; font-size:1.05rem; line-height:1.25;">${esc(p.title || '')}</h3>
          ${linkedBody ? `<p style="margin:0; color: var(--text-muted); font-size:0.92rem; display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden;">${linkedBody}</p>` : ''}
          <div style="display:flex; gap: var(--space-3); font-size:0.82rem; color: var(--text-muted);">
            <span><i class="lucide-heart"></i> ${Number(p.upvotes) || 0}</span>
            <span><i class="lucide-message-circle"></i> ${Number(p.commentCount) || 0}</span>
            ${p.location ? `<span><i class="lucide-map-pin"></i> ${esc(p.location)}</span>` : ''}
          </div>
        </div>
      </a>
    </article>
  `;
}
