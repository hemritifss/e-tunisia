// Scene 4 — Nº 02 Field routes. Boarding passes that get punched on entry:
// notch holes pop and the barcode takes a single scan sweep.
import React, { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { EyeSvg, HeartSvg } from './ephemera';
import { deal, settle, VIEWPORT_ONCE } from './choreo';

export interface Itinerary {
  id: string; title: string; description: string;
  duration: number; difficulty: string;
  likeCount?: number; viewCount?: number;
}

function RouteTicket({ it, index }: { it: Itinerary; index: number }) {
  const reduced = useReducedMotion();
  const [punched, setPunched] = useState(!!reduced);
  const diffColor = it.difficulty === 'easy' ? 'var(--olive)' : it.difficulty === 'challenging' ? 'var(--coral)' : 'var(--amber)';
  const diffLabel = it.difficulty === 'easy' ? 'Easy' : it.difficulty === 'challenging' ? 'Challenging' : 'Moderate';
  return (
    <motion.a
      href="#/itineraries"
      className={`ej-ticket${punched ? ' is-punched' : ''}`}
      variants={deal}
      custom={index * 0.11}
      initial="hidden"
      whileInView="show"
      viewport={VIEWPORT_ONCE}
      onViewportEnter={() => setTimeout(() => setPunched(true), 300 + index * 110)}
    >
      <div className="ej-ticket-stub">
        <span className="ej-ticket-days">{it.duration}</span>
        <span className="ej-ticket-days-label">days</span>
        <span className="ej-ticket-route">Field route · boarding all curious</span>
      </div>
      <div className="ej-ticket-body">
        <div className="ej-ticket-head">Route Nº {String(index + 1).padStart(2, '0')} — tested by the community</div>
        <h3>{it.title}</h3>
        <p>{it.description}</p>
        <div className="ej-ticket-foot">
          <span><HeartSvg /> {it.likeCount || 0}</span>
          <span><EyeSvg /> {(it.viewCount || 0).toLocaleString()}</span>
          <span className="ej-ticket-diff" style={{ ['--diff-color' as any]: diffColor }}>{diffLabel}</span>
        </div>
      </div>
      <div className="ej-ticket-barcode" aria-hidden="true"><span className="ej-ticket-scan" /></div>
    </motion.a>
  );
}

export default function SceneRoutes({ itineraries }: { itineraries?: Itinerary[] }) {
  return (
    <section className="ej-section ej-scene-routes">
      <div className="ej-section-head ej-head-folio">
        <span className="ej-folio-bg" aria-hidden="true">02</span>
        <motion.p className="ej-kicker" variants={settle} initial="hidden" whileInView="show" viewport={VIEWPORT_ONCE}>
          <span className="ej-no">Nº 02</span> Field routes
        </motion.p>
        <motion.h2 className="ej-h2" variants={settle} custom={0.08} initial="hidden" whileInView="show" viewport={VIEWPORT_ONCE}>
          Routes written by people who've <em>actually</em> gone.
        </motion.h2>
        <motion.p className="ej-lede" variants={settle} custom={0.16} initial="hidden" whileInView="show" viewport={VIEWPORT_ONCE}>
          From a foodie weekend in Tunis to a five-day Sahara crossing. Real plans, tested on real roads.
        </motion.p>
      </div>
      <div className="ej-tickets">
        {itineraries
          ? itineraries.map((it, i) => <RouteTicket key={it.id} it={it} index={i} />)
          : Array.from({ length: 3 }).map((_, i) => (
            <div className="ej-ticket" key={i} aria-hidden="true" style={{ minHeight: 180 }}>
              <div className="ej-ticket-stub"><div className="skeleton" style={{ width: 40, height: 40 }} /></div>
              <div className="ej-ticket-body">
                <div className="skeleton skeleton-text" style={{ width: '60%', height: 16, marginBottom: 8 }} />
                <div className="skeleton skeleton-text" style={{ width: '90%', height: 12 }} />
              </div>
            </div>
          ))}
      </div>
    </section>
  );
}
