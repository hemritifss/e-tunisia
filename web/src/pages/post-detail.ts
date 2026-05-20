// ============================================
// POST DETAIL — /#/post/:id
// Threaded comments (1 level deep) + comment likes + creator analytics.
// ============================================

import * as api from '../api';
import { replaceIcons } from '../icons';
import { requireAuth, showToast, linkifyHashtagsAndMentions, isLoggedIn } from '../ui-utils';

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

function fmtCount(n: number): string {
  const v = Number(n) || 0;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}k`;
  return v.toLocaleString();
}

export async function initPostDetailPage(id: string) {
  const root = document.getElementById('post-detail-root');
  if (!root) return;

  const [post, me] = await Promise.all([
    api.getPostById(id).catch(() => null),
    isLoggedIn() ? api.getMyProfile().catch(() => null) : Promise.resolve(null),
  ]);

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
  const isAuthor = !!me && me.id === author.id;

  // Engagement rate = (reactions + comments) / views; only shown to author.
  const reactions = Number(post.upvotes) || 0;
  const comments = Number(post.commentCount) || 0;
  const views = Number(post.viewCount) || 0;
  const engagementRate = views > 0
    ? (((reactions + comments) / views) * 100).toFixed(1) + '%'
    : '—';

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
        <button class="post-detail-stat post-detail-stat-btn" id="open-reactors-btn" type="button" ${reactions === 0 ? 'disabled' : ''}>
          <i class="lucide-thumbs-up"></i> ${fmtCount(reactions)}
        </button>
        <span class="post-detail-stat"><i class="lucide-message-square"></i> ${fmtCount(comments)}</span>
        <span class="post-detail-stat"><i class="lucide-eye"></i> ${fmtCount(views)} views</span>
      </div>

      ${isAuthor ? `
        <div class="creator-analytics" title="Visible only to you, the author">
          <span class="creator-analytics-pill"><i class="lucide-bar-chart-3"></i> Your stats</span>
          <div class="creator-analytics-row">
            <div><strong>${fmtCount(views)}</strong><span>Views</span></div>
            <div><strong>${fmtCount(reactions)}</strong><span>Reactions</span></div>
            <div><strong>${fmtCount(comments)}</strong><span>Comments</span></div>
            <div><strong>${engagementRate}</strong><span>Engagement</span></div>
          </div>
        </div>` : ''}
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

  await refreshComments(id, me);

  document.getElementById('open-reactors-btn')?.addEventListener('click', () => openReactorsSheet(id));

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
      await refreshComments(id, me);
      showToast('Comment posted');
    } catch (err: any) {
      showToast(err?.message || 'Could not post comment', { type: 'error' });
    } finally {
      btn.disabled = false;
    }
  });
}

async function refreshComments(postId: string, me: any) {
  const list = document.getElementById('comments-list');
  const header = document.getElementById('comments-count');
  if (!list) return;

  let threads: any[] = [];
  try { threads = await api.getPostComments(postId); } catch {}

  // Server returns top-level comments with `.replies` nested.
  const totalCount = countComments(threads);
  if (header) header.textContent = `${totalCount} Comment${totalCount === 1 ? '' : 's'}`;

  if (threads.length === 0) {
    list.innerHTML = `<div class="text-muted text-center" style="padding:var(--space-4);">No comments yet — be the first.</div>`;
    return;
  }

  list.innerHTML = threads.map(c => renderThread(c, me)).join('');
  replaceIcons(list);

  // Wire actions on every comment + reply
  list.querySelectorAll<HTMLButtonElement>('.comment-like-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const commentId = btn.dataset.comment!;
      if (!requireAuth('like comments')) return;
      btn.disabled = true;
      try {
        const res = await api.likeComment(commentId);
        btn.classList.toggle('liked', !!res.liked);
        const countEl = btn.querySelector('.comment-like-count');
        if (countEl) countEl.textContent = String(res.likeCount);
        const icon = btn.querySelector('i');
        if (icon) icon.className = res.liked ? 'lucide-heart' : 'lucide-heart';
        // Heart fill is in CSS via .liked class
      } catch (e: any) {
        showToast(e?.message || 'Could not like', { type: 'error' });
      } finally {
        btn.disabled = false;
      }
    });
  });

  list.querySelectorAll<HTMLButtonElement>('.comment-reply-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const commentId = btn.dataset.comment!;
      const replyArea = document.getElementById(`reply-form-${commentId}`) as HTMLElement | null;
      if (!replyArea) return;
      replyArea.hidden = !replyArea.hidden;
      if (!replyArea.hidden) {
        const ta = replyArea.querySelector('textarea') as HTMLTextAreaElement;
        setTimeout(() => ta?.focus(), 50);
      }
    });
  });

  list.querySelectorAll<HTMLButtonElement>('.comment-reply-submit').forEach(btn => {
    btn.addEventListener('click', async () => {
      const commentId = btn.dataset.comment!;
      const wrap = document.getElementById(`reply-form-${commentId}`);
      const ta = wrap?.querySelector('textarea') as HTMLTextAreaElement;
      const text = (ta?.value || '').trim();
      if (!text) return;
      if (!requireAuth('reply')) return;
      btn.disabled = true;
      try {
        await api.addPostComment(postId, text, commentId);
        if (ta) ta.value = '';
        await refreshComments(postId, me);
        showToast('Reply posted');
      } catch (e: any) {
        showToast(e?.message || 'Could not reply', { type: 'error' });
      } finally {
        btn.disabled = false;
      }
    });
  });
}

function countComments(threads: any[]): number {
  let n = 0;
  for (const t of threads) {
    n += 1;
    if (Array.isArray(t.replies)) n += t.replies.length;
  }
  return n;
}

function renderThread(c: any, me: any): string {
  const a = c.author || {};
  const seed = encodeURIComponent(a.fullName || a.id || 'user');
  const av = a.avatar
    ? api.getImageUrl(a.avatar, 'avatar')
    : `https://api.dicebear.com/9.x/thumbs/svg?seed=${seed}`;

  const myAvatarSeed = encodeURIComponent(me?.fullName || me?.id || 'me');
  const myAvatar = me?.avatar
    ? api.getImageUrl(me.avatar, 'avatar')
    : `https://api.dicebear.com/9.x/thumbs/svg?seed=${myAvatarSeed}`;

  const liked = !!c.likedByMe;
  const replies: any[] = Array.isArray(c.replies) ? c.replies : [];

  return `
    <div class="comment-thread">
      <div class="comment-item">
        <a href="#/user/${a.id}"><img src="${av}" alt="${a.fullName || ''}" class="comment-avatar" /></a>
        <div class="comment-body">
          <a href="#/user/${a.id}" class="comment-author">${a.fullName || 'Anonymous'}</a>
          <div class="comment-text">${linkifyHashtagsAndMentions(c.body || '').replace(/\n/g, '<br />')}</div>
          <div class="comment-toolbar">
            <span class="comment-time">${timeAgo(c.createdAt)}</span>
            <button class="comment-like-btn ${liked ? 'liked' : ''}" data-comment="${c.id}" aria-label="Like comment">
              <i class="lucide-heart"></i>
              <span class="comment-like-count">${c.likeCount || 0}</span>
            </button>
            <button class="comment-reply-btn" data-comment="${c.id}" aria-label="Reply">
              <i class="lucide-corner-down-right"></i>
              Reply
            </button>
          </div>

          <div class="comment-reply-form" id="reply-form-${c.id}" hidden>
            <img src="${myAvatar}" alt="" class="comment-reply-avatar" />
            <div class="comment-reply-input-wrap">
              <textarea class="input" rows="2" placeholder="Reply to ${a.fullName ? (a.fullName.split(' ')[0] + '…') : 'this comment'}" maxlength="1000"></textarea>
              <button class="btn btn-primary btn-sm comment-reply-submit" data-comment="${c.id}">Reply</button>
            </div>
          </div>
        </div>
      </div>

      ${replies.length > 0 ? `
        <div class="comment-replies">
          ${replies.map((r: any) => renderReply(r, me)).join('')}
        </div>` : ''}
    </div>
  `;
}

function renderReply(c: any, _me: any): string {
  const a = c.author || {};
  const seed = encodeURIComponent(a.fullName || a.id || 'user');
  const av = a.avatar
    ? api.getImageUrl(a.avatar, 'avatar')
    : `https://api.dicebear.com/9.x/thumbs/svg?seed=${seed}`;
  const liked = !!c.likedByMe;
  return `
    <div class="comment-item comment-item-reply">
      <a href="#/user/${a.id}"><img src="${av}" alt="${a.fullName || ''}" class="comment-avatar" /></a>
      <div class="comment-body">
        <a href="#/user/${a.id}" class="comment-author">${a.fullName || 'Anonymous'}</a>
        <div class="comment-text">${linkifyHashtagsAndMentions(c.body || '').replace(/\n/g, '<br />')}</div>
        <div class="comment-toolbar">
          <span class="comment-time">${timeAgo(c.createdAt)}</span>
          <button class="comment-like-btn ${liked ? 'liked' : ''}" data-comment="${c.id}" aria-label="Like reply">
            <i class="lucide-heart"></i>
            <span class="comment-like-count">${c.likeCount || 0}</span>
          </button>
        </div>
      </div>
    </div>
  `;
}

// ────────────────────────────────────────────────────────────
// "Who reacted" bottom sheet — Instagram/LinkedIn style
// ────────────────────────────────────────────────────────────
const REACTION_EMOJI: Record<string, string> = {
  like: '👍', love: '❤️', celebrate: '🎉', insightful: '💡',
  laugh: '😂', wow: '😮', support: '🤝',
};

function escHtml(s: string): string {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c] as string));
}

function openReactorsSheet(postId: string) {
  // Close any existing
  document.getElementById('reactors-sheet-overlay')?.remove();

  const overlay = document.createElement('div');
  overlay.id = 'reactors-sheet-overlay';
  overlay.className = 'sheet-overlay';
  overlay.innerHTML = `
    <div class="sheet" role="dialog" aria-label="Reactions">
      <header class="sheet-head">
        <h3>Reactions</h3>
        <button class="sheet-close" id="reactors-close" aria-label="Close"><i class="lucide-x"></i></button>
      </header>
      <div class="sheet-tabs" id="reactors-tabs"></div>
      <div class="sheet-body" id="reactors-body">
        <div class="text-muted text-center" style="padding:var(--space-4);">Loading…</div>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  replaceIcons(overlay);
  document.body.style.overflow = 'hidden';

  const close = () => {
    overlay.remove();
    document.body.style.overflow = '';
  };
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  document.getElementById('reactors-close')?.addEventListener('click', close);
  const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { close(); window.removeEventListener('keydown', onKey); } };
  window.addEventListener('keydown', onKey);

  loadReactors(postId, null);
}

let currentReactorPostId = '';

async function loadReactors(postId: string, type: string | null) {
  currentReactorPostId = postId;
  const tabs = document.getElementById('reactors-tabs');
  const body = document.getElementById('reactors-body');
  if (!body || !tabs) return;
  body.innerHTML = `<div class="text-muted text-center" style="padding:var(--space-4);">Loading…</div>`;

  let res: any = { data: [], meta: { total: 0 } };
  try {
    res = await api.getPostReactors(postId, type ? { type, limit: 100 } : { limit: 100 });
  } catch {}

  const rows: any[] = Array.isArray(res?.data) ? res.data : [];

  // Render tabs from the aggregate of all reactions (re-fetched once, cached on the overlay)
  const overlay = document.getElementById('reactors-sheet-overlay');
  let breakdown = (overlay as any)?.__breakdown as Record<string, number> | undefined;
  if (!breakdown) {
    breakdown = {};
    try {
      const all = await api.getPostReactors(postId, { limit: 100 });
      for (const r of (all?.data || [])) {
        breakdown[r.type] = (breakdown[r.type] || 0) + 1;
      }
    } catch {}
    if (overlay) (overlay as any).__breakdown = breakdown;
  }
  const total = Object.values(breakdown).reduce((a, b) => a + b, 0);
  const types = Object.entries(breakdown).sort((a, b) => b[1] - a[1]);

  tabs.innerHTML = `
    <button class="sheet-tab ${type === null ? 'active' : ''}" data-type="">All <span class="sheet-tab-count">${total}</span></button>
    ${types.map(([t, c]) => `
      <button class="sheet-tab ${type === t ? 'active' : ''}" data-type="${escHtml(t)}">
        ${REACTION_EMOJI[t] || '👍'} <span class="sheet-tab-count">${c}</span>
      </button>
    `).join('')}
  `;
  tabs.querySelectorAll<HTMLButtonElement>('.sheet-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      const t = btn.dataset.type || '';
      loadReactors(currentReactorPostId, t || null);
    });
  });

  if (rows.length === 0) {
    body.innerHTML = `<div class="text-muted text-center" style="padding:var(--space-6);">No one yet.</div>`;
    return;
  }

  body.innerHTML = rows.map((r: any) => {
    const u = r.user || {};
    const avatar = u.avatar
      ? api.getImageUrl(u.avatar)
      : `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(u.fullName || 'M')}`;
    const emoji = REACTION_EMOJI[r.type] || '👍';
    return `
      <a class="reactor-row" href="#/user/${escHtml(u.id)}">
        <div class="reactor-avatar-wrap">
          <img src="${escHtml(avatar)}" alt="" class="reactor-avatar" loading="lazy" />
          <span class="reactor-emoji" aria-hidden="true">${emoji}</span>
        </div>
        <div class="reactor-meta">
          <div class="reactor-name">${escHtml(u.fullName || 'Member')}</div>
          ${u.country ? `<div class="reactor-sub">${escHtml(u.country)}</div>` : ''}
        </div>
      </a>
    `;
  }).join('');
}
