import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle,
  Share2,
  Bookmark,
  MapPin,
  Clock,
  TrendingUp,
  Flame,
  Coins,
} from 'lucide-react';
import { openDonateModal } from '../../donate-modal';
import { api } from '../../shared/api';
import type { Post } from '../../shared/types/api';
import { Card, CardContent } from '../components/Card';
import { Avatar } from '../components/Avatar';
import { Button } from '../components/Button';
import { Skeleton, PostCardSkeleton } from '../components/Skeleton';
import { formatNumber, formatDate } from '../lib/utils';
import { useAuthStore } from '../stores/auth-store';
import { useUIStore } from '../stores/ui-store';

import { StoriesStrip } from '../components/StoriesStrip';
import { AdCard } from '../components/AdCard';
import { ComposeBox } from '../components/ComposeBox';
import { SuggestedUsers } from '../components/SuggestedUsers';
import { TrendingHashtags } from '../components/TrendingHashtags';
import { ReactionPicker, REACTIONS } from '../components/ReactionPicker';
import { OnboardingBanner } from '../components/OnboardingBanner';
import { FeaturedPlaces } from '../components/FeaturedPlaces';
import { DiscoverTrips } from '../components/DiscoverTrips';
import { WelcomeStrip } from '../components/WelcomeStrip';
import { TunisiaPulse } from '../components/TunisiaPulse';
import { MoodCompass } from '../components/MoodCompass';
import { TunisiaNowPanel } from '../components/TunisiaNowPanel';
import { Plus, User as UserIcon, RefreshCcw, Users as UsersIcon } from 'lucide-react';
import { useAuthStore as _useAuthStoreFeed } from '../stores/auth-store';
import { requireAuth } from '../../ui-utils';

type SortType = 'hot' | 'new' | 'top' | 'following' | 'mine';

const sortLabels: Record<SortType, { label: string; icon: React.ReactNode }> = {
  hot:       { label: 'Hot',       icon: <Flame size={14} /> },
  new:       { label: 'New',       icon: <Clock size={14} /> },
  top:       { label: 'Top',       icon: <TrendingUp size={14} /> },
  following: { label: 'Following', icon: <UsersIcon size={14} /> },
  mine:      { label: 'Mine',      icon: <UserIcon size={14} /> },
};

function PostCard({ post }: { post: Post }) {
  const [isSavedLocal, setIsSavedLocal] = useState(() => {
    try {
      const map = JSON.parse(localStorage.getItem('etunisia_saved_items') || '{}');
      return !!map['post:' + post.id];
    } catch {
      return false;
    }
  });
  const showToast = useUIStore((s) => s.showToast);

  // For review items, navigate to the underlying place; for real posts, the post itself.
  const detailHash =
    (post as any).type === 'review' && (post as any).place?.id
      ? `#/place/${(post as any).place.id}`
      : `#/post/${post.id}`;

  const handleComment = () => {
    location.hash = detailHash;
  };

  const handleShare = async () => {
    const url = `${location.origin}${location.pathname}${detailHash}`;
    if ((navigator as any).share) {
      try {
        await (navigator as any).share({ title: post.title, text: post.body?.slice(0, 100), url });
        return;
      } catch {}
    }
    try {
      await navigator.clipboard.writeText(url);
      showToast('Link copied to clipboard', 'success');
    } catch {
      showToast('Could not share link', 'error');
    }
  };

  const handleSave = async () => {
    if (!requireAuth('save posts')) return;
    // Only real posts can be persisted server-side. Reviews/ads fall back to local-only.
    const canPersist = (post as any).type === 'post' || !(post as any).type;
    const key = 'post:' + post.id;
    const wasSaved = isSavedLocal;
    // Optimistic flip
    setIsSavedLocal(!wasSaved);
    try {
      const map = JSON.parse(localStorage.getItem('etunisia_saved_items') || '{}');
      if (wasSaved) delete map[key];
      else map[key] = true;
      localStorage.setItem('etunisia_saved_items', JSON.stringify(map));
    } catch {}

    if (!canPersist) {
      showToast(wasSaved ? 'Removed from bookmarks' : 'Saved to bookmarks', wasSaved ? 'info' : 'success');
      return;
    }

    try {
      if (wasSaved) {
        await api.unsavePost(post.id);
        showToast('Removed from bookmarks', 'info');
      } else {
        await api.savePost(post.id);
        showToast('Saved to bookmarks', 'success');
      }
    } catch {
      // Revert on failure
      setIsSavedLocal(wasSaved);
      try {
        const map = JSON.parse(localStorage.getItem('etunisia_saved_items') || '{}');
        if (wasSaved) map[key] = true;
        else delete map[key];
        localStorage.setItem('etunisia_saved_items', JSON.stringify(map));
      } catch {}
      showToast('Could not update bookmark', 'error');
    }
  };

  const authorHandle = (post.author as any)?.handle;
  const authorHref = authorHandle
    ? `#/u/${authorHandle}`
    : (post.author?.id ? `#/user/${post.author.id}` : '#');
  const isCreator = (post.author as any)?.role === 'creator';
  const images: string[] = Array.isArray(post.images) ? post.images.filter(Boolean) : [];

  return (
    <motion.article
      className="post-card-v2"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
    >
      <header className="post-card-v2-head">
        <a
          className="post-card-v2-author"
          href={authorHref}
          onClick={(e) => { if (!post.author?.id) e.preventDefault(); }}
        >
          <Avatar
            src={post.author?.avatar}
            fallback={post.author?.fullName}
            size="sm"
          />
          <div className="post-card-v2-byline">
            <strong>
              {post.author?.fullName || 'Anonymous'}
              {isCreator && <span className="post-card-v2-guide" title="Local Guide">✓</span>}
            </strong>
            <span>
              {authorHandle ? `@${authorHandle} · ` : ''}{formatDate(post.createdAt)}
            </span>
          </div>
        </a>
        {post.category && (
          <span className="post-card-v2-category">{post.category}</span>
        )}
      </header>

      <a className="post-card-v2-content" href={detailHash}>
        {post.title && <h3 className="post-card-v2-title">{post.title}</h3>}
        {post.body && <p className="post-card-v2-body">{post.body}</p>}
      </a>

      {images.length > 0 && (
        <a className={`post-card-v2-media post-card-v2-media-${Math.min(images.length, 4)}`} href={detailHash} aria-label="Open post">
          {images.slice(0, 4).map((src, i) => (
            <img key={i} src={src} alt="" loading="lazy" />
          ))}
          {images.length > 4 && (
            <span className="post-card-v2-media-overflow">+{images.length - 4}</span>
          )}
        </a>
      )}

      {post.location && (
        <div className="post-card-v2-loc">
          <MapPin size={12} /> {post.location}
        </div>
      )}

      <footer className="post-card-v2-actions">
        <ReactionPicker
          postId={post.id}
          initialMine={(post as any).myReaction || null}
          initialBreakdown={(post as any).reactions?.breakdown || {}}
          initialTotal={
            typeof (post as any).reactions?.total === 'number'
              ? (post as any).reactions.total
              : (Number(post.upvotes) || 0)
          }
        />
        <button className="post-card-v2-action" onClick={handleComment} aria-label="Comments">
          <MessageCircle size={15} />
          <span>{formatNumber(post.commentCount)}</span>
        </button>
        <button className="post-card-v2-action" onClick={handleShare} aria-label="Share">
          <Share2 size={15} />
          <span>Share</span>
        </button>
        <button
          className={`post-card-v2-action ${isSavedLocal ? 'is-active' : ''}`}
          onClick={handleSave}
          aria-label={isSavedLocal ? 'Unsave' : 'Save'}
        >
          <Bookmark size={15} className={isSavedLocal ? 'fill-current' : ''} />
          <span>{isSavedLocal ? 'Saved' : 'Save'}</span>
        </button>
        {post.author && (
          <button
            className="post-card-v2-action post-card-v2-tip"
            onClick={() => openDonateModal({
              target: 'user',
              toUserId: post.author!.id,
              toUserName: post.author!.fullName,
              toUserAvatar: post.author!.avatar || undefined,
            })}
            aria-label="Tip"
          >
            <Coins size={15} />
            <span>Tip</span>
          </button>
        )}
      </footer>
    </motion.article>
  );
}

export default function FeedPage() {
  const [sort, setSort] = useState<SortType>('hot');
  const queryClient = useQueryClient();
  const showToast = useUIStore((s) => s.showToast);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteQuery({
    queryKey: ['feed', sort],
    queryFn: async ({ pageParam = 1 }) => {
      const params: Record<string, string> = {
        page: String(pageParam),
        limit: '10',
        sort: sort === 'mine' || sort === 'following' ? 'new' : sort,
      };
      let fetcher;
      if (sort === 'mine')           fetcher = api.getMyFeed;
      else if (sort === 'following') fetcher = (api as any).getFollowingFeed;
      else                           fetcher = api.getFeed;
      const res = await fetcher(params);
      return res as { data: any[]; meta: { page: number; limit: number; total: number; totalPages: number } };
    },
    getNextPageParam: (lastPage) => {
      // Defensive: if the page payload didn't include meta (error / unexpected shape), stop paging.
      const meta = (lastPage as any)?.meta;
      if (!meta || typeof meta.page !== 'number' || typeof meta.totalPages !== 'number') return undefined;
      if (meta.page >= meta.totalPages) return undefined;
      return meta.page + 1;
    },
    initialPageParam: 1,
    // Background refresh — every 60s the feed checks for new content.
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });

  // Refresh immediately when a new post is created (modal dispatches this event).
  useEffect(() => {
    const onCreated = () => queryClient.invalidateQueries({ queryKey: ['feed'] });
    window.addEventListener('etunisia:post-created', onCreated);
    return () => window.removeEventListener('etunisia:post-created', onCreated);
  }, [queryClient]);

  // Intersection observer for infinite scroll
  useEffect(() => {
    if (loadMoreRef.current) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        },
        { threshold: 0.1 },
      );
      observerRef.current.observe(loadMoreRef.current);
    }
    return () => observerRef.current?.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const allItems = (() => {
    const pages = data?.pages || [];
    const out: any[] = [];
    const seen = new Set<string>();
    for (const page of pages) {
      const arr = Array.isArray(page?.data) ? page.data : Array.isArray(page) ? page : [];
      for (const it of arr) {
        if (!it) continue;
        const id = String((it as any).id || '');
        if (!id || seen.has(id)) continue;
        seen.add(id);
        out.push(it);
      }
    }
    return out;
  })();
  const isAuth = _useAuthStoreFeed((s) => !!s.token) || !!localStorage.getItem('etunisia_token');
  const user = _useAuthStoreFeed((s) => s.user);

  const openComposer = () => {
    document.dispatchEvent(new CustomEvent('etunisia:open-post-modal'));
  };

  return (
    <div className="compass-shell animate-fade-in">
      {/* Top band: welcome/hero spans full width */}
      <div className="compass-top">
        <WelcomeStrip />
        {isAuth && <OnboardingBanner />}
        <TunisiaPulse />
        <MoodCompass />
      </div>

      {/* 2-column body: wide feed + sticky discovery panel */}
      <div className="compass-body">
        <div className="compass-feed">
          <StoriesStrip />
          {isAuth && <ComposeBox user={user} />}
          <div className="compass-discovery-mobile">
            <FeaturedPlaces />
            <DiscoverTrips />
            <TrendingHashtags />
            <SuggestedUsers />
          </div>

      {/* Sort bar */}
      <div className="flex items-center gap-2 p-1 bg-surface rounded-xl shadow-sm sticky top-20 z-10 overflow-x-auto scrollbar-hide">
        {(Object.keys(sortLabels) as SortType[]).map((key) => {
          if ((key === 'mine' || key === 'following') && !isAuth) return null;
          return (
            <button
              key={key}
              onClick={() => setSort(key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                sort === key
                  ? 'bg-brand text-white shadow-sm'
                  : 'text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              {sortLabels[key].icon}
              {sortLabels[key].label}
            </button>
          );
        })}
        <button
          onClick={() => queryClient.invalidateQueries({ queryKey: ['feed'] })}
          className="ml-auto p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5"
          title="Refresh feed"
          aria-label="Refresh feed"
        >
          <RefreshCcw size={14} />
        </button>
      </div>

      {/* Posts + ads */}
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => <PostCardSkeleton key={i} />)
          ) : isError ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Failed to load feed</p>
              <Button
                variant="primary"
                className="mt-4"
                onClick={() => queryClient.invalidateQueries({ queryKey: ['feed'] })}
              >
                Retry
              </Button>
            </div>
          ) : allItems.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-3">
                {sort === 'mine' ? "You haven't posted anything yet." : 'No posts yet.'}
              </p>
              {isAuth && (
                <Button variant="primary" onClick={openComposer} leftIcon={<Plus size={16} />}>
                  Create your first post
                </Button>
              )}
            </div>
          ) : (
            allItems.map((item: any) =>
              item.type === 'ad'
                ? <AdCard key={item.id} ad={item} />
                : <PostCard key={item.id} post={item} />
            )
          )}
        </AnimatePresence>
      </div>

      {/* Load more trigger */}
      <div ref={loadMoreRef} className="py-4 text-center">
        {isFetchingNextPage && (
          <div className="space-y-3">
            <PostCardSkeleton />
            <PostCardSkeleton />
          </div>
        )}
        {!hasNextPage && allItems.length > 0 && (
          <p className="text-sm text-muted-foreground">You've reached the end!</p>
        )}
      </div>
        </div>{/* /compass-feed */}

        {/* Right sticky panel — single tabbed widget instead of a stack of cards. */}
        <TunisiaNowPanel />
      </div>{/* /compass-body */}
    </div>
  );
}
