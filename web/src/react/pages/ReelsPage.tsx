import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { goTo, absoluteUrl } from '../../router';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Volume2,
  VolumeX,
  MapPin,
  X,
  ChevronUp,
  ChevronDown,
  Music,
} from 'lucide-react';
import { api } from '../../shared/api';
import { Avatar } from '../components/Avatar';
import { useAuthStore } from '../stores/auth-store';
import { useUIStore } from '../stores/ui-store';

interface ReelItem {
  id: string;
  title: string;
  body?: string;
  videoUrl: string;
  author?: { id: string; fullName: string; handle?: string | null; avatar?: string | null };
  location?: string;
  upvotes: number;
  commentCount: number;
  category?: string;
  createdAt: string;
}

function ReelCard({
  reel,
  isActive,
}: {
  reel: ReelItem;
  isActive: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const showToast = useUIStore((s) => s.showToast);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isActive) {
      video.play().catch(() => {});
    } else {
      video.pause();
      video.currentTime = 0;
    }
  }, [isActive]);

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
    api.votePost(reel.id, isLiked ? 'clear' : 'up').catch(() => {});
  };

  const handleShare = async () => {
    const url = absoluteUrl(`/post/${reel.id}`);
    try {
      await navigator.clipboard.writeText(url);
      showToast('Link copied!', 'success');
    } catch {
      showToast('Could not copy link', 'error');
    }
  };

  return (
    <div className="relative w-full h-[100dvh] bg-black overflow-hidden snap-start">
      {/* Video */}
      <video
        ref={videoRef}
        src={reel.videoUrl}
        className="absolute inset-0 w-full h-full object-cover"
        loop
        playsInline
        muted={isMuted}
        onClick={toggleMute}
      />

      {/* Gradient overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60 pointer-events-none" />

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-4 pb-12 z-10">
        <button
          onClick={() => window.history.back()}
          className="p-2 rounded-full bg-black/20 backdrop-blur-sm text-white"
        >
          <X size={20} />
        </button>
        <span className="text-white font-semibold text-sm tracking-wide">Reels</span>
        <button
          onClick={toggleMute}
          className="p-2 rounded-full bg-black/20 backdrop-blur-sm text-white"
        >
          {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>
      </div>

      {/* Right action rail */}
      <div className="absolute right-3 bottom-24 flex flex-col items-center gap-5 z-10">
        <button onClick={handleLike} className="flex flex-col items-center gap-1">
          <div className={`p-2.5 rounded-full ${isLiked ? 'text-red-500' : 'text-white'}`}>
            <Heart size={28} className={isLiked ? 'fill-current' : ''} />
          </div>
          <span className="text-white text-xs font-medium">{reel.upvotes || 0}</span>
        </button>
        <button onClick={() => setShowComments(true)} className="flex flex-col items-center gap-1">
          <div className="p-2.5 rounded-full text-white">
            <MessageCircle size={28} />
          </div>
          <span className="text-white text-xs font-medium">{reel.commentCount || 0}</span>
        </button>
        <button onClick={handleShare} className="flex flex-col items-center gap-1">
          <div className="p-2.5 rounded-full text-white">
            <Share2 size={28} />
          </div>
          <span className="text-white text-xs font-medium">Share</span>
        </button>
        <button className="flex flex-col items-center gap-1">
          <div className="p-2.5 rounded-full text-white">
            <Bookmark size={28} />
          </div>
        </button>
      </div>

      {/* Bottom info */}
      <div className="absolute left-4 right-20 bottom-8 z-10 space-y-3">
        <div className="flex items-center gap-2">
          <Avatar src={reel.author?.avatar || undefined} fallback={reel.author?.fullName} size="sm" />
          <span className="text-white font-semibold text-sm">{reel.author?.fullName || 'Anonymous'}</span>
          {reel.author?.handle && (
            <span className="text-white/60 text-xs">@{reel.author.handle}</span>
          )}
        </div>
        <p className="text-white text-sm leading-relaxed line-clamp-3">{reel.title}</p>
        {reel.body && (
          <p className="text-white/70 text-xs leading-relaxed line-clamp-2">{reel.body}</p>
        )}
        {reel.location && (
          <div className="flex items-center gap-1.5 text-white/80 text-xs">
            <MapPin size={12} />
            <span>{reel.location}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-white/60 text-xs">
          <Music size={12} />
          <span>Original sound · {reel.author?.fullName || 'Traveler'}</span>
        </div>
      </div>

      {/* Comments sheet */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="absolute inset-x-0 bottom-0 h-[60%] bg-surface rounded-t-3xl z-20 flex flex-col"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-black/5 dark:border-white/5">
              <span className="font-semibold">Comments</span>
              <button onClick={() => setShowComments(false)} className="p-1">
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <p className="text-muted-foreground text-sm text-center">Comments coming soon</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ReelsPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const showToast = useUIStore((s) => s.showToast);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ['reels'],
    queryFn: async ({ pageParam = 1 }) => {
      const res = (await api.getFeed({
        page: String(pageParam),
        limit: '10',
        sort: 'hot',
      })) as { data: any[]; meta: { page: number; totalPages: number } };
      // Filter to only video posts
      const videos = (res.data || []).filter((item: any) => item.videoUrl);
      return { data: videos, meta: res.meta };
    },
    getNextPageParam: (lastPage) => {
      const meta = (lastPage as any)?.meta;
      if (!meta || meta.page >= meta.totalPages) return undefined;
      return meta.page + 1;
    },
    initialPageParam: 1,
  });

  const reels: ReelItem[] = data?.pages.flatMap((p: any) => p.data) || [];

  // Snap scroll observer
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = Number((entry.target as HTMLElement).dataset.index);
            setActiveIndex(idx);
          }
        });
      },
      { threshold: 0.6 }
    );
    container.querySelectorAll('.snap-start').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [reels.length]);

  // Load more when near end
  useEffect(() => {
    if (activeIndex >= reels.length - 3 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [activeIndex, reels.length, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const scrollTo = (dir: 1 | -1) => {
    const container = containerRef.current;
    if (!container) return;
    const next = Math.max(0, Math.min(reels.length - 1, activeIndex + dir));
    const el = container.children[next] as HTMLElement;
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (reels.length === 0 && !isFetchingNextPage) {
    return (
      <div className="h-[100dvh] bg-black flex flex-col items-center justify-center text-white gap-4">
        <Music size={48} className="text-white/30" />
        <h2 className="text-xl font-semibold">No reels yet</h2>
        <p className="text-white/50 text-sm">Be the first to share a video from Tunisia</p>
        <button
          onClick={() => goTo('/')}
          className="px-6 py-2.5 rounded-full bg-brand text-white font-medium"
        >
          Back to feed
        </button>
      </div>
    );
  }

  return (
    <div className="relative h-[100dvh] bg-black">
      {/* Scroll container */}
      <div
        ref={containerRef}
        className="h-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
        style={{ scrollSnapType: 'y mandatory' }}
      >
        {reels.map((reel, i) => (
          <div key={reel.id} data-index={i} className="snap-start">
            <ReelCard reel={reel} isActive={i === activeIndex} />
          </div>
        ))}
        {isFetchingNextPage && (
          <div className="h-[100dvh] flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Scroll hints (desktop) */}
      <div className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 flex-col gap-2 z-20">
        <button onClick={() => scrollTo(-1)} className="p-2 rounded-full bg-black/30 text-white hover:bg-black/50">
          <ChevronUp size={20} />
        </button>
        <button onClick={() => scrollTo(1)} className="p-2 rounded-full bg-black/30 text-white hover:bg-black/50">
          <ChevronDown size={20} />
        </button>
      </div>
    </div>
  );
}
