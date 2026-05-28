import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, FileQuestion, ThumbsUp, MessageSquare, Eye, BarChart3, Heart, CornerDownRight, X } from 'lucide-react';
import * as api from '../../api';
import { requireAuth, showToast, linkifyHashtagsAndMentions, isLoggedIn } from '../../ui-utils';
import { currentPath, onRouteChange } from '../../router';

// Migrated from vanilla pages/post-detail.ts — post + threaded comments + reactors sheet.

function postIdFromPath(): string {
  const m = currentPath().match(/^\/post\/([^/?]+)/);
  return m ? m[1] : '';
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

function linkedHtml(text: string, br = false): string {
  let h = linkifyHashtagsAndMentions(text || '');
  if (br) h = h.replace(/\n/g, '<br />');
  return h;
}

function avatarOf(u: any): string {
  return u?.avatar
    ? api.getImageUrl(u.avatar, 'avatar')
    : `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(u?.fullName || u?.id || 'user')}`;
}

const REACTION_EMOJI: Record<string, string> = {
  like: '👍', love: '❤️', celebrate: '🎉', insightful: '💡', laugh: '😂', wow: '😮', support: '🤝',
};

// ── A single comment's like button (local optimistic state) ──
function LikeButton({ comment, label }: { comment: any; label: string }) {
  const [liked, setLiked] = useState(!!comment.likedByMe);
  const [count, setCount] = useState(comment.likeCount || 0);
  const [busy, setBusy] = useState(false);
  const onLike = async () => {
    if (!requireAuth('like comments')) return;
    setBusy(true);
    try {
      const res = await api.likeComment(comment.id);
      setLiked(!!res.liked);
      setCount(res.likeCount);
    } catch (e: any) {
      showToast(e?.message || 'Could not like', { type: 'error' });
    } finally {
      setBusy(false);
    }
  };
  return (
    <button className={`comment-like-btn ${liked ? 'liked' : ''}`} aria-label={label} disabled={busy} onClick={onLike}>
      <Heart />
      <span className="comment-like-count">{count}</span>
    </button>
  );
}

function CommentThread({ c, me, postId }: { c: any; me: any; postId: string }) {
  const queryClient = useQueryClient();
  const a = c.author || {};
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [busy, setBusy] = useState(false);
  const replies: any[] = Array.isArray(c.replies) ? c.replies : [];

  const submitReply = async () => {
    const text = replyText.trim();
    if (!text) return;
    if (!requireAuth('reply')) return;
    setBusy(true);
    try {
      await api.addPostComment(postId, text, c.id);
      setReplyText('');
      setReplyOpen(false);
      queryClient.invalidateQueries({ queryKey: ['post-comments', postId] });
      showToast('Reply posted');
    } catch (e: any) {
      showToast(e?.message || 'Could not reply', { type: 'error' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="comment-thread">
      <div className="comment-item">
        <a href={`#/user/${a.id}`}><img src={avatarOf(a)} alt={a.fullName || ''} className="comment-avatar" /></a>
        <div className="comment-body">
          <a href={`#/user/${a.id}`} className="comment-author">{a.fullName || 'Anonymous'}</a>
          <div className="comment-text" dangerouslySetInnerHTML={{ __html: linkedHtml(c.body, true) }} />
          <div className="comment-toolbar">
            <span className="comment-time">{timeAgo(c.createdAt)}</span>
            <LikeButton comment={c} label="Like comment" />
            <button className="comment-reply-btn" aria-label="Reply" onClick={() => setReplyOpen((o) => !o)}>
              <CornerDownRight /> Reply
            </button>
          </div>
          {replyOpen && (
            <div className="comment-reply-form">
              <img src={avatarOf(me)} alt="" className="comment-reply-avatar" />
              <div className="comment-reply-input-wrap">
                <textarea className="input" rows={2} maxLength={1000} placeholder={`Reply to ${a.fullName ? a.fullName.split(' ')[0] + '…' : 'this comment'}`} value={replyText} onChange={(e) => setReplyText(e.target.value)} />
                <button className="btn btn-primary btn-sm comment-reply-submit" disabled={busy} onClick={submitReply}>Reply</button>
              </div>
            </div>
          )}
        </div>
      </div>
      {replies.length > 0 && (
        <div className="comment-replies">
          {replies.map((r: any) => (
            <div className="comment-item comment-item-reply" key={r.id}>
              <a href={`#/user/${r.author?.id}`}><img src={avatarOf(r.author)} alt={r.author?.fullName || ''} className="comment-avatar" /></a>
              <div className="comment-body">
                <a href={`#/user/${r.author?.id}`} className="comment-author">{r.author?.fullName || 'Anonymous'}</a>
                <div className="comment-text" dangerouslySetInnerHTML={{ __html: linkedHtml(r.body, true) }} />
                <div className="comment-toolbar">
                  <span className="comment-time">{timeAgo(r.createdAt)}</span>
                  <LikeButton comment={r} label="Like reply" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ReactorsSheet({ postId, onClose }: { postId: string; onClose: () => void }) {
  const [type, setType] = useState<string | null>(null);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [onClose]);

  const { data, isLoading } = useQuery({
    queryKey: ['reactors', postId],
    queryFn: () => api.getPostReactors(postId, { limit: 100 }).then((r: any) => (Array.isArray(r?.data) ? r.data : [])).catch(() => []),
  });

  const all: any[] = data ?? [];
  const breakdown: Record<string, number> = {};
  for (const r of all) breakdown[r.type] = (breakdown[r.type] || 0) + 1;
  const total = all.length;
  const types = Object.entries(breakdown).sort((a, b) => b[1] - a[1]);
  const rows = type ? all.filter((r) => r.type === type) : all;

  return createPortal(
    <div className="sheet-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sheet" role="dialog" aria-label="Reactions">
        <header className="sheet-head">
          <h3>Reactions</h3>
          <button className="sheet-close" aria-label="Close" onClick={onClose}><X /></button>
        </header>
        <div className="sheet-tabs">
          <button className={`sheet-tab ${type === null ? 'active' : ''}`} onClick={() => setType(null)}>All <span className="sheet-tab-count">{total}</span></button>
          {types.map(([t, c]) => (
            <button key={t} className={`sheet-tab ${type === t ? 'active' : ''}`} onClick={() => setType(t)}>
              {REACTION_EMOJI[t] || '👍'} <span className="sheet-tab-count">{c}</span>
            </button>
          ))}
        </div>
        <div className="sheet-body">
          {isLoading ? (
            <div className="text-muted text-center" style={{ padding: 'var(--space-4)' }}>Loading…</div>
          ) : rows.length === 0 ? (
            <div className="text-muted text-center" style={{ padding: 'var(--space-6)' }}>No one yet.</div>
          ) : (
            rows.map((r: any, i: number) => {
              const u = r.user || {};
              return (
                <a className="reactor-row" href={`#/user/${u.id}`} key={u.id || i}>
                  <div className="reactor-avatar-wrap">
                    <img src={u.avatar ? api.getImageUrl(u.avatar) : `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(u.fullName || 'M')}`} alt="" className="reactor-avatar" loading="lazy" />
                    <span className="reactor-emoji" aria-hidden="true">{REACTION_EMOJI[r.type] || '👍'}</span>
                  </div>
                  <div className="reactor-meta">
                    <div className="reactor-name">{u.fullName || 'Member'}</div>
                    {u.country && <div className="reactor-sub">{u.country}</div>}
                  </div>
                </a>
              );
            })
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default function PostDetailPage() {
  const queryClient = useQueryClient();
  const [postId, setPostId] = useState(postIdFromPath());
  useEffect(() => onRouteChange(() => setPostId(postIdFromPath())), []);

  const [commentText, setCommentText] = useState('');
  const [posting, setPosting] = useState(false);
  const [reactorsOpen, setReactorsOpen] = useState(false);

  const postQ = useQuery({ queryKey: ['post', postId], queryFn: () => api.getPostById(postId).catch(() => null) });
  const meQ = useQuery({ queryKey: ['me-postdetail'], queryFn: () => api.getMyProfile().catch(() => null), enabled: isLoggedIn() });
  const commentsQ = useQuery({ queryKey: ['post-comments', postId], queryFn: () => api.getPostComments(postId).catch(() => [] as any[]) });

  const post = postQ.data;
  const me = meQ.data ?? null;
  const threads = commentsQ.data ?? [];
  const totalComments = threads.reduce((n: number, t: any) => n + 1 + (Array.isArray(t.replies) ? t.replies.length : 0), 0);

  const submitComment = async () => {
    const text = commentText.trim();
    if (!text) return;
    if (!requireAuth('comment on posts')) return;
    setPosting(true);
    try {
      await api.addPostComment(postId, text);
      setCommentText('');
      queryClient.invalidateQueries({ queryKey: ['post-comments', postId] });
      showToast('Comment posted');
    } catch (err: any) {
      showToast(err?.message || 'Could not post comment', { type: 'error' });
    } finally {
      setPosting(false);
    }
  };

  const BackLink = (
    <a href="#/" className="btn btn-ghost" style={{ marginBottom: 'var(--space-4)' }}><ArrowLeft /> Back to Feed</a>
  );

  if (postQ.isLoading) {
    return (
      <div className="post-detail-page page-enter" data-design="sleek" id="post-detail-root">
        {BackLink}
        <div className="post-detail-loading"><div className="spinner" /><p>Loading post…</p></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="post-detail-page page-enter" data-design="sleek" id="post-detail-root">
        {BackLink}
        <div className="empty-state">
          <FileQuestion style={{ width: '3rem', height: '3rem', color: 'var(--text-muted)' }} />
          <h3>Post not found</h3>
          <p>This post may have been removed.</p>
        </div>
      </div>
    );
  }

  const author = post.author || {};
  const cover = Array.isArray(post.images) && post.images[0] ? post.images[0] : null;
  const isAuthor = !!me && me.id === author.id;
  const reactions = Number(post.upvotes) || 0;
  const comments = Number(post.commentCount) || 0;
  const views = Number(post.viewCount) || 0;
  const engagementRate = views > 0 ? (((reactions + comments) / views) * 100).toFixed(1) + '%' : '—';

  return (
    <div className="post-detail-page page-enter" data-design="sleek" id="post-detail-root">
      {BackLink}

      <article className="post-detail-card">
        <header className="post-detail-header">
          <a href={`#/user/${author.id}`} className="post-detail-author">
            <img src={avatarOf(author)} alt={author.fullName || ''} />
            <div>
              <strong>{author.fullName || 'Anonymous'}</strong>
              <span className="text-xs text-muted">{timeAgo(post.createdAt)}{post.location ? ' · ' + post.location : ''}</span>
            </div>
          </a>
          {post.category && <span className="post-detail-cat">{post.category}</span>}
        </header>

        <h1 className="post-detail-title" dangerouslySetInnerHTML={{ __html: linkedHtml(post.title) }} />
        {cover && <img src={cover} alt="" className="post-detail-image" loading="lazy" />}
        <p className="post-detail-body" dangerouslySetInnerHTML={{ __html: linkedHtml(post.body, true) }} />

        <div className="post-detail-actions">
          <button className="post-detail-stat post-detail-stat-btn" type="button" disabled={reactions === 0} onClick={() => setReactorsOpen(true)}>
            <ThumbsUp /> {fmtCount(reactions)}
          </button>
          <span className="post-detail-stat"><MessageSquare /> {fmtCount(comments)}</span>
          <span className="post-detail-stat"><Eye /> {fmtCount(views)} views</span>
        </div>

        {isAuthor && (
          <div className="creator-analytics" title="Visible only to you, the author">
            <span className="creator-analytics-pill"><BarChart3 /> Your stats</span>
            <div className="creator-analytics-row">
              <div><strong>{fmtCount(views)}</strong><span>Views</span></div>
              <div><strong>{fmtCount(reactions)}</strong><span>Reactions</span></div>
              <div><strong>{fmtCount(comments)}</strong><span>Comments</span></div>
              <div><strong>{engagementRate}</strong><span>Engagement</span></div>
            </div>
          </div>
        )}
      </article>

      <section className="comments-section">
        <h3 className="comments-header">{totalComments} Comment{totalComments === 1 ? '' : 's'}</h3>
        <div className="comment-form">
          <textarea className="input" rows={3} placeholder="Share your thoughts…" maxLength={1000} value={commentText} onChange={(e) => setCommentText(e.target.value)} />
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-2)' }}>
            <button className="btn btn-primary btn-sm" disabled={posting} onClick={submitComment}>Comment</button>
          </div>
        </div>
        <div className="comments-list">
          {commentsQ.isLoading ? (
            <div className="text-muted text-center" style={{ padding: 'var(--space-4)' }}>Loading comments…</div>
          ) : threads.length === 0 ? (
            <div className="text-muted text-center" style={{ padding: 'var(--space-4)' }}>No comments yet — be the first.</div>
          ) : (
            threads.map((c: any) => <CommentThread key={c.id} c={c} me={me} postId={postId} />)
          )}
        </div>
      </section>

      {reactorsOpen && <ReactorsSheet postId={postId} onClose={() => setReactorsOpen(false)} />}
    </div>
  );
}
