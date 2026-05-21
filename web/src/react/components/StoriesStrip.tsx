import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';
import { api } from '../../shared/api';
import { useAuthStore } from '../stores/auth-store';

interface StoryItem {
  id: string;
  imageUrl: string;
  caption: string | null;
  createdAt: string;
  expiresAt: string;
}
interface StoryAuthor {
  authorId: string;
  author: { id: string; fullName: string; avatar: string | null } | null;
  items: StoryItem[];
  latestAt: string;
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return 'now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export function StoriesStrip() {
  const queryClient = useQueryClient();
  const isAuth = useAuthStore((s) => !!s.token || !!localStorage.getItem('etunisia_token'));
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [viewer, setViewer] = useState<{ authorIdx: number; itemIdx: number } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['stories'],
    queryFn: () => api.getStories() as Promise<StoryAuthor[]>,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  const groups = useMemo(() => (Array.isArray(data) ? data : []), [data]);

  const createMutation = useMutation({
    mutationFn: async (payload: { imageUrl: string; caption?: string }) => {
      // Upload the data URL to MinIO first so we don't bloat the DB with base64.
      const hosted = await uploadDataUrlOnClient(payload.imageUrl, 'stories');
      return api.createStory({ ...payload, imageUrl: hosted });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['stories'] }),
  });

  async function uploadDataUrlOnClient(dataUrl: string, folder = 'uploads'): Promise<string> {
    if (!dataUrl || !dataUrl.startsWith('data:')) return dataUrl;
    try {
      const token = localStorage.getItem('etunisia_token');
      const res = await fetch('/api/v1/media/from-data-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ dataUrl, folder }),
      });
      const body = await res.json().catch(() => ({}));
      const url = body?.data?.url || body?.url;
      return url || dataUrl;
    } catch {
      return dataUrl;
    }
  }

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-select same file
    if (!file) return;
    if (!isAuth) {
      location.hash = '#/login';
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = (ev.target?.result as string) || '';
      if (dataUrl) createMutation.mutate({ imageUrl: dataUrl });
    };
    reader.readAsDataURL(file);
  };

  const openYourTile = () => {
    if (!isAuth) { location.hash = '#/login'; return; }
    fileInputRef.current?.click();
  };

  if (isLoading) {
    return (
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex-shrink-0 flex flex-col items-center gap-1.5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-black/5 dark:bg-white/10 animate-pulse" />
            <div className="w-14 h-2 rounded bg-black/5 dark:bg-white/10 animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={onFile}
        className="hidden"
        aria-label="Upload a story image"
      />

      <div className="stories-v2-wrap">
        <div className="stories-v2-track snap-x">
          {/* "Your story +" tile — always present, opens file picker */}
          <button
            onClick={openYourTile}
            className="stories-v2-tile stories-v2-tile-self snap-start"
            aria-label="Add a story"
          >
            <div className="stories-v2-ring stories-v2-ring-self">
              <div className="stories-v2-add-inner">
                {createMutation.isPending ? <span className="animate-spin">⟳</span> : <Plus size={22} />}
              </div>
            </div>
            <span className="stories-v2-label">
              {createMutation.isPending ? 'Posting…' : 'Your story'}
            </span>
          </button>

          {groups.map((g, gi) => {
            const top = g.items[0];
            const name = g.author?.fullName || 'Member';
            const avatar = g.author?.avatar
              || `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(name)}`;
            return (
              <button
                key={g.authorId}
                onClick={() => setViewer({ authorIdx: gi, itemIdx: 0 })}
                className="stories-v2-tile snap-start"
              >
                <div className="stories-v2-ring">
                  <img
                    src={top?.imageUrl || avatar}
                    alt={name}
                    className="stories-v2-image"
                    loading="lazy"
                  />
                  {g.items.length > 1 && (
                    <span className="stories-v2-count">{g.items.length}</span>
                  )}
                </div>
                <span className="stories-v2-label stories-v2-label-muted">{name.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {viewer && groups[viewer.authorIdx] && (
          <StoryViewer
            groups={groups}
            authorIdx={viewer.authorIdx}
            itemIdx={viewer.itemIdx}
            onClose={() => setViewer(null)}
            onChange={(authorIdx, itemIdx) => setViewer({ authorIdx, itemIdx })}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// ────────────────────────────────────────────────────────────
// Full-screen story viewer with auto-advance
// ────────────────────────────────────────────────────────────
function StoryViewer({
  groups, authorIdx, itemIdx, onClose, onChange,
}: {
  groups: StoryAuthor[];
  authorIdx: number;
  itemIdx: number;
  onClose: () => void;
  onChange: (authorIdx: number, itemIdx: number) => void;
}) {
  const group = groups[authorIdx];
  const item = group.items[itemIdx];
  const totalInGroup = group.items.length;

  // Record a view (fire-and-forget) when story changes.
  useEffect(() => {
    if (item?.id) api.viewStory(item.id).catch(() => {});
  }, [item?.id]);

  // Auto-advance every 5s
  useEffect(() => {
    const t = window.setTimeout(() => advance(1), 5000);
    return () => clearTimeout(t);
  }, [authorIdx, itemIdx]);

  // Keyboard nav
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') advance(1);
      if (e.key === 'ArrowLeft') advance(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const advance = (dir: 1 | -1) => {
    let a = authorIdx;
    let i = itemIdx + dir;
    if (i >= totalInGroup) { a += 1; i = 0; }
    else if (i < 0) { a -= 1; i = (groups[a]?.items.length || 1) - 1; }
    if (a < 0 || a >= groups.length) { onClose(); return; }
    onChange(a, i);
  };

  const name = group.author?.fullName || 'Member';
  const avatar = group.author?.avatar
    || `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(name)}`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[400] bg-black/95 flex items-center justify-center"
      onClick={onClose}
    >
      <button
        onClick={(e) => { e.stopPropagation(); advance(-1); }}
        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"
        aria-label="Previous"
      >
        <ChevronLeft size={28} />
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); advance(1); }}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"
        aria-label="Next"
      >
        <ChevronRight size={28} />
      </button>
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"
        aria-label="Close"
      >
        <X size={22} />
      </button>

      <div
        className="relative w-full max-w-[420px] aspect-[9/16] mx-4 rounded-2xl overflow-hidden bg-neutral-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Progress bars */}
        <div className="absolute top-2 left-2 right-2 flex gap-1 z-10">
          {group.items.map((_, idx) => (
            <div key={idx} className="flex-1 h-0.5 rounded-full bg-white/30 overflow-hidden">
              <div
                className={
                  idx < itemIdx ? 'h-full bg-white w-full' :
                  idx === itemIdx ? 'h-full bg-white animate-[grow_5s_linear_forwards]' :
                  'h-full w-0'
                }
                style={idx === itemIdx ? ({ animation: 'storyProgress 5s linear forwards' } as any) : {}}
              />
            </div>
          ))}
        </div>

        {/* Author header */}
        <div className="absolute top-5 left-3 right-3 flex items-center gap-2 z-10">
          <img src={avatar} alt={name} className="w-8 h-8 rounded-full border-2 border-white object-cover" />
          <div className="text-white text-sm font-medium">{name}</div>
          <div className="text-white/70 text-xs">{timeAgo(item.createdAt)}</div>
        </div>

        <img
          src={item.imageUrl}
          alt={item.caption || 'story'}
          className="absolute inset-0 w-full h-full object-cover"
        />
        {item.caption && (
          <div className="absolute bottom-4 left-3 right-3 text-white text-sm bg-black/50 backdrop-blur-sm px-3 py-2 rounded-xl">
            {item.caption}
          </div>
        )}

        {/* Tap zones for prev/next */}
        <button
          className="absolute inset-y-0 left-0 w-1/3"
          onClick={(e) => { e.stopPropagation(); advance(-1); }}
          aria-label="Previous"
        />
        <button
          className="absolute inset-y-0 right-0 w-1/3"
          onClick={(e) => { e.stopPropagation(); advance(1); }}
          aria-label="Next"
        />
      </div>
    </motion.div>
  );
}
