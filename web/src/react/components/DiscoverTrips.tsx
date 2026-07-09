import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Compass, MapPin, Calendar, Users, ChevronRight, Flame } from 'lucide-react';
import { api, getImageUrl } from '../../shared/api';

interface DiscoverTrip {
  slug: string;
  title: string;
  travelers: number;
  days: number;
  currency: string;
  viewCount: number;
  stopCount: number;
  previewCities: string[];
  previewCovers: string[];
  updatedAt: string;
}

export function DiscoverTrips() {
  const { data, isLoading } = useQuery({
    queryKey: ['discover-trips-feed'],
    queryFn: async () => {
      const res = await api.getTripsDiscover({ sort: 'popular', limit: 8 });
      // fetchWithAuth re-attaches meta when present, so {data, meta} comes back.
      if (res && typeof res === 'object' && 'data' in res) return (res as any).data;
      return Array.isArray(res) ? res : [];
    },
    staleTime: 5 * 60_000,
  });

  const trips: DiscoverTrip[] = Array.isArray(data) ? data : [];
  if (!isLoading && trips.length === 0) return null;

  return (
    <aside className="discover-trips-card">
      <header className="discover-trips-card-head">
        <div className="discover-trips-card-title">
          <Compass size={16} className="text-brand" />
          <h3>Trip plans by travelers</h3>
        </div>
        <a className="discover-trips-card-link" href="#/discover-trips">
          See all <ChevronRight size={14} />
        </a>
      </header>

      <div className="discover-trips-card-strip">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="discover-trip-mini discover-trip-mini-skel" />
            ))
          : trips.slice(0, 8).map((t) => (
              <a key={t.slug} href={`#/trip/${t.slug}`} className="discover-trip-mini">
                <div className="discover-trip-mini-cover">
                  {t.previewCovers.slice(0, 3).map((src, i) => (
                    <img
                      key={i}
                      src={src.startsWith('http') ? src : getImageUrl(src)}
                      alt=""
                      loading="lazy"
                    />
                  ))}
                  {t.viewCount > 0 && (
                    <span className="discover-trip-mini-views">
                      <Flame size={11} /> {t.viewCount}
                    </span>
                  )}
                </div>
                <div className="discover-trip-mini-body">
                  <div className="discover-trip-mini-title">{t.title}</div>
                  {t.previewCities.length > 0 && (
                    <div className="discover-trip-mini-cities">
                      <MapPin size={11} /> {t.previewCities.slice(0, 2).join(' · ')}
                    </div>
                  )}
                  <div className="discover-trip-mini-meta">
                    <span><Calendar size={11} /> {t.days}d</span>
                    <span><Users size={11} /> {t.travelers}</span>
                    <span>{t.stopCount} stops</span>
                  </div>
                </div>
              </a>
            ))}
      </div>
    </aside>
  );
}
