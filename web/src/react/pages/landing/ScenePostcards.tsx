// Scene 7 — Nº 05 Postcards. Testimonials arrive address-side up, then
// flip (real CSS 3D) to the written side as they cross the viewport.
// Reduced motion renders the written side directly.
import React, { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Postmark } from './ephemera';
import { TESTIMONIALS } from './data';
import { deal, settle, VIEWPORT_ONCE } from './choreo';

type T = (typeof TESTIMONIALS)[number];

function PostcardFlip({ t, index }: { t: T; index: number }) {
  const reduced = useReducedMotion();
  const [flipped, setFlipped] = useState(!!reduced);

  return (
    <motion.article
      className="ej-flip"
      variants={deal}
      custom={(index % 3) * 0.09}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.45 }}
      onViewportEnter={() => setTimeout(() => setFlipped(true), 480 + (index % 3) * 160)}
    >
      <motion.div
        className="ej-flip-inner"
        initial={false}
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ type: 'spring', stiffness: 210, damping: 24, mass: 0.9 }}
      >
        {/* front — the address side */}
        <div className="ej-postcard ej-flip-face ej-flip-front" aria-hidden="true">
          <span className="ej-postcard-title">Carte postale <span>بطاقة بريدية</span></span>
          <span className="ej-postcard-stamp"><img src="/logo-chechia.svg" alt="" /></span>
          <Postmark />
          <div className="ej-postcard-address">
            <span className="ej-hand">to: whoever still collects moments</span>
            <span className="ej-postcard-addr-line" />
            <span className="ej-hand">{t.dest}</span>
            <span className="ej-postcard-addr-line" />
          </div>
        </div>
        {/* back — the written side */}
        <div className={`ej-postcard ej-flip-face ej-flip-back${t.pro ? ' is-pro' : ''}`}>
          {t.pro && <span className="ej-postcard-pro">Pro member</span>}
          <span className="ej-postcard-stamp" aria-hidden="true"><img src="/logo-chechia.svg" alt="" /></span>
          <Postmark />
          <p className="ej-postcard-quote">“{t.quote}”</p>
          <div className="ej-postcard-sig">
            <span className="ej-hand">— {t.name}</span>
            <span>{t.sub}</span>
          </div>
        </div>
      </motion.div>
    </motion.article>
  );
}

export default function ScenePostcards() {
  return (
    <section className="ej-section ej-scene-postcards">
      <div className="ej-section-head ej-head-folio">
        <span className="ej-folio-bg" aria-hidden="true">05</span>
        <motion.p className="ej-kicker" variants={settle} initial="hidden" whileInView="show" viewport={VIEWPORT_ONCE}>
          <span className="ej-no">Nº 05</span> Postcards
        </motion.p>
        <motion.h2 className="ej-h2" variants={settle} custom={0.08} initial="hidden" whileInView="show" viewport={VIEWPORT_ONCE}>
          From the road, in their <em>own</em> words.
        </motion.h2>
      </div>
      <div className="ej-postcards">
        {TESTIMONIALS.map((t, i) => <PostcardFlip key={t.name} t={t} index={i} />)}
      </div>
    </section>
  );
}
