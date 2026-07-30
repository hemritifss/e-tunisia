import React, { useEffect, useRef, useState } from 'react';
// Ported onto the editorial carnet system (.ej-*) in Phase 2 stage 2. The old
// landing system and its always-dark canvas are gone, so this page now follows
// the app theme like every other route.
import '../../styles/landing-editorial.css';
import { Arrow, RoundStamp } from './landing/ephemera';
import PublicMasthead from '../components/public/PublicMasthead';
import PublicFooter from '../components/public/PublicFooter';
import { isLoggedIn } from '../../api';
import { MARKETING_STATS } from '../data/marketingStats';

// Deterministic first+last initials for the placeholder crew portraits.
function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.charAt(0) ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : '';
  return (first + last).toUpperCase();
}

function Stat({ target, suffix = '+', label }: { target: number; suffix?: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [val, setVal] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          let cur = 0;
          const step = target / 50;
          const timer = setInterval(() => {
            cur += step;
            if (cur >= target) { cur = target; clearInterval(timer); }
            setVal(Math.floor(cur));
          }, 20);
          obs.unobserve(el);
        }
      });
    }, { threshold: 0.5 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [target]);
  return (
    <div className="ej-almanac-cell" ref={ref}>
      <span className="ej-almanac-num">{val.toLocaleString()}{suffix}</span>
      <span className="ej-almanac-label">{label}</span>
    </div>
  );
}

// Three prints for the opening spread, from the repo's journey set.
const PRINTS = [
  { cls: 'ej-print-1', src: '/img/journey/sidi-bou-said.webp', alt: 'Blue doors and whitewashed walls in Sidi Bou Said', cap: 'where it started', meta: '36.87°N 10.34°E', eager: true },
  { cls: 'ej-print-2', src: '/img/journey/dougga.webp', alt: 'Roman ruins of Dougga on the hillside', cap: 'Dougga, off the map', meta: 'II century', eager: false },
  { cls: 'ej-print-3', src: '/img/journey/medina-tunis.webp', alt: 'Alleyway in the old Medina of Tunis', cap: 'the medina, unposed', meta: 'est. 698 AD', eager: false },
];

// Icons and the per-item accent colour were dropped in the Bled port: the
// manifesto pattern is typographic by design, and the six-colour rainbow
// collapses to the single blue accent.
const VALUES = [
  { kicker: 'Nº 01', title: 'Community-driven', desc: 'Real travelers, real locals, real experiences. Our community curates everything, with no corporate editorial team deciding what is worth seeing.' },
  { kicker: 'Nº 02', title: 'Support local', desc: 'We prioritize family-run businesses, artisans, and independent hosts. Every booking directly supports Tunisian entrepreneurs.' },
  { kicker: 'Nº 03', title: 'Authentic', desc: 'No tourist traps, no paid placements. Every recommendation is tested and verified by our community of explorers.' },
  { kicker: 'Nº 04', title: 'Sustainable', desc: "Responsible travel that preserves Tunisia's natural beauty and cultural heritage for future generations." },
];

// ASSET: real square headshots pending for the two people below. Until they
// land, they render a self-contained initials tile in the same arch crop (no
// external avatar service, so nothing breaks offline or under a strict CSP).
const TEAM = [
  {
    kind: 'logo' as const,
    img: '/img/partenaires/Jci%20Gremda.png',
    name: 'JCI Gremda',
    role: 'Founder',
    bio: 'Junior Chamber International, Gremda, Sfax. A youth-led organization driving community impact projects across Tunisia. e-Tunisia is one of them.',
  },
  {
    kind: 'person' as const,
    name: 'Zeinab Ben Ayed',
    role: 'Directrice de Projet',
    bio: 'Leads the vision, partnerships and roadmap, making sure e-Tunisia serves travelers and local businesses alike.',
  },
  {
    kind: 'person' as const,
    name: 'Amine Hemriti',
    role: 'Developer',
    bio: 'Builds e-Tunisia end to end: web, backend, and the details that make the whole platform run.',
  },
];

export default function AboutPage() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add('is-in'); obs.unobserve(entry.target); } });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    root.querySelectorAll('.ej-reveal').forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  return (
    <div className="ej-landing ej-landing--page" ref={rootRef}>
      {!isLoggedIn() && <PublicMasthead active="about" />}

      {/* ── Hero — the opening spread ── */}
      <header className="ej-hero">
        <span className="ej-hero-watermark" aria-hidden="true">تونس</span>
        <div className="ej-hero-copy">
          <p className="ej-hero-kicker">Our story</p>
          <h1 className="ej-hero-title">Building the future of <em>Tunisian travel.</em></h1>
          <p className="ej-hero-arabic">نبنيو مستقبل السياحة التونسية</p>
          <p className="ej-hero-sub">
            e-Tunisia was born from a simple frustration: the most magical places in Tunisia
            are nowhere to be found online. We are fixing that, together.
          </p>
          <div className="ej-hero-actions">
            <a href="#/explore" className="ej-btn">Start exploring<Arrow /></a>
            <a href="#/register" className="ej-link">Join the community</a>
          </div>
          <div className="ej-hero-note">
            <span className="ej-hand">Built in Sfax, for anyone curious enough to look past the brochure.</span>
          </div>
        </div>
        <div className="ej-hero-prints">
          {PRINTS.map((p) => (
            <figure className={`ej-print ${p.cls}`} key={p.cls}>
              <img src={p.src} alt={p.alt} loading={p.eager ? 'eager' : 'lazy'} fetchPriority={p.eager ? 'high' : undefined} />
              <figcaption>{p.cap} <span className="ej-print-meta">{p.meta}</span></figcaption>
            </figure>
          ))}
          <RoundStamp idSuffix="-about" />
        </div>
      </header>

      {/* ── Story spread ── */}
      <section className="ej-section">
        <div className="ej-spread ej-reveal">
          <figure className="ej-print ej-print--static">
            <img src="/img/journey/matmata.webp" alt="Cave dwellings carved into the hills of Matmata" loading="lazy" />
            <figcaption>the real thing <span className="ej-print-meta">Matmata</span></figcaption>
          </figure>
          <div className="ej-spread-text">
            <p className="ej-kicker"><span className="ej-no">Nº 00</span> Why we started</p>
            <h2 className="ej-h2">The same twenty spots, <em>copied around.</em></h2>
            <p>
              Existing travel platforms list the same 20 tourist spots copied from each other.
              The real Tunisia (the cave restaurants, the secret beaches, the family-run
              guesthouses, the hidden Roman ruins) stays invisible.
            </p>
            <p>
              Local businesses lose travelers to all-inclusive resorts. Travelers miss
              experiences they would remember forever. Everyone loses.
            </p>
            <h2 className="ej-h2">So we built the <em>index</em> instead.</h2>
            <p>
              e-Tunisia is a community-driven platform where locals and travelers share the
              spots that do not make it into guidebooks. We verify, curate, and make them
              bookable, with no paid placements and no fake reviews.
            </p>
          </div>
        </div>
      </section>

      {/* ── Almanac ── */}
      <section className="ej-almanac" aria-label="Platform numbers">
        <div className="ej-almanac-grid">
          <Stat target={MARKETING_STATS.placesCharted.value} suffix={MARKETING_STATS.placesCharted.suffix} label="Hidden places" />
          <Stat target={MARKETING_STATS.travelers.value} suffix={MARKETING_STATS.travelers.suffix} label="Travelers" />
          <Stat target={MARKETING_STATS.localHosts.value} suffix={MARKETING_STATS.localHosts.suffix} label="Local hosts" />
          <Stat target={MARKETING_STATS.communityReviews.value} suffix={MARKETING_STATS.communityReviews.suffix} label="Reviews" />
        </div>
        <div className="ej-almanac-footnote">
          <span className="ej-hand">counted by hand — no inflated numbers here.</span>
        </div>
      </section>

      {/* ── Values ── */}
      <section className="ej-section ej-manifesto">
        <div className="ej-section-head">
          <p className="ej-kicker"><span className="ej-no">Nº 01</span> What we believe</p>
          <h2 className="ej-h2">Values that <em>drive us.</em></h2>
        </div>
        <div className="ej-manifesto-cols ej-manifesto-cols--4">
          {VALUES.map((v) => (
            <div className="ej-manifesto-col ej-reveal" key={v.title}>
              <h3>{v.kicker} · {v.title}</h3>
              <p>{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Crew ── */}
      <section className="ej-section">
        <div className="ej-section-head">
          <p className="ej-kicker"><span className="ej-no">Nº 02</span> The team</p>
          <h2 className="ej-h2">Built by Tunisians, <em>for the world.</em></h2>
          <p className="ej-lede">A youth-led project, designed and built in Sfax.</p>
        </div>
        <div className="ej-crew">
          {TEAM.map((m) => (
            <article className="ej-crew-card ej-reveal" key={m.name}>
              {m.kind === 'logo' ? (
                <img className="ej-crew-portrait ej-crew-portrait--logo" src={m.img} alt={m.name} loading="lazy" />
              ) : (
                <div className="ej-crew-portrait ej-crew-portrait--initials" aria-hidden="true">{initials(m.name)}</div>
              )}
              <h3>{m.name}</h3>
              <span className="ej-crew-role">{m.role}</span>
              <p>{m.bio}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ── Final call ── */}
      <section className="ej-cta">
        <div className="ej-cta-inner">
          <RoundStamp idSuffix="-about-cta" />
          <h2>Be part of the <em>story.</em></h2>
          <p className="ej-cta-arabic">أهلا وسهلا</p>
          <div className="ej-hero-actions" style={{ justifyContent: 'center' }}>
            <a href="#/register" className="ej-btn">Join the community<Arrow /></a>
            <a href="#/partner" className="ej-btn ej-btn--paper">Partner with us</a>
          </div>
          <span className="ej-cta-note">
            <span className="ej-hand">Ahlan wa sahlan. Welcome.</span>
          </span>
        </div>
      </section>

      {!isLoggedIn() && <PublicFooter />}
    </div>
  );
}
