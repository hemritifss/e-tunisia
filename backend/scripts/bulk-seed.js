// ============================================
// Bulk-seed real Tunisian places + reviewer users + reviews.
// Connects directly to Postgres on localhost (no NestJS bootstrap).
// Run from the host:   node backend/scripts/bulk-seed.js
// ============================================
/* eslint-disable */
const { Client } = require('pg');
const bcrypt = require('bcrypt');

const PG = {
  host: process.env.PGHOST || 'localhost',
  port: Number(process.env.PGPORT || 5432),
  user: process.env.PGUSER || 'etunisia',
  password: process.env.PGPASSWORD || 'etunisia_secret',
  database: process.env.PGDATABASE || 'etunisia',
};

// --- Image pool (Unsplash IDs — same proven sources as seed.ts) ---
const IMG = {
  roman: [
    'https://images.unsplash.com/photo-1594818379496-da1e345b0ded?w=1200',
    'https://images.unsplash.com/photo-1608922723064-0c0e82af3f93?w=1200',
    'https://images.unsplash.com/photo-1627581909893-fd4ccbb4fa4d?w=1200',
    'https://images.unsplash.com/photo-1568322445389-f64c0f4d6aab?w=1200',
    'https://images.unsplash.com/photo-1548682913-75c13e6d2cb1?w=1200',
  ],
  medina: [
    'https://images.unsplash.com/photo-1572204292164-b35ba943fca7?w=1200',
    'https://images.unsplash.com/photo-1519999482648-25049ddd37b1?w=1200',
    'https://images.unsplash.com/photo-1677942269665-1a08bf81d362?w=1200',
    'https://images.unsplash.com/photo-1611094184403-df84cdcc7523?w=1200',
  ],
  blueVillage: [
    'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=1200',
    'https://images.unsplash.com/photo-1580436542435-7c4d96da76c1?w=1200',
  ],
  mosque: [
    'https://images.unsplash.com/photo-1564769662892-7b53b6e85d4e?w=1200',
    'https://images.unsplash.com/photo-1551867633-194f125695a2?w=1200',
    'https://images.unsplash.com/photo-1604357209793-fca5dca89f97?w=1200',
  ],
  beach: [
    'https://images.unsplash.com/photo-1598554200951-b9f36526ecd9?w=1200',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200',
    'https://images.unsplash.com/photo-1493558103817-58b2924bce98?w=1200',
    'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200',
  ],
  desert: [
    'https://images.unsplash.com/photo-1689742855019-a09e208930e8?w=1200',
    'https://images.unsplash.com/photo-1509316785289-ef98d7f4e7e8?w=1200',
    'https://images.unsplash.com/photo-1473580044384-7ba9967e16a0?w=1200',
    'https://images.unsplash.com/photo-1547234935-80c7145ec969?w=1200',
  ],
  oasis: [
    'https://images.unsplash.com/photo-1573160813959-df05c1b1e1b6?w=1200',
    'https://images.unsplash.com/photo-1517457210348-703079e57d4b?w=1200',
  ],
  troglodyte: [
    'https://images.unsplash.com/photo-1559511260-66a654ae982a?w=1200',
    'https://images.unsplash.com/photo-1535357658493-c0bd75de5bfa?w=1200',
  ],
  port: [
    'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=1200',
    'https://images.unsplash.com/photo-1551918120-9739cb430c6d?w=1200',
  ],
  island: [
    'https://images.unsplash.com/photo-1653173449794-09b4ec96a17f?w=1200',
    'https://images.unsplash.com/photo-1499781350541-7783f6c6a0c8?w=1200',
  ],
  food: [
    'https://images.unsplash.com/photo-1742806418170-f051cb880314?w=1200',
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200',
    'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=1200',
  ],
  cafe: [
    'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=1200',
    'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=1200',
  ],
  hotel: [
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200',
    'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=1200',
  ],
  mountain: [
    'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200',
    'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=1200',
  ],
  nature: [
    'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1200',
    'https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=1200',
  ],
};

const pick = (arr, n = 3) => {
  const a = [...arr];
  const out = [];
  for (let i = 0; i < n && a.length; i++) {
    out.push(a.splice(Math.floor(Math.random() * a.length), 1)[0]);
  }
  return out;
};

// --- Categories will be looked up by name ---
const CAT = {
  HIST: 'Historical Sites',
  FOOD: 'Gastronomy',
  NATURE: 'Nature & Beaches',
  ART: 'Artisanat',
  FEST: 'Festivals',
  HOTEL: 'Hotels & Riads',
};

// --- The big curated places list (60+ real Tunisian places) ---
const PLACES = [
  // ═══════ UNESCO / MAJOR HISTORICAL ═══════
  { name: 'Amphitheatre of El Jem', nameFr: "Amphithéâtre d'El Jem", nameAr: 'قصر الجم', slug: 'amphitheatre-el-jem',
    description: "One of the most impressive Roman ruins in Africa. This 3rd-century amphitheatre once seated 35,000 spectators and rivals the Colosseum in scale. UNESCO World Heritage Site.",
    address: 'Centre ville, El Jem', city: 'El Jem', governorate: 'Mahdia', latitude: 35.2963, longitude: 10.7069,
    cat: CAT.HIST, img: IMG.roman, tags: ['UNESCO', 'Roman', 'Ancient', 'Monument'], rating: 4.8, isFeatured: true, priceRange: '12 TND', openingHours: '08:00 – 18:00' },
  { name: 'Medina of Tunis', nameFr: 'Médina de Tunis', nameAr: 'مدينة تونس العتيقة', slug: 'medina-of-tunis',
    description: "A UNESCO-listed labyrinth of 700+ monuments — palaces, mosques, mausoleums, madrasas and fountains — woven into the heart of the capital since the 7th century.",
    address: 'Médina, Tunis', city: 'Tunis', governorate: 'Tunis', latitude: 36.7987, longitude: 10.1709,
    cat: CAT.HIST, img: IMG.medina, tags: ['UNESCO', 'Medina', 'Shopping', 'Culture'], rating: 4.6, isFeatured: true, openingHours: 'Open 24/7' },
  { name: 'Sidi Bou Said', nameFr: 'Sidi Bou Saïd', nameAr: 'سيدي بو سعيد', slug: 'sidi-bou-said',
    description: "The iconic blue-and-white cliffside village overlooking the Mediterranean, immortalised by artists from Klee to Foucault. Cobbled lanes, jasmine-draped doors, and the legendary Café des Délices.",
    address: 'Sidi Bou Said', city: 'Sidi Bou Said', governorate: 'Tunis', latitude: 36.8687, longitude: 10.3477,
    cat: CAT.HIST, img: IMG.blueVillage, tags: ['Village', 'Scenic', 'Photography', 'Mediterranean'], rating: 4.7, isFeatured: true },
  { name: 'Carthage Archaeological Site', nameFr: 'Site Archéologique de Carthage', nameAr: 'موقع قرطاج الأثري', slug: 'carthage-archaeological-site',
    description: "Ruins of the Phoenician superpower that once rivalled Rome — Antonine Baths, Punic ports, the Tophet sanctuary, and a Roman amphitheatre. UNESCO World Heritage Site.",
    address: 'Carthage', city: 'Carthage', governorate: 'Tunis', latitude: 36.8526, longitude: 10.3234,
    cat: CAT.HIST, img: IMG.roman, tags: ['UNESCO', 'Phoenician', 'Roman', 'Archaeology'], rating: 4.5, isFeatured: true, priceRange: '10 TND', openingHours: '08:30 – 17:30' },
  { name: 'Dougga (Thugga)', nameFr: 'Cité romaine de Dougga', nameAr: 'دقة', slug: 'dougga-thugga',
    description: "The best-preserved Roman small town in North Africa, sprawling across 65 hectares with a Capitol, theatre, Libyo-Punic mausoleum and panoramic valley views. UNESCO listed.",
    address: 'Route de Téboursouk', city: 'Téboursouk', governorate: 'Béja', latitude: 36.4225, longitude: 9.2189,
    cat: CAT.HIST, img: IMG.roman, tags: ['UNESCO', 'Roman', 'Ruins', 'Hilltop'], rating: 4.9, isFeatured: true, priceRange: '10 TND', openingHours: '08:00 – 17:30' },
  { name: 'Kerkouane', nameFr: 'Kerkouane', nameAr: 'كركوان', slug: 'kerkouane',
    description: "The only Punic city to survive unaltered — preserved exactly as the Carthaginians left it before Rome destroyed it in 250 BC. Pink-stuccoed bathrooms and street grids 2,300 years old.",
    address: 'Cap Bon Peninsula', city: 'Kelibia', governorate: 'Nabeul', latitude: 36.9450, longitude: 11.0972,
    cat: CAT.HIST, img: IMG.roman, tags: ['UNESCO', 'Punic', 'Hidden Gem'], rating: 4.7, priceRange: '8 TND' },
  { name: 'Bulla Regia', nameFr: 'Bulla Regia', nameAr: 'بولا ريجيا', slug: 'bulla-regia',
    description: "Roman city famed for its underground villas — entire mansions built below ground to escape the Numidian summer, with mosaic floors still pristine after 1,800 years.",
    address: 'Route de Jendouba', city: 'Jendouba', governorate: 'Jendouba', latitude: 36.5594, longitude: 8.7561,
    cat: CAT.HIST, img: IMG.roman, tags: ['Roman', 'Underground', 'Mosaics'], rating: 4.8 },
  { name: 'Sbeitla (Sufetula)', nameFr: 'Vestiges de Sbeïtla', nameAr: 'سبيطلة', slug: 'sbeitla-sufetula',
    description: "Golden-stone ruins of Sufetula, crowned by three near-intact temples to Jupiter, Juno and Minerva — the only Roman triad standing this way in the world.",
    address: 'Sbeitla', city: 'Sbeitla', governorate: 'Kasserine', latitude: 35.2404, longitude: 9.1232,
    cat: CAT.HIST, img: IMG.roman, tags: ['Roman', 'Temples', 'Architecture'], rating: 4.7 },
  { name: 'Utica', nameFr: 'Utique', nameAr: 'أوتيكا', slug: 'utica',
    description: "Older than Carthage itself. The Phoenician city that became Cato the Younger's last stand against Caesar — Punic tombs, Roman villas with magnificent mosaics.",
    address: 'Utique', city: 'Utique', governorate: 'Bizerte', latitude: 37.0567, longitude: 10.0617,
    cat: CAT.HIST, img: IMG.roman, tags: ['Phoenician', 'Roman', 'Mosaics'], rating: 4.4 },
  { name: 'Thuburbo Majus', nameFr: 'Thuburbo Majus', nameAr: 'ثوبربو ماجوس', slug: 'thuburbo-majus',
    description: "Compact Roman provincial city with a stunning Capitol, forum and bathhouses — wonderfully empty of crowds. A photographer's dream at golden hour.",
    address: 'El Fahs', city: 'El Fahs', governorate: 'Zaghouan', latitude: 36.3953, longitude: 9.9056,
    cat: CAT.HIST, img: IMG.roman, tags: ['Roman', 'Forum', 'Hidden Gem'], rating: 4.6 },
  { name: 'Oudhna (Uthina)', nameFr: 'Oudhna', nameAr: 'عوذنة', slug: 'oudhna-uthina',
    description: "A Roman colony just south of Tunis — colossal aqueduct arches, a partially-reconstructed amphitheatre, and remarkable mosaics now housed at the Bardo.",
    address: 'Oudhna', city: 'Oudhna', governorate: 'Ben Arous', latitude: 36.6092, longitude: 10.1714,
    cat: CAT.HIST, img: IMG.roman, tags: ['Roman', 'Aqueduct', 'Mosaics'], rating: 4.3 },
  { name: 'Maktar (Mactaris)', nameFr: 'Maktar', nameAr: 'مكثر', slug: 'maktar-mactaris',
    description: "Highland Numidian-Roman city at 900m — Trajan's Arch, an immense baths complex, and one of the great Latin inscriptions ('Harvester of Mactar').",
    address: 'Maktar', city: 'Maktar', governorate: 'Siliana', latitude: 35.8567, longitude: 9.1989,
    cat: CAT.HIST, img: IMG.roman, tags: ['Roman', 'Numidian', 'Hilltop'], rating: 4.5 },
  { name: 'Haïdra (Ammaedara)', nameFr: 'Haïdra', nameAr: 'حيدرة', slug: 'haidra-ammaedara',
    description: "Far west on the Algerian border — one of Rome's earliest African legionary camps. A triumphal arch and a magnificent Byzantine fortress dominate the steppe.",
    address: 'Haïdra', city: 'Haïdra', governorate: 'Kasserine', latitude: 35.5667, longitude: 8.4500,
    cat: CAT.HIST, img: IMG.roman, tags: ['Roman', 'Byzantine', 'Border'], rating: 4.4 },
  { name: 'Chemtou (Simitthus)', nameFr: 'Chemtou', nameAr: 'شمتو', slug: 'chemtou-simitthus',
    description: "The quarry that supplied Rome's coveted giallo antico marble — sanctuaries, a Roman bridge over the Medjerda, and a brilliant on-site museum.",
    address: 'Chemtou', city: 'Jendouba', governorate: 'Jendouba', latitude: 36.4889, longitude: 8.5775,
    cat: CAT.HIST, img: IMG.roman, tags: ['Roman', 'Quarry', 'Museum'], rating: 4.5 },
  { name: 'Younga (Iunca Maritima)', nameFr: 'Iunca', nameAr: 'يونقة', slug: 'younga-iunca',
    description: "Sun-bleached coastal Roman ruins south of Mahdia — a forum, an early Christian basilica, and a quiet beach where Roman pottery still washes ashore.",
    address: 'Younga', city: 'Mahdia', governorate: 'Mahdia', latitude: 34.7853, longitude: 11.0339,
    cat: CAT.HIST, img: IMG.roman, tags: ['Roman', 'Coastal', 'Hidden Gem'], rating: 4.4 },

  // ═══════ MEDINAS & ISLAMIC HERITAGE ═══════
  { name: 'Medina of Kairouan', nameFr: 'Médina de Kairouan', nameAr: 'مدينة القيروان', slug: 'medina-of-kairouan',
    description: "Islam's fourth holiest city. A UNESCO medina of whitewashed alleys, copperware souks and 9th-century Aghlabid water basins still in use today.",
    address: 'Médina, Kairouan', city: 'Kairouan', governorate: 'Kairouan', latitude: 35.6781, longitude: 10.0975,
    cat: CAT.HIST, img: IMG.medina, tags: ['UNESCO', 'Medina', 'Islamic'], rating: 4.7, isFeatured: true },
  { name: 'Great Mosque of Kairouan', nameFr: 'Grande Mosquée de Kairouan', nameAr: 'جامع القيروان الأكبر', slug: 'great-mosque-of-kairouan',
    description: "The mother of all mosques in North Africa, founded 670 AD. A vast marble courtyard, a hypostyle prayer hall with 414 columns, and a square minaret older than nearly all that survive in Islam.",
    address: 'Rue de la Mosquée', city: 'Kairouan', governorate: 'Kairouan', latitude: 35.6814, longitude: 10.1039,
    cat: CAT.HIST, img: IMG.mosque, tags: ['UNESCO', 'Mosque', 'Islamic', 'Architecture'], rating: 4.9, isFeatured: true, priceRange: '8 TND', openingHours: '08:00 – 14:00' },
  { name: 'Medina of Sousse', nameFr: 'Médina de Sousse', nameAr: 'مدينة سوسة', slug: 'medina-of-sousse',
    description: "UNESCO-listed walled medina with the Ribat (a fortified Islamic monastery) and the Great Mosque — both 9th-century Aghlabid gems facing the Mediterranean.",
    address: 'Médina, Sousse', city: 'Sousse', governorate: 'Sousse', latitude: 35.8281, longitude: 10.6383,
    cat: CAT.HIST, img: IMG.medina, tags: ['UNESCO', 'Medina', 'Coastal'], rating: 4.5, isFeatured: true },
  { name: 'Ribat of Monastir', nameFr: 'Ribat de Monastir', nameAr: 'رباط المنستير', slug: 'ribat-of-monastir',
    description: "The fortified outpost where Franco Zeffirelli filmed Jesus of Nazareth. Climb the watchtower for sweeping views over the marina and the Mediterranean.",
    address: 'Avenue du Ribat', city: 'Monastir', governorate: 'Monastir', latitude: 35.7780, longitude: 10.8278,
    cat: CAT.HIST, img: IMG.medina, tags: ['Fortress', 'Islamic', 'Coastal'], rating: 4.6 },
  { name: 'Aghlabid Basins', nameFr: 'Bassins des Aghlabides', nameAr: 'فسقيات الأغالبة', slug: 'aghlabid-basins',
    description: "9th-century circular water reservoirs that supplied Kairouan — engineering marvels you can walk around at sunset for golden reflections.",
    address: 'Kairouan', city: 'Kairouan', governorate: 'Kairouan', latitude: 35.6914, longitude: 10.0961,
    cat: CAT.HIST, img: IMG.medina, tags: ['Aghlabid', 'Engineering', 'Photography'], rating: 4.4 },
  { name: 'Mosque of the Three Doors', nameFr: 'Mosquée des Trois Portes', nameAr: 'مسجد الأبواب الثلاثة', slug: 'mosque-three-doors-kairouan',
    description: "Built 866 AD — one of the oldest decorated mosque facades in Islam, with hand-carved bands of Kufic calligraphy and floral motifs.",
    address: 'Médina, Kairouan', city: 'Kairouan', governorate: 'Kairouan', latitude: 35.6800, longitude: 10.1011,
    cat: CAT.HIST, img: IMG.mosque, tags: ['Mosque', 'Calligraphy', 'Aghlabid'], rating: 4.5 },
  { name: 'Kasbah of Tunis', nameFr: 'Kasbah de Tunis', nameAr: 'قصبة تونس', slug: 'kasbah-of-tunis',
    description: "The citadel and seat of government since the 12th century. Wide modern square, statue of Ibn Khaldoun, and gateway to the Medina.",
    address: 'Place de la Kasbah', city: 'Tunis', governorate: 'Tunis', latitude: 36.7989, longitude: 10.1639,
    cat: CAT.HIST, img: IMG.medina, tags: ['Kasbah', 'Square', 'Government'], rating: 4.3 },
  { name: 'Bardo National Museum', nameFr: 'Musée National du Bardo', nameAr: 'متحف باردو الوطني', slug: 'bardo-national-museum',
    description: "Housed in a 13th-century Hafsid palace, the largest Roman mosaic collection in the world — including the only known portrait of Virgil. A must-visit for art lovers.",
    address: 'Avenue Habib Bourguiba, Le Bardo', city: 'Tunis', governorate: 'Tunis', latitude: 36.8094, longitude: 10.1342,
    cat: CAT.HIST, img: IMG.medina, tags: ['Museum', 'Mosaics', 'Palace'], rating: 4.8, isFeatured: true, priceRange: '13 TND', openingHours: '09:30 – 16:30' },
  { name: 'Borj el Kebir (Mahdia)', nameFr: 'Borj el Kebir', nameAr: 'برج الكبير', slug: 'borj-el-kebir-mahdia',
    description: "Ottoman-era fortress guarding the Fatimid peninsula of Mahdia. Walk the ramparts at sunset for views over the old port and pastel-coloured fishermen's quarters.",
    address: 'Cap Africa, Mahdia', city: 'Mahdia', governorate: 'Mahdia', latitude: 35.5042, longitude: 11.0731,
    cat: CAT.HIST, img: IMG.port, tags: ['Fortress', 'Ottoman', 'Coastal'], rating: 4.5 },
  { name: 'Kasbah of Sousse', nameFr: 'Kasbah de Sousse', nameAr: 'قصبة سوسة', slug: 'kasbah-of-sousse',
    description: "The Aghlabid hilltop fortress with a 9th-century tower used as a lighthouse for over a millennium — now home to the wonderful Sousse Archaeological Museum.",
    address: 'Kasbah, Sousse', city: 'Sousse', governorate: 'Sousse', latitude: 35.8228, longitude: 10.6378,
    cat: CAT.HIST, img: IMG.medina, tags: ['Kasbah', 'Museum', 'Mosaics'], rating: 4.4 },

  // ═══════ BERBER & DESERT VILLAGES ═══════
  { name: 'Matmata (Troglodyte Homes)', nameFr: 'Matmata', nameAr: 'مطماطة', slug: 'matmata-troglodyte-homes',
    description: "The famous underground Berber pit-homes carved into the earth. Sleep where Luke Skywalker's family lived — the Hotel Sidi Driss is still functioning.",
    address: 'Matmata', city: 'Matmata', governorate: 'Gabès', latitude: 33.5444, longitude: 9.9686,
    cat: CAT.HIST, img: IMG.troglodyte, tags: ['Berber', 'Underground', 'Star Wars'], rating: 4.6, isFeatured: true },
  { name: 'Chenini', nameFr: 'Chenini', nameAr: 'شنني', slug: 'chenini',
    description: "Crumbling Berber ksar dripping down a 700m ridge — fortified granaries and cave dwellings still inhabited. Best at sunrise when the cliffs glow ochre.",
    address: 'Chenini', city: 'Tataouine', governorate: 'Tataouine', latitude: 32.9119, longitude: 10.2697,
    cat: CAT.HIST, img: IMG.troglodyte, tags: ['Berber', 'Ksar', 'Mountain'], rating: 4.7 },
  { name: 'Douiret', nameFr: 'Douiret', nameAr: 'دويرات', slug: 'douiret',
    description: "Ghostly hilltop Berber village clinging to a chalky escarpment. White-domed mosque at the top, cave-mosques in the cliffs below. Almost no tourists.",
    address: 'Douiret', city: 'Tataouine', governorate: 'Tataouine', latitude: 32.8508, longitude: 10.2542,
    cat: CAT.HIST, img: IMG.troglodyte, tags: ['Berber', 'Hidden Gem', 'Mountain'], rating: 4.7 },
  { name: 'Ksar Ouled Soltane', nameFr: 'Ksar Ouled Soltane', nameAr: 'قصر أولاد سلطان', slug: 'ksar-ouled-soltane',
    description: "Four-storey honeycomb of grain stores (ghorfas) ringing a courtyard — featured as the slave quarters of Mos Espa in Star Wars Episode I.",
    address: 'Ksar Ouled Soltane', city: 'Tataouine', governorate: 'Tataouine', latitude: 32.7892, longitude: 10.6711,
    cat: CAT.HIST, img: IMG.troglodyte, tags: ['Berber', 'Granary', 'Star Wars'], rating: 4.8, isFeatured: true },
  { name: 'Ksar Hadada', nameFr: 'Ksar Hadada', nameAr: 'قصر حدادة', slug: 'ksar-hadada',
    description: "Lesser-visited Berber ksar that doubled as Mos Espa slave quarters before Ouled Soltane. White-vaulted galleries you can wander alone.",
    address: 'Ksar Hadada', city: 'Tataouine', governorate: 'Tataouine', latitude: 33.0142, longitude: 10.4283,
    cat: CAT.HIST, img: IMG.troglodyte, tags: ['Berber', 'Star Wars', 'Hidden Gem'], rating: 4.5 },
  { name: 'Ghomrassen', nameFr: 'Ghomrassen', nameAr: 'غمراسن', slug: 'ghomrassen',
    description: "Mountain Berber town famous for handmade fricassé (Tunisian doughnuts) and dozens of fortified ksour scattered through the surrounding hills.",
    address: 'Ghomrassen', city: 'Tataouine', governorate: 'Tataouine', latitude: 33.0581, longitude: 10.3461,
    cat: CAT.HIST, img: IMG.troglodyte, tags: ['Berber', 'Food', 'Mountain'], rating: 4.3 },
  { name: 'Tamezret', nameFr: 'Tamezret', nameAr: 'تامزرت', slug: 'tamezret',
    description: "Pristine hilltop Berber village near Matmata where Tamazight is still spoken daily. Stone houses with hand-painted symbols above each doorway.",
    address: 'Tamezret', city: 'Matmata', governorate: 'Gabès', latitude: 33.5797, longitude: 9.8917,
    cat: CAT.HIST, img: IMG.troglodyte, tags: ['Berber', 'Language', 'Authentic'], rating: 4.6 },
  { name: 'Toujane', nameFr: 'Toujane', nameAr: 'توجان', slug: 'toujane',
    description: "Hidden mountain village tumbling down a canyon — once part of Berber resistance against the French, today a place of carpet weavers and silence.",
    address: 'Toujane', city: 'Matmata', governorate: 'Gabès', latitude: 33.4644, longitude: 10.0606,
    cat: CAT.HIST, img: IMG.troglodyte, tags: ['Berber', 'Carpets', 'Mountain'], rating: 4.7 },

  // ═══════ SAHARA & OASES ═══════
  { name: 'Tozeur Oasis', nameFr: 'Oasis de Tozeur', nameAr: 'واحة توزر', slug: 'tozeur-oasis',
    description: "A million date palms and 200 freshwater springs at the edge of the Sahara. Ride a calèche through the palmeraie and sleep in a brick medina hotel.",
    address: 'Tozeur', city: 'Tozeur', governorate: 'Tozeur', latitude: 33.9190, longitude: 8.1280,
    cat: CAT.NATURE, img: IMG.oasis, tags: ['Oasis', 'Sahara', 'Dates'], rating: 4.7, isFeatured: true },
  { name: 'Douz — Gateway to the Sahara', nameFr: 'Douz, Porte du Sahara', nameAr: 'دوز', slug: 'douz-sahara-gateway',
    description: "The last town before the Grand Erg Oriental dunes. Camel treks, sand hockey, and the wild December Sahara Festival.",
    address: 'Douz', city: 'Douz', governorate: 'Kebili', latitude: 33.4664, longitude: 9.0203,
    cat: CAT.NATURE, img: IMG.desert, tags: ['Sahara', 'Camel', 'Festival'], rating: 4.6, isFeatured: true },
  { name: 'Chott el Djerid', nameFr: 'Chott el Djérid', nameAr: 'شط الجريد', slug: 'chott-el-djerid',
    description: "Tunisia's biggest salt lake — 7,000 km² of blinding white crust that becomes a perfect mirror after rain. Drive the elevated causeway between Tozeur and Kebili.",
    address: 'Between Tozeur and Kebili', city: 'Kebili', governorate: 'Kebili', latitude: 33.7000, longitude: 8.4000,
    cat: CAT.NATURE, img: IMG.desert, tags: ['Salt Lake', 'Sahara', 'Photography'], rating: 4.8, isFeatured: true },
  { name: 'Ksar Ghilane', nameFr: 'Ksar Ghilane', nameAr: 'قصر غيلان', slug: 'ksar-ghilane',
    description: "Hot-spring oasis ringed by Saharan dunes — the southernmost point reachable without a 4x4. Roman fort ruins and a swimming pool fed by a natural thermal source.",
    address: 'Ksar Ghilane', city: 'Tataouine', governorate: 'Tataouine', latitude: 32.9897, longitude: 9.6361,
    cat: CAT.NATURE, img: IMG.desert, tags: ['Oasis', 'Sahara', 'Thermal'], rating: 4.8 },
  { name: 'Chebika Oasis', nameFr: 'Oasis de Chebika', nameAr: 'واحة شبيكة', slug: 'chebika-oasis',
    description: "A 'mountain oasis' tucked under cliffs — a hidden waterfall cascades into a palm-shaded canyon. The English Patient was filmed here.",
    address: 'Chebika', city: 'Tameghza', governorate: 'Tozeur', latitude: 34.3247, longitude: 7.9242,
    cat: CAT.NATURE, img: IMG.oasis, tags: ['Oasis', 'Waterfall', 'Canyon'], rating: 4.7 },
  { name: 'Tamerza Canyon', nameFr: 'Tameghza', nameAr: 'تمغزة', slug: 'tamerza-canyon',
    description: "Tunisia's Grand Canyon — sheer ochre walls and a turquoise waterfall in the middle of the desert. A ghost village abandoned after a 1969 flood.",
    address: 'Tameghza', city: 'Tameghza', governorate: 'Tozeur', latitude: 34.3839, longitude: 7.9489,
    cat: CAT.NATURE, img: IMG.oasis, tags: ['Canyon', 'Waterfall', 'Ghost Town'], rating: 4.8 },
  { name: 'Mides Canyon', nameFr: 'Canyon de Midès', nameAr: 'وادي ميداس', slug: 'mides-canyon',
    description: "The most dramatic of the three mountain oases — a 150m-deep canyon you can walk into, with the Algerian border just metres away.",
    address: 'Mides', city: 'Tameghza', governorate: 'Tozeur', latitude: 34.4239, longitude: 7.8056,
    cat: CAT.NATURE, img: IMG.oasis, tags: ['Canyon', 'Border', 'Hiking'], rating: 4.7 },
  { name: 'Ong Jemal', nameFr: 'Ong Jemal', nameAr: 'عنق الجمل', slug: 'ong-jemal',
    description: "The 'Camel's Neck' — a cliff plunging into a salt flat where the Mos Espa pod-racing set still stands. Hire a 4x4 from Tozeur at dawn for the best light.",
    address: 'Ong Jemal', city: 'Tozeur', governorate: 'Tozeur', latitude: 33.9986, longitude: 7.9806,
    cat: CAT.NATURE, img: IMG.desert, tags: ['Star Wars', 'Cliff', 'Salt Flat'], rating: 4.8 },
  { name: 'Mos Espa Set', nameFr: 'Décor de Mos Espa', nameAr: 'موقع موس إسبا', slug: 'mos-espa-set',
    description: "The original Star Wars set left to bake in the Sahara — domed huts, market stalls, and Anakin's house, all still standing 25+ years after filming.",
    address: 'Near Nefta', city: 'Nefta', governorate: 'Tozeur', latitude: 33.9939, longitude: 7.8419,
    cat: CAT.NATURE, img: IMG.desert, tags: ['Star Wars', 'Movie Set', 'Sahara'], rating: 4.6 },

  // ═══════ BEACHES & ISLANDS ═══════
  { name: 'Djerba Island', nameFr: 'Île de Djerba', nameAr: 'جزيرة جربة', slug: 'djerba-island',
    description: "The 'Island of Forgetfulness' from the Odyssey — palm-fringed beaches, white-domed mosques, Mediterranean's oldest synagogue, and Djerbahood's street art.",
    address: 'Djerba', city: 'Houmt Souk', governorate: 'Medenine', latitude: 33.8076, longitude: 10.8451,
    cat: CAT.NATURE, img: IMG.island, tags: ['Island', 'Beach', 'Culture'], rating: 4.7, isFeatured: true },
  { name: 'El Ghriba Synagogue', nameFr: 'Synagogue de la Ghriba', nameAr: 'كنيس الغريبة', slug: 'el-ghriba-synagogue',
    description: "One of Judaism's oldest continuous places of worship — turquoise tiles, hanging silver lamps, and a Torah said to be 2,000 years old. Major Jewish pilgrimage in May.",
    address: 'Hara Sghira', city: 'Erriadh', governorate: 'Medenine', latitude: 33.8147, longitude: 10.8636,
    cat: CAT.HIST, img: IMG.mosque, tags: ['Synagogue', 'Pilgrimage', 'Heritage'], rating: 4.7 },
  { name: 'Djerbahood (Erriadh)', nameFr: 'Djerbahood', nameAr: 'جربهود', slug: 'djerbahood-erriadh',
    description: "150+ murals by artists from 30 countries transformed Erriadh village into an open-air gallery in 2014 — and the locals keep painting.",
    address: 'Erriadh', city: 'Erriadh', governorate: 'Medenine', latitude: 33.8225, longitude: 10.8514,
    cat: CAT.ART, img: IMG.medina, tags: ['Street Art', 'Murals', 'Village'], rating: 4.7, isFeatured: true },
  { name: 'Hammamet Beach', nameFr: 'Plage de Hammamet', nameAr: 'شاطئ الحمامات', slug: 'hammamet-beach',
    description: "Tunisia's first beach resort, still arguably its best. Soft sand, gentle Mediterranean, and the photogenic 15th-century kasbah at the headland.",
    address: 'Avenue de la Corniche, Hammamet', city: 'Hammamet', governorate: 'Nabeul', latitude: 36.3977, longitude: 10.5986,
    cat: CAT.NATURE, img: IMG.beach, tags: ['Beach', 'Resort', 'Family'], rating: 4.5, isFeatured: true },
  { name: 'Tabarka & Coral Coast', nameFr: 'Tabarka', nameAr: 'طبرقة', slug: 'tabarka-coral-coast',
    description: "Pine-clad coastline famous for red coral, jazz festivals, and the Genoese fort on Tabarka Island. The Aiguilles rock formations are a diver's paradise.",
    address: 'Tabarka', city: 'Tabarka', governorate: 'Jendouba', latitude: 36.9544, longitude: 8.7589,
    cat: CAT.NATURE, img: IMG.beach, tags: ['Beach', 'Coral', 'Diving'], rating: 4.7 },
  { name: 'La Marsa Beach', nameFr: 'Plage de la Marsa', nameAr: 'شاطئ المرسى', slug: 'la-marsa-beach',
    description: "The trendy north-Tunis beach — wide sand, palm-shaded promenade, cafés serving the best almond ice cream in Tunisia. Locals' favourite.",
    address: 'La Marsa', city: 'La Marsa', governorate: 'Tunis', latitude: 36.8783, longitude: 10.3253,
    cat: CAT.NATURE, img: IMG.beach, tags: ['Beach', 'Cafés', 'Local'], rating: 4.4 },
  { name: 'Gammarth Beach', nameFr: 'Plage de Gammarth', nameAr: 'شاطئ قمرت', slug: 'gammarth-beach',
    description: "The luxury stretch north of Tunis — five-star resorts, calm bays, and the best sunset views over Cap Carthage.",
    address: 'Gammarth', city: 'Gammarth', governorate: 'Tunis', latitude: 36.9180, longitude: 10.2942,
    cat: CAT.NATURE, img: IMG.beach, tags: ['Beach', 'Luxury', 'Sunset'], rating: 4.5 },
  { name: 'Kerkennah Islands', nameFr: 'Îles Kerkennah', nameAr: 'جزر قرقنة', slug: 'kerkennah-islands',
    description: "Time-stopped flat islands off Sfax — palm-roofed fishing huts, octopus traps still made of dried palm fronds, and beaches with no one on them.",
    address: 'Kerkennah', city: 'Remla', governorate: 'Sfax', latitude: 34.7000, longitude: 11.2500,
    cat: CAT.NATURE, img: IMG.island, tags: ['Island', 'Fishing', 'Quiet'], rating: 4.6 },
  { name: 'Cap Bon Peninsula', nameFr: 'Cap Bon', nameAr: 'الوطن القبلي', slug: 'cap-bon-peninsula',
    description: "Tunisia's wine country and citrus heartland — wild beaches, ancient quarries, and a coastline of Cap Bon that swings between turquoise and emerald.",
    address: 'Nabeul Region', city: 'Kelibia', governorate: 'Nabeul', latitude: 36.8417, longitude: 11.0925,
    cat: CAT.NATURE, img: IMG.beach, tags: ['Peninsula', 'Wine', 'Beaches'], rating: 4.6 },
  { name: 'El Haouaria Caves', nameFr: 'Grottes Romaines, El Haouaria', nameAr: 'مغارات الهوارية', slug: 'el-haouaria-caves',
    description: "Roman quarries on the tip of Cap Bon — vast cathedral-like underground chambers carved into the cliff for stone used in Carthage.",
    address: 'El Haouaria', city: 'El Haouaria', governorate: 'Nabeul', latitude: 37.0500, longitude: 11.0167,
    cat: CAT.NATURE, img: IMG.roman, tags: ['Caves', 'Roman', 'Cliff'], rating: 4.5 },

  // ═══════ NATURE & PARKS ═══════
  { name: 'Ichkeul National Park', nameFr: 'Parc National d\'Ichkeul', nameAr: 'منتزه إشكل الوطني', slug: 'ichkeul-national-park',
    description: "The only UNESCO Natural site in Tunisia — wintering grounds for tens of thousands of pink flamingos, geese and ducks. A wild mountain rising out of a lagoon.",
    address: 'Mateur', city: 'Mateur', governorate: 'Bizerte', latitude: 37.1467, longitude: 9.6750,
    cat: CAT.NATURE, img: IMG.nature, tags: ['UNESCO', 'Wildlife', 'Lake'], rating: 4.7 },
  { name: 'Bouhedma National Park', nameFr: 'Parc National de Bouhedma', nameAr: 'منتزه بوهدمة', slug: 'bouhedma-national-park',
    description: "Reintroduction site for Saharan oryx, addax and ostrich — drive-through wildlife reserve in the foothills of the Atlas.",
    address: 'Sidi Bouzid', city: 'Mezzouna', governorate: 'Sidi Bouzid', latitude: 34.4833, longitude: 9.6500,
    cat: CAT.NATURE, img: IMG.nature, tags: ['Wildlife', 'Park', 'Oryx'], rating: 4.5 },
  { name: 'Zaghouan Mountain & Roman Water Temple', nameFr: 'Mont Zaghouan & Temple des Eaux', nameAr: 'جبل زغوان', slug: 'zaghouan-mountain',
    description: "Sacred mountain rising to 1,295m with the Roman Temple of the Waters at its foot — the source of a 132km Roman aqueduct supplying Carthage.",
    address: 'Zaghouan', city: 'Zaghouan', governorate: 'Zaghouan', latitude: 36.4000, longitude: 10.1500,
    cat: CAT.NATURE, img: IMG.mountain, tags: ['Mountain', 'Roman', 'Aqueduct'], rating: 4.6 },
  { name: 'Jebel Chambi', nameFr: 'Jebel Chambi', nameAr: 'جبل شعانبي', slug: 'jebel-chambi',
    description: "Tunisia's highest peak at 1,544m — Atlas foothills covered in Aleppo pine, home to gazelles and (rarely seen) striped hyena.",
    address: 'Kasserine', city: 'Kasserine', governorate: 'Kasserine', latitude: 35.2167, longitude: 8.6667,
    cat: CAT.NATURE, img: IMG.mountain, tags: ['Mountain', 'Highest', 'Hiking'], rating: 4.5 },
  { name: 'Cap Angela', nameFr: 'Cap Angela', nameAr: 'رأس انجلة', slug: 'cap-angela',
    description: "The northernmost point of Africa. A lighthouse, dramatic limestone cliffs, and a quiet bay where you'll likely be alone with the wind.",
    address: 'Ras ben Sakka', city: 'Bizerte', governorate: 'Bizerte', latitude: 37.3500, longitude: 9.7500,
    cat: CAT.NATURE, img: IMG.mountain, tags: ['Cape', 'Lighthouse', 'Northernmost'], rating: 4.6 },

  // ═══════ COASTAL TOWNS ═══════
  { name: 'Bizerte Old Port', nameFr: 'Vieux Port de Bizerte', nameAr: 'الميناء القديم ببنزرت', slug: 'bizerte-old-port',
    description: "Africa's northernmost city — a tiny old harbour boxed in by ochre fortifications, pastel fishing boats, and waterfront cafés where time has clearly stopped.",
    address: 'Vieux Port, Bizerte', city: 'Bizerte', governorate: 'Bizerte', latitude: 37.2747, longitude: 9.8739,
    cat: CAT.HIST, img: IMG.port, tags: ['Port', 'Fortress', 'Fishing'], rating: 4.5 },
  { name: 'La Marsa Promenade', nameFr: 'Promenade de la Marsa', nameAr: 'كورنيش المرسى', slug: 'la-marsa-promenade',
    description: "The seaside promenade where Tunis comes to walk, eat almond glaces, and watch the sunset over Sidi Bou Said. Cafés open till 2am.",
    address: 'Avenue Taïeb M\'hiri', city: 'La Marsa', governorate: 'Tunis', latitude: 36.8783, longitude: 10.3253,
    cat: CAT.NATURE, img: IMG.cafe, tags: ['Promenade', 'Cafés', 'Local'], rating: 4.5 },
  { name: 'Mahdia Old Town', nameFr: 'Vieille ville de Mahdia', nameAr: 'مدينة المهدية العتيقة', slug: 'mahdia-old-town',
    description: "A whitewashed Fatimid peninsula thrust into the sea — silk weavers' workshops, a cathedral-mosque, and the original 10th-century city gate Skifa el Kahla.",
    address: 'Médina, Mahdia', city: 'Mahdia', governorate: 'Mahdia', latitude: 35.5042, longitude: 11.0731,
    cat: CAT.HIST, img: IMG.medina, tags: ['Medina', 'Fatimid', 'Coastal'], rating: 4.6 },
  { name: 'Port El Kantaoui', nameFr: 'Port El Kantaoui', nameAr: 'مرفأ القنطاوي', slug: 'port-el-kantaoui',
    description: "The purpose-built tourist marina in andalusian style — golf, yacht-spotting, and family-friendly restaurants. Convenient base for Sousse-Monastir trips.",
    address: 'Port El Kantaoui', city: 'Hammam Sousse', governorate: 'Sousse', latitude: 35.8917, longitude: 10.5953,
    cat: CAT.NATURE, img: IMG.port, tags: ['Marina', 'Resort', 'Family'], rating: 4.3 },

  // ═══════ GASTRONOMY ═══════
  { name: 'Dar El Jeld Restaurant', nameFr: 'Dar El Jeld', nameAr: 'دار الجلد', slug: 'dar-el-jeld-restaurant',
    description: "Tunis's most famous restaurant, set in an 18th-century palace inside the Medina. Refined Tunisian classics under a domed andalusian ceiling.",
    address: '5-10 Rue Dar el Jeld', city: 'Tunis', governorate: 'Tunis', latitude: 36.7977, longitude: 10.1675,
    cat: CAT.FOOD, img: IMG.food, tags: ['Restaurant', 'Palace', 'Fine Dining'], rating: 4.7, isFeatured: true, priceRange: '60-120 TND', phone: '+216 71 560 916' },
  { name: 'El Walima', nameFr: 'El Walima', nameAr: 'الوليمة', slug: 'el-walima-restaurant',
    description: "Hidden Tunis gem doing perfect couscous and brik à l'oeuf at lunchtime — the kind of place you'd walk past without knowing.",
    address: 'Avenue de Carthage, Tunis', city: 'Tunis', governorate: 'Tunis', latitude: 36.8000, longitude: 10.1800,
    cat: CAT.FOOD, img: IMG.food, tags: ['Restaurant', 'Local', 'Couscous'], rating: 4.6, priceRange: '20-40 TND' },
  { name: 'Café des Délices', nameFr: 'Café des Délices', nameAr: 'مقهى اللذات', slug: 'cafe-des-delices',
    description: "Made famous by Patrick Bruel's song — terraced café in Sidi Bou Said with sweeping Mediterranean views, mint tea, and pine-nut sweets.",
    address: 'Sidi Bou Said', city: 'Sidi Bou Said', governorate: 'Tunis', latitude: 36.8702, longitude: 10.3492,
    cat: CAT.FOOD, img: IMG.cafe, tags: ['Café', 'View', 'Iconic'], rating: 4.6, isFeatured: true, priceRange: '5-15 TND' },
  { name: 'Café Sidi Chabaane', nameFr: 'Café Sidi Chabaane', nameAr: 'مقهى سيدي شعبان', slug: 'cafe-sidi-chabaane',
    description: "Cliffside café whose terraces hang directly over the Mediterranean — the most photographed shisha spot in Tunisia.",
    address: 'Cliff, Sidi Bou Said', city: 'Sidi Bou Said', governorate: 'Tunis', latitude: 36.8700, longitude: 10.3500,
    cat: CAT.FOOD, img: IMG.cafe, tags: ['Café', 'Cliff', 'Shisha'], rating: 4.7, priceRange: '8-20 TND' },
  { name: 'Marché Central de Tunis', nameFr: 'Marché Central', nameAr: 'سوق المركزي', slug: 'marche-central-tunis',
    description: "The colossal covered market — pyramids of olives, hanging tuna, rosewater stalls, and the city's best lablabi window stand for breakfast.",
    address: 'Rue Charles de Gaulle, Tunis', city: 'Tunis', governorate: 'Tunis', latitude: 36.8000, longitude: 10.1850,
    cat: CAT.FOOD, img: IMG.food, tags: ['Market', 'Street Food', 'Local'], rating: 4.5, openingHours: '06:00 – 14:00' },
  { name: 'Fondouk El Attarine', nameFr: 'Fondouk El Attarine', nameAr: 'فندق العطارين', slug: 'fondouk-el-attarine',
    description: "Tea-and-perfume merchants' caravanserai turned trendy restaurant inside the Medina — Ottoman archways and rooftop dining.",
    address: 'Souk El Attarine, Medina', city: 'Tunis', governorate: 'Tunis', latitude: 36.7977, longitude: 10.1700,
    cat: CAT.FOOD, img: IMG.food, tags: ['Restaurant', 'Medina', 'Rooftop'], rating: 4.6, priceRange: '40-80 TND' },

  // ═══════ HOTELS / RIADS ═══════
  { name: 'Dar Ben Gacem', nameFr: 'Dar Ben Gacem', nameAr: 'دار بن قاسم', slug: 'dar-ben-gacem',
    description: "Award-winning eco-riad in the Tunis Medina, restored from a 17th-century palace. Owners give private walking tours of their neighbourhood.",
    address: 'Rue du Pacha, Medina', city: 'Tunis', governorate: 'Tunis', latitude: 36.7979, longitude: 10.1689,
    cat: CAT.HOTEL, img: IMG.hotel, tags: ['Riad', 'Boutique', 'Heritage'], rating: 4.9, isFeatured: true, priceRange: '180-340 TND/night' },
  { name: 'Dar El Medina', nameFr: 'Dar El Medina', nameAr: 'دار المدينة', slug: 'dar-el-medina-hotel',
    description: "Charming boutique riad in the Tunis Medina, housed in a beautifully restored 18th-century palace. Traditional architecture with modern comforts.",
    address: '64 Rue Sidi Ben Arous, Medina', city: 'Tunis', governorate: 'Tunis', latitude: 36.7979, longitude: 10.1706,
    cat: CAT.HOTEL, img: IMG.hotel, tags: ['Riad', 'Boutique', 'Traditional'], rating: 4.6, priceRange: '120-300 TND/night', phone: '+216 71 563 022' },
  { name: 'La Badira Hotel', nameFr: 'La Badira Hôtel', nameAr: 'فندق البديرة', slug: 'la-badira-hotel',
    description: "Five-star Art Deco beachfront hotel in Hammamet — adults-only — blending 1930s glamour with contemporary luxury, rooftop bar, direct beach access.",
    address: 'Zone Touristique, Hammamet', city: 'Hammamet', governorate: 'Nabeul', latitude: 36.3977, longitude: 10.5986,
    cat: CAT.HOTEL, img: IMG.hotel, tags: ['5-Star', 'Beach', 'Adults Only'], rating: 4.7, isFeatured: true, priceRange: '350-800 TND/night', phone: '+216 72 226 622' },
  { name: 'Anantara Tozeur Resort', nameFr: 'Anantara Tozeur', nameAr: 'منتجع أنانتارا توزر', slug: 'anantara-tozeur-resort',
    description: "Luxury desert resort at the edge of the Sahara overlooking the Chott. Spa, desert excursions, and stargazing under some of Earth's clearest skies.",
    address: 'Avenue Abou El Kacem Chebbi', city: 'Tozeur', governorate: 'Tozeur', latitude: 33.9190, longitude: 8.1280,
    cat: CAT.HOTEL, img: IMG.hotel, tags: ['5-Star', 'Desert', 'Spa'], rating: 4.8, priceRange: '500-1200 TND/night', phone: '+216 76 449 300' },
  { name: 'The Residence Tunis', nameFr: 'The Residence Tunis', nameAr: 'ذي ريزيدنس تونس', slug: 'the-residence-tunis',
    description: "Five-star Leading Hotels of the World resort in Gammarth — golf, two private beaches, and one of North Africa's best spas.",
    address: 'Les Côtes de Carthage, Gammarth', city: 'Gammarth', governorate: 'Tunis', latitude: 36.9270, longitude: 10.2978,
    cat: CAT.HOTEL, img: IMG.hotel, tags: ['5-Star', 'Beach', 'Spa', 'Golf'], rating: 4.7, priceRange: '600-1500 TND/night' },

  // ═══════ ARTISANAT & MARKETS ═══════
  { name: 'Nabeul Pottery Market', nameFr: 'Marché de la poterie de Nabeul', nameAr: 'سوق الفخار بنابل', slug: 'nabeul-pottery-market',
    description: "Tunisia's ceramic capital since Roman times — hundreds of workshops on Avenue Habib Thameur producing the iconic green-and-yellow Nabeul style.",
    address: 'Avenue Habib Thameur', city: 'Nabeul', governorate: 'Nabeul', latitude: 36.4561, longitude: 10.7376,
    cat: CAT.ART, img: IMG.medina, tags: ['Pottery', 'Crafts', 'Market'], rating: 4.4 },
  { name: 'Souk El Berka (Slave Market)', nameFr: 'Souk El Berka', nameAr: 'سوق البركة', slug: 'souk-el-berka',
    description: "Once the Ottoman-era slave market in the Tunis Medina, now a beautiful jewellery souk under whitewashed vaults. Best Tunisian gold-and-silver work.",
    address: 'Souk El Berka, Medina', city: 'Tunis', governorate: 'Tunis', latitude: 36.7976, longitude: 10.1712,
    cat: CAT.ART, img: IMG.medina, tags: ['Souk', 'Jewellery', 'Medina'], rating: 4.5 },
  { name: 'Carpet Souks of Kairouan', nameFr: 'Souks des Tapis, Kairouan', nameAr: 'أسواق الزرابي بالقيروان', slug: 'kairouan-carpet-souks',
    description: "Kairouan is Tunisia's carpet capital — workshops where women still hand-knot the legendary 'Alloucha' wool rugs. Many shops let you watch the loom.",
    address: 'Médina, Kairouan', city: 'Kairouan', governorate: 'Kairouan', latitude: 35.6781, longitude: 10.0975,
    cat: CAT.ART, img: IMG.medina, tags: ['Carpets', 'Souk', 'Crafts'], rating: 4.5 },
];

// --- Reviewer personas (fake users to author reviews) ---
const REVIEWERS = [
  { fullName: 'Yasmine Khelil', email: 'yasmine.k@tnreviews.com' },
  { fullName: 'Marco Rossi', email: 'marco.r@tnreviews.com' },
  { fullName: 'Sarah Chen', email: 'sarah.c@tnreviews.com' },
  { fullName: 'David Park', email: 'david.p@tnreviews.com' },
  { fullName: 'Amina Trabelsi', email: 'amina.t@tnreviews.com' },
  { fullName: 'Emma Laurent', email: 'emma.l@tnreviews.com' },
  { fullName: 'Karim Ben Salem', email: 'karim.b@tnreviews.com' },
  { fullName: 'Sofia Almeida', email: 'sofia.a@tnreviews.com' },
  { fullName: 'Lucas Müller', email: 'lucas.m@tnreviews.com' },
  { fullName: 'Leila Trabelsi', email: 'leila.t@tnreviews.com' },
  { fullName: 'Hiroshi Tanaka', email: 'hiroshi.t@tnreviews.com' },
  { fullName: 'Mehdi Bouazizi', email: 'mehdi.b@tnreviews.com' },
];

// --- Review comment fragments — combined randomly per place ---
const REVIEW_BANK = {
  positive: [
    "Absolutely worth the trip — far exceeded my expectations.",
    "One of the highlights of our whole Tunisia visit. Wow.",
    "Stunning location, friendly locals, and barely any tourists.",
    "Photographers' paradise — the light here is incredible.",
    "Came expecting little, left blown away. Will return for sure.",
    "Felt like stepping back in time. Take your time here.",
    "A genuinely magical place, especially around sunset.",
    "Easy to reach, easier to fall in love with.",
    "Locals were warm and proud to share their history.",
    "Hidden gem — please don't tell everyone about it!",
    "Underrated and uncrowded. Skip the bigger sites for this one.",
    "Worth every minute and every dinar.",
    "Brought back so many memories — my family loved it.",
    "Powerful, atmospheric, and beautifully preserved.",
    "Honestly, photos don't do this place justice.",
    "Came for the morning, stayed until dusk.",
    "A perfect day trip from Tunis — go, just go.",
    "The kind of place you can't believe is real.",
  ],
  mixed: [
    "Beautiful but bring water — there's nothing on site.",
    "Loved it. Just wish parking was easier.",
    "Stunning views, but the path up is steep.",
    "Great experience but visit early to avoid the heat.",
    "Highlight of the trip — don't rush, give it 2-3 hours.",
    "Worth visiting, but a guide makes a huge difference.",
    "Bring a hat and decent shoes — terrain can be uneven.",
    "Wonderful, though the entrance fee was a surprise.",
    "Better than expected but information signs are scarce.",
  ],
};

const detailExtras = [
  "Tip: go on a weekday morning to avoid crowds.",
  "Pair it with a stop in nearby Sidi Bou Said for a full day.",
  "We hired a local guide for 30 TND — money well spent.",
  "Bring sunscreen and 2L of water in summer.",
  "The light an hour before sunset is unreal.",
  "Accessible by louage from the nearest town.",
  "Free wifi at the café next to the entrance.",
  "We came on a Friday and it was almost empty.",
];

function reviewFor(place, reviewerName) {
  const isPositive = Math.random() < 0.85;
  const bank = isPositive ? REVIEW_BANK.positive : REVIEW_BANK.mixed;
  const main = bank[Math.floor(Math.random() * bank.length)];
  const extra = detailExtras[Math.floor(Math.random() * detailExtras.length)];
  const ratingBase = isPositive ? 4.5 : 3.8;
  const rating = Math.min(5, Math.max(3, +(ratingBase + (Math.random() * 0.5 - 0.2)).toFixed(1)));
  return {
    rating,
    comment: `${main} — visiting ${place.name} was a great call. ${extra}`,
  };
}

async function main() {
  const c = new Client(PG);
  await c.connect();
  console.log('Connected to', `${PG.host}:${PG.port}/${PG.database}`);

  // 1. category lookup
  const { rows: catRows } = await c.query('SELECT id, name FROM categories');
  const catByName = Object.fromEntries(catRows.map(r => [r.name, r.id]));
  console.log('Found', catRows.length, 'categories');

  // 2. reviewer users — insert if missing
  const hashedPw = await bcrypt.hash('demo1234', 10);
  const reviewerIds = [];
  for (const r of REVIEWERS) {
    let { rows } = await c.query('SELECT id FROM users WHERE email=$1', [r.email]);
    if (rows.length === 0) {
      ({ rows } = await c.query(
        `INSERT INTO users (id, "fullName", email, password, role, country)
         VALUES (gen_random_uuid(), $1, $2, $3, 'user', 'Tunisia') RETURNING id`,
        [r.fullName, r.email, hashedPw],
      ));
    }
    reviewerIds.push({ id: rows[0].id, name: r.fullName });
  }
  console.log('Reviewers ready:', reviewerIds.length);

  // 3. places
  let placesInserted = 0;
  let placesSkipped = 0;
  for (const p of PLACES) {
    const catId = catByName[p.cat] || null;
    const images = pick(p.img, Math.min(p.img.length, 4)).join(',');
    const cover = p.img[0];
    const tagsStr = (p.tags || []).join(',');
    const baseReviewCount = 50 + Math.floor(Math.random() * 800);
    const viewCount = baseReviewCount * (8 + Math.floor(Math.random() * 14));

    try {
      await c.query(
        `INSERT INTO places (
           id, name, "nameFr", "nameAr", slug, description, address, city, governorate,
           latitude, longitude, images, "coverImage", tags, rating, "reviewCount", "viewCount",
           "isFeatured", "isActive", "isApproved", "categoryId", "priceRange", "openingHours", phone
         ) VALUES (
           gen_random_uuid(), $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,true,true,$18,$19,$20,$21
         )
         ON CONFLICT (slug) DO NOTHING`,
        [
          p.name, p.nameFr || null, p.nameAr || null, p.slug, p.description,
          p.address, p.city, p.governorate, p.latitude, p.longitude,
          images, cover, tagsStr, p.rating || 4.5, baseReviewCount, viewCount,
          !!p.isFeatured, catId, p.priceRange || null, p.openingHours || null, p.phone || null,
        ],
      );
      placesInserted++;
    } catch (e) {
      placesSkipped++;
      console.warn('skip', p.slug, '—', e.message);
    }
  }
  console.log(`Places: ${placesInserted} inserted, ${placesSkipped} skipped.`);

  // 4. reviews — 4 to 7 per place
  let reviewsInserted = 0;
  const { rows: placeRows } = await c.query('SELECT id, name, slug FROM places');
  for (const place of placeRows) {
    const matchPlace = PLACES.find(x => x.slug === place.slug);
    if (!matchPlace) continue;
    const n = 4 + Math.floor(Math.random() * 4);
    const usedReviewers = new Set();
    for (let i = 0; i < n; i++) {
      let reviewer;
      do {
        reviewer = reviewerIds[Math.floor(Math.random() * reviewerIds.length)];
      } while (usedReviewers.has(reviewer.id) && usedReviewers.size < reviewerIds.length);
      usedReviewers.add(reviewer.id);

      const { rating, comment } = reviewFor(matchPlace, reviewer.name);
      await c.query(
        `INSERT INTO reviews (id, rating, comment, "userId", "placeId")
         VALUES (gen_random_uuid(), $1, $2, $3, $4)`,
        [rating, comment, reviewer.id, place.id],
      );
      reviewsInserted++;
    }
  }
  console.log(`Reviews inserted: ${reviewsInserted}`);

  // 5. recompute place rating + reviewCount from actual reviews
  await c.query(`
    UPDATE places p SET
      rating = COALESCE(sub.avg, p.rating),
      "reviewCount" = COALESCE(sub.cnt, p."reviewCount")
    FROM (
      SELECT "placeId", ROUND(AVG(rating)::numeric, 1) AS avg, COUNT(*) AS cnt
      FROM reviews GROUP BY "placeId"
    ) sub
    WHERE sub."placeId" = p.id
  `);
  console.log('Recomputed place rating + reviewCount from reviews.');

  await c.end();
  console.log('Done.');
}

main().catch(e => {
  console.error('FAILED:', e);
  process.exit(1);
});
