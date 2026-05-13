import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowBigUp,
  ArrowBigDown,
  MessageCircle,
  Share2,
  Bookmark,
  MapPin,
  Clock,
  TrendingUp,
  Flame,
  Navigation,
} from 'lucide-react';
import { api } from '../../shared/api';
import type { Post } from '../../shared/types/api';
import { Card, CardContent } from '../components/Card';
import { Avatar } from '../components/Avatar';
import { Button } from '../components/Button';
import { Skeleton, PostCardSkeleton } from '../components/Skeleton';
import { formatNumber, formatDate } from '../lib/utils';
import { useAuthStore } from '../stores/auth-store';
import { useUIStore } from '../stores/ui-store';

type SortType = 'hot' | 'new' | 'top' | 'nearby';

const sortLabels: Record<SortType, { label: string; icon: React.ReactNode }> = {
  hot: { label: 'Hot', icon: <Flame size={14} /> },
  new: { label: 'New', icon: <Clock size={14} /> },
  top: { label: 'Top', icon: <TrendingUp size={14} /> },
  nearby: { label: 'Nearby', icon: <Navigation size={14} /> },
};

function PostCard({
  post,
  onVote,
}: {
  post: Post;
  onVote: (id: string, direction: 'up' | 'down') => void;
}) {
  const [voteState, setVoteState] = useState<'up' | 'down' | null>(null);
  const [localScore, setLocalScore] = useState(post.upvotes - post.downvotes);
  const showToast = useUIStore((s) => s.showToast);

  const handleVote = (direction: 'up' | 'down') => {
    if (voteState === direction) {
      setVoteState(null);
      setLocalScore((prev) => (direction === 'up' ? prev - 1 : prev + 1));
    } else {
      const oldVote = voteState;
      setVoteState(direction);
      if (oldVote) {
        setLocalScore((prev) => (direction === 'up' ? prev + 2 : prev - 2));
      } else {
        setLocalScore((prev) => (direction === 'up' ? prev + 1 : prev - 1));
      }
    }
    onVote(post.id, direction);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card hover className="group">
        <CardContent className="p-0">
          <div className="flex">
            {/* Vote sidebar */}
            <div className="flex flex-col items-center gap-1 p-3 bg-black/[0.02] dark:bg-white/[0.02] border-r border-black/5 dark:border-white/5">
              <button
                onClick={() => handleVote('up')}
                className={`p-1 rounded-lg transition-colors ${
                  voteState === 'up'
                    ? 'text-orange-500 bg-orange-500/10'
                    : 'text-gray-400 hover:text-orange-500 hover:bg-orange-500/10'
                }`}
              >
                <ArrowBigUp size={24} />
              </button>
              <span
                className={`text-sm font-bold ${
                  voteState === 'up'
                    ? 'text-orange-500'
                    : voteState === 'down'
                      ? 'text-indigo-500'
                      : 'text-foreground'
                }`}
              >
                {formatNumber(localScore)}
              </span>
              <button
                onClick={() => handleVote('down')}
                className={`p-1 rounded-lg transition-colors ${
                  voteState === 'down'
                    ? 'text-indigo-500 bg-indigo-500/10'
                    : 'text-gray-400 hover:text-indigo-500 hover:bg-indigo-500/10'
                }`}
              >
                <ArrowBigDown size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 p-4 min-w-0">
              {/* Header */}
              <div className="flex items-center gap-2 mb-2">
                <Avatar
                  src={post.author?.avatar}
                  fallback={post.author?.fullName}
                  size="sm"
                />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium truncate">
                    {post.author?.fullName || 'Anonymous'}
                  </span>
                  <span className="text-xs text-muted-foreground ml-2">
                    {formatDate(post.createdAt)}
                  </span>
                </div>
                {post.category && (
                  <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-brand/10 text-brand">
                    {post.category}
                  </span>
                )}
              </div>

              {/* Title & Body */}
              <h3 className="text-base font-semibold mb-1 leading-snug">
                {post.title}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
                {post.body}
              </p>

              {/* Images */}
              {post.images && post.images.length > 0 && (
                <div className="mb-3 rounded-xl overflow-hidden">
                  <img
                    src={post.images[0]}
                    alt={post.title}
                    className="w-full h-48 object-cover"
                    loading="lazy"
                  />
                </div>
              )}

              {/* Location */}
              {post.location && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
                  <MapPin size={12} />
                  {post.location}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" leftIcon={<MessageCircle size={14} />}>
                  {formatNumber(post.commentCount)}
                </Button>
                <Button variant="ghost" size="sm" leftIcon={<Share2 size={14} />}>
                  Share
                </Button>
                <Button variant="ghost" size="sm" leftIcon={<Bookmark size={14} />}>
                  Save
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
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
    queryKey: ['posts', sort],
    queryFn: async ({ pageParam = 1 }) => {
      // For now, return mock data since backend doesn't have posts endpoint yet
      // This will be replaced with actual API call when backend adds social feed
      const mockPosts: Post[] = Array.from({ length: 10 }).map((_, i) => ({
        id: `post-${pageParam}-${i}`,
        title: `Amazing discovery in ${['Sidi Bou Said', 'Carthage', 'Djerba', 'Douz', 'Tabarka'][i % 5]}!`,
        body: 'Just visited this incredible hidden gem. The views are absolutely breathtaking and the locals are so welcoming. Highly recommend adding this to your itinerary!',
        category: ['Culture', 'Adventure', 'Food & Drink', 'Historical', 'Beaches'][i % 5],
        location: ['Sidi Bou Said', 'Carthage', 'Djerba', 'Douz', 'Tabarka'][i % 5],
        images: i % 3 === 0 ? ['https://images.unsplash.com/photo-1539020140153-e479b8c22e70?w=800'] : [],
        authorId: `user-${i}`,
        author: {
          id: `user-${i}`,
          fullName: ['Yasmine K.', 'Marco R.', 'Sarah C.', 'David P.', 'Amina T.', 'Emma L.'][i % 6],
          avatar: `https://api.dicebear.com/9.x/thumbs/svg?seed=${i}`,
        },
        upvotes: Math.floor(Math.random() * 500) + 50,
        downvotes: Math.floor(Math.random() * 20),
        commentCount: Math.floor(Math.random() * 100) + 5,
        createdAt: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString(),
      }));

      return {
        data: mockPosts,
        meta: { page: pageParam, limit: 10, total: 100, totalPages: 10 },
      };
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.meta.page >= lastPage.meta.totalPages) return undefined;
      return lastPage.meta.page + 1;
    },
    initialPageParam: 1,
  });

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

  const voteMutation = useMutation({
    mutationFn: async ({ id, direction }: { id: string; direction: 'up' | 'down' }) => {
      // Will be replaced with actual API
      return { id, direction };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });

  const handleVote = useCallback(
    (id: string, direction: 'up' | 'down') => {
      voteMutation.mutate({ id, direction });
    },
    [voteMutation],
  );

  const allPosts = data?.pages.flatMap((page) => page.data) || [];

  return (
    <div className="max-w-2xl mx-auto space-y-4 animate-fade-in">
      {/* Sort bar */}
      <div className="flex items-center gap-2 p-1 bg-surface rounded-xl shadow-sm sticky top-20 z-10">
        {(Object.keys(sortLabels) as SortType[]).map((key) => (
          <button
            key={key}
            onClick={() => setSort(key)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              sort === key
                ? 'bg-brand text-white shadow-sm'
                : 'text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5'
            }`}
          >
            {sortLabels[key].icon}
            {sortLabels[key].label}
          </button>
        ))}
      </div>

      {/* Posts */}
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => <PostCardSkeleton key={i} />)
          ) : isError ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Failed to load posts</p>
              <Button
                variant="primary"
                className="mt-4"
                onClick={() => queryClient.invalidateQueries({ queryKey: ['posts'] })}
              >
                Retry
              </Button>
            </div>
          ) : (
            allPosts.map((post) => (
              <PostCard key={post.id} post={post} onVote={handleVote} />
            ))
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
        {!hasNextPage && allPosts.length > 0 && (
          <p className="text-sm text-muted-foreground">You've reached the end!</p>
        )}
      </div>
    </div>
  );
}
