import React, { useState, useEffect, useRef } from 'react';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
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
  Star,
  Sparkles,
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
import { CityCompleteness } from '../components/GemWidgets';
import { useCity } from '../lib/useCity';

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
    e.preventDefault();
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
        <a
          href={`#/place/${place.id}`}
          className="block no-underline text-inherit rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          aria-label={`View ${place.name}`}
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
                type="button"
                onClick={handleLike}
                aria-pressed={isLiked}
                aria-label={isLiked ? `Remove ${place.name} from saved` : `Save ${place.name}`}
                className={`p-2 rounded-full transition-all ${
                  isLiked
                    ? 'text-red-500 bg-red-500/10'
                    : 'text-gray-400 hover:text-red-500 hover:bg-red-500/10'
                }`}
              >
                <Heart size={18} aria-hidden="true" className={isLiked ? 'fill-current' : ''} />
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
        </a>
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
      <a
        href={`#/place/${place.id}`}
        className="block h-full no-underline text-inherit rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        aria-label={`View ${place.name}`}
      >
      <Card hover className="h-full flex flex-col">
        <div className="relative">
          <CardImage
            src={getImageUrl(place.coverImage || place.images?.[0]) || coverPlaceholder(place.id, place.name)}
            alt={place.name}
            aspect="video"
          />
          <button
            type="button"
            onClick={handleLike}
            aria-pressed={isLiked}
            aria-label={isLiked ? `Remove ${place.name} from saved` : `Save ${place.name}`}
            className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all ${
              isLiked
                ? 'text-red-500 bg-white/90'
                : 'text-white bg-black/30 hover:bg-white/90 hover:text-red-500'
            }`}
          >
            <Heart size={18} aria-hidden="true" className={isLiked ? 'fill-current' : ''} />
          </button>
          {place.isFeatured && (
            <span className="absolute top-3 left-3 px-2.5 py-1 text-xs font-semibold rounded-full bg-brand text-white shadow-sm">
              Featured
            </span>
          )}
          {/* Bottom scrim + glassy rating pill (editorial travel-card style) */}
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/55 to-transparent pointer-events-none" />
          {Number(place.rating) > 0 && (
            <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white/95 backdrop-blur-md text-xs font-bold text-gray-900 shadow-sm">
              <Star size={12} className="fill-amber-400 text-amber-400" />
              {Number(place.rating).toFixed(1)}
            </span>
          )}
        </div>
        <CardContent className="flex-1 flex flex-col">
          <h3 className="font-semibold text-base leading-snug mb-1 line-clamp-1 group-hover:text-brand transition-colors">{place.name}</h3>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin size={14} className="shrink-0" />
            <span className="truncate">{place.city}</span>
            <span className="text-muted-foreground/50 mx-1">·</span>
            <span className="whitespace-nowrap">{formatNumber(place.reviewCount)} reviews</span>
          </div>
        </CardContent>
      </Card>
      </a>
    </motion.div>
  );
}

/**
 * AI "For you" strip — Claude-re-ranked place picks for the signed-in user
 * (GET /ai/suggestions). Rendered only on the unfiltered Explore view; hidden
 * for guests and when there are no suggestions.
 */
/**
 * The AI fallback labels every pick "Top-rated by travelers" — the same
 * sentence six cards in a row reads as filler and stops meaning anything.
 * Keep the first occurrence; swap repeats for concrete facts we already have.
 */
function varyReasons(items: any[]): any[] {
  const seen = new Map<string, number>();
  return items.map((it: any) => {
    const r = String(it.reason || '').trim();
    if (!r) return it;
    const n = (seen.get(r) || 0) + 1;
    seen.set(r, n);
    if (n === 1) return it;
    const p = it.place || {};
    const reviews = Number(p.reviewsCount) || 0;
    const alt = reviews > 0
      ? `${reviews} traveler ${reviews === 1 ? 'review' : 'reviews'}`
      : (p.city ? `A ${p.city} favorite` : '');
    return { ...it, reason: alt };
  });
}

function ForYouStrip() {
  const user = useAuthStore((s) => s.user);
  const { data } = useQuery({
    queryKey: ['ai-suggestions', user?.id],
    queryFn: () => api.aiSuggestions((user as any)?.interests).catch(() => []),
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });
  const items = varyReasons(Array.isArray(data) ? data : []);
  if (!user || items.length === 0) return null;

  return (
    <section className="explore-foryou mt-2 mb-6">
      <div className="flex items-center gap-2 mb-3 px-1">
        <Sparkles size={16} className="text-brand" />
        <h2 className="font-semibold text-base">For you</h2>
        <span className="text-xs text-muted-foreground">AI picks based on your taste</span>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x">
        {items.slice(0, 10).map((it: any) => {
          const p = it.place || {};
          const img = getImageUrl(p.coverImage || p.images?.[0]) || coverPlaceholder(p.id, p.name);
          return (
            <a key={it.placeId} href={`#/place/${p.id}`} className="shrink-0 w-44 snap-start group">
              <div className="relative w-44 h-28 rounded-xl overflow-hidden bg-black/5 dark:bg-white/5">
                <img
                  src={img}
                  alt={p.name}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {Number(p.rating) > 0 && (
                  <span className="absolute bottom-1.5 left-1.5 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-white/95 text-[11px] font-bold text-gray-900">
                    <Star size={10} className="fill-amber-400 text-amber-400" /> {Number(p.rating).toFixed(1)}
                  </span>
                )}
              </div>
              <h3 className="mt-1.5 text-sm font-medium line-clamp-1 group-hover:text-brand transition-colors">{p.name}</h3>
              {it.reason && <p className="text-xs text-muted-foreground line-clamp-2 leading-snug">{it.reason}</p>}
            </a>
          );
        })}
      </div>
    </section>
  );
}

/** Active category lives in the URL (?cat=beaches) so refresh/share keep the filter. */
function categoryFromUrl(): string {
  try {
    return new URLSearchParams(window.location.search).get('cat') || 'all';
  } catch {
    return 'all';
  }
}

export default function ExplorePage() {
  const [activeCategory, setActiveCategoryState] = useState(categoryFromUrl);
  const setActiveCategory = (c: string) => {
    setActiveCategoryState(c);
    try {
      const url = new URL(window.location.href);
      if (c === 'all') url.searchParams.delete('cat');
      else url.searchParams.set('cat', c);
      window.history.replaceState(window.history.state, '', url);
    } catch { /* best-effort */ }
  };
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [minRating, setMinRating] = useState(0);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const globalCity = useCity(); // navbar city pill — filters the whole app
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
    queryKey: ['places', activeCategory, searchQuery, priceRange, minRating, verifiedOnly, globalCity],
    queryFn: async ({ pageParam = 1 }) => {
      const params: Record<string, string> = {
        page: String(pageParam),
        limit: '12',
      };
      if (activeCategory !== 'all') params.category = activeCategory;
      if (searchQuery) params.search = searchQuery;
      if (minRating > 0) params.minRating = String(minRating);
      if (verifiedOnly) params.verified = 'true';
      if (globalCity) params.city = globalCity;

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
    <div className="explore-page animate-fade-in" data-design="carnet" style={{ '--cat-tint': activeCat.tint } as React.CSSProperties}>
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
              enterKeyHint="search"
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

      {/* AI "For you" — only on the unfiltered discovery view */}
      {activeCategory === 'all' && !searchQuery.trim() && minRating === 0 && !verifiedOnly && <ForYouStrip />}

      {/* The completeness game — "Kairouan is 34% mapped" → contribute */}
      {activeCategory === 'all' && !searchQuery.trim() && <CityCompleteness />}

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
