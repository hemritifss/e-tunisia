// ============================================
// POST DETAIL — /#/post/:id
// Loads a real post from the backend + its comment thread.
// ============================================

import * as api from '../api';
import { replaceIcons } from '../icons';
import { requireAuth, showToast, linkifyHashtagsAndMentions } from '../ui-utils';

export function renderPostDetailPage(_id: string): string {
  return `
    <div class="post-detail-page page-enter" data-design="sleek" id="post-detail-root">
      <a href="#/" class="btn btn-ghost" style="margin-bottom: var(--space-4);">
        <i class="lucide-arrow-left"></i> Back to Feed
      </a>
      <div class="post-detail-loading">
        <div class="spinner"></div>
        <p>Loading post…</p>
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

export async function initPostDetailPage(id: string) {
  const root = document.getElementById('post-detail-root');
  if (!root) return;

  let post: any = null;
  try { post = await api.getPostById(id); } catch { post = null; }

  if (!post) {
    root.innerHTML = `
      <a href="#/" class="btn btn-ghost" style="margin-bottom: var(--space-4);">
        <i class="lucide-arrow-left"></i> Back to Feed
      </a>
      <div class="empty-state">
        <i class="lucide-file-question" style="font-size: 3rem; color: var(--text-muted);"></i>
        <h3>Post not found</h3>
        <p>This post may have been removed.</p>
      </div>
    `;
    replaceIcons(root);
    return;
  }

  const author = post.author || {};
  const seed = encodeURIComponent(author.fullName || author.id || 'user');
  const avatar = author.avatar
    ? api.getImageUrl(author.avatar, 'avatar')
    : `https://api.dicebear.com/9.x/thumbs/svg?seed=${seed}`;
  const cover = Array.isArray(post.images) && post.images[0] ? post.images[0] : null;

  root.innerHTML = `
    <a href="#/" class="btn btn-ghost" style="margin-bottom: var(--space-4);">
      <i class="lucide-arrow-left"></i> Back to Feed
    </a>

    <article class="post-detail-card">
      <header class="post-detail-header">
        <a href="#/user/${author.id}" class="post-detail-author">
          <img src="${avatar}" alt="${author.fullName || ''}" />
          <div>
            <strong>${author.fullName || 'Anonymous'}</strong>
            <span class="text-xs text-muted">${timeAgo(post.createdAt)}${post.location ? ' · ' + post.location : ''}</span>
          </div>
        </a>
        ${post.category ? `<span class="post-detail-cat">${post.category}</span>` : ''}
      </header>

      <h1 class="post-detail-title">${linkifyHashtagsAndMentions(post.title || '')}</h1>
      ${cover ? `<img src="${cover}" alt="" class="post-detail-image" loading="lazy" />` : ''}
      <p class="post-detail-body">${linkifyHashtagsAndMentions(post.body || '').replace(/\n/g, '<br />')}</p>

      <div class="post-detail-actions">
        <span class="post-detail-stat"><i class="lucide-chevron-up"></i> ${post.upvotes || 0}</span>
        <span class="post-detail-stat"><i class="lucide-message-square"></i> ${post.commentCount || 0}</span>
      </div>
    </article>

    <section class="comments-section">
      <h3 class="comments-header" id="comments-count">Comments</h3>

      <div class="comment-form">
        <textarea id="new-comment" class="input" rows="3" placeholder="Share your thoughts…" maxlength="1000"></textarea>
        <div style="display:flex;justify-content:flex-end;margin-top:var(--space-2);">
          <button class="btn btn-primary btn-sm" id="submit-comment">Comment</button>
        </div>
      </div>

      <div class="comments-list" id="comments-list">
        <div class="text-muted text-center" style="padding:var(--space-4);">Loading comments…</div>
      </div>
    </section>
  `;
  replaceIcons(root);

  // Load comments
  await refreshComments(id);

  document.getElementById('submit-comment')?.addEventListener('click', async () => {
    const ta = document.getElementById('new-comment') as HTMLTextAreaElement;
    const text = (ta?.value || '').trim();
    if (!text) return;
    if (!requireAuth('comment on posts')) return;
    const btn = document.getElementById('submit-comment') as HTMLButtonElement;
    btn.disabled = true;
    try {
      await api.addPostComment(id, text);
      if (ta) ta.value = '';
      await refreshComments(id);
      showToast('Comment posted');
    } catch (err: any) {
      showToast(err?.message || 'Could not post comment', { type: 'error' });
    } finally {
      btn.disabled = false;
    }
  });
}

async function refreshComments(postId: string) {
  const list = document.getElementById('comments-list');
  const header = document.getElementById('comments-count');
  if (!list) return;
  let comments: any[] = [];
  try { comments = await api.getPostComments(postId); } catch {}
  if (header) header.textContent = `${comments.length} Comment${comments.length === 1 ? '' : 's'}`;
  if (comments.length === 0) {
    list.innerHTML = `<div class="text-muted text-center" style="padding:var(--space-4);">No comments yet — be the first.</div>`;
    return;
  }
  list.innerHTML = comments.map(c => {
    const a = c.author || {};
    const seed = encodeURIComponent(a.fullName || a.id || 'user');
    const av = a.avatar
      ? api.getImageUrl(a.avatar, 'avatar')
      : `https://api.dicebear.com/9.x/thumbs/svg?seed=${seed}`;
    return `
      <div class="comment-item">
        <a href="#/user/${a.id}"><img src="${av}" alt="${a.fullName || ''}" class="comment-avatar" /></a>
        <div class="comment-body">
          <a href="#/user/${a.id}" class="comment-author">${a.fullName || 'Anonymous'}</a>
          <div class="comment-text">${linkifyHashtagsAndMentions(c.body || '').replace(/\n/g, '<br />')}</div>
          <div class="comment-time">${timeAgo(c.createdAt)}</div>
        </div>
      </div>
    `;
  }).join('');
  replaceIcons(list);
}

