// The 24 governorates of Tunisia — the collectible philatelic set. A check-in
// resolves to a governorate; the passport album fills in as the traveller
// completes the country. Names carry Arabic (a first-class design element).

export interface Governorate {
  id: string;
  name: string;   // Latin
  nameAr: string; // Arabic
  n: number;      // 1..24 — the stamp "denomination" / issue number
}

export const GOVERNORATES: Governorate[] = [
  { id: 'tunis',       name: 'Tunis',        nameAr: 'تونس',       n: 1 },
  { id: 'ariana',      name: 'Ariana',       nameAr: 'أريانة',     n: 2 },
  { id: 'ben-arous',   name: 'Ben Arous',    nameAr: 'بن عروس',    n: 3 },
  { id: 'manouba',     name: 'Manouba',      nameAr: 'منوبة',      n: 4 },
  { id: 'nabeul',      name: 'Nabeul',       nameAr: 'نابل',       n: 5 },
  { id: 'zaghouan',    name: 'Zaghouan',     nameAr: 'زغوان',      n: 6 },
  { id: 'bizerte',     name: 'Bizerte',      nameAr: 'بنزرت',      n: 7 },
  { id: 'beja',        name: 'Béja',         nameAr: 'باجة',       n: 8 },
  { id: 'jendouba',    name: 'Jendouba',     nameAr: 'جندوبة',     n: 9 },
  { id: 'le-kef',      name: 'Le Kef',       nameAr: 'الكاف',      n: 10 },
  { id: 'siliana',     name: 'Siliana',      nameAr: 'سليانة',     n: 11 },
  { id: 'sousse',      name: 'Sousse',       nameAr: 'سوسة',       n: 12 },
  { id: 'monastir',    name: 'Monastir',     nameAr: 'المنستير',   n: 13 },
  { id: 'mahdia',      name: 'Mahdia',       nameAr: 'المهدية',    n: 14 },
  { id: 'sfax',        name: 'Sfax',         nameAr: 'صفاقس',      n: 15 },
  { id: 'kairouan',    name: 'Kairouan',     nameAr: 'القيروان',   n: 16 },
  { id: 'kasserine',   name: 'Kasserine',    nameAr: 'القصرين',    n: 17 },
  { id: 'sidi-bouzid', name: 'Sidi Bouzid',  nameAr: 'سيدي بوزيد', n: 18 },
  { id: 'gabes',       name: 'Gabès',        nameAr: 'قابس',       n: 19 },
  { id: 'medenine',    name: 'Médenine',     nameAr: 'مدنين',      n: 20 },
  { id: 'tataouine',   name: 'Tataouine',    nameAr: 'تطاوين',     n: 21 },
  { id: 'gafsa',       name: 'Gafsa',        nameAr: 'قفصة',       n: 22 },
  { id: 'tozeur',      name: 'Tozeur',       nameAr: 'توزر',       n: 23 },
  { id: 'kebili',      name: 'Kébili',       nameAr: 'قبلي',       n: 24 },
];

export const GOVERNORATE_BY_ID: Record<string, Governorate> =
  Object.fromEntries(GOVERNORATES.map((g) => [g.id, g]));

// Known sub-cities / landmarks → governorate. Keys are lowercased. Anything
// whose city already equals a governorate name resolves without an entry here.
const CITY_ALIASES: Record<string, string> = {
  'sidi bou said': 'tunis', 'carthage': 'tunis', 'la marsa': 'tunis', 'la goulette': 'tunis',
  'gammarth': 'tunis', 'bardo': 'tunis',
  'raoued': 'ariana', 'la soukra': 'ariana',
  'rades': 'ben-arous', 'radès': 'ben-arous', 'hammam lif': 'ben-arous', 'ezzahra': 'ben-arous',
  'hammamet': 'nabeul', 'nabeul': 'nabeul', 'kelibia': 'nabeul', 'korba': 'nabeul', 'el haouaria': 'nabeul',
  'tabarka': 'jendouba', 'ain draham': 'jendouba', 'aïn draham': 'jendouba',
  'dougga': 'beja', 'testour': 'beja',
  'el jem': 'mahdia', 'el djem': 'mahdia',
  'port el kantaoui': 'sousse', 'kantaoui': 'sousse', 'hergla': 'sousse', 'enfidha': 'sousse',
  'sbeitla': 'kasserine', 'sufetula': 'kasserine',
  'djerba': 'medenine', 'jerba': 'medenine', 'houmt souk': 'medenine', 'midoun': 'medenine',
  'zarzis': 'medenine', 'ben gardane': 'medenine',
  'matmata': 'gabes', 'el hamma': 'gabes',
  'chenini': 'tataouine', 'ksar ouled soltane': 'tataouine', 'ghomrassen': 'tataouine',
  'nefta': 'tozeur', 'chebika': 'tozeur', 'tamerza': 'tozeur', 'tamaghza': 'tozeur', 'ong jemel': 'tozeur',
  'douz': 'kebili', 'ksar ghilane': 'kebili',
  'metlaoui': 'gafsa',
  'takrouna': 'sousse', 'zaghouan': 'zaghouan', 'thuburbo majus': 'zaghouan',
};

const COMBINING = new RegExp('[\\u0300-\\u036f]', 'g');
/** Lowercase + strip accents (é→e, è→e) for tolerant matching. */
function deaccent(s: string): string {
  return s.trim().toLowerCase().normalize('NFD').replace(COMBINING, '');
}

/** Resolve a place's city/location string to a governorate id, or null. */
export function resolveGovernorate(city?: string | null, location?: string | null): string | null {
  for (const raw of [city, location]) {
    if (!raw) continue;
    const key = raw.trim().toLowerCase();
    if (!key) continue;
    if (CITY_ALIASES[key]) return CITY_ALIASES[key];
    const norm = deaccent(key);
    const hit = GOVERNORATES.find((g) => deaccent(g.name) === norm);
    if (hit) return hit.id;
    // Loose contains (e.g. "Sfax Medina" → sfax).
    const loose = GOVERNORATES.find((g) => {
      const gn = deaccent(g.name);
      return norm.includes(gn) || key.includes(g.id.replace('-', ' '));
    });
    if (loose) return loose.id;
  }
  return null;
}

/** Governorate ids earned from a list of visited city names. */
export function governoratesFromCities(cities: string[] | undefined): Set<string> {
  const out = new Set<string>();
  for (const c of cities || []) {
    const id = resolveGovernorate(c);
    if (id) out.add(id);
  }
  return out;
}
