import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Compass, MapPin, CalendarDays, Flame, Clock, Users, Eye, SearchX } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import * as api from '../../api';
import { CardGridSkeleton } from '../components/RouteSkeleton';

// Migrated from vanilla pages/discover-trips.ts — community trip browse with
// sort tabs + debounced city filter + duration select.

type Sort = 'popular' | 'new';

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const d = Math.floor(ms / 86_400_000);
  if (d < 1) return 'today';
  if (d < 30) return `${d}d ago`;
  if (d < 365) return `${Math.floor(d / 30)}mo ago`;
  return `${Math.floor(d / 365)}y ago`;
}

function coverSrc(src: string): string {
  return src.startsWith('http') ? src : `/uploads${src.startsWith('/') ? '' : '/'}${src}`;
}

function TripCard({ t }: { t: api.DiscoverTripCard }) {
  return (
    <a className="discover-trip-card" href={`#/trip/${t.slug}`}>
      <div className="discover-trip-cover">
        {t.previewCovers.length > 0 ? (
          t.previewCovers.slice(0, 3).map((src, i) => <img key={i} src={coverSrc(src)} alt="" loading="lazy" />)
        ) : (
          <div className="discover-trip-cover-fallback" />
        )}
        <span className="discover-trip-chip">
          <MapPin /> <span> {t.stopCount} {t.stopCount === 1 ? 'stop' : 'stops'}</span>
        </span>
      </div>
      <div className="discover-trip-body">
        <h3 className="discover-trip-title">{t.title}</h3>
        {t.previewCities.length > 0 && (
          <div className="discover-trip-cities">
            {t.previewCities.join(' · ')}{t.stopCount > t.previewCities.length ? ' · …' : ''}
          </div>
        )}
        <div className="discover-trip-meta">
          <span><CalendarDays /> <span> {t.days} {t.days === 1 ? 'day' : 'days'}</span></span>
          <span><Users /> <span> {t.travelers} {t.travelers === 1 ? 'traveler' : 'travelers'}</span></span>
          {t.viewCount > 0 && <span><Eye /> <span> {t.viewCount}</span></span>}
          <span><Clock /> <span> {timeAgo(t.updatedAt)}</span></span>
        </div>
      </div>
    </a>
  );
}

const SORT_TABS: Array<{ key: Sort; label: string; Icon: React.ComponentType }> = [
  { key: 'popular', label: 'Popular', Icon: Flame },
  { key: 'new', label: 'Newest', Icon: Clock },
];

export default function DiscoverTripsPage() {
  const [sort, setSort] = useState<Sort>('popular');
  const [cityInput, setCityInput] = useState('');
  const [city, setCity] = useState('');
  const [days, setDays] = useState('');

  // Debounce the city filter (250ms), matching the vanilla page.
  useEffect(() => {
    const tmr = setTimeout(() => setCity(cityInput.trim()), 250);
    return () => clearTimeout(tmr);
  }, [cityInput]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['discover-trips', sort, city, days],
    queryFn: async () => {
      let minDays: number | undefined;
      let maxDays: number | undefined;
      if (days) {
        const [a, b] = days.split('-');
        minDays = Number(a) || undefined;
        maxDays = Number(b) || undefined;
      }
      const res = await api.discoverTrips({ sort, city: city || undefined, minDays, maxDays, limit: 36 });
      return Array.isArray(res?.data) ? res.data : [];
    },
  });

  return (
    <div className="discover-trips-page page-enter" id="discover-trips-root">
      <PageHeader
        eyebrow={<><Compass size={13} /> Community plans · carnet de voyages</>}
        title={<>Discover <em>trips</em></>}
        subtitle="Travel plans shared by the e-Tunisia community. Tap any trip to view the full plan or clone it as your own."
      />

      <div className="discover-trips-filters">
        <div className="discover-trips-tabs" role="tablist" aria-label="Sort trips">
          <div className="discover-trips-tabs-inner">
            {SORT_TABS.map(({ key, label, Icon }) => (
              <button
                key={key}
                type="button"
                className={`discover-trips-tab ${sort === key ? 'active' : ''}`}
                onClick={() => setSort(key)}
              >
                <Icon /> <span> {label}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="discover-trips-search-row">
          <span className="discover-trips-search-wrap">
            <MapPin />
            <input
              type="text"
              className="discover-trips-city"
              placeholder="Filter by city (e.g. Djerba)"
              aria-label="Filter by city"
              value={cityInput}
              onChange={(e) => setCityInput(e.target.value)}
            />
          </span>
          <span className="discover-trips-select-wrap">
            <CalendarDays />
            <select
              className="discover-trips-days"
              aria-label="Trip length"
              value={days}
              onChange={(e) => setDays(e.target.value)}
            >
              <option value="">Any length</option>
              <option value="1-3">1–3 days</option>
              <option value="4-7">4–7 days</option>
              <option value="8-14">8–14 days</option>
              <option value="15-30">15+ days</option>
            </select>
          </span>
        </div>
      </div>

      <div className="discover-trips-grid">
        {isLoading ? (
          <CardGridSkeleton count={6} label="Loading trips" />
        ) : isError ? (
          <p className="text-muted" style={{ padding: 'var(--space-3)' }}>Could not load trips.</p>
        ) : (data || []).length === 0 ? (
          <div className="empty-state">
            <SearchX />
            <h3>No trips match</h3>
            <p>Try a different city or duration — or build the first trip yourself.</p>
            <a className="btn btn-primary" href="#/explore"><Compass /> Browse places</a>
          </div>
        ) : (
          (data || []).map((t) => <TripCard key={t.slug} t={t} />)
        )}
      </div>
    </div>
  );
}
