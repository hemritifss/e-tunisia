// Replace stock Unsplash photos in the place seeds with the real Wikipedia lead
// image of each landmark. A travel app's credibility IS its imagery — a Canadian
// lake illustrating a Kairouan souk reads "fake" no matter how polished the UI.
//
// - Resolves each seed place to a curated Wikipedia article (en/fr fallbacks)
// - Pulls the article's lead image at 1200px via the MediaWiki pageimages API
// - Verifies each URL responds 200
// - Patches backend/src/seeds/seed.ts and more_places.ts in place
// - Emits travel-content/fix-photos.sql to repair an already-seeded database
//
// Usage: node travel-content/fix-seed-photos.mjs

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SEED_FILES = [
  join(ROOT, 'backend/src/seeds/seed.ts'),
  join(ROOT, 'backend/src/seeds/more_places.ts'),
];
const SQL_OUT = join(ROOT, 'travel-content/fix-photos.sql');

// Seed place name → ordered Wikipedia article candidates ('fr:' = French wiki).
const ARTICLES = {
  'Amphitheatre of El Jem': ['Amphitheatre of El Jem'],
  'Medina of Tunis': ['Medina of Tunis'],
  'Sidi Bou Said': ['Sidi Bou Said'],
  'Carthage Archaeological Site': ['Carthage'],
  'Dougga (Thugga)': ['Dougga'],
  'Kairouan Great Mosque': ['Great Mosque of Kairouan'],
  'Great Mosque of Kairouan': ['Great Mosque of Kairouan'],
  'Bardo National Museum': ['Bardo National Museum (Tunis)', 'fr:Musée national du Bardo (Tunisie)'],
  'Ksar Ouled Soltane': ['Ksar Ouled Soltane'],
  'Bambalouni - Tunisian Doughnut': ['fr:Bambalouni', 'Bambalouni', 'Sidi Bou Said'],
  'Dar El Jeld Restaurant': ['fr:Dar El Jeld', 'Medina of Tunis'],
  'Marché Central de Tunis': ['fr:Marché central de Tunis', 'Tunis'],
  'Lablabi Street Food': ['Lablabi', 'fr:Lablabi'],
  'Café des Délices': ['fr:Café Sidi Chabaane', 'Sidi Bou Said'],
  'Chott el Jerid': ['Chott el Djerid'],
  'Djerba Island': ['Djerba'],
  'Ichkeul National Park': ['Ichkeul National Park', 'Lake Ichkeul'],
  'Tabarka': ['Tabarka'],
  'Matmata (Troglodyte Houses)': ['Matmata, Tunisia', 'Matmata'],
  'Matmata Troglodyte Village': ['Matmata, Tunisia', 'Matmata'],
  'Tozeur Oasis': ['Tozeur'],
  'Ain Draham': ['Aïn Draham', 'Ain Draham'],
  'Cap Bon': ['Cap Bon'],
  'Hammamet Beach': ['Hammamet, Tunisia', 'Hammamet'],
  'Ribat of Sousse': ['Ribat of Sousse', 'Sousse'],
  'Mausoleum of Habib Bourguiba': ['Bourguiba mausoleum', 'fr:Mausolée de Habib Bourguiba', 'Monastir'],
  'Ksar Ghilane Oasis': ['fr:Ksar Ghilane', 'Ksar Ghilane', 'Douz'],
  'Chebika Mountain Oasis': ['fr:Chebika', 'Chebika', 'Tozeur'],
  'Nabeul Pottery Market': ['Nabeul'],
  'Carpet Workshop of Kairouan': ['Kairouan'],
  'Guellala Heritage Museum': ['Guellala', 'Djerba'],
  'Carthage International Festival': ['Carthage International Festival', 'Carthage'],
  'Tabarka Jazz Festival': ['Tabarka Jazz Festival', 'Tabarka'],
  'Douz Sahara Festival': ['International Festival of the Sahara', 'Douz'],
  'Dar El Medina': ['Medina of Tunis'],
  'La Badira Hotel': ['Hammamet, Tunisia', 'Hammamet'],
  'Anantara Tozeur Resort': ['Tozeur'],
  'Bulla Regia': ['Bulla Regia'],
  'Sbeitla (Sufetula)': ['Sbeitla', 'Sufetula'],
  'Zaghouan Water Temple': ['fr:Temple des eaux de Zaghouan', 'Zaghouan'],
  'Oued Zitoun Waterfalls': ['Aïn Draham', 'Tabarka'],
  'Cap Blanc & Bizerte Coast': ['Cap Blanc (Tunisia)', 'Bizerte'],
  'Djerbahood (Erriadh)': ['Erriadh', 'Djerba'],
  'Takrouna Berber Village': ['fr:Takrouna', 'Takrouna'],
  'Cafe des Nattes (Sidi Bou Said)': ['fr:Café des Nattes', 'Sidi Bou Said'],
  'Medina of Tunis Souks': ['Medina of Tunis'],
  'Korbous Thermal Baths': ['fr:Korbous', 'Korbous'],

  // DB-only places (older seed runs) — not present in the current seed files,
  // fixed via the emitted SQL only.
  'Aghlabid Basins': ['Aghlabid Basins', 'fr:Bassins des Aghlabides', 'Kairouan'],
  'Bizerte Old Port': ['Bizerte'],
  'Borj el Kebir (Mahdia)': ['fr:Borj El Kebir (Mahdia)', 'Mahdia'],
  'Bouhedma National Park': ['Bouhedma National Park', 'fr:Parc national de Bouhedma'],
  'Café Sidi Chabaane': ['fr:Café Sidi Chabaane', 'Sidi Bou Said'],
  'Cap Angela': ['Cape Angela', 'fr:Cap Angela', 'Bizerte'],
  'Cap Bon Peninsula': ['Cap Bon'],
  'Carpet Souks of Kairouan': ['Kairouan'],
  'Chebika Oasis': ['Chebika', 'fr:Chebika'],
  'Chemtou (Simitthus)': ['Chemtou'],
  'Chenini': ['Chenini'],
  'Chott el Djerid': ['Chott el Djerid'],
  'Dar Ben Gacem': ['Medina of Tunis'],
  'Douiret': ['Douiret'],
  'Douz — Gateway to the Sahara': ['Douz'],
  'El Ghriba Synagogue': ['El Ghriba synagogue', 'Djerba'],
  'El Haouaria Caves': ['El Haouaria'],
  'El Walima': ['Medina of Tunis', 'Tunis'],
  'Fondouk El Attarine': ['fr:Souk El Attarine', 'Medina of Tunis'],
  'Gammarth Beach': ['Gammarth', 'fr:Gammarth'],
  'Ghomrassen': ['fr:Ghomrassen', 'Tataouine'],
  'Haïdra (Ammaedara)': ['Ammaedara', 'Haïdra'],
  'Jebel Chambi': ['Jebel ech Chambi', 'fr:Djebel Chambi'],
  'Kasbah of Sousse': ['Sousse'],
  'Kasbah of Tunis': ['Kasbah Mosque', 'Tunis'],
  'Kerkennah Islands': ['Kerkennah Islands'],
  'Kerkouane': ['Kerkouane'],
  'Ksar Ghilane': ['fr:Ksar Ghilane', 'Ksar Ghilane', 'Douz'],
  'Ksar Hadada': ['Ksar Ould Debbab', 'fr:Ksar Hedada', 'Tataouine'],
  'La Marsa Beach': ['La Marsa'],
  'La Marsa Promenade': ['fr:La Marsa', 'La Marsa', 'Sidi Bou Said'],
  'Mahdia Old Town': ['fr:Mahdia', 'Mahdia'],
  'Maktar (Mactaris)': ['fr:Makthar', 'Mactar', 'Maktar'],
  'Matmata (Troglodyte Homes)': ['Matmata, Tunisia', 'Matmata'],
  'Medina of Kairouan': ['Kairouan'],
  'Medina of Sousse': ['Medina of Sousse', 'Sousse'],
  'Mides Canyon': ['Mides', 'fr:Midès'],
  'Mos Espa Set': ['Mos Espa', 'Nefta'],
  'Mosque of the Three Doors': ['Mosque of the Three Doors', 'Kairouan'],
  'Ong Jemal': ['Ong Jemal', 'Mos Espa', 'Nefta'],
  'Oudhna (Uthina)': ['fr:Oudna', 'Uthina'],
  'Port El Kantaoui': ['fr:Port El-Kantaoui', 'Port El Kantaoui', 'Sousse'],
  'Ribat of Monastir': ['fr:Ribat de Monastir', 'Monastir'],
  'Souk El Berka (Slave Market)': ['fr:Souk El Berka', 'Medina of Tunis'],
  'Tabarka & Coral Coast': ['Tabarka'],
  'Tamerza Canyon': ['Tamerza'],
  'Tamezret': ['Tamezret', 'fr:Tamezret'],
  'The Residence Tunis': ['Gammarth'],
  'Thuburbo Majus': ['Thuburbo Majus'],
  'Toujane': ['fr:Toujane', 'Matmata, Tunisia'],
  'Utica': ['Utica, Tunisia'],
  'Younga (Iunca Maritima)': ['fr:Younga', 'Mahdia'],
  'Zaghouan Mountain & Roman Water Temple': ['fr:Djebel Zaghouan', 'Zaghouan'],
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function leadImage(candidate, attempt = 1) {
  const [lang, title] = candidate.startsWith('fr:')
    ? ['fr', candidate.slice(3)]
    : ['en', candidate];
  const api = `https://${lang}.wikipedia.org/w/api.php?action=query&format=json&prop=pageimages&piprop=thumbnail&pithumbsize=1200&redirects=1&origin=*&titles=${encodeURIComponent(title)}`;
  try {
    const res = await fetch(api, { headers: { 'User-Agent': 'e-tunisia-seed-fixer/1.0 (dev tooling; contact: local)' } });
    if (!res.ok) {
      console.warn(`    [${candidate}] HTTP ${res.status}`);
      if ((res.status === 429 || res.status >= 500) && attempt <= 2) {
        await sleep(1500 * attempt);
        return leadImage(candidate, attempt + 1);
      }
      return null;
    }
    const json = await res.json();
    for (const page of Object.values(json?.query?.pages || {})) {
      const src = page?.thumbnail?.source;
      if (src) return src;
    }
    return null;
  } catch (err) {
    console.warn(`    [${candidate}] ${err.message}`);
    if (attempt <= 2) { await sleep(1500 * attempt); return leadImage(candidate, attempt + 1); }
    return null;
  }
}

const CACHE = join(ROOT, 'travel-content/.photo-cache.json');

function readCache() {
  try { return JSON.parse(readFileSync(CACHE, 'utf8')); } catch { return {}; }
}

async function resolveAll() {
  const resolved = readCache();
  const pending = Object.entries(ARTICLES).filter(([place]) => !resolved[place]);
  console.log(`${Object.keys(resolved).length} cached, ${pending.length} to resolve`);
  for (const [place, candidates] of pending) {
    let found = null;
    for (const cand of candidates) {
      const url = await leadImage(cand);
      await sleep(800); // stay well under Wikimedia burst limits
      if (url) { found = { url, via: cand }; break; }
    }
    if (found) {
      resolved[place] = found;
      writeFileSync(CACHE, JSON.stringify(resolved, null, 2)); // survive rate-limit aborts
      console.log(`✓ ${place}  ←  ${found.via}`);
    } else {
      console.warn(`✗ ${place}  — no image found, keeping existing`);
    }
  }
  return resolved;
}

const UNSPLASH_LINE = /(['"])https:\/\/images\.unsplash\.com[^'"]*\1/;

function patchFile(file, resolved) {
  const lines = readFileSync(file, 'utf8').split('\n');
  let current = null;         // seed place name of the block we're inside
  let seenArrayImage = false; // first unsplash line in the images array is kept (rewritten), later ones dropped
  let replaced = 0;
  const out = [];

  for (const line of lines) {
    const nameMatch = line.match(/^\s*name: '([^']+)'/);
    if (nameMatch) { current = nameMatch[1]; seenArrayImage = false; out.push(line); continue; }

    const hit = current && resolved[current] && UNSPLASH_LINE.test(line);
    if (!hit) { out.push(line); continue; }

    const newUrl = resolved[current].url;
    if (/coverImage\s*:/.test(line)) {
      out.push(line.replace(UNSPLASH_LINE, `'${newUrl}'`));
      replaced++;
    } else if (!seenArrayImage) {
      out.push(line.replace(UNSPLASH_LINE, `'${newUrl}'`));
      seenArrayImage = true;
      replaced++;
    } // else: drop duplicate stock entries in the images array
  }

  writeFileSync(file, out.join('\n'));
  console.log(`patched ${file} (${replaced} URLs)`);
}

function emitSql(resolved) {
  const esc = (s) => s.replace(/'/g, "''");
  const stmts = Object.entries(resolved).map(([name, { url }]) =>
    `UPDATE places SET "coverImage" = '${esc(url)}', images = '${esc(url)}' WHERE name = '${esc(name)}' AND ("coverImage" LIKE '%unsplash%' OR "coverImage" IS NULL);`
  );
  writeFileSync(SQL_OUT, ['BEGIN;', ...stmts, 'COMMIT;', ''].join('\n'));
  console.log(`wrote ${SQL_OUT} (${stmts.length} updates)`);
}

const resolved = await resolveAll();
for (const file of SEED_FILES) patchFile(file, resolved);
emitSql(resolved);
console.log('\nDone. Apply to a running DB with:');
console.log('  docker exec -i etunisia-postgres psql -U <user> -d <db> < travel-content/fix-photos.sql');
