// Scene 9 — nightfall, then the last page.
// The paper darkens to ink as you approach the end (scroll-scrubbed, the
// sun sets at the reader's pace), the stamp thunks in, the flourish draws.
import React, { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { track } from '../../../analytics';
import { Arrow, RoundStamp } from './ephemera';
import { lineRise, thunk, VIEWPORT_ONCE } from './choreo';

export default function SceneFinale() {
  const reduced = useReducedMotion();
  const nightRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({ target: nightRef, offset: ['start 0.9', 'end 0.55'] });
  const night = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <>
      {/* dusk — paper darkens as you scroll toward the last page */}
      <div className="ej-nightfall" ref={nightRef} aria-hidden="true">
        <motion.div className="ej-nightfall-ink" style={{ opacity: reduced ? 1 : night }}>
          <p className="ej-nightfall-line">
            <span className="ej-hand">the sun sets on the road…</span>
            <span className="ej-nightfall-ar">الليل يطيح على الطريق</span>
          </p>
        </motion.div>
      </div>

      {/* ── Final call — the ink page ── */}
      <section className="ej-cta ej-cta--night">
        {/* night over the Grand Erg, washed in ink */}
        <div className="ej-cta-bg" aria-hidden="true" />
        <div className="ej-cta-inner">
          <motion.span
            className="ej-cta-stamp-wrap"
            variants={thunk}
            initial={reduced ? false : 'hidden'}
            whileInView="show"
            viewport={{ once: true, amount: 0.5 }}
            aria-hidden="true"
          >
            <RoundStamp idSuffix="-cta" />
          </motion.span>
          {/* whileInView lives on the h2 — the masked span never intersects
              the viewport itself (it starts translated outside the clip) */}
          <motion.h2 initial={reduced ? false : 'hidden'} whileInView="show" viewport={VIEWPORT_ONCE}>
            <span className="ej-line">
              <motion.span className="ej-line-in" variants={lineRise}>
                The <em>real</em> Tunisia is waiting.
              </motion.span>
            </span>
          </motion.h2>
          <p className="ej-cta-arabic">أهلاً وسهلاً — مرحبا بيك</p>
          <a href="#/register" className="ej-btn ej-btn--paper" onClick={() => track('landing_final_cta_click')}>Create your free account<Arrow /></a>
          <div className="ej-cta-note">
            <span className="ej-hand">no tour buses, no all-inclusive compounds — promise.</span>
          </div>
        </div>
        <span className="ej-cta-credit" aria-hidden="true">the grand erg at dusk — photo Elcèd77 · CC BY-SA 3.0</span>
      </section>
    </>
  );
}
