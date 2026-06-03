import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { goTo, absoluteUrl } from '../../router';
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
  Repeat,
  Languages,
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
import { TierBadge } from '../components/TierBadge';
import { PullToRefresh } from '../components/PullToRefresh';
import { TunisiaNowPanel } from '../components/TunisiaNowPanel';
import { PostImageCarousel } from '../components/PostImageCarousel';
import { Reveal } from '../components/Reveal';
import { Plus, User as UserIcon, RefreshCcw, Users as UsersIcon, Sparkles, Compass } from 'lucide-react';
import { useAuthStore as _useAuthStoreFeed } from '../stores/auth-store';
import { requireAuth } from '../../ui-utils';

type SortType = 'foryou' | 'hot' | 'new' | 'top' | 'following' | 'mine';

const sortLabels: Record<SortType, { label: string; icon: React.ReactNode }> = {
  foryou:    { label: 'For You',   icon: <Sparkles size={14} /> },
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

  const [repostedLocal, setRepostedLocal] = useState(() => {
    try {
      const map = JSON.parse(localStorage.getItem('etunisia_reposted_items') || '{}');
      return !!map['post:' + post.id];
    } catch {
      return false;
    }
  });
  const [repostCount, setRepostCount] = useState<number>((post as any).repostCount || 0);

  // AI "translate to read" — translates the body in place, with a toggle back to the original.
  const [translated, setTranslated] = useState<string | null>(null);
  const [showOriginal, setShowOriginal] = useState(false);
  const [translating, setTranslating] = useState(false);
  const handleTranslate = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (translated) { setShowOriginal((v) => !v); return; }
    if (!post.body?.trim()) return;
    setTranslating(true);
    try {
      const r: any = await api.aiAssist({ text: post.body, action: 'translate', targetLang: 'en' });
      if (r?.mock) showToast('Translation needs AI to be configured.', 'info');
      else if (r?.text) { setTranslated(r.text); setShowOriginal(false); }
    } catch (err: any) {
      showToast(err?.message || 'Could not translate right now.', 'error');
    } finally {
      setTranslating(false);
    }
  };
  const displayBody = translated && !showOriginal ? translated : post.body;

  // For review items, navigate to the underlying place; for real posts, the post itself.
  const detailHash =
    (post as any).type === 'review' && (post as any).place?.id
      ? `#/place/${(post as any).place.id}`
      : `#/post/${post.id}`;

  const handleComment = () => {
    goTo(detailHash);
  };

  const handleShare = async () => {
    const url = absoluteUrl(detailHash);
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

  const handleRepost = async () => {
    if (!requireAuth('repost')) return;
    const was = repostedLocal;
    const persist = (on: boolean) => {
      try {
        const map = JSON.parse(localStorage.getItem('etunisia_reposted_items') || '{}');
        if (on) map['post:' + post.id] = true; else delete map['post:' + post.id];
        localStorage.setItem('etunisia_reposted_items', JSON.stringify(map));
      } catch {}
    };
    // Optimistic toggle
    setRepostedLocal(!was);
    setRepostCount((c) => Math.max(0, c + (was ? -1 : 1)));
    persist(!was);
    try {
      if (was) {
        await api.undoRepost(post.id);
        showToast('Repost removed', 'info');
      } else {
        await api.repostPost(post.id);
        showToast('Reposted to your profile', 'success');
      }
    } catch (err: any) {
      // Revert on failure
      setRepostedLocal(was);
      setRepostCount((c) => Math.max(0, c + (was ? 1 : -1)));
      persist(was);
      showToast(err?.message || (was ? 'Could not undo repost' : 'Repost failed'), 'error');
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
  const authorPlan = (post.author as any)?.plan;
  const isProAuthor = authorPlan === 'premium' || authorPlan === 'business' || authorPlan === 'admin';
  const images: string[] = Array.isArray(post.images) ? post.images.filter(Boolean) : [];

  return (
    <motion.article
      className={`post-card-v2${isProAuthor ? ' is-pro' : ''}`}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
    >
      <header className="post-card-v2-head">
        <a
          className="post-card-v2-author"
          href={authorHref}
          onClick={(e) => { if (!post.author?.id) e.preventDefault(); }}
          data-user-id={post.author?.id || undefined}
          data-user-name={post.author?.fullName || undefined}
          data-user-avatar={post.author?.avatar || undefined}
          data-user-handle={authorHandle || undefined}
          data-user-plan={authorPlan || undefined}
        >
          <Avatar
            src={post.author?.avatar}
            fallback={post.author?.fullName}
            size="sm"
          />
          <div className="post-card-v2-byline">
            <strong>
              {post.author?.fullName || 'Anonymous'}
              <TierBadge plan={(post.author as any)?.plan} role={(post.author as any)?.role} size="xs" />
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
        {post.body && <p className="post-card-v2-body">{displayBody}</p>}
      </a>
      {post.body && post.body.trim().length > 0 && (
        <button
          type="button"
          onClick={handleTranslate}
          disabled={translating}
          className="post-card-v2-translate inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline disabled:opacity-50 mt-0.5 ml-0.5"
        >
          <Languages size={12} />
          {translating ? 'Translating…' : translated && !showOriginal ? 'Show original' : 'Translate'}
        </button>
      )}

      {(post as any).videoUrl && (
        <a className="post-card-v2-media post-card-v2-media-1" href={detailHash} aria-label="Open post">
          <video
            src={(post as any).videoUrl}
            muted
            playsInline
            preload="metadata"
            className="w-full h-full object-cover rounded-xl"
          />
          <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/50 text-white text-xs font-medium">
            VIDEO
          </span>
        </a>
      )}
      {images.length > 0 && !(post as any).videoUrl && (
        <PostImageCarousel images={images} onOpen={() => goTo(detailHash)} />
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
        <button className={`post-card-v2-action ${repostedLocal ? 'is-active' : ''}`} onClick={handleRepost} aria-label={repostedLocal ? 'Undo repost' : 'Repost'}>
          <Repeat size={15} />
          <span>{formatNumber(repostCount)}</span>
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
          <motion.span
            animate={isSavedLocal ? { scale: [1, 1.35, 1] } : { scale: 1 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            style={{ display: 'inline-flex' }}
          >
            <Bookmark size={15} className={isSavedLocal ? 'fill-current' : ''} />
          </motion.span>
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

/**
 * Segmented-pill sort bar that becomes elevated when the page scrolls past it.
 * Replaces the old Tailwind-utility sort row with a token-driven, sticky control
 * that matches the rest of the redesign.
 */
function FeedSortBar({
  sort,
  onSort,
  isAuth,
  onRefresh,
  total,
}: {
  sort: SortType;
  onSort: (s: SortType) => void;
  isAuth: boolean;
  onRefresh: () => void;
  total: number;
}) {
  const railRef = useRef<HTMLDivElement | null>(null);
  const refreshBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    // Sentinel a pixel above the rail tells us when it sticks.
    const sentinel = document.createElement('div');
    sentinel.style.cssText = 'position:absolute;top:-1px;height:1px;width:1px;';
    rail.parentElement?.insertBefore(sentinel, rail);
    const obs = new IntersectionObserver(([entry]) => {
      rail.classList.toggle('is-scrolled', !entry.isIntersecting);
    }, { threshold: [0] });
    obs.observe(sentinel);
    return () => { obs.disconnect(); sentinel.remove(); };
  }, []);

  const handleRefresh = () => {
    const btn = refreshBtnRef.current;
    if (btn) {
      btn.classList.add('is-spinning');
      setTimeout(() => btn.classList.remove('is-spinning'), 500);
    }
    onRefresh();
  };

  return (
    <div ref={railRef} className="feed-sort-rail" role="tablist" aria-label="Feed sort">
      {(Object.keys(sortLabels) as SortType[]).map((key) => {
        if ((key === 'mine' || key === 'following') && !isAuth) return null;
        const isActive = sort === key;
        return (
          <button
            key={key}
            role="tab"
            aria-selected={isActive}
            onClick={() => onSort(key)}
            className={`feed-sort-pill${isActive ? ' is-active' : ''}`}
          >
            {sortLabels[key].icon}
            {sortLabels[key].label}
          </button>
        );
      })}
      {total > 0 && (
        <span className="feed-sort-meta" aria-live="polite">{total} posts</span>
      )}
      <button
        ref={refreshBtnRef}
        onClick={handleRefresh}
        className="feed-sort-refresh"
        title="Refresh feed"
        aria-label="Refresh feed"
      >
        <RefreshCcw size={14} />
      </button>
    </div>
  );
}

export default function FeedPage() {
  const [sort, setSort] = useState<SortType>('foryou');
  const queryClient = useQueryClient();
  const showToast = useUIStore((s) => s.showToast);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
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
          // Bail if the last page request failed (e.g. 429 rate limit). Without this,
          // the sentinel stays in view, the effect re-runs, and we hammer the API in a
          // tight loop — which is exactly what trips the throttler.
          if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage && !isFetchNextPageError) {
            fetchNextPage();
          }
        },
        { threshold: 0.1 },
      );
      observerRef.current.observe(loadMoreRef.current);
    }
    return () => observerRef.current?.disconnect();
  }, [hasNextPage, isFetchingNextPage, isFetchNextPageError, fetchNextPage]);

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
            <Reveal><FeaturedPlaces /></Reveal>
            <Reveal delay={0.06}><DiscoverTrips /></Reveal>
            <Reveal delay={0.12}><TrendingHashtags /></Reveal>
            <Reveal delay={0.18}><SuggestedUsers /></Reveal>
          </div>

      {/* Sort bar — segmented pill control with sliding refresh affordance */}
      <FeedSortBar
        sort={sort}
        onSort={setSort}
        isAuth={isAuth}
        onRefresh={() => queryClient.invalidateQueries({ queryKey: ['feed'] })}
        total={allItems.length}
      />

      {/* Posts + ads */}
      <PullToRefresh onRefresh={async () => {
        await queryClient.invalidateQueries({ queryKey: ['feed'] });
        await queryClient.refetchQueries({ queryKey: ['feed'] });
      }}>
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => <PostCardSkeleton key={i} />)
          ) : isError ? (
            <div className="feed-empty">
              <div className="feed-empty-icon"><RefreshCcw size={28} /></div>
              <h3>Couldn't load the feed</h3>
              <p>Check your connection and try again — your draft posts are safe.</p>
              <Button
                variant="primary"
                onClick={() => queryClient.invalidateQueries({ queryKey: ['feed'] })}
              >
                Retry
              </Button>
            </div>
          ) : allItems.length === 0 ? (
            <div className="feed-empty">
              <div className="feed-empty-icon">
                {sort === 'mine' ? <Sparkles size={28} /> : <Compass size={28} />}
              </div>
              <h3>
                {sort === 'mine'
                  ? 'Your story starts here'
                  : sort === 'following'
                    ? 'Follow people to see them here'
                    : 'No posts yet — be first'}
              </h3>
              <p>
                {sort === 'mine'
                  ? 'Share a place, a tip, or a photo from your last trip. Other travelers will see it on Hot and Top.'
                  : sort === 'following'
                    ? 'Find local guides and travelers on the Explore tab, then come back here to see only what they share.'
                    : 'The community is just warming up. Be the first to share a moment from Tunisia and start a thread.'}
              </p>
              {isAuth && (
                <Button variant="primary" onClick={openComposer} leftIcon={<Plus size={16} />}>
                  {sort === 'mine' ? 'Create your first post' : 'Share something'}
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
      </PullToRefresh>

      {/* Load more trigger */}
      <div ref={loadMoreRef} className="py-4 text-center">
        {isFetchingNextPage && (
          <div className="space-y-3">
            <PostCardSkeleton />
            <PostCardSkeleton />
          </div>
        )}
        {isFetchNextPageError && !isFetchingNextPage && (
          <button
            type="button"
            onClick={() => fetchNextPage()}
            className="px-5 py-2 rounded-full bg-surface border border-black/5 dark:border-white/10 text-sm font-medium"
          >
            Couldn't load more — tap to retry
          </button>
        )}
        {!hasNextPage && allItems.length > 0 && (
          <div className="feed-end">
            <span className="feed-end-mark">You've reached the end</span>
          </div>
        )}
      </div>
        </div>{/* /compass-feed */}

        {/* Right sticky panel — single tabbed widget instead of a stack of cards. */}
        <TunisiaNowPanel />
      </div>{/* /compass-body */}
    </div>
  );
}
