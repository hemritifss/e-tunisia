import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Hash, Rss, Heart, MessageCircle, MapPin } from 'lucide-react';
import * as api from '../../api';
import { linkifyHashtagsAndMentions } from '../../ui-utils';
import { currentPath, onRouteChange } from '../../router';
import { ListSkeleton } from '../components/RouteSkeleton';

// Migrated from vanilla pages/tag.ts — /tag/:tag hashtag feed.

function rawTagFromPath(): string {
  const m = currentPath().match(/^\/tag\/([^/?]+)/);
  return m ? decodeURIComponent(m[1]) : '';
}

function esc(s: string): string {
  return String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string),
  );
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

function TagCard({ p }: { p: any }) {
  const author = p.author || {};
  const avatar = author.avatar
    ? api.getImageUrl(author.avatar)
    : `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(author.fullName || 'M')}`;
  const firstImage = Array.isArray(p.images) && p.images[0] ? api.getImageUrl(p.images[0]) : '';
  const linkedBody = p.body ? linkifyHashtagsAndMentions(esc(p.body)) : '';
  const detail = p.type === 'review' && p.place?.id ? `#/place/${p.place.id}` : `#/post/${p.id}`;
  return (
    <article className="tag-card card" style={{ overflow: 'hidden' }}>
      <a href={detail} style={{ display: 'flex', flexDirection: 'column', textDecoration: 'none', color: 'inherit' }}>
        {firstImage && (
          <img src={firstImage} alt="" style={{ width: '100%', maxHeight: 280, objectFit: 'cover' }} loading="lazy" />
        )}
        <div style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <img src={avatar} alt="" style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover' }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{author.fullName || 'Member'}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{timeAgo(p.createdAt)}</div>
            </div>
          </div>
          <h3 style={{ margin: 0, fontSize: '1.05rem', lineHeight: 1.25 }}>{p.title || ''}</h3>
          {linkedBody && (
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
              dangerouslySetInnerHTML={{ __html: linkedBody }}
            />
          )}
          <div style={{ display: 'flex', gap: 'var(--space-3)', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            <span><Heart /> {Number(p.upvotes) || 0}</span>
            <span><MessageCircle /> {Number(p.commentCount) || 0}</span>
            {p.location && <span><MapPin /> {p.location}</span>}
          </div>
        </div>
      </a>
    </article>
  );
}

export default function TagPage() {
  const [raw, setRaw] = useState(rawTagFromPath());

  // Re-read when navigating between /tag/<a> and /tag/<b>.
  useEffect(() => onRouteChange(() => setRaw(rawTagFromPath())), []);

  const t = raw.replace(/^#/, '').toLowerCase();
  const safe = raw.replace(/[^a-zA-Z0-9_-]/g, '');

  const { data, isLoading } = useQuery({
    queryKey: ['tag-feed', t],
    queryFn: async () => {
      const res = await api.getFeed({ hashtag: t, limit: 30, sort: 'new' });
      const items = Array.isArray(res?.data) ? res.data : [];
      const total = res?.meta?.total ?? items.length;
      return { items, total };
    },
  });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const metaText = isLoading
    ? 'Loading posts…'
    : total > 0
      ? `${total.toLocaleString()} ${total === 1 ? 'post' : 'posts'}`
      : 'No posts yet — be the first.';

  return (
    <div className="tag-page page-enter" id="tag-root">
      <a href="#/" className="btn btn-ghost" style={{ marginBottom: 'var(--space-4)' }}>
        <ArrowLeft /> Back
      </a>
      <header className="tag-header" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
        <div className="tag-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>#</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ margin: 0, fontSize: '1.6rem' }}>#{safe || 'tunisia'}</h1>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>{metaText}</p>
        </div>
      </header>
      <div id="tag-list" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {isLoading ? (
          <ListSkeleton count={5} label="Loading posts" rowHeight={92} />
        ) : items.length === 0 ? (
          <div className="empty-state">
            <Hash style={{ width: '3rem', height: '3rem', color: 'var(--text-muted)' }} />
            <h3>No posts with #{t}</h3>
            <p>Be the first — share something and add <strong>#{t}</strong> in the body.</p>
            <a href="#/" className="btn btn-primary"><Rss /> Back to feed</a>
          </div>
        ) : (
          items.map((p) => <TagCard key={p.id} p={p} />)
        )}
      </div>
    </div>
  );
}
