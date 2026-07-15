// Scene 2 — "La Traversée" (Nº 00, the crossing).
// A pinned, scroll-scrubbed journey: an ink map of Tunisia on which the
// route draws itself through six real stops; each stop develops a photo
// print beside the map. Pure position-mapping — scrolling fast simply
// plays it fast. Reduced motion renders the whole journey statically.
import React, { useRef, useState } from 'react';
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import * as api from '../../../api';
import { track } from '../../../analytics';
import TunisiaMap, { TRAV_STOPS, TRAV_TOTAL_KM } from './TunisiaMap';
import { SPRING_SCRUB, EASE_SETTLE } from './choreo';

/* Resolve the stop to a real catalog place (progressive enhancement — the
   print becomes a link when the backend knows the place). */
function useStopPlace(name: string) {
  const q = useQuery({
    queryKey: ['trav-place', name],
    staleTime: Infinity,
    queryFn: async () => {
      try {
        const res: any = await api.getPlaces({ search: name, limit: '1' } as any);
        return res?.data?.[0] ?? null;
      } catch { return null; }
    },
  });
  return q.data;
}

function StopPrint({ stop, instant = false }: { stop: (typeof TRAV_STOPS)[number]; instant?: boolean }) {
  const place = useStopPlace(stop.name);
  return (
    <motion.figure
      className="ej-trav-print"
      initial={instant ? false : { opacity: 0, y: 26, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={instant ? undefined : { opacity: 0, y: -18, scale: 0.99, transition: { duration: 0.22, ease: 'easeIn' } }}
      transition={{ duration: 0.42, ease: EASE_SETTLE }}
    >
      <img src={stop.img} alt={`${stop.name} — ${stop.caption}`} loading="lazy" />
      <figcaption>
        <span className="ej-hand">{stop.caption}</span>
        <span className="ej-trav-print-meta">
          <span>{stop.coords}</span>
          {stop.credit && <span>photo — {stop.credit}</span>}
        </span>
      </figcaption>
      {place?.id && (
        <a className="ej-trav-print-link" href={`#/place/${place.id}`} aria-label={`Open ${stop.name} in the index`}>
          <span className="ej-trav-print-chip">in the index →</span>
        </a>
      )}
    </motion.figure>
  );
}

export default function SceneTraversee() {
  const reduced = useReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({ target: wrapRef, offset: ['start start', 'end end'] });
  const progress = useSpring(scrollYProgress, SPRING_SCRUB);

  // active stop index — switches midway between waypoints
  const N = TRAV_STOPS.length;
  const T0 = 0.04, T1 = 0.96;
  const [idx, setIdx] = useState(0);
  const completedRef = useRef(false);
  useMotionValueEvent(progress, 'change', (v) => {
    const next = Math.min(N - 1, Math.max(0, Math.round(((v - T0) / (T1 - T0)) * (N - 1))));
    setIdx(next);
    if (next === N - 1 && !completedRef.current) {
      completedRef.current = true;
      track('landing_traversee_complete');
    }
  });

  // odometer — position-mapped through each stop's real road kilometers,
  // so the number agrees with the stop on screen (not a fake count-up)
  const stopTimes = TRAV_STOPS.map((_, i) => T0 + (i / (N - 1)) * (T1 - T0));
  const km = useTransform(progress, stopTimes, TRAV_STOPS.map((s) => s.km), { clamp: true });
  const kmText = useTransform(km, (v) => String(Math.max(0, Math.round(v))).padStart(4, '0'));

  // desert warmth washes in as the route goes south
  const warmth = useTransform(progress, [0.15, 0.75], [0, 1]);

  const stop = TRAV_STOPS[idx];

  // Scroll HUD — a pinned scene reads as a frozen page, so an unmissable,
  // always-present affordance carries the visitor the whole way: an animated
  // scroll-mouse glyph plus a label that names exactly what to do and how much
  // is left. The three phases answer both fears — "am I stuck?" and "did it
  // end?" — and the arrival phase points them out of the pin.
  const remaining = N - 1 - idx;
  const hudPhase = idx === 0 ? 'intro' : remaining > 0 ? 'go' : 'end';
  const hudLabel =
    hudPhase === 'intro'
      ? 'Scroll to travel the route'
      : hudPhase === 'go'
        ? `Keep scrolling · ${remaining} ${remaining === 1 ? 'stop' : 'stops'} to go`
        : "You've arrived — keep scrolling";

  /* Reduced motion / no-JS-scrub fallback: the full journey, statically. */
  if (reduced) {
    return (
      <section className="ej-trav-static" aria-label="La Traversée — a five day route across Tunisia">
        <div className="ej-section ej-trav-static-head">
          <p className="ej-kicker"><span className="ej-no">Nº 00</span> La traversée</p>
          <h2 className="ej-h2">Five days, <em>one thousand</em> kilometers.</h2>
          <p className="ej-lede">One route across the whole country — coast, holy city, Roman south, salt lake, island. Scroll it, then make it yours.</p>
        </div>
        <div className="ej-trav-static-grid">
          <div className="ej-trav-map-box"><TunisiaMap progress={progress} activeIdx={TRAV_STOPS.length - 1} reduced /></div>
          <ol className="ej-trav-static-list">
            {TRAV_STOPS.map((s) => (
              <li key={s.id}>
                <StopPrint stop={s} instant />
                <div className="ej-trav-copy">
                  <span className="ej-trav-day">{s.day}</span>
                  <h3>{s.name} <span className="ej-trav-ar">{s.arabic}</span></h3>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <div className="ej-trav-cta"><a className="ej-btn-ghost" href="#/itineraries">Chart your own crossing</a></div>
      </section>
    );
  }

  return (
    <section className="ej-trav-wrap" ref={wrapRef} aria-label="La Traversée — a five day route across Tunisia">
      <div className="ej-trav">
        {/* desert warmth overlay */}
        <motion.div className="ej-trav-warmth" style={{ opacity: warmth }} aria-hidden="true" />

        {/* scroll HUD — always present through the whole pin so the scene
            never reads as stuck or ended; the label names the action and the
            stops remaining, and flips to an "arrived" cue at the last stop */}
        <div className={`ej-trav-hud is-${hudPhase}`} aria-hidden="true">
          <span className="ej-trav-hud-mouse"><span className="ej-trav-hud-wheel" /></span>
          <AnimatePresence mode="wait">
            <motion.span
              key={hudPhase}
              className="ej-trav-hud-label"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5, transition: { duration: 0.16 } }}
              transition={{ duration: 0.26, ease: EASE_SETTLE }}
            >
              {hudLabel}
            </motion.span>
          </AnimatePresence>
        </div>

        <div className="ej-trav-inner">
          <header className="ej-trav-head">
            <p className="ej-kicker"><span className="ej-no">Nº 00</span> La traversée</p>
            <h2 className="ej-h2">Five days, <em>one thousand</em> kilometers.</h2>
          </header>

          <div className="ej-trav-stage">
            <div className="ej-trav-map-box">
              <TunisiaMap progress={progress} activeIdx={idx} />
              <div className="ej-trav-km" aria-hidden="true">
                <span className="ej-trav-km-label">odometer</span>
                <motion.span className="ej-trav-km-num">{kmText}</motion.span>
                <span className="ej-trav-km-unit">km</span>
              </div>
            </div>

            <div className="ej-trav-panel">
              <AnimatePresence mode="wait">
                <StopPrint key={stop.id} stop={stop} />
              </AnimatePresence>
              <AnimatePresence mode="wait">
                <motion.div
                  key={stop.id}
                  className="ej-trav-copy"
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10, transition: { duration: 0.18 } }}
                  transition={{ duration: 0.35, ease: EASE_SETTLE, delay: 0.06 }}
                >
                  <span className="ej-trav-day">{stop.day}</span>
                  <h3>{stop.name} <span className="ej-trav-ar">{stop.arabic}</span></h3>
                </motion.div>
              </AnimatePresence>

              {/* route progress — a stable rail (kept out of the per-stop
                  AnimatePresence so it advances smoothly rather than flashing).
                  Tells the visitor "you're on stop N of M, more ahead", so the
                  pinned scroll never feels stuck or finished early. */}
              <div className="ej-trav-progress">
                <div className="ej-trav-progressbar" aria-hidden="true">
                  {TRAV_STOPS.map((s, i) => (
                    <span key={s.id} className={`ej-trav-seg${i <= idx ? ' is-on' : ''}`} />
                  ))}
                </div>
                <span className="ej-trav-count">
                  stop {String(idx + 1).padStart(2, '0')} / {String(N).padStart(2, '0')}
                </span>
              </div>
              <a
                className={`ej-link ej-trav-link${idx === TRAV_STOPS.length - 1 ? ' is-shown' : ''}`}
                href="#/itineraries"
                tabIndex={idx === TRAV_STOPS.length - 1 ? 0 : -1}
              >
                Chart your own crossing
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
