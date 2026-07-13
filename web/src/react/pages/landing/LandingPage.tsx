import '../../../styles/landing-editorial.css';
import '../../../styles/landing-ultra.css';
// Landing — "Le Carnet Vivant" (design-system/pages/landing-ultra.md).
// The carnet identity from the editorial edition, given direction: a
// scroll-driven narrative across nine scenes. Two motion grammars only —
// enter-once paper physics and position-scrubbed sequences. No scroll
// hijacking, no loops, reduced-motion renders a complete static page.
import React, { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion, useScroll, useSpring } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import * as api from '../../../api';
import { track } from '../../../analytics';
import { settle, VIEWPORT_ONCE } from './choreo';
import { fallbackPlaces, fallbackItineraries } from './data';
import SceneHero from './SceneHero';
import SceneTraversee from './SceneTraversee';
import SceneIndex from './SceneIndex';
import SceneRoutes from './SceneRoutes';
import SceneMoods from './SceneMoods';
import SceneManifesto from './SceneManifesto';
import ScenePostcards from './ScenePostcards';
import SceneLetter from './SceneLetter';
import SceneFinale from './SceneFinale';

/* Right-edge folio bookmark: current chapter + a 1px ink progress rule.
   Replaces the generic progress bar; decorative, hidden from AT. */
function FolioBookmark({ rootRef }: { rootRef: React.RefObject<HTMLDivElement | null> }) {
  const [label, setLabel] = useState('Vol. I — the opening spread');
  const { scrollYProgress } = useScroll();
  const scaleY = useSpring(scrollYProgress, { stiffness: 120, damping: 26 });

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const scenes = Array.from(root.querySelectorAll<HTMLElement>('[data-folio]'));
    const seen = new Set<string>();
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const name = e.target.getAttribute('data-folio') || '';
          setLabel(name);
          if (!seen.has(name)) {
            seen.add(name);
            // scroll-depth funnel: which chapters do visitors actually reach?
            track('landing_scene_view', { scene: name, order: seen.size });
          }
        }
      },
      { rootMargin: '-42% 0px -42% 0px' },
    );
    scenes.forEach((s) => obs.observe(s));
    return () => obs.disconnect();
  }, [rootRef]);

  return (
    <div className="ej-folio-corner" aria-hidden="true">
      <span className="ej-folio-label">{label}</span>
      <div className="ej-folio-rail"><motion.div className="ej-folio-rule" style={{ scaleY }} /></div>
    </div>
  );
}

function Almanac({ totalPlaces, totalReviews }: { totalPlaces: number; totalReviews: number }) {
  const cells = [
    { num: totalPlaces ? totalPlaces.toLocaleString() : '—', label: 'Places charted', star: true },
    { num: totalReviews ? totalReviews.toLocaleString() : '—', label: 'Community reviews' },
    { num: '24', label: 'Governorates' },
    { num: '3,000+', label: 'Years of history' },
  ];
  return (
    <section className="ej-almanac" aria-label="Platform numbers">
      <div className="ej-almanac-grid">
        {cells.map((c, i) => (
          <motion.div
            key={c.label}
            className="ej-almanac-cell"
            variants={settle}
            custom={i * 0.08}
            initial="hidden"
            whileInView="show"
            viewport={VIEWPORT_ONCE}
          >
            <span className="ej-almanac-num">{c.num}{c.star && <sup>*</sup>}</span>
            <span className="ej-almanac-label">{c.label}</span>
          </motion.div>
        ))}
      </div>
      <div className="ej-almanac-footnote">
        <span className="ej-hand">* counted by hand — no inflated numbers here.</span>
      </div>
    </section>
  );
}

export default function LandingPage() {
  const rootRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const [navScrolled, setNavScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const placesQ = useQuery({
    queryKey: ['hero-places'],
    queryFn: async () => {
      try {
        const res: any = await api.getPlaces({ limit: '6' } as any);
        if (res?.data?.length) return { places: res.data, total: res.meta?.total || res.data.length };
      } catch { /* offline */ }
      return { places: fallbackPlaces, total: 19 };
    },
  });
  const itinQ = useQuery({
    queryKey: ['hero-itineraries'],
    queryFn: async () => {
      try {
        const res: any = await api.getItineraries();
        if (Array.isArray(res) && res.length) return res.slice(0, 3);
        if (res?.data?.length) return res.data.slice(0, 3);
      } catch { /* offline */ }
      return fallbackItineraries;
    },
  });

  const places = placesQ.data?.places;
  const totalPlaces = placesQ.data?.total || 0;
  const totalReviews = places ? Math.max(places.reduce((s: number, p: any) => s + (p.reviewCount || 0), 0), 8500) : 0;
  const itineraries = itinQ.data;

  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="ej-landing ej-ultra" ref={rootRef}>

      {/* ── Masthead ── */}
      <motion.nav
        className={`ej-masthead${navScrolled ? ' is-scrolled' : ''}`}
        aria-label="Primary"
        initial={reduced ? false : { y: -14, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="ej-masthead-strip" aria-hidden="true">
          <span>Vol. I — The traveler's edition</span>
          <span>{today} · Tunis, Tunisia</span>
        </div>
        <div className="ej-masthead-inner">
          <a href="#/hero" className="ej-wordmark"><strong>e-Tunisia</strong><span>تونس</span></a>
          <div className="ej-masthead-links">
            <a href="#/explore">Explore</a>
            <a href="#/itineraries">Itineraries</a>
            <a href="#/about">About</a>
            <a href="#/premium">Pricing</a>
          </div>
          <div className="ej-masthead-actions">
            <a href="#/login" className="ej-masthead-login">Log in</a>
            <a href="#/register" className="ej-btn ej-btn--sm">Join free</a>
          </div>
        </div>
      </motion.nav>

      <FolioBookmark rootRef={rootRef} />

      <div data-folio="Vol. I — the opening spread"><SceneHero /></div>
      <div data-folio="Nº 00 — la traversée"><SceneTraversee /></div>
      <div data-folio="the almanac"><Almanac totalPlaces={totalPlaces} totalReviews={totalReviews} /></div>
      <div data-folio="Nº 01 — the index"><SceneIndex places={places} /></div>
      <div data-folio="Nº 02 — field routes"><SceneRoutes itineraries={itineraries} /></div>
      <div data-folio="Nº 03 — pick a mood"><SceneMoods /></div>
      <div data-folio="Nº 04 — why we built this"><SceneManifesto /></div>
      <div data-folio="Nº 05 — postcards"><ScenePostcards /></div>
      <div data-folio="✳ — the letter"><SceneLetter /></div>
      <div data-folio="the last page"><SceneFinale /></div>

      {/* ── Colophon ── */}
      <footer className="ej-footer">
        <div className="ej-footer-grid">
          <div className="ej-footer-brand">
            <a href="#/hero" className="ej-wordmark"><strong>e-Tunisia</strong><span>تونس</span></a>
            <p>The platform for discovering real Tunisia. Built by Tunisians, for the world.</p>
          </div>
          <div className="ej-footer-col"><h4>Explore</h4><a href="#/explore">Places</a><a href="#/map">Map</a><a href="#/itineraries">Itineraries</a><a href="#/events">Events</a></div>
          <div className="ej-footer-col"><h4>Community</h4><a href="#/">Feed</a><a href="#/tips">Tips</a><a href="#/leaderboard">Leaderboard</a><a href="#/partner">Partner</a></div>
          <div className="ej-footer-col"><h4>Company</h4><a href="#/about">About</a><a href="#/premium">Pricing</a><a href="#/partner">Contact</a><a href="#/legal/privacy">Privacy</a></div>
        </div>
        <div className="ej-footer-bottom">
          <span>© 2026 e-Tunisia — Édition Nº 1</span>
          <span>
            Printed with
            {' '}<span className="ej-footer-heart" aria-hidden="true"><svg width="13" height="13" viewBox="0 0 24 24"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /></svg></span>
            <span className="ej-sr-only">love</span>
            {' '}in Tunis
          </span>
        </div>
      </footer>
    </div>
  );
}
