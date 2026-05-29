// Deterministic, branded cover placeholder for items without an image.
// Returns an inline SVG data-URI gradient keyed by a seed, so each item gets a
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

export function coverPlaceholder(seed = '', label = ''): string {
  const key = seed || label || 'e-tunisia';
  const hue = hashInt(key) % 360;
  const hue2 = (hue + 32) % 360;
  const initial = (label || seed || '•').trim().charAt(0).toUpperCase() || '•';
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'>` +
    `<defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>` +
    `<stop offset='0' stop-color='hsl(${hue} 52% 46%)'/>` +
    `<stop offset='1' stop-color='hsl(${hue2} 58% 30%)'/>` +
    `</linearGradient></defs>` +
    `<rect width='400' height='300' fill='url(#g)'/>` +
    `<text x='200' y='162' font-family='system-ui,-apple-system,sans-serif' font-size='150' font-weight='700' ` +
    `fill='rgba(255,255,255,0.16)' text-anchor='middle'>${initial}</text>` +
    `</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
