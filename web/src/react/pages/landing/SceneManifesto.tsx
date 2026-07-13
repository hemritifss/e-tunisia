// Scene 6 — Nº 04 The manifesto, printed on a different paper stock
// (a warm insert with torn edges). The pull-quote inks itself in
// word-by-word at the reader's own scroll pace.
import React, { useRef, useState } from 'react';
import { motion, useMotionValueEvent, useReducedMotion, useScroll } from 'framer-motion';
import { TornEdge } from './ephemera';
import { settle, VIEWPORT_ONCE } from './choreo';

const QUOTE = 'Tourism that gives back — not tourism that extracts. Built different. Built Tunisian.';
const WORDS = QUOTE.split(' ');

const COLS = [
  { h: 'For travelers', p: 'Find the cave café in Tabarka that has no Google Maps pin. The family in Matmata that still lives in a troglodyte house. The brik stand in La Goulette that locals queue twenty minutes for.' },
  { h: 'For locals', p: 'List your riad, your tour, your restaurant, your handicraft shop. Keep what you earn. No Booking.com commission. No TripAdvisor games. Just you and the traveler.' },
  { h: 'For Tunisia', p: 'Every dinar spent through e-Tunisia stays in Tunisia. Supports a Tunisian family. Preserves a Tunisian tradition. This is tourism that gives back.' },
];

export default function SceneManifesto() {
  const reduced = useReducedMotion();
  const quoteRef = useRef<HTMLQuoteElement>(null);

  // ink in words as the quote crosses the middle of the viewport
  const { scrollYProgress } = useScroll({ target: quoteRef, offset: ['start 0.92', 'start 0.38'] });
  const [inked, setInked] = useState(reduced ? WORDS.length : 0);
  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    if (reduced) return;
    const n = Math.round(v * WORDS.length);
    setInked((prev) => (n > prev ? n : prev)); // ink never un-dries
  });

  return (
    <div className="ej-manifesto-insert">
      <TornEdge fill="var(--paper-warm)" />
      <section className="ej-section ej-manifesto">
        <div className="ej-section-head ej-head-folio">
          <span className="ej-folio-bg" aria-hidden="true">04</span>
          <motion.p className="ej-kicker" variants={settle} initial="hidden" whileInView="show" viewport={VIEWPORT_ONCE}>
            <span className="ej-no">Nº 04</span> Why we built this
          </motion.p>
        </div>
        <blockquote className="ej-pullquote" ref={quoteRef}>
          {WORDS.map((w, i) => (
            <span key={i} className={`ej-quote-word${i < inked ? ' is-inked' : ''}`}>{w}{i < WORDS.length - 1 ? ' ' : ''}</span>
          ))}
        </blockquote>
        <div className="ej-manifesto-cols">
          {COLS.map((c, i) => (
            <motion.div
              key={c.h}
              className="ej-manifesto-col"
              variants={settle}
              custom={i * 0.12}
              initial="hidden"
              whileInView="show"
              viewport={VIEWPORT_ONCE}
            >
              <h3>{c.h}</h3>
              <p>{c.p}</p>
            </motion.div>
          ))}
        </div>
      </section>
      <TornEdge fill="var(--paper-warm)" flip />
    </div>
  );
}
