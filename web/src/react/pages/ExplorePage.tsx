import React, { useState, useEffect, useRef } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  Star,
  Heart,
  Search,
  SlidersHorizontal,
  Grid3X3,
  List,
  ChevronDown,
  X,
} from 'lucide-react';
import { api, getImageUrl } from '../../shared/api';
import { requireAuth } from '../../ui-utils';
import type { Place, Category } from '../../shared/types/api';
import { Card, CardImage, CardContent, CardFooter } from '../components/Card';
import { StarRating } from '../components/StarRating';
import { Button } from '../components/Button';
import { Skeleton, PlaceCardSkeleton } from '../components/Skeleton';
import { formatNumber } from '../lib/utils';
import { useAuthStore } from '../stores/auth-store';
import { useUIStore } from '../stores/ui-store';

type ViewMode = 'grid' | 'list';

const CATEGORIES = [
  { id: 'all', name: 'All', icon: '🌍' },
  { id: 'beaches', name: 'Beaches', icon: '🏖️' },
  { id: 'historical', name: 'Historical', icon: '🏛️' },
  { id: 'food', name: 'Food', icon: '🍽️' },
  { id: 'nature', name: 'Nature', icon: '🌿' },
  { id: 'culture', name: 'Culture', icon: '🎭' },
  { id: 'adventure', name: 'Adventure', icon: '🏔️' },
];

function PlaceCard({
  place,
  viewMode,
}: {
  place: Place;
  viewMode: ViewMode;
}) {
  const flagKey = 'place:' + place.id + ':fav';
  // Initial like state from auth-store favorites OR persisted flags. The selector returns
  // a stable reference (no `|| []` literal) so Zustand doesn't trigger an infinite render loop.
  const [isLiked, setIsLiked] = useState(() => {
    try {
      const auth = useAuthStore.getState();
      if (Array.isArray(auth.user?.favoriteIds) && auth.user!.favoriteIds!.includes(place.id)) return true;
      const map = JSON.parse(localStorage.getItem('etunisia_flags') || '{}');
      return !!map[flagKey];
    } catch { return false; }
  });
  const addFavorite = useAuthStore((s) => s.addFavorite);
  const removeFavorite = useAuthStore((s) => s.removeFavorite);
  const showToast = useUIStore((s) => s.showToast);

  const persistFav = (liked: boolean) => {
    try {
      const map = JSON.parse(localStorage.getItem('etunisia_flags') || '{}');
      if (liked) map[flagKey] = true; else delete map[flagKey];
      localStorage.setItem('etunisia_flags', JSON.stringify(map));
    } catch {}
  };

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!requireAuth('save places')) return;
    const next = !isLiked;
    setIsLiked(next);
    persistFav(next);
    if (next) {
      addFavorite(place.id);
      showToast('Added to favorites!', 'success');
      try { api.toggleFavorite(place.id); } catch {}
    } else {
      removeFavorite(place.id);
      try { api.toggleFavorite(place.id); } catch {}
    }
  };

  if (viewMode === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card hover className="flex gap-4">
          <div className="w-48 shrink-0">
            <CardImage
              src={getImageUrl(place.coverImage || place.images?.[0]) || 'https://images.unsplash.com/photo-1539020140153-e479b8c22e70?w=400'}
              alt={place.name}
              aspect="square"
            />
          </div>
          <CardContent className="flex-1 py-4 pr-4 pl-0">
            <div className="flex justify-between items-start mb-1">
              <h3 className="font-semibold text-lg">{place.name}</h3>
              <button
                onClick={handleLike}
                className={`p-2 rounded-full transition-all ${
                  isLiked
                    ? 'text-red-500 bg-red-500/10'
                    : 'text-gray-400 hover:text-red-500 hover:bg-red-500/10'
                }`}
              >
                <Heart size={18} className={isLiked ? 'fill-current' : ''} />
              </button>
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
              <MapPin size={14} />
              {place.city}, {place.governorate}
            </div>
            <div className="flex items-center gap-3 mb-2">
              <StarRating rating={place.rating} size={14} />
              <span className="text-sm text-muted-foreground">
                ({formatNumber(place.reviewCount)} reviews)
              </span>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {place.description}
            </p>
            <div className="flex flex-wrap gap-1 mt-3">
              {place.tags?.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 text-xs rounded-full bg-black/5 dark:bg-white/5"
                >
                  {tag}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="group"
    >
      <Card hover className="h-full flex flex-col">
        <div className="relative">
          <CardImage
            src={getImageUrl(place.coverImage || place.images?.[0]) || 'https://images.unsplash.com/photo-1539020140153-e479b8c22e70?w=400'}
            alt={place.name}
            aspect="video"
          />
          <button
            onClick={handleLike}
            className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all ${
              isLiked
                ? 'text-red-500 bg-white/90'
                : 'text-white bg-black/30 hover:bg-white/90 hover:text-red-500'
            }`}
          >
            <Heart size={18} className={isLiked ? 'fill-current' : ''} />
          </button>
          {place.isFeatured && (
            <span className="absolute top-3 left-3 px-2 py-1 text-xs font-medium rounded-full bg-brand text-white">
              Featured
            </span>
          )}
        </div>
        <CardContent className="flex-1 flex flex-col">
          <h3 className="font-semibold text-base mb-1">{place.name}</h3>
          <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
            <MapPin size={14} />
            {place.city}
          </div>
          <div className="flex items-center gap-2 mt-auto">
            <StarRating rating={place.rating} size={14} />
            <span className="text-xs text-muted-foreground">
              {formatNumber(place.reviewCount)}
            </span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function ExplorePage() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [minRating, setMinRating] = useState(0);
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
    queryKey: ['places', activeCategory, searchQuery, priceRange, minRating],
    queryFn: async ({ pageParam = 1 }) => {
      const params: Record<string, string> = {
        page: String(pageParam),
        limit: '12',
      };
      if (activeCategory !== 'all') params.category = activeCategory;
      if (searchQuery) params.search = searchQuery;
      if (minRating > 0) params.minRating = String(minRating);

      try {
        const response = await api.getPlaces(params);
        return response;
      } catch {
        // Fallback to mock data if API fails
        const mockPlaces: Place[] = Array.from({ length: 12 }).map((_, i) => ({
          id: `place-${pageParam}-${i}`,
          name: [
            'Sidi Bou Said',
            'Carthage Ruins',
            'Djerba Island',
            'Douz Desert',
            'El Jem Amphitheater',
            'Tabarka Beach',
            'Sousse Medina',
            'Kairouan Mosque',
            'Tozeur Oasis',
            'Hammamet Beach',
            'Bizerte Port',
            'Chott el Djerid',
          ][i],
          description: 'A stunning destination with rich history and breathtaking views. Perfect for tourists seeking authentic Tunisian experiences.',
          address: 'Main Street',
          city: ['Tunis', 'Nabeul', 'Medenine', 'Kebili', 'Mahdia', 'Jendouba', 'Sousse', 'Kairouan', 'Tozeur', 'Nabeul', 'Bizerte', 'Kebili'][i],
          governorate: ['Tunis', 'Nabeul', 'Medenine', 'Kebili', 'Mahdia', 'Jendouba', 'Sousse', 'Kairouan', 'Tozeur', 'Nabeul', 'Bizerte', 'Kebili'][i],
          latitude: 36.8 + Math.random(),
          longitude: 10.1 + Math.random(),
          images: [`https://images.unsplash.com/photo-${[
            '1539020140153-e479b8c22e70',
            '1564507592033-5de8b4981227',
            '1523906834658-6e24ef2386f9',
            '1509316785289-ef98d7f4e7e8',
            '1548013146-7247976e0e1b',
            '1507525428034-b723cf961d3e',
            '1469854523086-cc02fe5d8800',
            '1476514525535-07fb3b4ae5f1',
            '1433086966358-54859d0ed716',
            '1501785888041-af3ef285b470',
            '1493976040374-85c8e12f0c0e',
            '1470071459604-3b5ec3a7fe05',
          ][i]}?w=400`],
          rating: 3.5 + Math.random() * 1.5,
          reviewCount: Math.floor(Math.random() * 500) + 10,
          viewCount: Math.floor(Math.random() * 5000) + 100,
          tags: ['Historical', 'Scenic', 'Popular', 'Hidden Gem'].slice(0, Math.floor(Math.random() * 4) + 1),
          isActive: true,
          isFeatured: i < 3,
          isBoosted: false,
          categoryId: String(i % 7 + 1),
        }));

        return {
          data: mockPlaces,
          meta: { page: pageParam, limit: 12, total: 100, totalPages: 9 },
        };
      }
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.meta.page >= lastPage.meta.totalPages) return undefined;
      return lastPage.meta.page + 1;
    },
    initialPageParam: 1,
  });

  // Infinite scroll
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

  const allPlaces = data?.pages.flatMap((page) => page.data) || [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-brand via-brand-dark to-mediterranean p-8 text-white">
        <div className="relative z-10">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Discover Hidden Tunisia
          </h1>
          <p className="text-white/80 max-w-lg">
            Explore authentic places, from ancient ruins to secret beaches, curated by locals and travelers like you.
          </p>
        </div>
        <div className="absolute inset-0 bg-black/20" />
      </div>

      {/* Search & Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input
            type="text"
            placeholder="Search places, cities, tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-surface focus:outline-none focus:ring-2 focus:ring-brand/30 transition-all"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={showFilters ? 'primary' : 'ghost'}
            size="md"
            leftIcon={<SlidersHorizontal size={16} />}
            onClick={() => setShowFilters(!showFilters)}
          >
            Filters
          </Button>
          <div className="flex bg-surface rounded-xl p-1 border border-black/10 dark:border-white/10">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-brand text-white' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Grid3X3 size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-brand text-white' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <List size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Filters panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 bg-surface rounded-xl border border-black/10 dark:border-white/10 space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Minimum Rating</label>
                <div className="flex gap-2">
                  {[0, 3, 4, 4.5].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => setMinRating(rating)}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                        minRating === rating
                          ? 'bg-brand text-white'
                          : 'bg-black/5 dark:bg-white/5 hover:bg-black/10'
                      }`}
                    >
                      {rating === 0 ? 'Any' : `${rating}+`}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Category filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              activeCategory === cat.id
                ? 'bg-brand text-white shadow-sm'
                : 'bg-surface border border-black/10 dark:border-white/10 text-muted-foreground hover:text-foreground'
            }`}
          >
            <span>{cat.icon}</span>
            {cat.name}
          </button>
        ))}
      </div>

      {/* Places grid/list */}
      {isLoading ? (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
          {Array.from({ length: 6 }).map((_, i) => (
            <PlaceCardSkeleton key={i} />
          ))}
        </div>
      ) : isError ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Failed to load places</p>
        </div>
      ) : (
        <div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
              : 'space-y-4'
          }
        >
          <AnimatePresence mode="popLayout">
            {allPlaces.map((place) => (
              <PlaceCard key={place.id} place={place} viewMode={viewMode} />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Load more */}
      <div ref={loadMoreRef} className="py-4 text-center">
        {isFetchingNextPage && (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
            <PlaceCardSkeleton />
            <PlaceCardSkeleton />
          </div>
        )}
        {!hasNextPage && allPlaces.length > 0 && (
          <p className="text-sm text-muted-foreground">No more places to show</p>
        )}
      </div>
    </div>
  );
}
