// Shared travel-ephemera glyphs and artifacts for the landing.
// One stroke family, no emoji; every decorative SVG is aria-hidden.
import React from 'react';

export const Arrow = ({ size = 17 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);

export const StarSvg = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1" aria-hidden="true">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

export const HeartSvg = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
  </svg>
);

export const EyeSvg = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

/* Rubber stamp — circular text on two rings, inked in terracotta */
export const RoundStamp = ({ className = 'ej-stamp', idSuffix = '' }: { className?: string; idSuffix?: string }) => {
  const arcId = `ej-stamp-arc${idSuffix}`;
  return (
    <svg className={className} viewBox="0 0 120 120" aria-hidden="true">
      <defs>
        <path id={arcId} d="M 60,60 m -45,0 a 45,45 0 1,1 90,0 a 45,45 0 1,1 -90,0" fill="none" />
      </defs>
      <circle cx="60" cy="60" r="57" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
      <circle cx="60" cy="60" r="33" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <text fontSize="10.5" letterSpacing="2.2" fill="currentColor" style={{ fontFamily: 'var(--font-mono)' }}>
        <textPath href={`#${arcId}`}>E-TUNISIA · CARNET DE VOYAGE · EST. TUNIS ·</textPath>
      </text>
      <text x="60" y="66" textAnchor="middle" fontSize="17" fontWeight="700" fill="currentColor" style={{ fontFamily: "'Noto Kufi Arabic', sans-serif" }}>تونس</text>
    </svg>
  );
};

/* Postmark — cancellation circle + wavy lines, like a mailed card */
export const Postmark = ({ className = 'ej-postcard-postmark' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 60 60" aria-hidden="true">
    <circle cx="24" cy="30" r="16" fill="none" stroke="currentColor" strokeWidth="1.2" />
    <text x="24" y="28" textAnchor="middle" fontSize="6" fill="currentColor" letterSpacing="0.5" style={{ fontFamily: 'var(--font-mono)' }}>TUNIS</text>
    <text x="24" y="36" textAnchor="middle" fontSize="5.2" fill="currentColor" style={{ fontFamily: 'var(--font-mono)' }}>2026</text>
    <path d="M38 22q6 2 16 0M38 30q6 2 16 0M38 38q6 2 16 0" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
  </svg>
);

/* Torn / deckle paper edge between scenes. `fill` is the color of the
   incoming section's paper; flip=true for a bottom edge. */
export const TornEdge = ({ fill, flip = false }: { fill: string; flip?: boolean }) => (
  <svg
    className={`ej-torn${flip ? ' ej-torn--flip' : ''}`}
    viewBox="0 0 1200 26"
    preserveAspectRatio="none"
    aria-hidden="true"
  >
    <path
      d="M0 26 L0 14 C 30 10, 55 19, 90 13 C 125 7, 150 17, 190 12 C 230 7, 260 20, 300 14 C 340 8, 370 16, 410 11 C 450 6, 480 19, 520 13 C 560 7, 590 15, 630 10 C 670 5, 700 18, 740 13 C 780 8, 810 16, 850 11 C 890 6, 920 19, 960 14 C 1000 9, 1030 17, 1070 12 C 1110 7, 1150 18, 1200 13 L1200 26 Z"
      fill={fill}
    />
  </svg>
);
