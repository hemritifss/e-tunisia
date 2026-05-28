import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Search, X, ArrowRight, MessageSquare, Star } from 'lucide-react';
import * as api from '../../api';

// Migrated from vanilla pages/map.ts — Leaflet map of Tunisia.
// Fixes a latent bug: the vanilla called api.getActiveTravelers without importing `api`.

interface MapPlace {
  id: string; name: string; lat: number; lng: number; category: string; categoryClass: string;
  rating: number; image: string; description: string; postCount: number; reviewCount: number;
  comments: { author: string; text: string }[];
}

const mapPlaces: MapPlace[] = [
  { id: 'sidi-bou-said', name: 'Sidi Bou Said', lat: 36.8708, lng: 10.3475, category: 'Culture', categoryClass: 'cat-culture', rating: 4.8, image: 'https://images.unsplash.com/photo-1680600855512-441b69ef3d18?w=400&q=80', description: 'Iconic blue-and-white clifftop village overlooking the Gulf of Tunis. Famous for its Mediterranean architecture and Cafe des Nattes.', postCount: 47, reviewCount: 1247, comments: [{ author: 'Sarah C.', text: 'The sunset view is absolutely breathtaking!' }, { author: 'Marco R.', text: 'Best mint tea at Cafe des Nattes.' }, { author: 'Yasmine K.', text: 'Visit on weekday mornings to avoid crowds.' }] },
  { id: 'carthage', name: 'Carthage', lat: 36.8525, lng: 10.3347, category: 'Historical', categoryClass: 'cat-historical', rating: 4.6, image: 'https://images.unsplash.com/photo-1770712857881-2133f72fcab7?w=400&q=80', description: 'Ancient Phoenician city and UNESCO World Heritage Site. Home to the Antonine Baths and Byrsa Hill ruins.', postCount: 32, reviewCount: 892, comments: [{ author: 'David P.', text: 'Arrive at 8 AM for zero crowds!' }, { author: 'Emma L.', text: 'The museum on Byrsa Hill is a must-see.' }, { author: 'Ahmed B.', text: 'Incredible history spanning millennia.' }] },
  { id: 'djerba', name: 'Djerba Island', lat: 33.8076, lng: 10.8451, category: 'Beaches', categoryClass: 'cat-beaches', rating: 4.7, image: 'https://images.unsplash.com/photo-1598554200951-b9f36526ecd9?w=400&q=80', description: 'Largest island in North Africa with stunning beaches, ancient synagogue, and incredible street art in Erriadh village.', postCount: 41, reviewCount: 1056, comments: [{ author: 'Emma L.', text: 'Rivals the Greek islands at a fraction of the price.' }, { author: 'Amina T.', text: 'The Erriadh street art is world-class.' }, { author: 'Marco R.', text: 'Crystal-clear water and amazing seafood.' }] },
  { id: 'douz', name: 'Sahara Desert / Douz', lat: 33.4667, lng: 8.9833, category: 'Adventure', categoryClass: 'cat-adventure', rating: 4.9, image: 'https://images.unsplash.com/photo-1689742855019-a09e208930e8?w=400&q=80', description: 'Gateway to the Sahara with camel treks, desert camps, and star-lit nights. The silence of the desert at night is otherworldly.', postCount: 63, reviewCount: 634, comments: [{ author: 'Marco R.', text: 'The starfield with zero light pollution is unreal.' }, { author: 'Sarah C.', text: 'Book a desert camp - unforgettable experience.' }, { author: 'Nadia K.', text: 'Best during cooler months (Oct-Mar).' }] },
  { id: 'medina-tunis', name: 'Medina of Tunis', lat: 36.7989, lng: 10.17, category: 'Culture', categoryClass: 'cat-culture', rating: 4.5, image: 'https://images.unsplash.com/photo-1677942269665-1a08bf81d362?w=400&q=80', description: 'UNESCO-listed medieval medina with vibrant souks, historic mosques, and the famous Ez-Zitouna Mosque at its heart.', postCount: 89, reviewCount: 789, comments: [{ author: 'Karim M.', text: 'Bargain at 40% of asking price - they expect it!' }, { author: 'Fatma C.', text: 'Try the lablabi for breakfast nearby.' }, { author: 'Julia W.', text: 'So many hidden gems in the side alleys.' }] },
  { id: 'el-jem', name: 'El Jem Amphitheatre', lat: 35.2969, lng: 10.7078, category: 'Historical', categoryClass: 'cat-historical', rating: 4.7, image: 'https://images.unsplash.com/photo-1611094184403-df84cdcc7523?w=400&q=80', description: 'Third-largest Roman amphitheatre in the world, remarkably preserved. A stunning testament to Roman engineering.', postCount: 28, reviewCount: 567, comments: [{ author: 'David P.', text: 'More impressive than the Colosseum in some ways.' }, { author: 'Amina T.', text: 'The acoustics inside are incredible.' }, { author: 'Sarah C.', text: 'Visit during golden hour for the best photos.' }] },
  { id: 'tabarka', name: 'Tabarka', lat: 36.9544, lng: 8.7581, category: 'Nature', categoryClass: 'cat-nature', rating: 4.4, image: 'https://images.unsplash.com/photo-1653173449794-09b4ec96a17f?w=400&q=80', description: 'Coral coast town with pine forests, diving spots, and a Genoese fort. Home to the famous Jazz Festival every summer.', postCount: 19, reviewCount: 342, comments: [{ author: 'Amina T.', text: 'The coral diving here is fantastic!' }, { author: 'Omar J.', text: 'Jazz Festival in summer is a must-attend.' }, { author: 'Julia W.', text: 'Pine forests meeting the sea - so peaceful.' }] },
  { id: 'sousse', name: 'Sousse Medina', lat: 35.8288, lng: 10.6369, category: 'Culture', categoryClass: 'cat-culture', rating: 4.3, image: 'https://images.unsplash.com/photo-1665083766545-a5b0b11fc4f3?w=400&q=80', description: 'Fortified old town with the iconic Ribat fortress and bustling markets. A UNESCO World Heritage coastal gem.', postCount: 24, reviewCount: 456, comments: [{ author: 'Emma L.', text: 'The Ribat offers stunning panoramic views.' }, { author: 'Karim M.', text: 'Great base for exploring the Sahel region.' }, { author: 'Marco R.', text: 'Night markets have incredible atmosphere.' }] },
  { id: 'kairouan', name: 'Kairouan', lat: 35.6781, lng: 10.0963, category: 'Historical', categoryClass: 'cat-historical', rating: 4.6, image: 'https://images.unsplash.com/photo-1590071089561-0e9b2f567ae9?w=400&q=80', description: 'Fourth holiest city in Islam with the Great Mosque, one of the oldest and most prestigious in the Western Islamic world.', postCount: 35, reviewCount: 623, comments: [{ author: 'Omar J.', text: 'The Great Mosque is architecturally stunning.' }, { author: 'Ahmed B.', text: "Don't miss the traditional makroudh pastries." }, { author: 'Nadia K.', text: 'Rich history spanning over a thousand years.' }] },
  { id: 'tozeur', name: 'Tozeur', lat: 33.9197, lng: 8.1339, category: 'Adventure', categoryClass: 'cat-adventure', rating: 4.5, image: 'https://images.unsplash.com/photo-1596394723269-e3e2b8140547?w=400&q=80', description: 'Desert oasis city with stunning palm groves, unique brick architecture, and gateway to the Chott el Jerid salt lake.', postCount: 22, reviewCount: 478, comments: [{ author: 'Marco R.', text: 'Chott el Jerid at sunset is surreal.' }, { author: 'Sarah C.', text: 'The old town brick architecture is unique.' }, { author: 'David P.', text: 'Star Wars was filmed nearby - cool to visit sets.' }] },
  { id: 'hammamet', name: 'Hammamet', lat: 36.4, lng: 10.6167, category: 'Beaches', categoryClass: 'cat-beaches', rating: 4.4, image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=80', description: 'Premier beach resort town with golden sand, luxury hotels, and a charming old medina on the waterfront.', postCount: 31, reviewCount: 534, comments: [{ author: 'Emma L.', text: 'Perfect beach vacation destination!' }, { author: 'Julia W.', text: 'The old medina by the sea is lovely.' }, { author: 'Yasmine K.', text: 'Great nightlife and restaurants.' }] },
  { id: 'bizerte', name: 'Bizerte', lat: 37.2747, lng: 9.8739, category: 'Nature', categoryClass: 'cat-nature', rating: 4.2, image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&q=80', description: 'Northernmost city in Africa with a picturesque old port, Kasbah fortress, and access to nearby nature reserves.', postCount: 15, reviewCount: 289, comments: [{ author: 'Amina T.', text: 'The old port is incredibly photogenic.' }, { author: 'Ahmed B.', text: 'Ichkeul National Park is nearby - great birding.' }, { author: 'Nadia K.', text: 'Fresh seafood straight from the boats.' }] },
];

const categoryColors: Record<string, string> = {
  Culture: 'oklch(58% 0.2 290)', Historical: 'oklch(80% 0.1 75)', Beaches: 'oklch(72% 0.18 200)',
  Adventure: 'oklch(55% 0.16 30)', Nature: 'oklch(57% 0.13 145)', 'Food & Drink': 'oklch(67% 0.19 25)',
};
const categoryIcons: Record<string, string> = { Culture: 'palette', Historical: 'landmark', Beaches: 'waves', Adventure: 'mountain', Nature: 'leaf', 'Food & Drink': 'utensils' };
const mapCategories = [
  { id: 'all', name: 'All', tint: 'var(--text-secondary)' },
  { id: 'Historical', name: 'Historical', tint: 'var(--sand)' },
  { id: 'Culture', name: 'Culture', tint: 'var(--violet)' },
  { id: 'Beaches', name: 'Beaches', tint: 'var(--cyan)' },
  { id: 'Adventure', name: 'Adventure', tint: 'var(--terracotta)' },
  { id: 'Nature', name: 'Nature', tint: 'var(--olive)' },
  { id: 'Food & Drink', name: 'Food', tint: 'var(--coral)' },
];

const svgIcons: Record<string, string> = {
  palette: '<path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.93 0 1.4-.7 1.4-1.5 0-.4-.13-.72-.35-1-.22-.28-.35-.6-.35-1 0-.83.67-1.5 1.5-1.5H16c3.31 0 6-2.69 6-6 0-5.52-4.48-10-10-10z"/>',
  landmark: '<line x1="3" y1="22" x2="21" y2="22"/><line x1="6" y1="18" x2="6" y2="11"/><line x1="10" y1="18" x2="10" y2="11"/><line x1="14" y1="18" x2="14" y2="11"/><line x1="18" y1="18" x2="18" y2="11"/><polygon points="12 2 20 7 4 7"/>',
  waves: '<path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>',
  mountain: '<path d="m8 3 4 8 5-5 5 15H2L8 3z"/>',
  leaf: '<path d="M11 20A7 7 0 0 1 9.8 6.9C15.5 4.9 17 3.5 19 2c1 2 2 4.5 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>',
  utensils: '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>',
};

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
  const color = categoryColors[place.category] || 'oklch(67% 0.19 25)';
  return `
    <div class="map-popup-content">
      <div class="map-popup-image" style="background-image: url('${place.image}')">
        <span class="map-popup-badge" style="background: ${color}">${place.category}</span>
      </div>
      <div class="map-popup-body">
        <h3 class="map-popup-title">${place.name}</h3>
        <div class="map-popup-rating"><div class="map-popup-stars">${starsHtml(place.rating)}</div><span class="map-popup-rating-num">${place.rating}</span></div>
        <p class="map-popup-desc">${place.description}</p>
        <div class="map-popup-comments">
          ${place.comments.map((c) => `<div class="map-popup-comment"><span class="map-popup-comment-author">${c.author}</span><span class="map-popup-comment-text">"${c.text}"</span></div>`).join('')}
        </div>
        <a href="#/explore" class="map-popup-btn" style="background: ${color}">View Posts</a>
      </div>
    </div>`;
}

function markerIcon(place: MapPlace): L.DivIcon {
  const color = categoryColors[place.category] || 'oklch(67% 0.19 25)';
  const svgPath = svgIcons[categoryIcons[place.category]] || svgIcons.landmark;
  return L.divIcon({
    className: 'map-custom-marker',
    html: `<div class="map-marker-pin" style="--marker-color: ${color}"><div class="map-marker-inner"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${svgPath}</svg></div><div class="map-marker-pulse" style="--marker-color: ${color}"></div></div>`,
    iconSize: [40, 52], iconAnchor: [20, 52], popupAnchor: [0, -52],
  });
}

export default function MapPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ marker: L.Marker; place: MapPlace }[]>([]);

  const [activeCat, setActiveCat] = useState('all');
  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [selected, setSelected] = useState<MapPlace | null>(null);

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

    mapPlaces.forEach((place, index) => {
      const marker = L.marker([place.lat, place.lng], { icon: markerIcon(place), opacity: 0 }).addTo(map);
      setTimeout(() => {
        marker.setOpacity(1);
        marker.getElement()?.classList.add('map-marker-animate-in');
      }, 100 + index * 80);
      marker.bindPopup(L.popup({ maxWidth: 320, minWidth: 280, className: 'map-custom-popup', closeButton: true, autoPan: true }).setContent(popupHtml(place)));
      marker.on('click', () => setSelected(place));
      markersRef.current.push({ marker, place });
    });

    // Active traveler pins — real data (vanilla forgot to import `api`, breaking this).
    api.getActiveTravelers(30).then((travelers: any[]) => {
      (travelers || []).forEach((t, index) => {
        const icon = L.divIcon({
          className: 'map-traveler-marker',
          html: `<div class="map-traveler-avatar"><img src="${t.avatar || 'https://api.dicebear.com/9.x/thumbs/svg?seed=' + (t.handle || t.userId)}" alt="" /></div>`,
          iconSize: [36, 36], iconAnchor: [18, 18],
        });
        const m = L.marker([t.lat, t.lng], { icon, opacity: 0 }).addTo(map);
        setTimeout(() => { m.setOpacity(1); m.getElement()?.classList.add('map-marker-animate-in'); }, 100 + index * 60);
        m.bindPopup(L.popup({ maxWidth: 240, className: 'map-traveler-popup' }).setContent(
          `<div class="map-traveler-popup-content"><strong>${t.fullName || 'Traveler'}</strong>${t.handle ? `<div class="map-traveler-handle">@${t.handle}</div>` : ''}<div class="map-traveler-place">📍 ${t.placeName || t.city || ''}</div><a href="#/u/${t.handle || t.userId}" class="map-traveler-link">View profile →</a></div>`,
        ));
      });
    }).catch(() => { /* travelers optional */ });

    setTimeout(() => map.invalidateSize(), 100);

    return () => { map.remove(); mapRef.current = null; markersRef.current = []; };
  }, []);

  // Category filter — show/hide markers.
  useEffect(() => {
    markersRef.current.forEach(({ marker, place }) => {
      const el = marker.getElement();
      if (!el) return;
      if (activeCat === 'all' || place.category === activeCat) {
        el.style.display = '';
        el.classList.remove('map-marker-animate-in');
        requestAnimationFrame(() => el.classList.add('map-marker-animate-in'));
      } else {
        el.style.display = 'none';
      }
    });
    setSelected(null);
  }, [activeCat]);

  const matches = search.trim()
    ? mapPlaces.filter((p) => {
        const q = search.toLowerCase().trim();
        return p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
      })
    : [];

  const goToPlace = (p: MapPlace) => {
    const found = markersRef.current.find((m) => m.place.id === p.id);
    if (found && mapRef.current) {
      mapRef.current.flyTo([p.lat, p.lng], 12, { duration: 1 });
      setTimeout(() => { found.marker.openPopup(); setSelected(p); }, 1100);
    }
    setSearch('');
    setSearchOpen(false);
  };

  const selColor = selected ? (categoryColors[selected.category] || 'oklch(67% 0.19 25)') : '';

  return (
    <div className="map-page page-enter">
      <div className="map-controls">
        <div className="map-search-wrapper">
          <Search className="map-search-icon" size={16} />
          <input
            type="text" className="map-search-input" placeholder="Search places..." autoComplete="off"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setSearchOpen(!!e.target.value.trim()); }}
            onFocus={() => setSearchOpen(!!search.trim())}
            onBlur={() => setTimeout(() => setSearchOpen(false), 150)}
          />
          <div className={`map-search-results ${searchOpen ? 'open' : ''}`}>
            {searchOpen && (matches.length > 0 ? matches.map((p) => (
              <div className="map-search-item" key={p.id} onMouseDown={() => goToPlace(p)}>
                <div className="map-search-item-dot" style={{ background: categoryColors[p.category] || 'oklch(67% 0.19 25)' }} />
                <div className="map-search-item-info">
                  <div className="map-search-item-name">{p.name}</div>
                  <div className="map-search-item-cat">{p.category} · {p.rating} ★</div>
                </div>
              </div>
            )) : <div className="map-search-empty">No places found</div>)}
          </div>
        </div>
        <div className="map-filter-chips" role="tablist" aria-label="Place category filter">
          {mapCategories.map((c) => (
            <button
              key={c.id} type="button" role="tab"
              className={`map-chip ${c.id === activeCat ? 'active' : ''}`}
              style={{ ['--cat-tint']: c.tint } as React.CSSProperties}
              aria-selected={c.id === activeCat}
              onClick={() => setActiveCat(c.id)}
            >
              <span className="map-chip-dot" aria-hidden="true" />
              <span className="map-chip-label">{c.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div ref={containerRef} className="map-leaflet-container" />

      <div className={`map-info-panel ${selected ? 'open' : ''}`}>
        <button className="map-info-close" onClick={() => setSelected(null)}><X size={18} /></button>
        {selected && (
          <div className="map-info-content">
            <div className="map-info-image" style={{ backgroundImage: `url('${selected.image}')` }}>
              <span className="map-popup-badge" style={{ background: selColor }}>{selected.category}</span>
            </div>
            <h2 className="map-info-title">{selected.name}</h2>
            <div className="map-info-rating">
              <div className="map-popup-stars" dangerouslySetInnerHTML={{ __html: starsHtml(selected.rating) }} />
              <span className="map-popup-rating-num">{selected.rating}</span>
              <span className="map-info-review-count">({selected.reviewCount} reviews)</span>
            </div>
            <p className="map-info-desc">{selected.description}</p>
            <div className="map-info-stats">
              <div className="map-info-stat"><MessageSquare size={16} /> <span><strong>{selected.postCount}</strong> posts</span></div>
              <div className="map-info-stat"><Star size={16} /> <span><strong>{selected.reviewCount}</strong> reviews</span></div>
            </div>
            <div className="map-info-comments-title">Recent Opinions</div>
            <div className="map-info-comments">
              {selected.comments.map((c, i) => (
                <div className="map-info-comment" key={i}>
                  <div className="map-info-comment-author">{c.author}</div>
                  <div className="map-info-comment-text">"{c.text}"</div>
                </div>
              ))}
            </div>
            <a href="#/explore" className="map-info-btn" style={{ background: selColor }}><ArrowRight size={16} /> View Posts</a>
          </div>
        )}
      </div>
    </div>
  );
}
