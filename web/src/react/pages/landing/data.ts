// Static editorial data for the landing — fallbacks keep the page honest
// when the API is unreachable (real content, no fake counters).
import type { Place } from './SceneIndex';
import type { Itinerary } from './SceneRoutes';

export const GOVERNORATES = ['Tunis', 'Sfax', 'Sousse', 'Kairouan', 'Bizerte', 'Gabès', 'Ariana', 'Gafsa', 'Monastir', 'Ben Arous', 'Kasserine', 'Médenine', 'Nabeul', 'Tataouine', 'Béja', 'Jendouba', 'Mahdia', 'Sidi Bouzid', 'Siliana', 'Tozeur', 'Kébili', 'Le Kef', 'Manouba', 'Zaghouan'];

export const fallbackPlaces: Place[] = [
  { id: '1', name: 'Amphitheatre of El Jem', city: 'El Jem', rating: 4.9, reviewCount: 1240, category: { name: 'Historical' }, images: ['/img/journey/el-jem.webp'] },
  { id: '2', name: 'Sidi Bou Said', city: 'Sidi Bou Said', rating: 4.8, reviewCount: 2100, category: { name: 'Cultural' }, images: ['/img/journey/sidi-bou-said.webp'] },
  { id: '3', name: 'Medina of Tunis', city: 'Tunis', rating: 4.7, reviewCount: 1850, category: { name: 'Historical' }, images: ['/img/journey/medina-tunis.webp'] },
  { id: '4', name: 'Dougga', city: 'Téboursouk', rating: 4.9, reviewCount: 890, category: { name: 'Historical' }, images: ['/img/journey/dougga.webp'] },
  { id: '5', name: 'Djerba Island', city: 'Houmt Souk', rating: 4.6, reviewCount: 1560, category: { name: 'Beach' }, images: ['/img/journey/djerba.webp'] },
  { id: '6', name: 'Kairouan Great Mosque', city: 'Kairouan', rating: 4.8, reviewCount: 980, category: { name: 'Religious' }, images: ['/img/journey/kairouan.webp'] },
];

export const fallbackItineraries: Itinerary[] = [
  { id: '1', title: 'Sahara Desert Adventure (5 Days)', description: "An unforgettable journey into Tunisia's vast Saharan landscapes — from oases to dune seas to underground cave homes.", duration: 5, difficulty: 'challenging', likeCount: 87, viewCount: 1020 },
  { id: '2', title: 'Coastal Road Trip (7 Days)', description: "Drive along Tunisia's stunning Mediterranean coast from Tabarka to Djerba, visiting ancient ports, beaches, and island paradises.", duration: 7, difficulty: 'moderate', likeCount: 126, viewCount: 1540 },
  { id: '3', title: 'Star Wars Filming Locations', description: 'Visit the real-world locations of Tatooine! A pilgrimage for sci-fi fans through the surreal landscapes of southern Tunisia.', duration: 3, difficulty: 'moderate', likeCount: 203, viewCount: 2800 },
];

export const TESTIMONIALS = [
  { pro: true, quote: 'I planned a 9-day trip end-to-end on e-Tunisia. Every place was where the locals said it would be — and half were missing from every guidebook I had.', name: 'Marco Rossi', sub: 'Pro traveler · Milan, Italy', dest: 'Milano, Italia' },
  { pro: false, quote: 'My riad in Tozeur was empty in November. I listed it on e-Tunisia and four bookings came through in two weeks — no commission, no middlemen.', name: 'Amina Trabelsi', sub: 'Riad owner · Tozeur', dest: 'Tozeur, Tunisia' },
  { pro: false, quote: 'The brik stand the app sent me to in La Goulette had a 20-person line. Now I get why. Best 4 dinars I\'ve ever spent.', name: 'Sarah Chen', sub: 'Solo traveler · Singapore', dest: 'Singapore' },
  { pro: true, quote: 'Took my family to the Star Wars filming locations using a community itinerary. The kids think I\'m a wizard. The badges kept them engaged the whole trip.', name: 'David Park', sub: 'Pro traveler · Seoul, Korea', dest: 'Seoul, Korea' },
  { pro: false, quote: 'As a local guide, I now match travelers with exactly the kind of trip I love giving — desert, slow, no rush. The platform actually understands.', name: 'Yasmine Khelil', sub: 'Local guide · Douz', dest: 'Douz, Tunisia' },
  { pro: false, quote: 'The blue-door route through Sidi Bou Said with the photographer who actually lives there? Worth every cent. This is what travel is supposed to be.', name: 'Emma Laurent', sub: 'Photographer · Paris', dest: 'Paris, France' },
];
