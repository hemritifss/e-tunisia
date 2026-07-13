// Scene 0/1 — the cover opens, then the desk.
// One-time intro (masked line-rise headline, prints tossed onto the desk,
// stamp thunk), then persistent depth: 3-plane scroll parallax + mouse tilt.
import React, { useRef, useState } from 'react';
import { track } from '../../../analytics';
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from 'framer-motion';
import { Arrow, RoundStamp } from './ephemera';
import { lineRise, settle, thunk, EASE_SETTLE, useIntroPlayed } from './choreo';

/* Dashed travel-route doodle behind the hero prints — draws itself */
function RouteDoodle({ animate }: { animate: boolean }) {
  return (
    <svg className="ej-route" viewBox="0 0 400 420" fill="none" aria-hidden="true">
      <motion.path
        d="M22 392 C 120 322, 92 182, 212 152 S 380 82, 374 34"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeDasharray="7 9"
        strokeLinecap="round"
        initial={animate ? { pathLength: 0, opacity: 0 } : false}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ pathLength: { duration: 1.3, ease: 'easeInOut', delay: 0.7 }, opacity: { duration: 0.2, delay: 0.7 } }}
      />
      <motion.path
        d="M371 46 l7 -16 -16 7 6 3 z"
        fill="currentColor"
        initial={animate ? { opacity: 0, scale: 0.5 } : false}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, delay: 1.9 }}
      />
      <circle cx="22" cy="392" r="4" fill="currentColor" />
    </svg>
  );
}

const PRINTS = [
  { cls: 'ej-print-1', src: '/img/journey/hero1.webp', alt: 'White and blue houses of Sidi Bou Said above the Mediterranean', cap: 'Sidi Bou Said, 07:14', meta: '36.87°N 10.34°E', eager: true },
  { cls: 'ej-print-2', src: '/img/journey/hero2.webp', alt: 'Alleys of the old Medina of Tunis', cap: 'mid-souk, Tunis', meta: 'est. 698 AD', eager: false },
  { cls: 'ej-print-3', src: '/img/journey/hero3.webp', alt: 'The Roman amphitheatre of El Jem at golden hour', cap: 'El Jem, before the crowds', meta: 'III century', eager: false },
];

/* Randomized marginalia — a different handwritten aside each visit. */
const PS_NOTES = [
  "P.S. — you will crave brik after this. Don't say we didn't warn you.",
  'P.S. — the mint tea is stronger than your plans. Surrender early.',
  "P.S. — 'one more medina alley' is how every good story here starts.",
];

export default function SceneHero() {
  const reduced = useReducedMotion();
  const introPlayed = useIntroPlayed();
  const runIntro = !reduced && !introPlayed;
  const [psNote] = useState(() => PS_NOTES[Math.floor(Math.random() * PS_NOTES.length)]);

  /* ── depth: scroll parallax (3 planes) ── */
  const { scrollY } = useScroll();
  const yWatermark = useTransform(scrollY, [0, 900], [0, 130]); // lags behind
  const yPrints = useTransform(scrollY, [0, 900], [0, -64]);    // leads ahead
  const yWatermarkStill = useMotionValue(0);
  const yPrintsStill = useMotionValue(0);

  /* ── depth: mouse tilt on the desk (desktop pointer only) ── */
  const tiltX = useSpring(useMotionValue(0), { stiffness: 120, damping: 18 });
  const tiltY = useSpring(useMotionValue(0), { stiffness: 120, damping: 18 });
  const deskRef = useRef<HTMLDivElement>(null);
  const onMove = (e: React.MouseEvent) => {
    if (reduced || window.matchMedia('(pointer: coarse)').matches) return;
    const r = deskRef.current?.getBoundingClientRect();
    if (!r) return;
    tiltY.set(((e.clientX - r.left) / r.width - 0.5) * 4.5);
    tiltX.set(((e.clientY - r.top) / r.height - 0.5) * -4.5);
  };
  const onLeave = () => { tiltX.set(0); tiltY.set(0); };

  const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.085, delayChildren: 0.12 } },
  };

  return (
    <motion.header
      className="ej-hero"
      variants={container}
      initial={runIntro ? 'hidden' : false}
      animate="show"
    >
      <motion.span
        className="ej-hero-watermark"
        style={{ y: reduced ? yWatermarkStill : yWatermark }}
        aria-hidden="true"
      >
        تونس
      </motion.span>

      <div className="ej-hero-copy">
        <motion.p className="ej-hero-kicker" variants={settle}>
          Carnet de voyage — a field guide to Tunisia
        </motion.p>

        <h1 className="ej-hero-title">
          <span className="ej-line"><motion.span className="ej-line-in" variants={lineRise}>The Tunisia{' '}
            <em className="ej-hand-underline">
              locals
              <motion.svg viewBox="0 0 200 12" preserveAspectRatio="none" aria-hidden="true">
                <motion.path
                  d="M4 8 C 45 3, 95 11, 140 6 S 190 4, 197 7"
                  fill="none" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round"
                  initial={runIntro ? { pathLength: 0, opacity: 0 } : false}
                  animate={{ pathLength: 1, opacity: 0.8 }}
                  transition={{ pathLength: { duration: 0.6, ease: 'easeOut', delay: 1.05 }, opacity: { duration: 0.15, delay: 1.05 } }}
                />
              </motion.svg>
            </em>
          </motion.span></span>
          <span className="ej-line"><motion.span className="ej-line-in" variants={lineRise}>keep to themselves.</motion.span></span>
        </h1>

        <motion.p className="ej-hero-arabic" variants={settle}>تونس تستدعيك</motion.p>
        <motion.p className="ej-hero-sub" variants={settle}>
          From the blue doors of Sidi Bou Said to the dunes of Douz. From the Roman stones
          of El Jem to the olive groves of Kairouan. This is the Tunisia locals live —
          not the one tour buses visit.
        </motion.p>
        <motion.div className="ej-hero-actions" variants={settle}>
          <a href="#/explore" className="ej-btn" onClick={() => track('landing_hero_cta_click')}>Start exploring<Arrow /></a>
          <a href="#/register" className="ej-link" onClick={() => track('landing_hero_join_click')}>Join the community</a>
        </motion.div>
        <motion.div className="ej-hero-note" variants={settle}>
          <span className="ej-hand">{psNote}</span>
        </motion.div>
      </div>

      <motion.div
        className="ej-hero-prints"
        ref={deskRef}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        style={{
          y: reduced ? yPrintsStill : yPrints,
          rotateX: tiltX,
          rotateY: tiltY,
          transformPerspective: 1100,
        }}
      >
        <RouteDoodle animate={runIntro} />
        {PRINTS.map((p, i) => (
          <motion.figure
            key={p.cls}
            className={`ej-print ${p.cls}`}
            variants={{
              hidden: { opacity: 0, y: -46, scale: 1.04 },
              show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.55, ease: EASE_SETTLE, delay: 0.35 + i * 0.14 } },
            }}
          >
            <img
              src={p.src}
              alt={p.alt}
              loading={p.eager ? 'eager' : 'lazy'}
              fetchPriority={p.eager ? 'high' : undefined}
            />
            <figcaption>{p.cap} <span className="ej-print-meta">{p.meta}</span></figcaption>
          </motion.figure>
        ))}
        <motion.span className="ej-hero-stamp-wrap" variants={thunk} custom={1.05}>
          <RoundStamp idSuffix="-hero" />
        </motion.span>
      </motion.div>
    </motion.header>
  );
}
