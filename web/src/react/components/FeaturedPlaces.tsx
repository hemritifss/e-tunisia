import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Sparkles, MapPin, Star, ChevronRight } from 'lucide-react';
import { api, getImageUrl } from '../../shared/api';

interface FeaturedPlace {
  id: string;
  name: string;
  city?: string;
  governorate?: string;
  rating?: number;
  reviewCount?: number;
  coverImage?: string | null;
  priceRange?: string | null;
  category?: { name: string } | null;
  isBoosted?: boolean;
  boostExpiresAt?: string | null;
}

export function FeaturedPlaces() {
  const { data, isLoading } = useQuery({
    queryKey: ['featured-places'],
    queryFn: () => api.getFeaturedPlaces() as Promise<FeaturedPlace[]>,
    staleTime: 5 * 60_000,
  });

  const places = Array.isArray(data) ? data : [];
  if (!isLoading && places.length === 0) return null;

  return (
    <aside className="featured-places-card">
      <header className="featured-places-head">
        <div className="featured-places-title">
          <Sparkles size={16} className="text-brand" />
          <h3>Featured experiences</h3>
        </div>
        <span className="featured-places-badge">Sponsored</span>
      </header>

      <div className="featured-places-strip">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="featured-place-card featured-place-skel" />
            ))
          : places.slice(0, 8).map((p) => {
              const cover = p.coverImage ? getImageUrl(p.coverImage) : '';
              return (
                <a
                  key={p.id}
                  href={`#/place/${p.id}`}
                  className="featured-place-card"
                >
                  <div className="featured-place-cover" data-arch-reveal>
                    {cover ? (
                      <img src={cover} alt="" loading="lazy" />
                    ) : (
                      <div className="featured-place-cover-fallback" />
                    )}
                    {p.isBoosted && (
                      <span className="featured-place-boost-badge" title="Boosted by host">
                        <Sparkles size={11} /> Boosted
                      </span>
                    )}
                    {p.priceRange && (
                      <span className="featured-place-price">{p.priceRange}</span>
                    )}
                  </div>
                  <div className="featured-place-body">
                    <div className="featured-place-name">{p.name}</div>
                    <div className="featured-place-meta">
                      {p.city && (
                        <span>
                          <MapPin size={11} /> {p.city}
                        </span>
                      )}
                      {typeof p.rating === 'number' && p.rating > 0 && (
                        <span>
                          <Star size={11} className="fill-current text-yellow-500" />{' '}
                          {Number(p.rating).toFixed(1)}
                          {p.reviewCount ? ` (${p.reviewCount})` : ''}
                        </span>
                      )}
                    </div>
                  </div>
                </a>
              );
            })}
      </div>

      <a className="featured-places-cta" href="#/explore">
        Explore all places <ChevronRight size={14} />
      </a>
    </aside>
  );
}
