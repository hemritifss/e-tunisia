import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Bookmark, BookmarkX, Heart, MessageCircle, Tag, MapPin, AlertCircle, Rss } from 'lucide-react';
import * as api from '../../api';
import { showToast } from '../../ui-utils';
import { ListSkeleton } from '../components/RouteSkeleton';
import { PageHeader } from '../components/PageHeader';

// Migrated from vanilla pages/saved.ts — same classes/inline styles, same
// api.listSavedPosts / unsavePost calls.

function timeAgo(d: string | Date): string {
  const ms = Date.now() - new Date(d).getTime();
  const m = Math.floor(ms / 60_000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

async function loadSaved(): Promise<any[]> {
  const res = await api.listSavedPosts(1, 30);
  return Array.isArray(res?.data) ? res.data : [];
}

function SavedCard({ post, onUnsave }: { post: any; onUnsave: (id: string) => void }) {
  const author = post.author || {};
  const avatar = author.avatar
    ? api.getImageUrl(author.avatar)
    : `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(author.fullName || 'M')}`;
  const firstImage = Array.isArray(post.images) && post.images[0] ? api.getImageUrl(post.images[0]) : '';
  return (
    <article className="saved-card card" style={{ overflow: 'hidden' }}>
      <a
        href={`#/post/${post.id}`}
        className="saved-card-link"
        style={{ display: 'flex', flexDirection: 'column', textDecoration: 'none', color: 'inherit' }}
      >
        {firstImage && (
          <img src={firstImage} alt="" style={{ width: '100%', maxHeight: 260, objectFit: 'cover' }} loading="lazy" />
        )}
        <div style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <img
              src={avatar}
              alt={author.fullName || ''}
              style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover' }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: '0.95rem', lineHeight: 1.1 }}>
                {author.fullName || 'Member'}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Saved {timeAgo(post.savedAt || post.createdAt)} · {timeAgo(post.createdAt)}
              </div>
            </div>
            <button
              className="btn btn-ghost"
              style={{ padding: '6px 10px' }}
              aria-label="Remove from saved"
              title="Remove from saved"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onUnsave(post.id);
              }}
            >
              <BookmarkX />
            </button>
          </div>
          <h3 style={{ margin: 0, fontSize: '1.05rem', lineHeight: 1.25 }}>{post.title || ''}</h3>
          {post.body && (
            <p
              style={{
                margin: 0,
                color: 'var(--text-muted)',
                fontSize: '0.92rem',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {post.body}
            </p>
          )}
          <div style={{ display: 'flex', gap: 'var(--space-3)', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            <span><Heart /> {Number(post.upvotes) || 0}</span>
            <span><MessageCircle /> {Number(post.commentCount) || 0}</span>
            {post.category && <span><Tag /> {post.category}</span>}
            {post.location && <span><MapPin /> {post.location}</span>}
          </div>
        </div>
      </a>
    </article>
  );
}

export default function SavedPage() {
  const queryClient = useQueryClient();
  const { data: posts, isLoading, isError } = useQuery({
    queryKey: ['saved', 'posts'],
    queryFn: loadSaved,
  });

  const onUnsave = async (id: string) => {
    const prev = queryClient.getQueryData<any[]>(['saved', 'posts']);
    queryClient.setQueryData<any[]>(['saved', 'posts'], (old) => (old || []).filter((p) => p.id !== id));
    try {
      await api.unsavePost(id);
      showToast('Removed from saved');
    } catch {
      queryClient.setQueryData(['saved', 'posts'], prev); // rollback
      showToast('Could not unsave — try again');
    }
  };

  return (
    <div className="saved-page page-enter" id="saved-root">
      <PageHeader
        eyebrow={<><Bookmark size={13} /> Library · carnet personnel</>}
        title="Saved Posts"
        subtitle="Posts you've bookmarked to revisit. They stay here until you unsave them."
      />
      <div>
        {isLoading ? (
          <ListSkeleton count={5} label="Loading your saved posts" rowHeight={92} />
        ) : isError ? (
          <div className="empty-state">
            <AlertCircle style={{ width: '3rem', height: '3rem', color: 'var(--text-muted)' }} />
            <h3>Couldn't load saved posts</h3>
            <p>Sign in and try again.</p>
            <a href="#/login" className="btn btn-primary">Sign in</a>
          </div>
        ) : !posts || posts.length === 0 ? (
          <div className="empty-state">
            <Bookmark style={{ width: '3rem', height: '3rem', color: 'var(--text-muted)' }} />
            <h3>Nothing saved yet</h3>
            <p>Tap the bookmark on any post to keep it here.</p>
            <a href="#/" className="btn btn-primary"><Rss /> Browse the feed</a>
          </div>
        ) : (
          <div className="saved-list" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {posts.map((p) => (
              <SavedCard key={p.id} post={p} onUnsave={onUnsave} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
