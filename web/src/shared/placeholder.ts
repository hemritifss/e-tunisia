// Deterministic, branded cover placeholder for items without an image.
// Returns an inline SVG data-URI keyed by a seed, so each item gets a
// distinct (but stable) cover instead of every image-less item sharing one
// generic stock photo.

function hashInt(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// encodeURIComponent leaves the apostrophe unescaped, which terminates a CSS
// url('...') wrapper early and makes the whole background-image invalid (the
// itinerary covers hit exactly this). Percent-encode it so the data URI is safe
// in both an <img src> and a CSS background-image url().
function svgDataUri(svg: string): string {
  return `data:image/svg+xml,${encodeURIComponent(svg).replace(/'/g, '%27')}`;
}

// Flat system tints — stone-pale, accent-pale, wall. Variety without leaving the
// palette: the seed picks the tile, never the hue.
const TILE_TINTS = ['#F2EBDD', '#E4EDF9', '#EDF1F7'];

export function coverPlaceholder(seed = '', label = ''): string {
  const key = seed || label || 'e-tunisia';
  const tint = TILE_TINTS[hashInt(key) % TILE_TINTS.length];
  const initial = (label || seed || '•').trim().charAt(0).toUpperCase() || '•';
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'>` +
    `<rect width='400' height='300' fill='${tint}'/>` +
    `<rect x='8.5' y='8.5' width='383' height='283' fill='none' stroke='rgba(29,46,74,0.10)' stroke-width='1'/>` +
    // Data-URI SVGs cannot pull the webfonts, so the system serif stack stands in.
    `<text x='200' y='170' font-family='Georgia, serif' font-size='140' ` +
    `fill='rgba(29,46,74,0.15)' text-anchor='middle'>${initial}</text>` +
    `<text x='200' y='262' font-family='Georgia, serif' font-size='15' ` +
    `fill='rgba(29,46,74,0.38)' letter-spacing='2.5' text-anchor='middle'>E-TUNISIA</text>` +
    `</svg>`;
  return svgDataUri(svg);
}

// ── Context placeholders ─────────────────────────────────────────────────────
// Branded fallback used by getImageUrl() when an item has no image and we know
// only its *kind* (place/post/event/itinerary/avatar), not its identity. Unlike
// coverPlaceholder() above (per-item tile), these carry a matching line-art
// glyph + the e-Tunisia wordmark, so a missing cover reads as "coming soon"
// rather than random stock scenery. Self-contained: no network, works offline.

export type PlaceholderContext =
  | 'place' | 'post' | 'event' | 'itinerary' | 'avatar';

// Glyphs authored in a 0–24 coordinate space (lucide-style geometry).
const GLYPH: Record<Exclude<PlaceholderContext, 'avatar'>, string> = {
  place:
    "<path d='M12 21s-6.5-5.8-6.5-10.5a6.5 6.5 0 1 1 13 0C18.5 15.2 12 21 12 21z'/><circle cx='12' cy='10.5' r='2.4'/>",
  post:
    "<rect x='3.5' y='4.5' width='17' height='15' rx='2.5'/><circle cx='8.5' cy='9.5' r='1.6'/><path d='M4 17l4.5-4.5L12 16l3-3 5 5'/>",
  event:
    "<rect x='4' y='5.5' width='16' height='14.5' rx='2'/><path d='M4 10h16M8 3.5v4M16 3.5v4'/>",
  itinerary:
    "<circle cx='6' cy='6.5' r='2.2'/><circle cx='18' cy='17.5' r='2.2'/><path d='M6 8.7v4a3 3 0 0 0 3 3h3a3 3 0 0 1 3 3'/>",
};

function landscapePlaceholder(glyph: string, label: string): string {
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='600' height='450' viewBox='0 0 600 450' role='img' aria-label='${label}'>` +
    `<defs><linearGradient id='g' x1='0' y1='0' x2='0' y2='1'>` +
    `<stop offset='0' stop-color='#F2EBDD'/><stop offset='1' stop-color='#E7DECC'/>` +
    `</linearGradient></defs>` +
    `<rect width='600' height='450' fill='url(#g)'/>` +
    `<g transform='translate(240 135) scale(5)' fill='none' stroke='#1E5FA8' ` +
    `stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round' opacity='0.5'>${glyph}</g>` +
    `<text x='300' y='400' text-anchor='middle' font-family='Georgia, serif' ` +
    `font-size='22' fill='#6B5B3E' letter-spacing='1.5'>e-Tunisia</text>` +
    `</svg>`;
  return svgDataUri(svg);
}

const AVATAR_PLACEHOLDER = svgDataUri(
  `<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200' role='img' aria-label='Traveler'>` +
  `<rect width='200' height='200' fill='#E7DECC'/>` +
  `<circle cx='100' cy='80' r='34' fill='#1E5FA8' opacity='0.55'/>` +
  `<path d='M40 176c0-33 27-52 60-52s60 19 60 52z' fill='#1E5FA8' opacity='0.55'/>` +
  `</svg>`,
);

const CONTEXT_PLACEHOLDER: Record<PlaceholderContext, string> = {
  place: landscapePlaceholder(GLYPH.place, 'Place image coming soon'),
  post: landscapePlaceholder(GLYPH.post, 'Photo coming soon'),
  event: landscapePlaceholder(GLYPH.event, 'Event image coming soon'),
  itinerary: landscapePlaceholder(GLYPH.itinerary, 'Itinerary cover coming soon'),
  avatar: AVATAR_PLACEHOLDER,
};

/** Branded fallback image for a given content context. */
export function brandPlaceholder(context?: PlaceholderContext): string {
  return CONTEXT_PLACEHOLDER[context ?? 'place'] ?? CONTEXT_PLACEHOLDER.place;
}
