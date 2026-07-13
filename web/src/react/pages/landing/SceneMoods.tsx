// Scene 5 — Nº 03 Moods: the postcard rack.
// Desktop: the section pins and the five postcards travel horizontally,
// scrubbed to scroll (the page's single horizontal-journey moment).
// Mobile / reduced motion: a native snap-scroll rack — no pinning.
import React, { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion';
import { GOVERNORATES } from './data';
import { settle, SPRING_SCRUB, VIEWPORT_ONCE, useMedia } from './choreo';

const MOODS = [
  { href: '#/mood/adventure', img: '/img/journey/douz.webp', title: 'Adventure', desc: 'dunes, kitesurf, canyons, cave homes', meta: 'Douz — gateway to the Sahara', credit: 'photo — McKay Savage · CC BY 2.0' },
  { href: '#/mood/culture', img: '/img/journey/dougga.webp', title: 'Culture', desc: 'Roman ruins, medinas, Berber heritage', meta: 'Dougga — best-kept Roman town', credit: 'photo — Emna Trabelsi · CC BY-SA 3.0' },
  { href: '#/mood/relax', img: '/img/journey/hero1.webp', title: 'Relax', desc: 'hammams, blue doors, sunset terraces', meta: 'Sidi Bou Said — blue & white', credit: '' },
  { href: '#/mood/foodie', img: '/img/journey/brik.webp', title: 'Foodie', desc: 'brik, harissa, mint tea on rooftops', meta: 'one dinar, life-changing', credit: 'photo — Muckster · CC BY 3.0' },
  { href: '#/mood/spiritual', img: '/img/journey/matmata.webp', title: 'Spiritual & slow', desc: 'Kairouan, Sufi chants, desert silence', meta: 'Matmata — homes under the earth', credit: 'photo — C. Kenworthy · CC BY-SA 3.0' },
];

function Ticker() {
  return (
    <div className="ej-ticker ej-ticker--rail" aria-label="The 24 governorates of Tunisia">
      <div className="ej-ticker-track">
        {[...GOVERNORATES, ...GOVERNORATES].map((g, i) => (
          <React.Fragment key={i}>
            <span className="ej-ticker-item">{g}</span>
            <span className="ej-ticker-sep" aria-hidden="true">✳</span>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

function MoodCard({ m }: { m: (typeof MOODS)[number] }) {
  return (
    <a className="ej-mood" href={m.href}>
      <img src={m.img} alt="" loading="lazy" />
      <div className="ej-mood-body">
        <h4>{m.title}</h4>
        <p>{m.desc}</p>
        <span className="ej-mood-meta">{m.meta}</span>
        {m.credit && <span className="ej-mood-credit">{m.credit}</span>}
      </div>
    </a>
  );
}

function Head() {
  return (
    <div className="ej-section-head ej-head-folio">
      <span className="ej-folio-bg" aria-hidden="true">03</span>
      <motion.p className="ej-kicker" variants={settle} initial="hidden" whileInView="show" viewport={VIEWPORT_ONCE}>
        <span className="ej-no">Nº 03</span> Pick a mood
      </motion.p>
      <motion.h2 className="ej-h2" variants={settle} custom={0.08} initial="hidden" whileInView="show" viewport={VIEWPORT_ONCE}>
        What kind of trip are you <em>packing</em> for?
      </motion.h2>
      <motion.p className="ej-lede" variants={settle} custom={0.16} initial="hidden" whileInView="show" viewport={VIEWPORT_ONCE}>
        Five moods. Twenty-four governorates. One country that fits all of them.
      </motion.p>
    </div>
  );
}

export default function SceneMoods() {
  const reduced = useReducedMotion();
  const narrow = useMedia('(max-width: 900px)');
  const flat = reduced || narrow;

  const wrapRef = useRef<HTMLDivElement>(null);
  const windowRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: wrapRef, offset: ['start start', 'end end'] });
  const progress = useSpring(scrollYProgress, SPRING_SCRUB);

  // travel exactly as far as the rack overflows its window — measured, so
  // the last card parks at the right edge on every viewport
  const [shift, setShift] = useState(620);
  useEffect(() => {
    if (flat) return;
    const measure = () => {
      const t = trackRef.current, w = windowRef.current;
      if (t && w) setShift(Math.max(0, t.scrollWidth - w.clientWidth + 12));
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [flat]);
  const x = useTransform(progress, [0.08, 0.94], [0, -shift]);

  if (flat) {
    return (
      <section className="ej-scene-moods ej-scene-moods--flat">
        <div className="ej-section">
          <Head />
          <div className="ej-moods-track ej-moods-track--snap">
            {MOODS.map((m) => <MoodCard key={m.href} m={m} />)}
          </div>
        </div>
        <Ticker />
      </section>
    );
  }

  return (
    <section className="ej-scene-moods ej-moods-wrap" ref={wrapRef}>
      <div className="ej-moods-pin">
        <div className="ej-section ej-moods-pin-inner">
          <Head />
          <div className="ej-moods-window" ref={windowRef}>
            <motion.div className="ej-moods-track" style={{ x }} ref={trackRef}>
              {MOODS.map((m) => <MoodCard key={m.href} m={m} />)}
            </motion.div>
          </div>
        </div>
        <Ticker />
      </div>
    </section>
  );
}
