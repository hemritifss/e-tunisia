import React, { useState, useRef, useEffect } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { goTo, absoluteUrl } from '../../router';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
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
  ArrowLeft,
  Plus,
  Trash2,
  Eye,
  Play,
} from 'lucide-react';
import { api } from '../../shared/api';
import { Avatar } from '../components/Avatar';
import { useAuthStore } from '../stores/auth-store';
import { useUIStore } from '../stores/ui-store';
import { ReelComposer } from '../components/ReelComposer';
import { RollingNumber } from '../components/RollingNumber';
import { isSaved, toggleSaved } from '../../ui-utils';

interface ReelItem {
  id: string;
  title: string;
  body?: string;
  videoUrl: string;
  author?: { id: string; fullName: string; handle?: string | null; avatar?: string | null };
  location?: string;
  upvotes: number;
  commentCount: number;
  viewCount?: number;
  category?: string;
  createdAt: string;
}

// Demo reels shown in "For You" only when there are no real video posts yet, so
// the surface is never empty (mirrors the landing page's fallback content). Real
// reels created via the composer always take precedence. Clips are reliable,
// CORS-open public samples.
const SAMPLE_REELS: ReelItem[] = [
  {
    id: 'sample-sahara', title: 'Golden hour over the Sahara dunes 🐪',
    body: 'Sunset in Douz — the gateway to the desert.',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
    author: { id: 's1', fullName: 'Sahara Diaries', handle: 'sahara', avatar: 'https://api.dicebear.com/9.x/personas/svg?seed=sahara' },
    location: 'Douz', upvotes: 1240, commentCount: 86, viewCount: 18400, createdAt: new Date().toISOString(),
  },
  {
    id: 'sample-sidibou', title: 'The blue doors of Sidi Bou Saïd 💙',
    body: 'Every corner is a postcard.',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    author: { id: 's2', fullName: 'Leïla Travels', handle: 'leila', avatar: 'https://api.dicebear.com/9.x/personas/svg?seed=leila' },
    location: 'Sidi Bou Said', upvotes: 2310, commentCount: 142, viewCount: 30200, createdAt: new Date().toISOString(),
  },
  {
    id: 'sample-medina', title: 'Street food in the Tunis Medina 🍲',
    body: 'Brik, fricassé, and mint tea on a rooftop.',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
    author: { id: 's3', fullName: 'Karim Eats', handle: 'karim', avatar: 'https://api.dicebear.com/9.x/personas/svg?seed=karimeats' },
    location: 'Tunis Medina', upvotes: 980, commentCount: 64, viewCount: 14700, createdAt: new Date().toISOString(),
  },
  {
    id: 'sample-tabarka', title: 'Diving the coast of Tabarka 🤿',
    body: 'Crystal-clear water and coral reefs up north.',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBunny.mp4',
    author: { id: 's4', fullName: 'Blue Tunisia', handle: 'bluetn', avatar: 'https://api.dicebear.com/9.x/personas/svg?seed=bluetn' },
    location: 'Tabarka', upvotes: 1530, commentCount: 97, viewCount: 21100, createdAt: new Date().toISOString(),
  },
];

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
  const [burstKey, setBurstKey] = useState(0);   // retriggers the double-tap heart burst
  const [muteFlash, setMuteFlash] = useState(0); // retriggers the center mute icon flash
  const [progress, setProgress] = useState(0);   // active video playback progress (0–100)
  const [likes, setLikes] = useState(reel.upvotes || 0);
  const [saved, setSaved] = useState(() => isSaved('reel:' + reel.id));
  const [videoError, setVideoError] = useState(false);
  const lastTap = useRef(0);
  const muteFlashTimer = useRef<number | null>(null);
  const showToast = useUIStore((s) => s.showToast);
  const reduceMotion = useReducedMotion();

  // The save button used to be inert (no handler) — wire it to the app's
  // shared local-save flag with feedback, same as Explore/Place cards.
  const handleSave = () => {
    const now = toggleSaved('reel:' + reel.id);
    setSaved(now);
    showToast(now ? 'Saved to your reels' : 'Removed from saved', now ? 'success' : undefined);
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isActive) {
      video.play().catch(() => {});
      const onTime = () => { if (video.duration) setProgress((video.currentTime / video.duration) * 100); };
      video.addEventListener('timeupdate', onTime);
      return () => video.removeEventListener('timeupdate', onTime);
    } else {
      video.pause();
      video.currentTime = 0;
      setProgress(0);
    }
  }, [isActive]);

  useEffect(() => () => { if (muteFlashTimer.current) window.clearTimeout(muteFlashTimer.current); }, []);

  const applyMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };
  const flashMute = () => setMuteFlash((k) => k + 1);
  // Rail mute button — toggle with an immediate flash.
  const toggleMute = () => { applyMute(); flashMute(); };

  const likeOn = () => {
    if (!isLiked) {
      setIsLiked(true);
      setLikes((n) => n + 1);
      api.votePost(reel.id, 'up').catch(() => {});
    }
  };

  const handleLike = () => {
    setIsLiked((v) => !v);
    setLikes((n) => Math.max(0, n + (isLiked ? -1 : 1)));
    api.votePost(reel.id, isLiked ? 'clear' : 'up').catch(() => {});
  };

  // Single tap toggles mute; a quick second tap "likes" with a heart burst.
  // The two mute toggles of a double-tap cancel out, so the mute state is preserved.
  const handleVideoTap = () => {
    applyMute();
    const now = Date.now();
    if (now - lastTap.current < 300) {
      // Double tap → like. Cancel the pending single-tap mute flash so a like never flashes.
      if (muteFlashTimer.current) { window.clearTimeout(muteFlashTimer.current); muteFlashTimer.current = null; }
      likeOn();
      setBurstKey((k) => k + 1);
      lastTap.current = 0;
    } else {
      lastTap.current = now;
      if (muteFlashTimer.current) window.clearTimeout(muteFlashTimer.current);
      muteFlashTimer.current = window.setTimeout(() => { flashMute(); muteFlashTimer.current = null; }, 280);
    }
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
        onClick={handleVideoTap}
        onError={() => setVideoError(true)}
        onLoadedData={() => setVideoError(false)}
      />

      {/* Graceful fallback — a broken video was a confusing pure-black void. */}
      {videoError && (
        <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-neutral-800 to-black text-center px-8 pointer-events-none">
          <div className="text-white/80">
            <Play size={40} className="mx-auto mb-3 opacity-60" aria-hidden="true" />
            <p className="font-semibold">{reel.title || 'Reel'}</p>
            <p className="text-sm text-white/60 mt-1">This video couldn’t be loaded.</p>
          </div>
        </div>
      )}

      {/* Gradient overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60 pointer-events-none" />

      {/* Playback progress bar */}
      <div className="absolute top-0 inset-x-0 z-40 h-[3px] bg-white/15 pointer-events-none">
        <div
          className="h-full bg-white/90"
          style={{ width: `${progress}%`, transition: 'width 0.2s linear' }}
        />
      </div>

      {/* Double-tap heart burst */}
      <AnimatePresence>
        {burstKey > 0 && !reduceMotion && (
          <motion.div
            key={burstKey}
            className="absolute inset-0 z-20 grid place-items-center pointer-events-none"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.2, opacity: 0, rotate: -12 }}
              animate={{ scale: [0.2, 1.15, 1], opacity: [0, 1, 0], rotate: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], times: [0, 0.4, 1] }}
            >
              <Heart size={120} className="text-white fill-current drop-shadow-2xl" />
            </motion.div>
            {[...Array(6)].map((_, i) => (
              <motion.span
                key={i}
                className="absolute"
                initial={{ scale: 0, x: 0, y: 0, opacity: 0 }}
                animate={{
                  scale: [0, 1, 0.6],
                  x: Math.cos((i / 6) * Math.PI * 2) * 90,
                  y: Math.sin((i / 6) * Math.PI * 2) * 90,
                  opacity: [0, 1, 0],
                }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              >
                <Heart size={22} className="text-rose-400 fill-current" />
              </motion.span>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mute / unmute center flash */}
      <AnimatePresence>
        {muteFlash > 0 && (
          <motion.div
            key={muteFlash}
            className="absolute inset-0 z-20 grid place-items-center pointer-events-none"
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: reduceMotion ? 0 : [0, 1, 0], scale: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <span className="grid place-items-center w-20 h-20 rounded-full bg-black/45 backdrop-blur-sm text-white">
              {isMuted ? <VolumeX size={34} /> : <Volume2 size={34} />}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Right action rail */}
      <div className="absolute right-3 bottom-24 flex flex-col items-center gap-5 z-10">
        <button onClick={toggleMute} aria-label={isMuted ? 'Unmute video' : 'Mute video'} aria-pressed={isMuted} className="flex flex-col items-center gap-1">
          <div className="p-2.5 rounded-full bg-black/20 backdrop-blur-sm text-white">
            {isMuted ? <VolumeX size={22} aria-hidden="true" /> : <Volume2 size={22} aria-hidden="true" />}
          </div>
        </button>
        <motion.button onClick={handleLike} aria-label={isLiked ? 'Unlike' : 'Like'} aria-pressed={isLiked} className="flex flex-col items-center gap-1" whileTap={reduceMotion ? undefined : { scale: 0.82 }}>
          <div className={`p-2.5 rounded-full ${isLiked ? 'text-red-500' : 'text-white'}`}>
            <motion.span
              key={isLiked ? 'liked' : 'unliked'}
              initial={reduceMotion ? false : { scale: 0.5 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 520, damping: 14 }}
              style={{ display: 'inline-flex' }}
            >
              <Heart size={28} aria-hidden="true" className={isLiked ? 'fill-current' : ''} />
            </motion.span>
          </div>
          <RollingNumber value={likes} className="text-white text-xs font-medium" />
        </motion.button>
        <button onClick={() => setShowComments(true)} aria-label="View comments" className="flex flex-col items-center gap-1">
          <div className="p-2.5 rounded-full text-white">
            <MessageCircle size={28} aria-hidden="true" />
          </div>
          <span className="text-white text-xs font-medium">{reel.commentCount || 0}</span>
        </button>
        <button onClick={handleShare} aria-label="Share this reel" className="flex flex-col items-center gap-1">
          <div className="p-2.5 rounded-full text-white">
            <Share2 size={28} aria-hidden="true" />
          </div>
          <span className="text-white text-xs font-medium">Share</span>
        </button>
        <button onClick={handleSave} aria-label={saved ? 'Remove from saved' : 'Save reel'} aria-pressed={saved} className="flex flex-col items-center gap-1">
          <div className={`p-2.5 rounded-full ${saved ? 'text-gold' : 'text-white'}`}>
            <Bookmark size={28} aria-hidden="true" className={saved ? 'fill-current' : ''} />
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
        {reel.body && reel.body !== reel.title && (
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

/** Vertical-feed "For You" experience (the original swipe view). */
function ForYouFeed() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isFetchNextPageError, isLoading } = useInfiniteQuery({
    queryKey: ['reels', 'foryou'],
    queryFn: async ({ pageParam = 1 }) => {
      const res = (await api.getFeed({
        page: String(pageParam),
        limit: '10',
        sort: 'hot',
      })) as { data: any[]; meta: { page: number; totalPages: number } };
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

  const realReels: ReelItem[] = data?.pages.flatMap((p: any) => p.data) || [];
  // Once the feed settles with no real videos (or it errored / backend is down),
  // fall back to demo reels so the surface is never empty.
  const reels: ReelItem[] = realReels.length > 0 ? realReels : (isLoading ? [] : SAMPLE_REELS);

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

  useEffect(() => {
    // Guard on !isFetchNextPageError so a failed page (e.g. 429) doesn't loop:
    // reels.length stays flat, the condition stays true, and we'd hammer the API.
    if (activeIndex >= reels.length - 3 && hasNextPage && !isFetchingNextPage && !isFetchNextPageError) {
      fetchNextPage();
    }
  }, [activeIndex, reels.length, hasNextPage, isFetchingNextPage, isFetchNextPageError, fetchNextPage]);

  const scrollTo = (dir: 1 | -1) => {
    const container = containerRef.current;
    if (!container) return;
    const next = Math.max(0, Math.min(reels.length - 1, activeIndex + dir));
    const el = container.children[next] as HTMLElement;
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Only empty while the first fetch is in flight — show a spinner, not the empty state
  // (a settled-but-empty feed renders SAMPLE_REELS instead).
  if (reels.length === 0) {
    return (
      <div className="h-[100dvh] grid place-items-center bg-black">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
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
        <button onClick={() => scrollTo(-1)} aria-label="Previous reel" className="p-2 rounded-full bg-black/30 text-white hover:bg-black/50">
          <ChevronUp size={20} aria-hidden="true" />
        </button>
        <button onClick={() => scrollTo(1)} aria-label="Next reel" className="p-2 rounded-full bg-black/30 text-white hover:bg-black/50">
          <ChevronDown size={20} aria-hidden="true" />
        </button>
      </div>
    </>
  );
}

/** A single tappable cell in the "My Reels" management grid. */
function MyReelCell({ reel, onDelete }: { reel: ReelItem; onDelete: (id: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play().catch(() => {}); setPlaying(true); }
    else { v.pause(); setPlaying(false); }
  };

  return (
    <div className="relative aspect-[9/16] rounded-xl overflow-hidden bg-neutral-900 ring-1 ring-white/10 group">
      <video
        ref={videoRef}
        src={reel.videoUrl}
        className="absolute inset-0 w-full h-full object-cover"
        muted
        loop
        playsInline
        preload="metadata"
        onClick={togglePlay}
      />
      {!playing && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 grid place-items-center bg-black/20"
          aria-label="Play"
        >
          <span className="grid place-items-center w-11 h-11 rounded-full bg-black/50 backdrop-blur">
            <Play size={18} className="text-white translate-x-0.5" fill="currentColor" />
          </span>
        </button>
      )}

      {/* Delete */}
      {confirming ? (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-black/70 backdrop-blur-sm px-3 text-center">
          <p className="text-white text-xs font-medium">Delete this reel?</p>
          <div className="flex gap-2">
            <button
              onClick={() => onDelete(reel.id)}
              className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs font-semibold"
            >
              Delete
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="px-3 py-1.5 rounded-lg bg-white/15 text-white text-xs font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setConfirming(true)}
          className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-black/50 backdrop-blur text-white opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
          aria-label="Delete reel"
        >
          <Trash2 size={15} />
        </button>
      )}

      {/* Stats + caption */}
      <div className="absolute inset-x-0 bottom-0 p-2.5 bg-gradient-to-t from-black/80 to-transparent pointer-events-none">
        <div className="flex items-center gap-1 text-white/90 text-xs font-medium mb-1">
          <Eye size={13} /> {reel.viewCount || 0}
          <Heart size={12} className="ml-2" /> {reel.upvotes || 0}
        </div>
        <p className="text-white text-[11px] leading-snug line-clamp-2">{reel.title}</p>
      </div>
    </div>
  );
}

/** Grid management view of the signed-in user's own reels. */
function MyReelsGrid({ onCreate }: { onCreate: () => void }) {
  const queryClient = useQueryClient();
  const showToast = useUIStore((s) => s.showToast);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteQuery({
    queryKey: ['reels', 'mine'],
    queryFn: async ({ pageParam = 1 }) => {
      const res = (await api.getMyFeed({
        page: String(pageParam),
        limit: '18',
      })) as { data: any[]; meta: { page: number; totalPages: number } };
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

  const handleDelete = async (id: string) => {
    try {
      await api.deletePost(id);
      showToast('Reel deleted', 'success');
      queryClient.invalidateQueries({ queryKey: ['reels'] });
      window.dispatchEvent(new CustomEvent('etunisia:post-created')); // refresh home feed too
    } catch (err: any) {
      showToast(err?.message || 'Could not delete the reel', 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (reels.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-white gap-4 px-8 text-center">
        <span className="grid place-items-center w-16 h-16 rounded-full bg-white/5 ring-1 ring-white/10">
          <Play size={26} className="text-white/40 translate-x-0.5" fill="currentColor" />
        </span>
        <h2 className="text-xl font-semibold">You haven't posted a reel yet</h2>
        <p className="text-white/50 text-sm">Share a vertical video — it shows up here and in the feed.</p>
        <button
          onClick={onCreate}
          className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-fuchsia-500 to-rose-500 text-white font-medium"
        >
          <Plus size={18} /> Create a reel
        </button>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto px-3 pt-20 pb-28 scrollbar-hide">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-w-3xl mx-auto">
        {reels.map((reel) => (
          <MyReelCell key={reel.id} reel={reel} onDelete={handleDelete} />
        ))}
      </div>
      {hasNextPage && (
        <div className="flex justify-center mt-6">
          <button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="px-5 py-2 rounded-full bg-white/10 text-white text-sm font-medium hover:bg-white/15 disabled:opacity-50"
          >
            {isFetchingNextPage ? 'Loading…' : 'Load more'}
          </button>
        </div>
      )}
    </div>
  );
}

export default function ReelsPage() {
  const user = useAuthStore((s) => s.user) as any;
  const queryClient = useQueryClient();
  const reduceMotion = useReducedMotion();
  const [tab, setTab] = useState<'foryou' | 'mine'>('foryou');
  const [composerOpen, setComposerOpen] = useState(false);

  const openComposer = () => {
    if (!user) { goTo('/login'); return; }
    setComposerOpen(true);
  };

  // The global mobile "+" (and the empty-state CTA) dispatch this when on /reels.
  useEffect(() => {
    const handler = () => openComposer();
    window.addEventListener('etunisia:open-reel-composer', handler);
    return () => window.removeEventListener('etunisia:open-reel-composer', handler);
  }, [user]);

  return (
    <div className="relative h-[100dvh] bg-black">
      {/* Page-level top bar (overlay) */}
      <div className="absolute top-0 inset-x-0 z-30 flex items-center justify-between px-4 pt-4 pb-10 bg-gradient-to-b from-black/50 to-transparent pointer-events-none">
        <button
          onClick={() => goTo('/')}
          className="p-2 rounded-full bg-black/30 backdrop-blur-sm text-white pointer-events-auto"
          aria-label="Back to feed"
        >
          <ArrowLeft size={20} />
        </button>

        <div role="tablist" aria-label="Reels feed" className="flex items-center gap-1 p-1 rounded-full bg-black/40 backdrop-blur-sm pointer-events-auto">
          <button
            role="tab"
            aria-selected={tab === 'foryou'}
            onClick={() => setTab('foryou')}
            className={`px-3.5 py-1.5 rounded-full text-sm font-semibold transition ${
              tab === 'foryou' ? 'bg-white text-black' : 'text-white/70 hover:text-white'
            }`}
          >
            For You
          </button>
          <button
            role="tab"
            aria-selected={tab === 'mine'}
            onClick={() => setTab('mine')}
            className={`px-3.5 py-1.5 rounded-full text-sm font-semibold transition ${
              tab === 'mine' ? 'bg-white text-black' : 'text-white/70 hover:text-white'
            }`}
          >
            My Reels
          </button>
        </div>

        <button
          onClick={openComposer}
          className="p-2 rounded-full bg-gradient-to-br from-fuchsia-500 to-rose-500 text-white pointer-events-auto shadow-lg"
          aria-label="Create a reel"
        >
          <Plus size={20} />
        </button>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={tab}
          className="h-full"
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduceMotion ? { opacity: 1 } : { opacity: 0, y: -8 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        >
          {tab === 'foryou' ? (
            <ForYouFeed />
          ) : !user ? (
            <div className="h-full flex flex-col items-center justify-center text-white gap-4 px-8 text-center">
              <h2 className="text-xl font-semibold">Sign in to manage your reels</h2>
              <p className="text-white/50 text-sm">Your posted reels live here — sign in to see and edit them.</p>
              <button
                onClick={() => goTo('/login')}
                className="px-6 py-2.5 rounded-full bg-white text-black font-medium"
              >
                Sign in
              </button>
            </div>
          ) : (
            <MyReelsGrid onCreate={openComposer} />
          )}
        </motion.div>
      </AnimatePresence>

      {composerOpen && (
        <ReelComposer
          onClose={() => setComposerOpen(false)}
          onPosted={() => {
            queryClient.invalidateQueries({ queryKey: ['reels'] });
            setTab('mine');
          }}
        />
      )}
    </div>
  );
}
