// Reusable rubber-stamp / postmark SVG (carnet identity).
// Returns an inline SVG string coloured via `currentColor`, so the caller sets
// `color: var(--accent)` on the container. Used by the check-in stamp slam
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
  /** Optional engraved emblem above the title (governorate motif). */
  motif?: string;
}

/** Stroke-based emblem glyphs, drawn in a 24×24 box (later centred + scaled).
 *  Kept simple so they read at album-thumbnail size. */
const MOTIFS: Record<string, string> = {
  arch:         'M6,21 L6,11 A6,6 0 0 1 18,11 L18,21 M9.5,21 L9.5,15 A2.5,2.5 0 0 1 14.5,15 L14.5,21',
  waves:        'M2,9 Q6,5 10,9 T18,9 M2,14 Q6,10 10,14 T18,14 M2,19 Q6,15 10,19 T18,19',
  mountain:     'M2,20 L9,7 L13,13 L16,9 L22,20 Z M9,7 L11,10',
  wheat:        'M12,22 L12,6 M12,8 C9,7 8,5 8.5,3 M12,8 C15,7 16,5 15.5,3 M12,12 C9,11 8,9 8.5,7 M12,12 C15,11 16,9 15.5,7 M12,16 C9,15 8,13 8.5,11 M12,16 C15,15 16,13 15.5,11',
  minaret:      'M9,21 L9,8 L12,3 L15,8 L15,21 M8,21 L16,21 M9,12 L15,12 M12,8 L12,3',
  amphitheater: 'M2,20 L22,20 M4,20 L4,13 A3,3 0 0 1 10,13 L10,20 M14,20 L14,13 A3,3 0 0 1 20,13 L20,20 M4,10 L20,10',
  palm:         'M12,22 L12,11 M12,11 C8,9.5 5.5,7.5 4,5 M12,11 C16,9.5 18.5,7.5 20,5 M12,11 C11,7.5 12,5 12,2.5 M12,11 C9.5,9 8,7 7,4 M12,11 C14.5,9 16,7 17,4',
  dune:         'M2,18 C6,11 10,20 13,15 C15,12 18,13 22,12 M2,18 L22,18',
};

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
  const glyph = opts.motif && MOTIFS[opts.motif]
    ? `<g transform="translate(100,57) scale(0.62) translate(-12,-12)" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${MOTIFS[opts.motif]}"/></g>`
    : '';

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
    ${glyph}
    <line x1="52" y1="74" x2="148" y2="74" stroke-width="1.5"/>
    <line x1="52" y1="126" x2="148" y2="126" stroke-width="1.5"/>
    <text x="100" y="${city ? 98 : 106}" font-family="'Instrument Serif', Georgia, serif" font-size="${ts}"
          font-weight="600" text-anchor="middle" stroke="none">${esc(title.toUpperCase())}</text>
    ${city ? `<text x="100" y="116" font-family="'JetBrains Mono', monospace" font-size="9"
          font-weight="500" letter-spacing="2" text-anchor="middle" stroke="none"
          opacity="0.85">${esc(city.toUpperCase())}</text>` : ''}
  </g>
</svg>`;
}
