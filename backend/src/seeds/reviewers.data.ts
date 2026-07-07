// Seed personas + review copy for the hidden-gems seeder (seed-gems.ts).
// Emails all use the @travelers.etunisia.tn domain so the seeder can detect
// (and stay idempotent about) the reviews/users it created.

export interface ReviewerSeed {
  fullName: string;
  handle: string;
  country: string;
  bio: string;
  plan: 'free' | 'premium' | 'business';
  /** pravatar image index 1..70 */
  avatarIdx: number;
}

const DOMAIN = '@travelers.etunisia.tn';

export const reviewers: ReviewerSeed[] = [
  { fullName: 'Yassine Khelifi',     handle: 'yassine_explores', country: 'Tunisia',        plan: 'premium',  avatarIdx: 12, bio: 'Tunis-based travel photographer chasing light across the medinas and the Sahara.' },
  { fullName: 'Amira Ben Salah',     handle: 'amira_wanders',    country: 'Tunisia',        plan: 'free',     avatarIdx: 5,  bio: 'Weekend road-tripper. Olive oil, mint tea, and back roads.' },
  { fullName: 'Lucas Moreau',        handle: 'lucasontheroad',   country: 'France',         plan: 'free',     avatarIdx: 33, bio: 'Lyon → anywhere with ruins and good bread.' },
  { fullName: 'Sofia Rossi',         handle: 'sofia_voyage',     country: 'Italy',          plan: 'premium',  avatarIdx: 9,  bio: 'Archaeology nerd. Will detour 200km for a mosaic.' },
  { fullName: 'Mehdi Trabelsi',      handle: 'mehdi_dunes',      country: 'Tunisia',        plan: 'business', avatarIdx: 14, bio: 'Desert guide out of Douz. The Sahara is my office.' },
  { fullName: 'Hana Bouzid',         handle: 'hana_eats',        country: 'Tunisia',        plan: 'free',     avatarIdx: 24, bio: 'Eating my way through every souk. Lablabi evangelist.' },
  { fullName: 'James Carter',        handle: 'jcarter_travels',  country: 'United Kingdom', plan: 'free',     avatarIdx: 51, bio: 'History teacher. Star Wars + Roman empire, equally obsessed.' },
  { fullName: 'Ines Gharbi',         handle: 'ines_g',           country: 'Tunisia',        plan: 'premium',  avatarIdx: 16, bio: 'Sfax girl. Islands, seafood, slow mornings.' },
  { fullName: 'Daniel Weber',        handle: 'dani_hikes',       country: 'Germany',        plan: 'free',     avatarIdx: 60, bio: 'Trail runner. If it has a viewpoint, I’m up there.' },
  { fullName: 'Nour El Houda',       handle: 'nour_elhouda',     country: 'Tunisia',        plan: 'free',     avatarIdx: 20, bio: 'Heritage student documenting Amazigh villages of the south.' },
  { fullName: 'Elena Petrova',       handle: 'elena_p',          country: 'Russia',         plan: 'free',     avatarIdx: 25, bio: 'Diver and beach-hunter on the Mediterranean.' },
  { fullName: 'Karim Jebali',        handle: 'karim_jb',         country: 'Tunisia',        plan: 'business', avatarIdx: 11, bio: 'Boutique-hotel owner in the Cap Bon. Hospitality is everything.' },
  { fullName: 'Chloé Dubois',        handle: 'chloe_d',          country: 'France',         plan: 'premium',  avatarIdx: 31, bio: 'Slow travel, sketchbook in hand.' },
  { fullName: 'Omar Saidi',          handle: 'omar_lens',        country: 'Tunisia',        plan: 'free',     avatarIdx: 13, bio: 'Drone shots of forts and coastlines. Bizerte born.' },
  { fullName: 'Maya Fournier',       handle: 'maya_f',           country: 'Canada',         plan: 'free',     avatarIdx: 44, bio: 'First time in North Africa and completely hooked.' },
  { fullName: 'Tariq Mansour',       handle: 'tariq_m',          country: 'Tunisia',        plan: 'free',     avatarIdx: 18, bio: 'Kairouan local. Carpets, calligraphy, quiet courtyards.' },
  { fullName: 'Greta Nilsson',       handle: 'greta_n',          country: 'Sweden',         plan: 'free',     avatarIdx: 47, bio: 'Birdwatcher. Flamingos are a personality trait now.' },
  { fullName: 'Rami Haddad',         handle: 'rami_h',           country: 'Tunisia',        plan: 'premium',  avatarIdx: 15, bio: 'Foodie + festival chaser. Mezoued until sunrise.' },
  { fullName: 'Aicha Mejri',         handle: 'aicha_mejri',      country: 'Tunisia',        plan: 'free',     avatarIdx: 21, bio: 'Pottery, weaving, and the women who keep the crafts alive.' },
  { fullName: 'Tom Anderson',        handle: 'tom_a',            country: 'United States',  plan: 'free',     avatarIdx: 53, bio: 'Backpacking the Maghreb on louages and curiosity.' },
  { fullName: 'Leïla Saadi',         handle: 'leila_s',          country: 'Tunisia',        plan: 'free',     avatarIdx: 23, bio: 'Djerba native. Synagogues, street art, and the sea.' },
  { fullName: 'Marco Bianchi',       handle: 'marco_b',          country: 'Italy',          plan: 'free',     avatarIdx: 56, bio: 'Sailing the Med, dropping anchor wherever looks good.' },
  { fullName: 'Sami Gharsalli',      handle: 'sami_g',           country: 'Tunisia',        plan: 'free',     avatarIdx: 17, bio: 'Mountain kid from Aïn Draham. Cork oaks and cold air.' },
  { fullName: 'Fatma Riahi',         handle: 'fatma_r',          country: 'Tunisia',        plan: 'premium',  avatarIdx: 26, bio: 'Family travel — proving kids love ruins if you bring snacks.' },
];

export function reviewerEmail(handle: string): string {
  return `${handle.replace(/[^a-z0-9]/gi, '').toLowerCase()}${DOMAIN}`;
}
export const REVIEWER_DOMAIN = DOMAIN;

// ── Review copy pools, by experience bucket. {place} and {city} are interpolated. ──
type Sentiment = { pos: string[]; mid: string[]; neg: string[] };

export const reviewSnippets: Record<'historical' | 'nature' | 'food' | 'artisan' | 'generic', Sentiment> = {
  historical: {
    pos: [
      'Walking through {place} felt like stepping back two thousand years. We practically had the place to ourselves.',
      '{place} is criminally underrated. The stonework is breathtaking and there were no crowds at all.',
      'Came for an hour, stayed for three. The detail still standing at {place} is incredible.',
      'A proper hidden gem near {city}. Bring water and good shoes — you’ll want to explore every corner.',
      'The light at golden hour over {place} was unreal. Easily a highlight of the whole trip.',
      'So much history packed into {place} and barely a tour bus in sight. Go before everyone finds out.',
      'Our guide brought {place} to life with stories. Worth hiring someone local.',
      'I’ve seen a lot of ruins and {place} genuinely surprised me. Beautifully preserved.',
    ],
    mid: [
      '{place} is impressive but there’s almost no signage — read up beforehand or you’ll miss the context.',
      'Worth a visit if you’re nearby, though {place} needs better upkeep in parts.',
      'Cool spot, but getting to {place} took longer than expected. Plan the drive.',
    ],
    neg: [
      'Honestly underwhelmed — {place} was hard to reach and there was little to see once we arrived.',
      'Beautiful in photos but {place} had no facilities and the access road was rough.',
    ],
  },
  nature: {
    pos: [
      'The views at {place} stopped me in my tracks. One of the most beautiful spots in Tunisia.',
      '{place} is pure magic at sunrise. Go early, take it slow, breathe it in.',
      'We swam, we hiked, we did nothing — {place} is perfect for all of it.',
      'Felt a million miles from the crowds. {place} near {city} is a proper escape.',
      'Photos don’t do {place} justice. The colours are something else.',
      'Spent the whole day at {place} and didn’t want to leave. Bring a picnic.',
      'Nature at its finest. {place} is exactly why I came to Tunisia.',
    ],
    mid: [
      '{place} is lovely but can get busy midday — arrive early for the calm.',
      'Pretty spot, though facilities around {place} are basic. Pack everything you need.',
      'Nice for a quick stop. {place} is scenic but the access is a bit of a trek.',
    ],
    neg: [
      'A bit of a letdown — {place} had litter around and felt neglected when we visited.',
      '{place} was hard to find and not really worth the detour for us.',
    ],
  },
  food: {
    pos: [
      'Some of the best food I had in Tunisia. {place} is the real deal — go hungry.',
      'Cheap, generous, delicious. {place} is exactly the local spot you hope to find.',
      'Sat for hours at {place} with mint tea and zero regrets. Lovely people.',
      'If you’re in {city}, do not skip {place}. Still thinking about that meal.',
      'Authentic and unpretentious. {place} serves the kind of food locals actually eat.',
    ],
    mid: [
      '{place} was tasty but service was slow when it got busy. Worth the wait though.',
      'Solid food at {place}, a touch touristy on price but still enjoyable.',
    ],
    neg: [
      'Overrated for us — {place} was fine but nothing special, and a bit pricey.',
    ],
  },
  artisan: {
    pos: [
      'Watched the artisans at work in {place} — mesmerising. Came home with treasures.',
      '{place} is a craft-lover’s dream. The skill passed down here is humbling.',
      'Bought directly from the makers at {place}. Real, beautiful, fairly priced.',
      'A wonderful window into local culture. {place} near {city} is worth the trip.',
    ],
    mid: [
      '{place} is interesting but quite small — give it an hour, not a day.',
      'Nice crafts at {place}, though some stalls felt aimed squarely at tourists.',
    ],
    neg: [
      'Expected more from {place} — felt a little staged and the prices were high.',
    ],
  },
  generic: {
    pos: [
      '{place} exceeded every expectation. A genuine hidden gem.',
      'So glad we made time for {place}. Don’t skip it.',
      'One of those places that stays with you. {place} was special.',
      'Loved every minute at {place}. Highly recommend.',
    ],
    mid: [
      '{place} is worth a look if you’re passing through {city}.',
      'Decent stop. {place} was fine, just manage your expectations.',
    ],
    neg: [
      '{place} didn’t click for us, but your mileage may vary.',
    ],
  },
};

export const reviewClosers: string[] = [
  'Would happily go back.',
  'Take a local guide if you can.',
  'Go early to beat the heat.',
  'Bring cash — no cards out here.',
  'Easily a trip highlight.',
  'Set aside more time than you think.',
  'Perfect for photos.',
  'A 4×4 makes the drive easier.',
];
