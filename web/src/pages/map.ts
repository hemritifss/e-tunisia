// ============================================
// MAP PAGE - Interactive Leaflet Map
// Touristic regions of Tunisia
// ============================================

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// ---- Map marker data ----

interface MapPlace {
  id: string;
  name: string;
  lat: number;
  lng: number;
  category: string;
  categoryClass: string;
  rating: number;
  image: string;
  description: string;
  postCount: number;
  reviewCount: number;
  comments: { author: string; text: string }[];
}

const mapPlaces: MapPlace[] = [
  {
    id: 'sidi-bou-said',
    name: 'Sidi Bou Said',
    lat: 36.8708,
    lng: 10.3475,
    category: 'Culture',
    categoryClass: 'cat-culture',
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1680600855512-441b69ef3d18?w=400&q=80',
    description: 'Iconic blue-and-white clifftop village overlooking the Gulf of Tunis. Famous for its Mediterranean architecture and Cafe des Nattes.',
    postCount: 47,
    reviewCount: 1247,
    comments: [
      { author: 'Sarah C.', text: 'The sunset view is absolutely breathtaking!' },
      { author: 'Marco R.', text: 'Best mint tea at Cafe des Nattes.' },
      { author: 'Yasmine K.', text: 'Visit on weekday mornings to avoid crowds.' },
    ],
  },
  {
    id: 'carthage',
    name: 'Carthage',
    lat: 36.8525,
    lng: 10.3347,
    category: 'Historical',
    categoryClass: 'cat-historical',
    rating: 4.6,
    image: 'https://images.unsplash.com/photo-1770712857881-2133f72fcab7?w=400&q=80',
    description: 'Ancient Phoenician city and UNESCO World Heritage Site. Home to the Antonine Baths and Byrsa Hill ruins.',
    postCount: 32,
    reviewCount: 892,
    comments: [
      { author: 'David P.', text: 'Arrive at 8 AM for zero crowds!' },
      { author: 'Emma L.', text: 'The museum on Byrsa Hill is a must-see.' },
      { author: 'Ahmed B.', text: 'Incredible history spanning millennia.' },
    ],
  },
  {
    id: 'djerba',
    name: 'Djerba Island',
    lat: 33.8076,
    lng: 10.8451,
    category: 'Beaches',
    categoryClass: 'cat-beaches',
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1598554200951-b9f36526ecd9?w=400&q=80',
    description: 'Largest island in North Africa with stunning beaches, ancient synagogue, and incredible street art in Erriadh village.',
    postCount: 41,
    reviewCount: 1056,
    comments: [
      { author: 'Emma L.', text: 'Rivals the Greek islands at a fraction of the price.' },
      { author: 'Amina T.', text: 'The Erriadh street art is world-class.' },
      { author: 'Marco R.', text: 'Crystal-clear water and amazing seafood.' },
    ],
  },
  {
    id: 'douz',
    name: 'Sahara Desert / Douz',
    lat: 33.4667,
    lng: 8.9833,
    category: 'Adventure',
    categoryClass: 'cat-adventure',
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1689742855019-a09e208930e8?w=400&q=80',
    description: 'Gateway to the Sahara with camel treks, desert camps, and star-lit nights. The silence of the desert at night is otherworldly.',
    postCount: 63,
    reviewCount: 634,
    comments: [
      { author: 'Marco R.', text: 'The starfield with zero light pollution is unreal.' },
      { author: 'Sarah C.', text: 'Book a desert camp - unforgettable experience.' },
      { author: 'Nadia K.', text: 'Best during cooler months (Oct-Mar).' },
    ],
  },
  {
    id: 'medina-tunis',
    name: 'Medina of Tunis',
    lat: 36.7989,
    lng: 10.1700,
    category: 'Culture',
    categoryClass: 'cat-culture',
    rating: 4.5,
    image: 'https://images.unsplash.com/photo-1677942269665-1a08bf81d362?w=400&q=80',
    description: 'UNESCO-listed medieval medina with vibrant souks, historic mosques, and the famous Ez-Zitouna Mosque at its heart.',
    postCount: 89,
    reviewCount: 789,
    comments: [
      { author: 'Karim M.', text: 'Bargain at 40% of asking price - they expect it!' },
      { author: 'Fatma C.', text: 'Try the lablabi for breakfast nearby.' },
      { author: 'Julia W.', text: 'So many hidden gems in the side alleys.' },
    ],
  },
  {
    id: 'el-jem',
    name: 'El Jem Amphitheatre',
    lat: 35.2969,
    lng: 10.7078,
    category: 'Historical',
    categoryClass: 'cat-historical',
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1611094184403-df84cdcc7523?w=400&q=80',
    description: 'Third-largest Roman amphitheatre in the world, remarkably preserved. A stunning testament to Roman engineering.',
    postCount: 28,
    reviewCount: 567,
    comments: [
      { author: 'David P.', text: 'More impressive than the Colosseum in some ways.' },
      { author: 'Amina T.', text: 'The acoustics inside are incredible.' },
      { author: 'Sarah C.', text: 'Visit during golden hour for the best photos.' },
    ],
  },
  {
    id: 'tabarka',
    name: 'Tabarka',
    lat: 36.9544,
    lng: 8.7581,
    category: 'Nature',
    categoryClass: 'cat-nature',
    rating: 4.4,
    image: 'https://images.unsplash.com/photo-1653173449794-09b4ec96a17f?w=400&q=80',
    description: 'Coral coast town with pine forests, diving spots, and a Genoese fort. Home to the famous Jazz Festival every summer.',
    postCount: 19,
    reviewCount: 342,
    comments: [
      { author: 'Amina T.', text: 'The coral diving here is fantastic!' },
      { author: 'Omar J.', text: 'Jazz Festival in summer is a must-attend.' },
      { author: 'Julia W.', text: 'Pine forests meeting the sea - so peaceful.' },
    ],
  },
  {
    id: 'sousse',
    name: 'Sousse Medina',
    lat: 35.8288,
    lng: 10.6369,
    category: 'Culture',
    categoryClass: 'cat-culture',
    rating: 4.3,
    image: 'https://images.unsplash.com/photo-1665083766545-a5b0b11fc4f3?w=400&q=80',
    description: 'Fortified old town with the iconic Ribat fortress and bustling markets. A UNESCO World Heritage coastal gem.',
    postCount: 24,
    reviewCount: 456,
    comments: [
      { author: 'Emma L.', text: 'The Ribat offers stunning panoramic views.' },
      { author: 'Karim M.', text: 'Great base for exploring the Sahel region.' },
      { author: 'Marco R.', text: 'Night markets have incredible atmosphere.' },
    ],
  },
  {
    id: 'kairouan',
    name: 'Kairouan',
    lat: 35.6781,
    lng: 10.0963,
    category: 'Historical',
    categoryClass: 'cat-historical',
    rating: 4.6,
    image: 'https://images.unsplash.com/photo-1590071089561-0e9b2f567ae9?w=400&q=80',
    description: 'Fourth holiest city in Islam with the Great Mosque, one of the oldest and most prestigious in the Western Islamic world.',
    postCount: 35,
    reviewCount: 623,
    comments: [
      { author: 'Omar J.', text: 'The Great Mosque is architecturally stunning.' },
      { author: 'Ahmed B.', text: 'Don\'t miss the traditional makroudh pastries.' },
      { author: 'Nadia K.', text: 'Rich history spanning over a thousand years.' },
    ],
  },
  {
    id: 'tozeur',
    name: 'Tozeur',
    lat: 33.9197,
    lng: 8.1339,
    category: 'Adventure',
    categoryClass: 'cat-adventure',
    rating: 4.5,
    image: 'https://images.unsplash.com/photo-1596394723269-e3e2b8140547?w=400&q=80',
    description: 'Desert oasis city with stunning palm groves, unique brick architecture, and gateway to the Chott el Jerid salt lake.',
    postCount: 22,
    reviewCount: 478,
    comments: [
      { author: 'Marco R.', text: 'Chott el Jerid at sunset is surreal.' },
      { author: 'Sarah C.', text: 'The old town brick architecture is unique.' },
      { author: 'David P.', text: 'Star Wars was filmed nearby - cool to visit sets.' },
    ],
  },
  {
    id: 'hammamet',
    name: 'Hammamet',
    lat: 36.4000,
    lng: 10.6167,
    category: 'Beaches',
    categoryClass: 'cat-beaches',
    rating: 4.4,
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=80',
    description: 'Premier beach resort town with golden sand, luxury hotels, and a charming old medina on the waterfront.',
    postCount: 31,
    reviewCount: 534,
    comments: [
      { author: 'Emma L.', text: 'Perfect beach vacation destination!' },
      { author: 'Julia W.', text: 'The old medina by the sea is lovely.' },
      { author: 'Yasmine K.', text: 'Great nightlife and restaurants.' },
    ],
  },
  {
    id: 'bizerte',
    name: 'Bizerte',
    lat: 37.2747,
    lng: 9.8739,
    category: 'Nature',
    categoryClass: 'cat-nature',
    rating: 4.2,
    image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&q=80',
    description: 'Northernmost city in Africa with a picturesque old port, Kasbah fortress, and access to nearby nature reserves.',
    postCount: 15,
    reviewCount: 289,
    comments: [
      { author: 'Amina T.', text: 'The old port is incredibly photogenic.' },
      { author: 'Ahmed B.', text: 'Ichkeul National Park is nearby - great birding.' },
      { author: 'Nadia K.', text: 'Fresh seafood straight from the boats.' },
    ],
  },
];

// Category color map
const categoryColors: Record<string, string> = {
  'Culture': '#9b59b6',
  'Historical': '#c8a04a',
  'Beaches': '#2e86c1',
  'Adventure': '#d4a537',
  'Nature': '#27ae60',
  'Food & Drink': '#c0392b',
};

const categoryIcons: Record<string, string> = {
  'Culture': 'palette',
  'Historical': 'landmark',
  'Beaches': 'waves',
  'Adventure': 'mountain',
  'Nature': 'leaf',
  'Food & Drink': 'utensils',
};

// Filter categories for the map
const mapCategories = [
  { id: 'all', name: 'All', icon: 'layers' },
  { id: 'Historical', name: 'Historical', icon: 'landmark' },
  { id: 'Culture', name: 'Culture', icon: 'palette' },
  { id: 'Beaches', name: 'Beaches', icon: 'waves' },
  { id: 'Adventure', name: 'Adventure', icon: 'mountain' },
  { id: 'Nature', name: 'Nature', icon: 'leaf' },
  { id: 'Food & Drink', name: 'Food', icon: 'utensils' },
];

// ---- Star rating HTML ----
function renderStars(rating: number): string {
  const full = Math.floor(rating);
  const hasHalf = rating - full >= 0.3;
  let stars = '';
  for (let i = 0; i < 5; i++) {
    if (i < full) {
      stars += '<span class="map-star filled">&#9733;</span>';
    } else if (i === full && hasHalf) {
      stars += '<span class="map-star half">&#9733;</span>';
    } else {
      stars += '<span class="map-star">&#9733;</span>';
    }
  }
  return stars;
}

// ---- Popup HTML ----
function createPopupContent(place: MapPlace): string {
  const color = categoryColors[place.category] || '#c0392b';
  return `
    <div class="map-popup-content">
      <div class="map-popup-image" style="background-image: url('${place.image}')">
        <span class="map-popup-badge" style="background: ${color}">${place.category}</span>
      </div>
      <div class="map-popup-body">
        <h3 class="map-popup-title">${place.name}</h3>
        <div class="map-popup-rating">
          <div class="map-popup-stars">${renderStars(place.rating)}</div>
          <span class="map-popup-rating-num">${place.rating}</span>
        </div>
        <p class="map-popup-desc">${place.description}</p>
        <div class="map-popup-stats">
          <span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> ${place.postCount} posts</span>
          <span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> ${place.reviewCount} reviews</span>
        </div>
        <div class="map-popup-comments">
          ${place.comments.map(c => `
            <div class="map-popup-comment">
              <span class="map-popup-comment-author">${c.author}</span>
              <span class="map-popup-comment-text">"${c.text}"</span>
            </div>
          `).join('')}
        </div>
        <a href="#/explore" class="map-popup-btn" style="background: ${color}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          View Posts
        </a>
      </div>
    </div>
  `;
}

// ---- Create custom marker icon ----
function createMarkerIcon(place: MapPlace): L.DivIcon {
  const color = categoryColors[place.category] || '#c0392b';
  const iconName = categoryIcons[place.category] || 'map-pin';

  // SVG icons for each category
  const svgIcons: Record<string, string> = {
    palette: '<path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.93 0 1.4-.7 1.4-1.5 0-.4-.13-.72-.35-1-.22-.28-.35-.6-.35-1 0-.83.67-1.5 1.5-1.5H16c3.31 0 6-2.69 6-6 0-5.52-4.48-10-10-10z"/>',
    landmark: '<line x1="3" y1="22" x2="21" y2="22"/><line x1="6" y1="18" x2="6" y2="11"/><line x1="10" y1="18" x2="10" y2="11"/><line x1="14" y1="18" x2="14" y2="11"/><line x1="18" y1="18" x2="18" y2="11"/><polygon points="12 2 20 7 4 7"/>',
    waves: '<path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>',
    mountain: '<path d="m8 3 4 8 5-5 5 15H2L8 3z"/>',
    leaf: '<path d="M11 20A7 7 0 0 1 9.8 6.9C15.5 4.9 17 3.5 19 2c1 2 2 4.5 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>',
    utensils: '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>',
  };

  const svgPath = svgIcons[iconName] || svgIcons.landmark;

  return L.divIcon({
    className: 'map-custom-marker',
    html: `
      <div class="map-marker-pin" style="--marker-color: ${color}">
        <div class="map-marker-inner">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${svgPath}</svg>
        </div>
        <div class="map-marker-pulse" style="--marker-color: ${color}"></div>
      </div>
    `,
    iconSize: [40, 52],
    iconAnchor: [20, 52],
    popupAnchor: [0, -52],
  });
}

// ---- Render ----

export function renderMapPage(): string {
  return `
    <div class="map-page page-enter">
      <div class="map-controls">
        <div class="map-search-wrapper">
          <svg class="map-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" class="map-search-input" id="map-search" placeholder="Search places..." autocomplete="off" />
          <div class="map-search-results" id="map-search-results"></div>
        </div>
        <div class="map-filter-chips" id="map-filter-chips">
          ${mapCategories.map(c => `
            <button class="map-chip ${c.id === 'all' ? 'active' : ''}" data-cat="${c.id}">
              ${c.name}
            </button>
          `).join('')}
        </div>
      </div>
      <div id="map-container" class="map-leaflet-container"></div>
      <div class="map-info-panel" id="map-info-panel">
        <button class="map-info-close" id="map-info-close">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
        <div class="map-info-content" id="map-info-content"></div>
      </div>
    </div>
  `;
}

// ---- Info panel content ----
function renderInfoPanel(place: MapPlace): string {
  const color = categoryColors[place.category] || '#c0392b';
  return `
    <div class="map-info-image" style="background-image: url('${place.image}')">
      <span class="map-popup-badge" style="background: ${color}">${place.category}</span>
    </div>
    <h2 class="map-info-title">${place.name}</h2>
    <div class="map-info-rating">
      <div class="map-popup-stars">${renderStars(place.rating)}</div>
      <span class="map-popup-rating-num">${place.rating}</span>
      <span class="map-info-review-count">(${place.reviewCount} reviews)</span>
    </div>
    <p class="map-info-desc">${place.description}</p>
    <div class="map-info-stats">
      <div class="map-info-stat">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        <span><strong>${place.postCount}</strong> posts</span>
      </div>
      <div class="map-info-stat">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        <span><strong>${place.reviewCount}</strong> reviews</span>
      </div>
    </div>
    <div class="map-info-comments-title">Recent Opinions</div>
    <div class="map-info-comments">
      ${place.comments.map(c => `
        <div class="map-info-comment">
          <div class="map-info-comment-author">${c.author}</div>
          <div class="map-info-comment-text">"${c.text}"</div>
        </div>
      `).join('')}
    </div>
    <a href="#/explore" class="map-info-btn" style="background: ${color}">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
      View Posts
    </a>
  `;
}

// ---- Init ----

let mapInstance: L.Map | null = null;
let markers: { marker: L.Marker; place: MapPlace }[] = [];

export function initMapPage() {
  // Destroy previous map instance if exists
  if (mapInstance) {
    mapInstance.remove();
    mapInstance = null;
  }
  markers = [];

  const container = document.getElementById('map-container');
  if (!container) return;

  // Init Leaflet map
  mapInstance = L.map(container, {
    center: [34.8, 9.5],
    zoom: 7,
    minZoom: 6,
    zoomControl: false,
    attributionControl: true,
  });

  // Add zoom control to bottom-right
  L.control.zoom({ position: 'bottomright' }).addTo(mapInstance);

  // CartoDB Voyager tile layer (elegant, free, no API key)
  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19,
  }).addTo(mapInstance);

  // Add markers with staggered animation
  mapPlaces.forEach((place, index) => {
    const icon = createMarkerIcon(place);
    const marker = L.marker([place.lat, place.lng], { icon, opacity: 0 }).addTo(mapInstance!);

    // Staggered fade-in
    setTimeout(() => {
      marker.setOpacity(1);
      const el = marker.getElement();
      if (el) {
        el.classList.add('map-marker-animate-in');
      }
    }, 100 + index * 80);

    // Popup
    const popup = L.popup({
      maxWidth: 320,
      minWidth: 280,
      className: 'map-custom-popup',
      closeButton: true,
      autoPan: true,
      autoPanPaddingTopLeft: L.point(50, 80),
      autoPanPaddingBottomRight: L.point(50, 50),
    }).setContent(createPopupContent(place));

    marker.bindPopup(popup);

    // Show info panel on click
    marker.on('click', () => {
      showInfoPanel(place);
    });

    markers.push({ marker, place });
  });

  // ---- Category filter ----
  const chips = document.querySelectorAll('.map-chip');
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      chips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      const cat = (chip as HTMLElement).dataset.cat || 'all';
      filterMarkers(cat);
    });
  });

  // ---- Search ----
  const searchInput = document.getElementById('map-search') as HTMLInputElement;
  const searchResults = document.getElementById('map-search-results');

  searchInput?.addEventListener('input', () => {
    const query = searchInput.value.toLowerCase().trim();
    if (!query) {
      if (searchResults) searchResults.classList.remove('open');
      return;
    }

    const matches = mapPlaces.filter(p =>
      p.name.toLowerCase().includes(query) ||
      p.category.toLowerCase().includes(query) ||
      p.description.toLowerCase().includes(query)
    );

    if (matches.length > 0 && searchResults) {
      searchResults.innerHTML = matches.map(p => {
        const color = categoryColors[p.category] || '#c0392b';
        return `
          <div class="map-search-item" data-place-id="${p.id}">
            <div class="map-search-item-dot" style="background: ${color}"></div>
            <div class="map-search-item-info">
              <div class="map-search-item-name">${p.name}</div>
              <div class="map-search-item-cat">${p.category} &middot; ${p.rating} &#9733;</div>
            </div>
          </div>
        `;
      }).join('');
      searchResults.classList.add('open');

      // Attach click handlers
      searchResults.querySelectorAll('.map-search-item').forEach(item => {
        item.addEventListener('click', () => {
          const placeId = (item as HTMLElement).dataset.placeId;
          const found = markers.find(m => m.place.id === placeId);
          if (found && mapInstance) {
            mapInstance.flyTo([found.place.lat, found.place.lng], 12, { duration: 1 });
            setTimeout(() => {
              found.marker.openPopup();
              showInfoPanel(found.place);
            }, 1100);
          }
          searchResults.classList.remove('open');
          searchInput.value = '';
        });
      });
    } else if (searchResults) {
      searchResults.innerHTML = '<div class="map-search-empty">No places found</div>';
      searchResults.classList.add('open');
    }
  });

  // Close search on click outside
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (!target.closest('.map-search-wrapper') && searchResults) {
      searchResults.classList.remove('open');
    }
  });

  // ---- Info panel close ----
  document.getElementById('map-info-close')?.addEventListener('click', () => {
    const panel = document.getElementById('map-info-panel');
    panel?.classList.remove('open');
  });

  // Force map resize after DOM settle
  setTimeout(() => {
    mapInstance?.invalidateSize();
  }, 100);
}

function filterMarkers(category: string) {
  markers.forEach(({ marker, place }) => {
    if (category === 'all' || place.category === category) {
      const el = marker.getElement();
      if (el) {
        el.style.display = '';
        // Re-trigger entrance animation on the inner pin
        const pin = el.querySelector('.map-marker-pin') as HTMLElement | null;
        if (pin) {
          pin.style.animation = 'none';
          // Force reflow
          void pin.offsetHeight;
          pin.style.animation = '';
        }
        el.classList.remove('map-marker-animate-in');
        requestAnimationFrame(() => {
          el.classList.add('map-marker-animate-in');
        });
      }
    } else {
      const el = marker.getElement();
      if (el) {
        el.style.display = 'none';
      }
    }
  });

  // Close info panel if open
  document.getElementById('map-info-panel')?.classList.remove('open');
}

function showInfoPanel(place: MapPlace) {
  const panel = document.getElementById('map-info-panel');
  const content = document.getElementById('map-info-content');
  if (panel && content) {
    content.innerHTML = renderInfoPanel(place);
    panel.classList.add('open');
  }
}
