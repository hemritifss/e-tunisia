// Scene 3 — Nº 01 The Index. Place prints dealt onto the page like cards.
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { coverPlaceholder } from '../../../shared/placeholder';
import { Arrow, StarSvg } from './ephemera';
import { deal, settle, VIEWPORT_ONCE } from './choreo';

export interface Place {
  id: string; name: string; city: string;
  category?: { name: string };
  rating: number; reviewCount: number;
  images?: string[]; image?: string;
}

/* The API lists [original, thumb] — always prefer the sized thumb; the
   originals are multi-MB Wikimedia files and would tank LCP. */
function pickCover(p: Place): string {
  const arr = p.images || [];
  return arr.find((u) => u.includes('/thumb/')) || arr[0] || p.image || '/img/hero1.png';
}

function PlacePrint({ p, index }: { p: Place; index: number }) {
  const [imgSrc, setImgSrc] = useState(() => pickCover(p));
  const cat = p.category?.name || 'Place';
  const filled = Math.floor(p.rating || 0);
  return (
    <motion.a
      href={`#/place/${p.id}`}
      className="ej-place"
      variants={deal}
      custom={(index % 3) * 0.09}
      initial="hidden"
      whileInView="show"
      viewport={VIEWPORT_ONCE}
    >
      <div className="ej-place-img">
        <img src={imgSrc} alt={`${p.name}, ${p.city}`} loading="lazy" onError={() => setImgSrc(coverPlaceholder(p.id, p.name))} />
        <span className="ej-place-cat">{cat}</span>
      </div>
      <div className="ej-place-body">
        <span className="ej-place-no">Nº {String(index + 1).padStart(2, '0')}</span>
        <h4>{p.name}</h4>
        <div className="ej-place-meta">
          <span>{p.city}</span>
          <span className="ej-stars" title={`${p.rating || 0}/5`} aria-label={`Rated ${p.rating || 0} out of 5`}>
            {Array.from({ length: 5 }).map((_, i) => <span key={i} className={i < filled ? 'is-filled' : ''}><StarSvg /></span>)}
          </span>
        </div>
      </div>
    </motion.a>
  );
}

export default function SceneIndex({ places }: { places?: Place[] }) {
  return (
    <section className="ej-section ej-scene-index">
      <div className="ej-section-head ej-head-folio">
        <span className="ej-folio-bg" aria-hidden="true">01</span>
        <motion.p className="ej-kicker" variants={settle} initial="hidden" whileInView="show" viewport={VIEWPORT_ONCE}>
          <span className="ej-no">Nº 01</span> The index
        </motion.p>
        <motion.h2 className="ej-h2" variants={settle} custom={0.08} initial="hidden" whileInView="show" viewport={VIEWPORT_ONCE}>
          Real places, vouched for by the people who <em>live</em> there.
        </motion.h2>
        <motion.p className="ej-lede" variants={settle} custom={0.16} initial="hidden" whileInView="show" viewport={VIEWPORT_ONCE}>
          Every listing is verified by our community. No paid placements. No tourist traps.
        </motion.p>
      </div>
      <div className="ej-index-grid">
        {places
          ? places.map((p, i) => <PlacePrint key={p.id} p={p} index={i} />)
          : Array.from({ length: 6 }).map((_, i) => (
            <div className="ej-place" key={i} aria-hidden="true">
              <div className="skeleton" style={{ height: 220 }} />
              <div style={{ padding: '12px 4px 0' }}>
                <div className="skeleton skeleton-text" style={{ width: '70%', height: 18, marginBottom: 8 }} />
                <div className="skeleton skeleton-text" style={{ width: '45%', height: 12 }} />
              </div>
            </div>
          ))}
      </div>
      <div className="ej-section-foot"><a href="#/explore" className="ej-btn-ghost">Browse the full index<Arrow size={15} /></a></div>
    </section>
  );
}
