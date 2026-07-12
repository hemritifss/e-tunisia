// Reusable rubber-stamp / postmark SVG (carnet identity).
// Returns an inline SVG string coloured via `currentColor`, so the caller sets
// `color: var(--stamp-ink)` on the container. Used by the check-in stamp slam
// now, and by the passport stamp album later (Phase 2 governorate set).

export interface StampOptions {
  /** Center line — usually the place name. Long names auto-shrink. */
  title: string;
  /** Small line under the title — city / governorate. */
  city?: string;
  /** Arced text along the top. */
  top?: string;
  /** Arced text along the bottom (e.g. a date). */
  bottom?: string;
  /** Rough, inky edge. Default true. Set false for a crisp album stamp. */
  rough?: boolean;
}

/** Escape text for safe embedding in SVG markup. */
function esc(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Rough length-based font size so long place names still fit the disc. */
function titleSize(title: string): number {
  const n = title.length;
  if (n <= 9) return 22;
  if (n <= 13) return 18;
  if (n <= 18) return 15;
  return 12;
}

export function renderStampSVG(opts: StampOptions): string {
  const { title, city = '', top = 'KONT HOUNI', bottom = 'TUNISIE', rough = true } = opts;
  const ts = titleSize(title);
  // Unique filter id so multiple stamps on one page don't collide.
  const fid = 'sr' + Math.random().toString(36).slice(2, 8);
  const filter = rough
    ? `<filter id="${fid}"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="1" result="n"/>` +
      `<feDisplacementMap in="SourceGraphic" in2="n" scale="1.6"/></filter>`
    : '';
  const fattr = rough ? ` filter="url(#${fid})"` : '';

  return `<svg viewBox="0 0 200 200" role="img" aria-label="${esc(top)} ${esc(title)}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    ${filter}
    <path id="${fid}-top" d="M32,100 A68,68 0 0 1 168,100" fill="none"/>
    <path id="${fid}-bot" d="M36,100 A64,64 0 0 0 164,100" fill="none"/>
  </defs>
  <g${fattr} fill="currentColor" stroke="currentColor">
    <circle cx="100" cy="100" r="88" fill="none" stroke-width="2.5"/>
    <circle cx="100" cy="100" r="80" fill="none" stroke-width="1"/>
    <text font-family="'JetBrains Mono', monospace" font-size="13" font-weight="600"
          letter-spacing="2.5" text-anchor="middle" stroke="none">
      <textPath href="#${fid}-top" startOffset="50%">${esc(top)}</textPath>
    </text>
    <text font-family="'JetBrains Mono', monospace" font-size="11" font-weight="500"
          letter-spacing="2" text-anchor="middle" stroke="none">
      <textPath href="#${fid}-bot" startOffset="50%">${esc(bottom)}</textPath>
    </text>
    <line x1="52" y1="74" x2="148" y2="74" stroke-width="1.5"/>
    <line x1="52" y1="126" x2="148" y2="126" stroke-width="1.5"/>
    <text x="100" y="${city ? 98 : 106}" font-family="Fraunces, Georgia, serif" font-size="${ts}"
          font-weight="600" text-anchor="middle" stroke="none">${esc(title.toUpperCase())}</text>
    ${city ? `<text x="100" y="116" font-family="'JetBrains Mono', monospace" font-size="9"
          font-weight="500" letter-spacing="2" text-anchor="middle" stroke="none"
          opacity="0.85">${esc(city.toUpperCase())}</text>` : ''}
  </g>
</svg>`;
}
