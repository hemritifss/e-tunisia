import '../../styles/map.css';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { Search, X, ArrowRight, Loader2 } from 'lucide-react';
import * as api from '../../api';
import { useCity } from '../lib/useCity';
import { cityCenter } from '../../city-filter';
import { KontHouniButton } from '../components/KontHouniButton';

// Map of Tunisia — every real place from the database (no hardcoded demo
// data). Categories, colors and chips derive from the data itself; the info
// panel shows real reviews fetched on selection.

interface MapPlace {
  id: string; name: string; lat: number; lng: number; category: string;
  rating: number; reviewCount: number; image: string; description: string; city?: string;
}

function esc(s: unknown): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Stable palette; well-known categories keep their identity, the rest cycle.
const PALETTE = [
  'oklch(58% 0.2 290)', 'oklch(80% 0.1 75)', 'oklch(72% 0.18 200)',
  'oklch(55% 0.16 30)', 'oklch(57% 0.13 145)', 'oklch(67% 0.19 25)',
  'oklch(62% 0.14 240)', 'oklch(70% 0.15 55)',
];
const KNOWN_COLORS: Record<string, string> = {
  'Historical Sites': 'oklch(80% 0.1 75)', Historical: 'oklch(80% 0.1 75)',
  Culture: 'oklch(58% 0.2 290)', Artisanat: 'oklch(58% 0.2 290)',
  Beaches: 'oklch(72% 0.18 200)', Nature: 'oklch(57% 0.13 145)',
  Adventure: 'oklch(55% 0.16 30)', 'Food & Drink': 'oklch(67% 0.19 25)',
  Restaurants: 'oklch(67% 0.19 25)', Hotels: 'oklch(62% 0.14 240)',
  Museums: 'oklch(58% 0.2 290)', Festivals: 'oklch(70% 0.15 55)',
};
function categoryColor(cat: string): string {
  if (KNOWN_COLORS[cat]) return KNOWN_COLORS[cat];
  let h = 0;
  for (let i = 0; i < cat.length; i++) h = (h * 31 + cat.charCodeAt(i)) | 0;
  return PALETTE[Math.abs(h) % PALETTE.length];
}

const SVG_ICONS: Record<string, string> = {
  palette: '<path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.93 0 1.4-.7 1.4-1.5 0-.4-.13-.72-.35-1-.22-.28-.35-.6-.35-1 0-.83.67-1.5 1.5-1.5H16c3.31 0 6-2.69 6-6 0-5.52-4.48-10-10-10z"/>',
  landmark: '<line x1="3" y1="22" x2="21" y2="22"/><line x1="6" y1="18" x2="6" y2="11"/><line x1="10" y1="18" x2="10" y2="11"/><line x1="14" y1="18" x2="14" y2="11"/><line x1="18" y1="18" x2="18" y2="11"/><polygon points="12 2 20 7 4 7"/>',
  waves: '<path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>',
  mountain: '<path d="m8 3 4 8 5-5 5 15H2L8 3z"/>',
  leaf: '<path d="M11 20A7 7 0 0 1 9.8 6.9C15.5 4.9 17 3.5 19 2c1 2 2 4.5 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>',
  utensils: '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>',
  bed: '<path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/>',
  pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
};
const KNOWN_ICONS: Record<string, string> = {
  Culture: 'palette', Artisanat: 'palette', Museums: 'palette',
  'Historical Sites': 'landmark', Historical: 'landmark',
  Beaches: 'waves', Adventure: 'mountain', Nature: 'leaf',
  'Food & Drink': 'utensils', Restaurants: 'utensils', Cafes: 'utensils',
  Hotels: 'bed', Festivals: 'palette',
};
const categoryIcon = (cat: string) => SVG_ICONS[KNOWN_ICONS[cat] || 'pin'] || SVG_ICONS.pin;

function starsHtml(rating: number): string {
  const full = Math.floor(rating);
  const hasHalf = rating - full >= 0.3;
  let s = '';
  for (let i = 0; i < 5; i++) {
    if (i < full) s += '<span class="map-star filled">&#9733;</span>';
    else if (i === full && hasHalf) s += '<span class="map-star half">&#9733;</span>';
    else s += '<span class="map-star">&#9733;</span>';
  }
  return s;
}

function popupHtml(place: MapPlace): string {
  const color = categoryColor(place.category);
  return `
    <div class="map-popup-content">
      <div class="map-popup-image" style="background-image: url('${esc(place.image)}')">
        <span class="map-popup-badge" style="background: ${color}">${esc(place.category)}</span>
      </div>
      <div class="map-popup-body">
        <h3 class="map-popup-title">${esc(place.name)}</h3>
        ${place.rating > 0 ? `<div class="map-popup-rating"><div class="map-popup-stars">${starsHtml(place.rating)}</div><span class="map-popup-rating-num">${place.rating.toFixed(1)}</span></div>` : ''}
        <p class="map-popup-desc">${esc(place.description.slice(0, 160))}${place.description.length > 160 ? '…' : ''}</p>
        <a href="#/place/${esc(place.id)}" class="map-popup-btn" style="background: ${color}">View place</a>
      </div>
    </div>`;
}

function markerIcon(place: MapPlace): L.DivIcon {
  const color = categoryColor(place.category);
  return L.divIcon({
    className: 'map-custom-marker',
    html: `<div class="map-marker-pin" style="--marker-color: ${color}"><div class="map-marker-inner"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${categoryIcon(place.category)}</svg></div><div class="map-marker-pulse" style="--marker-color: ${color}"></div></div>`,
    iconSize: [40, 52], iconAnchor: [20, 52], popupAnchor: [0, -52],
  });
}

/** Page through /places until done — the WHOLE catalog goes on the map. */
async function loadAllPlaces(): Promise<MapPlace[]> {
  const out: MapPlace[] = [];
  for (let page = 1; page <= 8; page++) {
    const res: any = await api.getPlaces({ page: String(page), limit: '100' });
    const arr: any[] = res?.data || (Array.isArray(res) ? res : []);
    for (const p of arr) {
      const lat = Number(p.latitude), lng = Number(p.longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
      out.push({
        id: p.id,
        name: p.name || 'Place',
        lat, lng,
        category: p.category?.name || p.categoryName || 'Other',
        rating: Number(p.rating) || 0,
        reviewCount: Number(p.reviewCount ?? p.reviewsCount) || 0,
        image: api.getImageUrl(p.coverImage || p.images?.[0], 'place'),
        description: String(p.description || ''),
        city: p.city || undefined,
      });
    }
    const totalPages = res?.meta?.totalPages;
    if (!arr.length || (totalPages && page >= totalPages)) break;
  }
  return out;
}

export default function MapPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ marker: L.Marker; place: MapPlace }[]>([]);
  const clusterRef = useRef<any>(null); // L.MarkerClusterGroup

  const [places, setPlaces] = useState<MapPlace[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCat, setActiveCat] = useState('all');
  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [selected, setSelected] = useState<MapPlace | null>(null);
  const [reviews, setReviews] = useState<{ author: string; text: string; rating: number }[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const globalCity = useCity();

  // Chips derive from the data: the most common categories, not a fixed list.
  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of places) counts.set(p.category, (counts.get(p.category) || 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name]) => name);
  }, [places]);

  // Init Leaflet once on mount.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, { center: [34.8, 9.5], zoom: 7, minZoom: 6, zoomControl: false, attributionControl: true });
    mapRef.current = map;
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
      subdomains: 'abcd', maxZoom: 19,
    }).addTo(map);

    // Active traveler pins — live community presence.
    api.getActiveTravelers(30).then((travelers: any[]) => {
      (travelers || []).forEach((t, index) => {
        const icon = L.divIcon({
          className: 'map-traveler-marker',
          html: `<div class="map-traveler-avatar"><img src="${esc(t.avatar || 'https://api.dicebear.com/9.x/thumbs/svg?seed=' + (t.handle || t.userId))}" alt="" /></div>`,
          iconSize: [36, 36], iconAnchor: [18, 18],
        });
        const m = L.marker([t.lat, t.lng], { icon, opacity: 0 }).addTo(map);
        setTimeout(() => { m.setOpacity(1); m.getElement()?.classList.add('map-marker-animate-in'); }, 100 + index * 60);
        m.bindPopup(L.popup({ maxWidth: 240, className: 'map-traveler-popup' }).setContent(
          `<div class="map-traveler-popup-content"><strong>${esc(t.fullName || 'Traveler')}</strong>${t.handle ? `<div class="map-traveler-handle">@${esc(t.handle)}</div>` : ''}<div class="map-traveler-place">${esc(t.placeName || t.city || '')}</div><a href="#/u/${esc(t.handle || t.userId)}" class="map-traveler-link">View profile →</a></div>`,
        ));
      });
    }).catch(() => { /* travelers optional */ });

    setTimeout(() => map.invalidateSize(), 100);
    return () => { map.remove(); mapRef.current = null; markersRef.current = []; clusterRef.current = null; };
  }, []);

  // Load the real catalog.
  useEffect(() => {
    let cancelled = false;
    loadAllPlaces()
      .then((all) => { if (!cancelled) setPlaces(all); })
      .catch(() => { /* map stays empty-but-honest; retry on next visit */ })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // (Re)create markers whenever the catalog lands. With ~800 real places we cluster
  // them (leaflet.markercluster) so dense areas (Tunis, Djerba) stay readable; the
  // category/city filter re-fills the cluster (see the filter effect below).
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !places.length) return;
    if (clusterRef.current) { map.removeLayer(clusterRef.current); clusterRef.current = null; }

    const cluster = (L as any).markerClusterGroup({
      chunkedLoading: true,
      showCoverageOnHover: false,
      maxClusterRadius: 55,
      spiderfyOnMaxZoom: true,
      disableClusteringAtZoom: 15, // individual pins once you're zoomed into a town
    });
    clusterRef.current = cluster;

    markersRef.current = places.map((place) => {
      const marker = L.marker([place.lat, place.lng], { icon: markerIcon(place) });
      marker.bindPopup(L.popup({ maxWidth: 320, minWidth: 280, className: 'map-custom-popup', closeButton: true, autoPan: true }).setContent(popupHtml(place)));
      marker.on('click', () => setSelected(place));
      return { marker, place };
    });
    map.addLayer(cluster);
    // Fill respecting the active filter (the filter effect also runs on `places`).
  }, [places]);

  // Real reviews for the selected place.
  useEffect(() => {
    if (!selected) { setReviews([]); return; }
    let cancelled = false;
    setReviewsLoading(true);
    api.getReviews(selected.id)
      .then((res: any) => {
        if (cancelled) return;
        const arr: any[] = Array.isArray(res) ? res : res?.data || [];
        setReviews(arr.slice(0, 3).map((r) => ({
          author: r.user?.fullName || 'Traveler',
          text: String(r.comment || '').slice(0, 140),
          rating: Number(r.rating) || 0,
        })));
      })
      .catch(() => { if (!cancelled) setReviews([]); })
      .finally(() => { if (!cancelled) setReviewsLoading(false); });
    return () => { cancelled = true; };
  }, [selected?.id]);

  // Category + global city filter — show/hide markers, fly to the city.
  useEffect(() => {
    const center = cityCenter(globalCity);
    const nearCity = (p: MapPlace) => {
      if (!center) return true;
      const dLat = (p.lat - center.lat) * 111;
      const dLng = (p.lng - center.lng) * 92;
      return Math.sqrt(dLat * dLat + dLng * dLng) <= 45;
    };
    // Re-fill the cluster with only the markers matching the category + city filter.
    const cluster = clusterRef.current;
    if (cluster) {
      const visible = markersRef.current
        .filter(({ place }) => (activeCat === 'all' || place.category === activeCat) && nearCity(place))
        .map(({ marker }) => marker);
      cluster.clearLayers();
      cluster.addLayers(visible);
    }
    setSelected(null);
    const map = mapRef.current;
    if (map) {
      if (center) map.flyTo([center.lat, center.lng], 10, { duration: 1 });
      else map.flyTo([34.8, 9.5], 7, { duration: 1 });
    }
  }, [activeCat, globalCity, places]);

  const matches = search.trim()
    ? places.filter((p) => {
        const q = search.toLowerCase().trim();
        return p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
      }).slice(0, 12)
    : [];

  const goToPlace = (p: MapPlace) => {
    const found = markersRef.current.find((m) => m.place.id === p.id);
    if (found && mapRef.current) {
      // Expand the enclosing cluster (if any) so the pin + popup are visible.
      const cluster = clusterRef.current;
      if (cluster && typeof cluster.zoomToShowLayer === 'function') {
        cluster.zoomToShowLayer(found.marker, () => {
          setTimeout(() => { found.marker.openPopup(); setSelected(p); }, 200);
        });
      } else {
        mapRef.current.flyTo([p.lat, p.lng], 12, { duration: 1 });
        setTimeout(() => { found.marker.openPopup(); setSelected(p); }, 1100);
      }
    }
    setSearch('');
    setSearchOpen(false);
  };

  const selColor = selected ? categoryColor(selected.category) : '';

  return (
    <div className="map-page page-enter">
      <div className="map-controls">
        <div className="map-search-wrapper">
          <Search className="map-search-icon" size={16} />
          <input
            type="text" className="map-search-input" placeholder="Search places…" autoComplete="off"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setSearchOpen(!!e.target.value.trim()); }}
            onFocus={() => setSearchOpen(!!search.trim())}
            onBlur={() => setTimeout(() => setSearchOpen(false), 150)}
          />
          <div className={`map-search-results ${searchOpen ? 'open' : ''}`}>
            {searchOpen && (matches.length > 0 ? matches.map((p) => (
              <div className="map-search-item" key={p.id} onMouseDown={() => goToPlace(p)}>
                <div className="map-search-item-dot" style={{ background: categoryColor(p.category) }} />
                <div className="map-search-item-info">
                  <div className="map-search-item-name">{p.name}</div>
                  <div className="map-search-item-cat">{p.category}{p.rating > 0 ? ` · ${p.rating.toFixed(1)} ★` : ''}</div>
                </div>
              </div>
            )) : <div className="map-search-empty">No places found</div>)}
          </div>
        </div>
        <div className="map-filter-chips" role="tablist" aria-label="Place category filter">
          <button
            type="button" role="tab"
            className={`map-chip ${activeCat === 'all' ? 'active' : ''}`}
            style={{ ['--cat-tint']: 'var(--text-secondary)' } as React.CSSProperties}
            aria-selected={activeCat === 'all'}
            onClick={() => setActiveCat('all')}
          >
            <span className="map-chip-dot" aria-hidden="true" />
            <span className="map-chip-label">All ({places.length})</span>
          </button>
          {categories.map((c) => (
            <button
              key={c} type="button" role="tab"
              className={`map-chip ${c === activeCat ? 'active' : ''}`}
              style={{ ['--cat-tint']: categoryColor(c) } as React.CSSProperties}
              aria-selected={c === activeCat}
              onClick={() => setActiveCat(c)}
            >
              <span className="map-chip-dot" aria-hidden="true" />
              <span className="map-chip-label">{c}</span>
            </button>
          ))}
        </div>
      </div>

      <div ref={containerRef} className="map-leaflet-container" />

      {loading && (
        <div className="map-loading-chip">
          <Loader2 size={14} className="spin" /> Loading {'…'}
        </div>
      )}

      <div className={`map-info-panel ${selected ? 'open' : ''}`}>
        <button className="map-info-close" onClick={() => setSelected(null)}><X size={18} /></button>
        {selected && (
          <div className="map-info-content">
            <div className="map-info-image" style={{ backgroundImage: `url('${selected.image}')` }}>
              <span className="map-popup-badge" style={{ background: selColor }}>{selected.category}</span>
            </div>
            <h2 className="map-info-title">{selected.name}</h2>
            {selected.rating > 0 && (
              <div className="map-info-rating">
                <div className="map-popup-stars" dangerouslySetInnerHTML={{ __html: starsHtml(selected.rating) }} />
                <span className="map-popup-rating-num">{selected.rating.toFixed(1)}</span>
                {selected.reviewCount > 0 && <span className="map-info-review-count">({selected.reviewCount} reviews)</span>}
              </div>
            )}
            <p className="map-info-desc">{selected.description}</p>
            <div className="map-info-comments-title">Recent Opinions</div>
            <div className="map-info-comments">
              {reviewsLoading ? (
                <div className="map-info-comment"><div className="map-info-comment-text">Loading reviews…</div></div>
              ) : reviews.length > 0 ? (
                reviews.map((c, i) => (
                  <div className="map-info-comment" key={i}>
                    <div className="map-info-comment-author">{c.author}{c.rating > 0 ? ` · ${c.rating}★` : ''}</div>
                    <div className="map-info-comment-text">"{c.text}"</div>
                  </div>
                ))
              ) : (
                <div className="map-info-comment"><div className="map-info-comment-text">No reviews yet — be the first.</div></div>
              )}
            </div>
            <div className="map-info-visit"><KontHouniButton placeId={selected.id} placeName={selected.name} city={selected.city} compact /></div>
            <a href={`#/place/${selected.id}`} className="map-info-btn" style={{ background: selColor }}><ArrowRight size={16} /> View place</a>
          </div>
        )}
      </div>
    </div>
  );
}
