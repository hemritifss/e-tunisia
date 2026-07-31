import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { goTo } from '../../router';
import { motion } from 'framer-motion';
import {
  MessageCircle,
  Share2,
  Bookmark,
  MapPin,
  Coins,
  Repeat,
  Languages,
  Award,
} from 'lucide-react';
import { openDonateModal } from '../../donate-modal';
import { api, ogShareUrl } from '../../shared/api';
import { track } from '../../analytics';
import { useT } from '../../i18n/useT';
import type { Post } from '../../shared/types/api';
import { Card, CardContent } from '../components/Card';
import { Avatar } from '../components/Avatar';
import { Button } from '../components/Button';
import { Skeleton, PostCardSkeleton } from '../components/Skeleton';
import { Swap } from '../components/Swap';
import { formatNumber, formatDate } from '../lib/utils';
import { useAuthStore } from '../stores/auth-store';
import { useUIStore } from '../stores/ui-store';

import { StoriesStrip } from '../components/StoriesStrip';
import { AdCard } from '../components/AdCard';
import { ComposeBox } from '../components/ComposeBox';
import { SuggestedUsers } from '../components/SuggestedUsers';
import { TrendingHashtags } from '../components/TrendingHashtags';
import { ReactionPicker } from '../components/ReactionPicker';
import { OnboardingBanner } from '../components/OnboardingBanner';
import { FeaturedPlaces } from '../components/FeaturedPlaces';
import { DiscoverTrips } from '../components/DiscoverTrips';
import { WelcomeStrip } from '../components/WelcomeStrip';
import { MoodCompass } from '../components/MoodCompass';
import { TierBadge } from '../components/TierBadge';
import { PullToRefresh } from '../components/PullToRefresh';
import { TunisiaNowPanel } from '../components/TunisiaNowPanel';
import { ActiveConversationsRail } from '../components/ActiveConversations';
import { PostImageCarousel } from '../components/PostImageCarousel';
import { StarRating } from '../components/StarRating';
import { DiscoveryCard } from '../components/DiscoveryCard';
import { Reveal } from '../components/Reveal';
import { SponsorsStrip } from '../components/SponsorsStrip';
import { Plus, RefreshCcw, Sparkles, Compass } from 'lucide-react';
import { useAuthStore as _useAuthStoreFeed } from '../stores/auth-store';
import { requireAuth } from '../../ui-utils';

type SortType = 'foryou' | 'hot' | 'new' | 'top' | 'following' | 'mine';

/** Tab order. Labels resolve through i18n at render time (see FeedSortBar). */
const SORT_VALUES: SortType[] = ['foryou', 'hot', 'new', 'top', 'following', 'mine'];

// Hover hints: one-word tab labels don't explain what each ranking means.
const sortHints: Record<SortType, string> = {
  foryou:    'Ranked for you — your interests, follows, and what’s rising',
  hot:       'Gaining reactions right now',
  new:       'Most recent first',
  top:       'All-time community favorites',
  following:'Only people you follow',
  mine:      'Your own posts',
};

function PostCard({ post, priority = false }: { post: Post; priority?: boolean }) {
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
    // Share the OG route (crawler-readable preview) — not the raw SPA URL.
    const url =
      (post as any).type === 'review' && (post as any).place?.id
        ? ogShareUrl(`place/${encodeURIComponent((post as any).place.id)}`)
        : ogShareUrl(`post/${encodeURIComponent(post.id)}`);
    track('share', { kind: (post as any).type === 'review' ? 'place' : 'post' });
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
        track('save', { kind: 'post' });
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

  // Reviews are shaped as feed cards but have no reaction/comment system of their
  // own — the honest engagement signal is the star rating. Render review cards with
  // a rating-first action row instead of the (server-side broken) react/comment/repost.
  const isReview = (post as any).type === 'review';
  const reviewRating = Number((post as any).rating) || 0;

  // Auto-generated achievement cards (badge/level earned) — celebratory styling,
  // still reactable/commentable by others (they're real posts).
  const isAchievement = (post as any).kind === 'achievement';
  const achievementMeta = (post as any).meta || null;
  const achievementBadges: Array<{ label: string; description?: string }> =
    Array.isArray(achievementMeta?.badges) ? achievementMeta.badges : [];

  return (
    <motion.article
      className={`post-card-v2${isProAuthor ? ' is-pro' : ''}${isAchievement ? ' is-achievement' : ''}`}
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
          <strong className="post-card-v2-byline">
            {post.author?.fullName || 'Anonymous'}
            <TierBadge plan={(post.author as any)?.plan} role={(post.author as any)?.role} size="xs" />
          </strong>
        </a>
        {/* Time and place are real values, so they carry the mono treatment.
            Place sits in the byline on desktop and under the media on mobile,
            where the 3a head has no room for it. */}
        <span className="post-card-v2-meta">· {formatDate(post.createdAt)}</span>
        {post.location && <span className="post-card-v2-place">· {post.location}</span>}
        {post.category && (
          <span className="post-card-v2-category">{post.category}</span>
        )}
      </header>

      {isAchievement ? (
        <div className="post-card-v2-achievement">
          <div className="pc-achv-medal" aria-hidden="true"><Award size={22} /></div>
          <div className="pc-achv-body">
            <h3 className="pc-achv-title">{post.title}</h3>
            {achievementBadges.length > 0 && (
              <ul className="pc-achv-badges">
                {achievementBadges.map((b, i) => (
                  <li key={i} className="pc-achv-badge">{b.label}</li>
                ))}
              </ul>
            )}
            {typeof achievementMeta?.points === 'number' && achievementMeta.points > 0 && (
              <span className="pc-achv-xp">+{achievementMeta.points} XP</span>
            )}
          </div>
        </div>
      ) : (
        <a className="post-card-v2-content" href={detailHash}>
          {post.title && <h3 className="post-card-v2-title">{post.title}</h3>}
          {isReview && reviewRating > 0 && (
            <div className="post-card-v2-review-rating" aria-label={`Rated ${reviewRating} out of 5`}>
              <StarRating rating={reviewRating} size={15} />
            </div>
          )}
          {post.body && <p className="post-card-v2-body">{displayBody}</p>}
        </a>
      )}
      {post.body && post.body.trim().length > 0 && (
        <button
          type="button"
          onClick={handleTranslate}
          disabled={translating}
          className="post-card-v2-translate"
        >
          <Languages size={12} />
          {translating ? 'Translating…' : translated && !showOriginal ? 'Show original' : 'Translate'}
        </button>
      )}

      {(post as any).videoUrl && (
        <a className="post-card-v2-media post-card-v2-media-1" href={detailHash} aria-label="Open post" data-arch-reveal>
          <video
            src={(post as any).videoUrl}
            muted
            playsInline
            preload="metadata"
          />
          <span className="post-card-v2-media-tag">VIDEO</span>
        </a>
      )}
      {images.length > 0 && !(post as any).videoUrl && (
        <PostImageCarousel images={images} onOpen={() => goTo(detailHash)} priority={priority} />
      )}

      {post.location && (
        <div className="post-card-v2-loc">
          <MapPin size={11} /> {post.location}
        </div>
      )}

      <footer className="post-card-v2-actions">
        {!isReview && (
          <>
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
            {/* Zero counts are noise — show the number only once it exists. */}
            <button className="post-card-v2-action pc-act-comment" onClick={handleComment} aria-label="Comments">
              <MessageCircle size={17} />
              {Number(post.commentCount) > 0 && <span>{formatNumber(post.commentCount)}</span>}
            </button>
            <button className={`post-card-v2-action pc-act-repost ${repostedLocal ? 'is-active' : ''}`} onClick={handleRepost} aria-label={repostedLocal ? 'Undo repost' : 'Repost'}>
              <Repeat size={17} />
              {Number(repostCount) > 0 && <span>{formatNumber(repostCount)}</span>}
            </button>
          </>
        )}
        {isReview && (
          <a className="post-card-v2-action pc-act-review" href={detailHash} aria-label="Read review on place page">
            <MapPin size={17} />
            <span>Visit place</span>
          </a>
        )}
        {/* Verbs sit opposite the counts; the rule is CSS-side so RTL mirrors. */}
        <button className="post-card-v2-action pc-act-share" onClick={handleShare} aria-label="Share">
          <Share2 size={17} />
          <span>Share</span>
        </button>
        <button
          className={`post-card-v2-action pc-act-save ${isSavedLocal ? 'is-active' : ''}`}
          onClick={handleSave}
          aria-label={isSavedLocal ? 'Unsave' : 'Save'}
        >
          <Bookmark size={17} className={isSavedLocal ? 'fill-current' : ''} />
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
            aria-label="Tip the author"
            title="Send a small thank-you (TND) to the author"
          >
            <Coins size={17} />
          </button>
        )}
      </footer>
    </motion.article>
  );
}

/**
 * Underline tab rail. It is deliberately not sticky: the feed reads as one
 * document, and a floating pill bar re-introduces the card chrome the rest of
 * this page just shed.
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
  const refreshBtnRef = useRef<HTMLButtonElement | null>(null);
  const t = useT();

  const handleRefresh = () => {
    const btn = refreshBtnRef.current;
    if (btn) {
      btn.classList.add('is-spinning');
      setTimeout(() => btn.classList.remove('is-spinning'), 500);
    }
    onRefresh();
  };

  return (
    <div className="feed-tabs" role="tablist" aria-label="Feed sort">
      {SORT_VALUES.map((key) => {
        if ((key === 'mine' || key === 'following') && !isAuth) return null;
        const isActive = sort === key;
        return (
          <button
            key={key}
            role="tab"
            aria-selected={isActive}
            onClick={() => onSort(key)}
            className={`feed-tab${isActive ? ' is-active' : ''}`}
            title={sortHints[key]}
          >
            {t(`sort.${key}`)}
          </button>
        );
      })}
      {total > 0 && (
        <span className="feed-tabs-count" aria-live="polite">{total} {t('sort.posts')}</span>
      )}
      <button
        ref={refreshBtnRef}
        onClick={handleRefresh}
        className="feed-tabs-refresh"
        title="Refresh feed"
        aria-label="Refresh feed"
      >
        <RefreshCcw size={14} />
      </button>
    </div>
  );
}

/** Sort tab lives in the URL (?sort=hot) so refresh and share keep context. */
function sortFromUrl(): SortType {
  try {
    const v = new URLSearchParams(window.location.search).get('sort') as SortType | null;
    return v && SORT_VALUES.includes(v) ? v : 'foryou';
  } catch {
    return 'foryou';
  }
}

export default function FeedPage() {
  const [sort, setSortState] = useState<SortType>(sortFromUrl);
  const setSort = (s: SortType) => {
    setSortState(s);
    try {
      const url = new URL(window.location.href);
      if (s === 'foryou') url.searchParams.delete('sort');
      else url.searchParams.set('sort', s);
      window.history.replaceState(window.history.state, '', url);
    } catch { /* URL update is best-effort */ }
  };
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
      {/* The page had no h1 at all — headings started at h3/h4. */}
      <h1 className="visually-hidden">e-Tunisia community feed</h1>
      {/* Top band: welcome/hero spans full width */}
      <div className="compass-top">
        <WelcomeStrip />
        {isAuth && <OnboardingBanner />}
        <MoodCompass />
        <div className="feed-zellige" aria-hidden="true" />
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
            <Reveal delay={0.24}><SponsorsStrip /></Reveal>
          </div>

      {/* Sort rail — underline tabs above the reading column */}
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
      {/* Each post owns its own bottom rule and spacing, so the list itself
          adds none. AnimatePresence/popLayout is deliberately absent: pulling
          an exiting item out of flow makes the rules below it jump. */}
      <div className="feed-list">
          <Swap
            loading={isLoading}
            skeleton={<>{Array.from({ length: 3 }).map((_, i) => <PostCardSkeleton key={i} />)}</>}
          >
          {isError ? (
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
            allItems.map((item: any, i: number) =>
              item.type === 'ad'
                ? <AdCard key={item.id} ad={item} />
                : item.type === 'discovery'
                  ? <DiscoveryCard key={item.id} item={item} />
                  : <PostCard key={item.id} post={item} priority={i === 0} />
            )
          )}
          </Swap>
      </div>
      </PullToRefresh>

      {/* Load more trigger. Must stay a plain in-flow block: the infinite-scroll
          IntersectionObserver watches this element, not a class. */}
      <div ref={loadMoreRef} className="feed-load-more">
        {isFetchingNextPage && (
          <div className="feed-list">
            <PostCardSkeleton />
            <PostCardSkeleton />
          </div>
        )}
        {isFetchNextPageError && !isFetchingNextPage && (
          <button
            type="button"
            onClick={() => fetchNextPage()}
            className="feed-retry"
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

        {/* Right sticky column: three ruled sections + quick DMs. The
            conversations rail is a shipped messenger surface and it fills the
            space below the sections. */}
        <aside className="compass-rail">
          <TunisiaNowPanel />
          <ActiveConversationsRail />
        </aside>
      </div>{/* /compass-body */}
    </div>
  );
}
