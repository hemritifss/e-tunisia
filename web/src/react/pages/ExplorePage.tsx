import React, { useState, useEffect, useRef } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import {
  MapPin,
  Heart,
  Search,
  SlidersHorizontal,
  Grid3X3,
  List,
  X,
  Compass,
  Globe,
  Waves,
  Landmark,
  UtensilsCrossed,
  Trees,
  Library,
  Mountain,
} from 'lucide-react';
import { api, getImageUrl } from '../../shared/api';
import { coverPlaceholder } from '../../shared/placeholder';
import { requireAuth } from '../../ui-utils';
import type { Place, Category } from '../../shared/types/api';
import { Card, CardImage, CardContent, CardFooter } from '../components/Card';
import { StarRating } from '../components/StarRating';
import { Button } from '../components/Button';
import { Skeleton, PlaceCardSkeleton } from '../components/Skeleton';
import { formatNumber } from '../lib/utils';
import { useAuthStore } from '../stores/auth-store';
import { useUIStore } from '../stores/ui-store';
import { PullToRefresh } from '../components/PullToRefresh';

type ViewMode = 'grid' | 'list';

interface CategoryDef {
  id: string;
  name: string;
  Icon: LucideIcon;
  /** CSS variable expression used as `--cat-tint`. Closes the loop with mood palette. */
  tint: string;
}

const CATEGORIES: CategoryDef[] = [
  { id: 'all',        name: 'All',        Icon: Globe,            tint: 'var(--text-secondary)' },
  { id: 'beaches',    name: 'Beaches',    Icon: Waves,            tint: 'var(--cyan)' },
  { id: 'historical', name: 'Historical', Icon: Landmark,         tint: 'var(--sand)' },
  { id: 'food',       name: 'Food',       Icon: UtensilsCrossed,  tint: 'var(--gold)' },
  { id: 'nature',     name: 'Nature',     Icon: Trees,            tint: 'var(--olive)' },
  { id: 'culture',    name: 'Culture',    Icon: Library,          tint: 'var(--violet)' },
  { id: 'adventure',  name: 'Adventure',  Icon: Mountain,         tint: 'var(--terracotta)' },
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
              src={getImageUrl(place.coverImage || place.images?.[0]) || coverPlaceholder(place.id, place.name)}
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
            src={getImageUrl(place.coverImage || place.images?.[0]) || coverPlaceholder(place.id, place.name)}
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
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const queryClient = useQueryClient();
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
    queryKey: ['places', activeCategory, searchQuery, priceRange, minRating, verifiedOnly],
    queryFn: async ({ pageParam = 1 }) => {
      const params: Record<string, string> = {
        page: String(pageParam),
        limit: '12',
      };
      if (activeCategory !== 'all') params.category = activeCategory;
      if (searchQuery) params.search = searchQuery;
      if (minRating > 0) params.minRating = String(minRating);
      if (verifiedOnly) params.verified = 'true';

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

  const activeCat = CATEGORIES.find((c) => c.id === activeCategory) || CATEGORIES[0];
  const clearAll = () => {
    setActiveCategory('all');
    setSearchQuery('');
    setMinRating(0);
    setVerifiedOnly(false);
  };
  const hasFilter = activeCategory !== 'all' || searchQuery.trim() !== '' || minRating > 0 || verifiedOnly;

  return (
    <div className="explore-page animate-fade-in" style={{ '--cat-tint': activeCat.tint } as React.CSSProperties}>
      {/* Hero — atmospheric mesh, search baked in */}
      <header className="explore-hero">
        <div className="explore-hero-bg" aria-hidden="true" />
        <div className="explore-hero-orbs" aria-hidden="true">
          <span className="explore-hero-orb" />
          <span className="explore-hero-orb" />
        </div>
        <div className="explore-hero-content">
          <span className="explore-hero-eyebrow">
            <Compass size={12} /> Discover
          </span>
          <h1>Find your next <span className="explore-hero-grad">Tunisia</span></h1>
          <p>Authentic places curated by locals and travelers — from ancient ruins to secret beaches.</p>
          <form
            className="explore-search-form"
            role="search"
            onSubmit={(e) => e.preventDefault()}
          >
            <Search className="explore-search-icon" size={18} aria-hidden="true" />
            <input
              type="search"
              placeholder="Search places, cities, tags…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="explore-search-input"
              aria-label="Search places"
            />
            {searchQuery && (
              <button
                type="button"
                className="explore-search-clear"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </form>
        </div>
      </header>

      {/* Controls — filters + view-mode toggle */}
      <div className="explore-controls">
        <button
          type="button"
          className={`explore-controls-btn${showFilters ? ' is-active' : ''}`}
          onClick={() => setShowFilters(!showFilters)}
          aria-expanded={showFilters}
        >
          <SlidersHorizontal size={16} /> Filters
          {minRating > 0 && <span className="explore-controls-dot" aria-hidden="true" />}
        </button>
        {hasFilter && (
          <button
            type="button"
            className="explore-controls-clear"
            onClick={clearAll}
          >
            Clear all
          </button>
        )}
        <div className="explore-view-toggle" role="tablist" aria-label="View mode">
          <button
            role="tab"
            aria-selected={viewMode === 'grid'}
            onClick={() => setViewMode('grid')}
            className={`explore-view-btn${viewMode === 'grid' ? ' is-active' : ''}`}
            title="Grid view"
            aria-label="Grid view"
          >
            <Grid3X3 size={16} />
          </button>
          <button
            role="tab"
            aria-selected={viewMode === 'list'}
            onClick={() => setViewMode('list')}
            className={`explore-view-btn${viewMode === 'list' ? ' is-active' : ''}`}
            title="List view"
            aria-label="List view"
          >
            <List size={16} />
          </button>
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
            className="explore-filters-wrap"
          >
            <div className="explore-filters">
              <fieldset className="explore-filter-group">
                <legend>Minimum rating</legend>
                <div className="explore-filter-pills">
                  {[0, 3, 4, 4.5].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => setMinRating(rating)}
                      className={`explore-filter-pill${minRating === rating ? ' is-active' : ''}`}
                    >
                      {rating === 0 ? 'Any' : `${rating}+ stars`}
                    </button>
                  ))}
                </div>
              </fieldset>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Category strip — Lucide icons, tinted on active */}
      <nav className="explore-cats" aria-label="Category filter">
        {CATEGORIES.map((cat) => {
          const I = cat.Icon;
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`explore-cat${isActive ? ' is-active' : ''}`}
              style={{ '--cat-tint': cat.tint } as React.CSSProperties}
              aria-pressed={isActive}
            >
              <span className="explore-cat-icon"><I size={16} strokeWidth={1.75} /></span>
              <span>{cat.name}</span>
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setVerifiedOnly((v) => !v)}
          className={`explore-cat explore-cat-verified${verifiedOnly ? ' is-active' : ''}`}
          aria-pressed={verifiedOnly}
          title="Show only listings from Verified Businesses"
        >
          <span className="explore-cat-icon" aria-hidden="true">✓</span>
          <span>Verified</span>
        </button>
      </nav>

      {/* Results */}
      <PullToRefresh onRefresh={async () => {
        await queryClient.invalidateQueries({ queryKey: ['explore'] });
        await queryClient.refetchQueries({ queryKey: ['explore'] });
      }}>
      {isLoading ? (
        <div className={viewMode === 'grid' ? 'explore-grid' : 'explore-list'}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="explore-skel" />
          ))}
        </div>
      ) : isError ? (
        <div className="explore-empty">
          <div className="explore-empty-icon"><X size={28} /></div>
          <h3>Couldn't load places</h3>
          <p>Check your connection and try again — your filters are preserved.</p>
        </div>
      ) : allPlaces.length === 0 ? (
        <div className="explore-empty">
          <div className="explore-empty-icon"><Compass size={28} /></div>
          <h3>No places match your filters</h3>
          <p>Try broadening the category, dropping the rating filter, or searching a city name.</p>
          {hasFilter && (
            <Button variant="primary" onClick={clearAll}>Clear all filters</Button>
          )}
        </div>
      ) : (
        <div className={viewMode === 'grid' ? 'explore-grid' : 'explore-list'}>
          <AnimatePresence mode="popLayout">
            {allPlaces.map((place) => (
              <PlaceCard key={place.id} place={place} viewMode={viewMode} />
            ))}
          </AnimatePresence>
        </div>
      )}
      </PullToRefresh>

      {/* Load more sentinel */}
      <div ref={loadMoreRef} className="explore-loadmore">
        {isFetchingNextPage && (
          <div className={viewMode === 'grid' ? 'explore-grid' : 'explore-list'}>
            <div className="explore-skel" />
            <div className="explore-skel" />
          </div>
        )}
        {!hasNextPage && allPlaces.length > 0 && (
          <div className="explore-end">
            <span className="explore-end-mark">You've seen every place</span>
          </div>
        )}
      </div>
    </div>
  );
}
