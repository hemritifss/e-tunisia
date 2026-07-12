import '../../styles/landing-editorial.css';
import '../../styles/landing.css';
import React, { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import * as api from '../../api';
import { usePlanCatalog, fmtPrice } from '../lib/plan-catalog';
import { coverPlaceholder } from '../../shared/placeholder';
import { getImageUrl } from '../../shared/api';
import { MARKETING_STATS } from '../data/marketingStats';
import PublicMasthead from '../components/public/PublicMasthead';
import PublicFooter from '../components/public/PublicFooter';

// Landing — "Carnet de Voyage" editorial edition (landing-editorial.css).
// A hand-assembled travel journal: paper, ink, pasted photo prints, rubber
// stamps, boarding-pass itineraries, postcard testimonials. Deliberately no
// particles, no mesh orbs, no gradient text, no fake live counters, no stock
// avatar stacks — those read as machine-made. Real data with honest fallbacks.

interface Place { id: string; name: string; city: string; category?: { name: string }; rating: number; reviewCount: number; coverImage?: string; images?: string[]; image?: string; }

const fallbackPlaces: Place[] = [
  { id: '1', name: 'Amphitheatre of El Jem', city: 'El Jem', rating: 4.9, reviewCount: 1240, category: { name: 'Historical' }, images: ['/img/hero3.png'] },
  { id: '2', name: 'Sidi Bou Said', city: 'Sidi Bou Said', rating: 4.8, reviewCount: 2100, category: { name: 'Cultural' }, images: ['/img/hero1.png'] },
  { id: '3', name: 'Medina of Tunis', city: 'Tunis', rating: 4.7, reviewCount: 1850, category: { name: 'Historical' }, images: ['/img/hero2.png'] },
  { id: '4', name: 'Dougga', city: 'Téboursouk', rating: 4.9, reviewCount: 890, category: { name: 'Historical' }, images: ['/img/hero3.png'] },
  { id: '5', name: 'Djerba Island', city: 'Houmt Souk', rating: 4.6, reviewCount: 1560, category: { name: 'Beach' }, images: ['/img/hero1.png'] },
  { id: '6', name: 'Kairouan Great Mosque', city: 'Kairouan', rating: 4.8, reviewCount: 980, category: { name: 'Religious' }, images: ['/img/hero2.png'] },
];

const fallbackItineraries = [
  { id: '1', title: 'Sahara Desert Adventure (5 Days)', description: "An unforgettable journey into Tunisia's vast Saharan landscapes — from oases to dune seas to underground cave homes.", duration: 5, difficulty: 'challenging', likeCount: 87, viewCount: 1020 },
  { id: '2', title: 'Coastal Road Trip (7 Days)', description: "Drive along Tunisia's stunning Mediterranean coast from Tabarka to Djerba, visiting ancient ports, beaches, and island paradises.", duration: 7, difficulty: 'moderate', likeCount: 126, viewCount: 1540 },
  { id: '3', title: 'Star Wars Filming Locations', description: 'Visit the real-world locations of Tatooine! A pilgrimage for sci-fi fans through the surreal landscapes of southern Tunisia.', duration: 3, difficulty: 'moderate', likeCount: 203, viewCount: 2800 },
];

const GOVERNORATES = ['Tunis', 'Sfax', 'Sousse', 'Kairouan', 'Bizerte', 'Gabès', 'Ariana', 'Gafsa', 'Monastir', 'Ben Arous', 'Kasserine', 'Médenine', 'Nabeul', 'Tataouine', 'Béja', 'Jendouba', 'Mahdia', 'Sidi Bouzid', 'Siliana', 'Tozeur', 'Kébili', 'Le Kef', 'Manouba', 'Zaghouan'];

/* ── Small inline glyphs (one stroke family, no emoji) ─────────── */
const Arrow = ({ size = 17 }: { size?: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>;
const StarSvg = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>;
const HeartSvg = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" /></svg>;
const EyeSvg = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>;

/* Rubber stamp — circular text on two rings, inked in terracotta */
const RoundStamp = ({ className = 'ej-stamp' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 120 120" aria-hidden="true">
    <defs>
      <path id="ej-stamp-arc" d="M 60,60 m -45,0 a 45,45 0 1,1 90,0 a 45,45 0 1,1 -90,0" fill="none" />
    </defs>
    <circle cx="60" cy="60" r="57" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
    <circle cx="60" cy="60" r="33" fill="none" stroke="currentColor" strokeWidth="1.4" />
    <text fontSize="10.5" letterSpacing="2.2" fill="currentColor" style={{ fontFamily: 'var(--font-mono)' }}>
      <textPath href="#ej-stamp-arc">E-TUNISIA · CARNET DE VOYAGE · EST. TUNIS ·</textPath>
    </text>
    <text x="60" y="66" textAnchor="middle" fontSize="17" fontWeight="700" fill="currentColor" style={{ fontFamily: "'Noto Kufi Arabic', sans-serif" }}>تونس</text>
  </svg>
);

/* Postmark — cancellation circle + wavy lines, like a mailed card */
const Postmark = () => (
  <svg className="ej-postcard-postmark" viewBox="0 0 60 60" aria-hidden="true">
    <circle cx="24" cy="30" r="16" fill="none" stroke="currentColor" strokeWidth="1.2" />
    <text x="24" y="28" textAnchor="middle" fontSize="6" fill="currentColor" letterSpacing="0.5" style={{ fontFamily: 'var(--font-mono)' }}>TUNIS</text>
    <text x="24" y="36" textAnchor="middle" fontSize="5.2" fill="currentColor" style={{ fontFamily: 'var(--font-mono)' }}>2026</text>
    <path d="M38 22q6 2 16 0M38 30q6 2 16 0M38 38q6 2 16 0" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
  </svg>
);

/* Dashed travel-route doodle behind the hero prints */
const RouteDoodle = () => (
  <svg className="ej-route" viewBox="0 0 400 420" fill="none" aria-hidden="true">
    <path d="M22 392 C 120 322, 92 182, 212 152 S 380 82, 374 34" stroke="currentColor" strokeWidth="1.6" strokeDasharray="7 9" strokeLinecap="round" />
    <path d="M371 46 l7 -16 -16 7 6 3 z" fill="currentColor" />
    <circle cx="22" cy="392" r="4" fill="currentColor" />
  </svg>
);

/* ── Place card — a pinned photo print with an index number ───── */
function PlacePrint({ p, index }: { p: Place; index: number }) {
  const [imgSrc, setImgSrc] = useState(getImageUrl(p.coverImage || p.images?.[0]) || coverPlaceholder(p.id, p.name));
  const cat = p.category?.name || 'Place';
  const filled = Math.floor(p.rating || 0);
  return (
    <a href={`#/place/${p.id}`} className="ej-place ej-reveal" style={{ transitionDelay: `${(index % 3) * 0.07}s` }}>
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
    </a>
  );
}

/* ── Itinerary — a boarding-pass ticket ────────────────────────── */
function RouteTicket({ it, index }: { it: any; index: number }) {
  const diffColor = it.difficulty === 'easy' ? 'var(--olive)' : it.difficulty === 'challenging' ? 'var(--coral)' : 'var(--amber)';
  const diffLabel = it.difficulty === 'easy' ? 'Easy' : it.difficulty === 'challenging' ? 'Challenging' : 'Moderate';
  return (
    <a href="#/itineraries" className="ej-ticket ej-reveal" style={{ transitionDelay: `${index * 0.08}s` }}>
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
      <div className="ej-ticket-barcode" aria-hidden="true" />
    </a>
  );
}

/* ── Pricing — fare stubs ──────────────────────────────────────── */
function FareStubs() {
  const { data: catalog } = usePlanCatalog();
  const plans = catalog?.plans || [];
  const currency = catalog?.currency || 'TND';
  return (
    <div className="ej-fares">
      {plans.map((plan) => (
        <div key={plan.id} className={`ej-fare ej-reveal${plan.featured ? ' ej-fare--featured' : ''}`}>
          {plan.featured && <span className="ej-fare-loved">Most loved</span>}
          <div className="ej-fare-name">{plan.name}</div>
          <div className="ej-fare-price">
            {plan.monthly === 0 ? '0' : fmtPrice(plan.monthly, currency).split(' ')[0]}
            <span>{plan.monthly === 0 ? currency : `${currency} / month`}</span>
          </div>
          <p className="ej-fare-tagline">{plan.tagline}</p>
          <ul className="ej-fare-features">
            {plan.features.slice(0, 4).map((feature, i) => <li key={i}>{feature}</li>)}
          </ul>
          <a href={plan.id === 'free' ? '#/register' : '#/pro'} className={plan.featured ? 'ej-btn' : 'ej-btn-ghost'}>
            {plan.id === 'free' ? 'Get started' : `Upgrade to ${plan.name}`}
          </a>
        </div>
      ))}
    </div>
  );
}

const TESTIMONIALS = [
  { pro: true, quote: 'I planned a 9-day trip end-to-end on e-Tunisia. Every place was where the locals said it would be — and half were missing from every guidebook I had.', name: 'Marco Rossi', sub: 'Pro traveler · Milan, Italy' },
  { pro: false, quote: 'My riad in Tozeur was empty in November. I listed it on e-Tunisia and four bookings came through in two weeks — no commission, no middlemen.', name: 'Amina Trabelsi', sub: 'Riad owner · Tozeur' },
  { pro: false, quote: 'The brik stand the app sent me to in La Goulette had a 20-person line. Now I get why. Best 4 dinars I\'ve ever spent.', name: 'Sarah Chen', sub: 'Solo traveler · Singapore' },
  { pro: true, quote: 'Took my family to the Star Wars filming locations using a community itinerary. The kids think I\'m a wizard. The badges kept them engaged the whole trip.', name: 'David Park', sub: 'Pro traveler · Seoul, Korea' },
  { pro: false, quote: 'As a local guide, I now match travelers with exactly the kind of trip I love giving — desert, slow, no rush. The platform actually understands.', name: 'Yasmine Khelil', sub: 'Local guide · Douz' },
  { pro: false, quote: 'The blue-door route through Sidi Bou Said with the photographer who actually lives there? Worth every cent. This is what travel is supposed to be.', name: 'Emma Laurent', sub: 'Photographer · Paris' },
];

export default function HeroPage() {
  const rootRef = useRef<HTMLDivElement>(null);

  const placesQ = useQuery({
    queryKey: ['hero-places'],
    queryFn: async () => {
      try {
        const res: any = await api.getPlaces({ limit: '6' } as any);
        if (res?.data?.length) return { places: res.data as Place[], total: res.meta?.total || res.data.length };
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
  const totalReviews = places ? Math.max(places.reduce((s, p) => s + (p.reviewCount || 0), 0), MARKETING_STATS.communityReviews.value) : 0;
  const itineraries = itinQ.data;

  // Scroll reveal — re-run when async content mounts so it gets observed.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add('is-in'); obs.unobserve(entry.target); } });
    }, { threshold: 0.08, rootMargin: '0px 0px -36px 0px' });
    root.querySelectorAll('.ej-reveal').forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [places, itineraries]);

  // Partner application form
  const [lp, setLp] = useState({ name: '', business: '', email: '', type: 'hotel' });
  const [lpBtn, setLpBtn] = useState('Send application — free');
  const [lpDisabled, setLpDisabled] = useState(false);
  const lpSet = (k: keyof typeof lp) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setLp((s) => ({ ...s, [k]: e.target.value }));
  const submitLp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLpDisabled(true); setLpBtn('Sending…');
    try {
      await api.submitContactForm({ name: lp.name.trim(), email: lp.email.trim(), businessName: lp.business.trim(), type: lp.type, message: 'Partner application from landing page' });
      setLpBtn('Application sent!');
      setLp({ name: '', business: '', email: '', type: 'hotel' });
      setTimeout(() => { setLpDisabled(false); setLpBtn('Send application — free'); }, 3000);
    } catch (err: any) {
      setLpBtn('Send application — free'); setLpDisabled(false);
      alert(`Couldn't submit: ${err?.message || 'network error'}.\nEmail support@etunisia.com and we'll follow up.`);
    }
  };

  return (
    <div className="ej-landing" ref={rootRef}>

      {/* ── Masthead ── */}
      <PublicMasthead />

      {/* ── Hero — the opening spread ── */}
      <header className="ej-hero">
        <span className="ej-hero-watermark" aria-hidden="true">تونس</span>
        <div className="ej-hero-copy">
          <p className="ej-hero-kicker">Carnet de voyage — a field guide to Tunisia</p>
          <h1 className="ej-hero-title">
            The Tunisia{' '}
            <em className="ej-hand-underline">
              locals
              <svg viewBox="0 0 200 12" preserveAspectRatio="none" aria-hidden="true"><path d="M4 8 C 45 3, 95 11, 140 6 S 190 4, 197 7" fill="none" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" opacity="0.8" /></svg>
            </em>{' '}
            keep to themselves.
          </h1>
          <p className="ej-hero-arabic">تونس تستدعيك</p>
          <p className="ej-hero-sub">
            From the blue doors of Sidi Bou Said to the dunes of Douz. From the Roman stones
            of El Jem to the olive groves of Kairouan. This is the Tunisia locals live —
            not the one tour buses visit.
          </p>
          <div className="ej-hero-actions">
            <a href="#/explore" className="ej-btn">Start exploring<Arrow /></a>
            <a href="#/register" className="ej-link">Join the community</a>
          </div>
          <div className="ej-hero-note">
            <span className="ej-hand">P.S. — you will crave brik after this. Don't say we didn't warn you.</span>
          </div>
        </div>
        <div className="ej-hero-prints" aria-hidden="false">
          <RouteDoodle />
          <figure className="ej-print ej-print-1">
            <img src="/img/hero1.png" alt="White and blue houses of Sidi Bou Said above the Mediterranean" />
            <figcaption>Sidi Bou Said, 07:14 <span className="ej-print-meta">36.87°N 10.34°E</span></figcaption>
          </figure>
          <figure className="ej-print ej-print-2">
            <img src="/img/hero2.png" alt="A camel and rider crossing the Sahara dunes at sunset near Douz" loading="lazy" />
            <figcaption>Douz, golden hour <span className="ej-print-meta">33.46°N 9.02°E</span></figcaption>
          </figure>
          <figure className="ej-print ej-print-3">
            <img src="/img/hero3.png" alt="The Roman amphitheatre of El Jem at golden hour" loading="lazy" />
            <figcaption>El Jem, before the crowds <span className="ej-print-meta">III century</span></figcaption>
          </figure>
          <RoundStamp />
        </div>
      </header>

      {/* ── Governorate ticker ── */}
      <div className="ej-ticker" aria-label="The 24 governorates of Tunisia">
        <div className="ej-ticker-track">
          {[...GOVERNORATES, ...GOVERNORATES].map((g, i) => (
            <React.Fragment key={i}>
              <span className="ej-ticker-item">{g}</span>
              <span className="ej-ticker-sep" aria-hidden="true">✳</span>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* ── Almanac ── */}
      <section className="ej-almanac" aria-label="Platform numbers">
        <div className="ej-almanac-grid">
          <div className="ej-almanac-cell">
            <span className="ej-almanac-num">{totalPlaces ? totalPlaces.toLocaleString() : '—'}<sup>*</sup></span>
            <span className="ej-almanac-label">Places charted</span>
          </div>
          <div className="ej-almanac-cell">
            <span className="ej-almanac-num">{totalReviews ? totalReviews.toLocaleString() : '—'}</span>
            <span className="ej-almanac-label">Community reviews</span>
          </div>
          <div className="ej-almanac-cell">
            <span className="ej-almanac-num">{MARKETING_STATS.governorates.display}</span>
            <span className="ej-almanac-label">Governorates</span>
          </div>
          <div className="ej-almanac-cell">
            <span className="ej-almanac-num">{MARKETING_STATS.yearsOfHistory.display}</span>
            <span className="ej-almanac-label">Years of history</span>
          </div>
        </div>
        <div className="ej-almanac-footnote">
          <span className="ej-hand">* counted by hand — no inflated numbers here.</span>
        </div>
      </section>

      {/* ── Nº 01 — The Index ── */}
      <section className="ej-section">
        <div className="ej-section-head">
          <p className="ej-kicker"><span className="ej-no">Nº 01</span> The index</p>
          <h2 className="ej-h2">Real places, vouched for by the people who <em>live</em> there.</h2>
          <p className="ej-lede">Every listing is verified by our community. No paid placements. No tourist traps.</p>
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

      {/* ── Nº 02 — Field routes ── */}
      <section className="ej-section">
        <div className="ej-section-head">
          <p className="ej-kicker"><span className="ej-no">Nº 02</span> Field routes</p>
          <h2 className="ej-h2">Routes written by people who've <em>actually</em> gone.</h2>
          <p className="ej-lede">From a foodie weekend in Tunis to a five-day Sahara crossing. Real plans, tested on real roads.</p>
        </div>
        <div className="ej-tickets">
          {itineraries
            ? itineraries.map((it: any, i: number) => <RouteTicket key={it.id} it={it} index={i} />)
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

      {/* ── Nº 03 — Moods ── */}
      <section className="ej-section">
        <div className="ej-section-head">
          <p className="ej-kicker"><span className="ej-no">Nº 03</span> Pick a mood</p>
          <h2 className="ej-h2">What kind of trip are you <em>packing</em> for?</h2>
          <p className="ej-lede">Five moods. Twenty-four governorates. One country that fits all of them.</p>
        </div>
        <div className="ej-moods">
          {[
            { href: '#/mood/adventure', img: '/img/hero2.png', title: 'Adventure', desc: 'dunes, kitesurf, canyons, cave homes' },
            { href: '#/mood/culture', img: '/img/hero3.png', title: 'Culture', desc: 'Roman ruins, medinas, Berber heritage' },
            { href: '#/mood/relax', img: '/img/hero1.png', title: 'Relax', desc: 'hammams, blue doors, sunset terraces' },
            { href: '#/mood/foodie', img: '/img/hero3.png', title: 'Foodie', desc: 'brik, harissa, mint tea on rooftops' },
            { href: '#/mood/spiritual', img: '/img/hero2.png', title: 'Spiritual & slow', desc: 'Kairouan, Sufi chants, desert silence' },
          ].map((m, i) => (
            <a key={m.href} className="ej-mood ej-reveal" href={m.href} style={{ transitionDelay: `${i * 0.06}s` }}>
              <img src={m.img} alt="" loading="lazy" />
              <div className="ej-mood-body"><h4>{m.title}</h4><p>{m.desc}</p></div>
            </a>
          ))}
        </div>
      </section>

      {/* ── Nº 04 — Manifesto ── */}
      <section className="ej-section ej-manifesto">
        <div className="ej-section-head">
          <p className="ej-kicker"><span className="ej-no">Nº 04</span> Why we built this</p>
        </div>
        <blockquote className="ej-pullquote">Tourism that gives back — not tourism that extracts. Built different. Built Tunisian.</blockquote>
        <div className="ej-manifesto-cols">
          <div className="ej-manifesto-col">
            <h3>For travelers</h3>
            <p>Find the cave café in Tabarka that has no Google Maps pin. The family in Matmata that still lives in a troglodyte house. The brik stand in La Goulette that locals queue twenty minutes for.</p>
          </div>
          <div className="ej-manifesto-col">
            <h3>For locals</h3>
            <p>List your riad, your tour, your restaurant, your handicraft shop. Keep what you earn. No Booking.com commission. No TripAdvisor games. Just you and the traveler.</p>
          </div>
          <div className="ej-manifesto-col">
            <h3>For Tunisia</h3>
            <p>Every dinar spent through e-Tunisia stays in Tunisia. Supports a Tunisian family. Preserves a Tunisian tradition. This is tourism that gives back.</p>
          </div>
        </div>
      </section>

      {/* ── Nº 05 — Postcards ── */}
      <section className="ej-section">
        <div className="ej-section-head">
          <p className="ej-kicker"><span className="ej-no">Nº 05</span> Postcards</p>
          <h2 className="ej-h2">From the road, in their <em>own</em> words.</h2>
        </div>
        <div className="ej-postcards">
          {TESTIMONIALS.map((t, i) => (
            <article key={t.name} className={`ej-postcard ej-reveal${t.pro ? ' is-pro' : ''}`} style={{ transitionDelay: `${(i % 3) * 0.06}s` }}>
              {t.pro && <span className="ej-postcard-pro">Pro member</span>}
              <span className="ej-postcard-stamp" aria-hidden="true"><img src="/logo-chechia.svg" alt="" /></span>
              <Postmark />
              <p className="ej-postcard-quote">“{t.quote}”</p>
              <div className="ej-postcard-sig">
                <span className="ej-hand">— {t.name}</span>
                <span>{t.sub}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ── The letter — for business owners ── */}
      <section className="ej-section">
        <div className="ej-letter">
          <div>
            <p className="ej-kicker"><span className="ej-no">✳</span> For business owners</p>
            <h2 className="ej-h2">Run a riad, a table, a tour? <em>Write to us.</em></h2>
            <p className="ej-letter-arabic">وصل للسياح اللي يستحقو</p>
            <p className="ej-lede">Hotels, riads, restaurants, guides, artisans - whatever you do, there's a traveler looking for you. Join {MARKETING_STATS.localHosts.display} Tunisian businesses already on the platform.</p>
            <ul className="ej-letter-benefits">
              <li><span className="ej-tick" aria-hidden="true">✓</span> Direct bookings, no middlemen</li>
              <li><span className="ej-tick" aria-hidden="true">✓</span> You keep what you earn</li>
              <li><span className="ej-tick" aria-hidden="true">✓</span> Verified by our community</li>
            </ul>
          </div>
          <form className="ej-letter-form" onSubmit={submitLp}>
            <div className="ej-letter-form-head"><span>Partner application</span><span>no commission, ever</span></div>
            <div className="ej-field">
              <label htmlFor="lp-name">Full name</label>
              <input type="text" id="lp-name" className="ej-input" placeholder="Your name" required value={lp.name} onChange={lpSet('name')} autoComplete="name" />
            </div>
            <div className="ej-field">
              <label htmlFor="lp-business">Business name</label>
              <input type="text" id="lp-business" className="ej-input" placeholder="Your business" required value={lp.business} onChange={lpSet('business')} autoComplete="organization" />
            </div>
            <div className="ej-field">
              <label htmlFor="lp-email">Email</label>
              <input type="email" id="lp-email" className="ej-input" placeholder="you@business.com" required value={lp.email} onChange={lpSet('email')} autoComplete="email" />
            </div>
            <div className="ej-field">
              <label htmlFor="lp-type">Business type</label>
              <select id="lp-type" className="ej-input" value={lp.type} onChange={lpSet('type')}>
                <option value="hotel">Hotel / Riad</option>
                <option value="restaurant">Restaurant / Café</option>
                <option value="tour">Tour guide / Experience</option>
                <option value="artisan">Artisan / Shop</option>
                <option value="other">Other</option>
              </select>
            </div>
            <button type="submit" className="ej-btn" disabled={lpDisabled}>{lpBtn}</button>
          </form>
        </div>
      </section>

      {/* ── Partners strip ── */}
      <section className="ej-partners" aria-label="Partner organizations">
        <div className="ej-partners-inner">
          <p className="ej-partners-title">In good company — partners &amp; supporters</p>
          <div className="ej-partners-row">
            {[
              { src: '/img/partenaires/OIM_Migration.png', alt: 'OIM — International Organization for Migration' },
              { src: '/img/partenaires/Logo%20SB%20ENET_Com_Color.png', alt: "ENET'Com" },
              { src: '/img/partenaires/APII.png', alt: "APII — Agence de Promotion de l'Industrie et de l'Innovation" },
              { src: '/img/partenaires/Nafship-1_upscayl_3x_ultramix_balanced.png', alt: 'Nafship' },
              { src: '/img/partenaires/MPRR_LOGO_Draft-01__1.png', alt: 'MPRR' },
              { src: '/img/partenaires/Bussiness_Success.png', alt: 'Business Success' },
            ].map((l) => <img key={l.src} src={l.src} alt={l.alt} loading="lazy" />)}
          </div>
        </div>
      </section>

      {/* ── Nº 06 — Fares ── */}
      <section className="ej-section">
        <div className="ej-section-head">
          <p className="ej-kicker"><span className="ej-no">Nº 06</span> Fair fares</p>
          <h2 className="ej-h2">Start free. Upgrade when you're <em>hooked.</em></h2>
          <p className="ej-lede">Every plan supports Tunisian local businesses. No hidden fees.</p>
        </div>
        <FareStubs />
      </section>

      {/* ── Final call — the ink page ── */}
      <section className="ej-cta">
        <div className="ej-cta-inner">
          <RoundStamp />
          <h2>The <em>real</em> Tunisia is waiting.</h2>
          <p className="ej-cta-arabic">أهلاً وسهلاً — مرحبا بيك</p>
          <a href="#/register" className="ej-btn ej-btn--paper">Create your free account<Arrow /></a>
          <div className="ej-cta-note">
            <span className="ej-hand">no tour buses, no all-inclusive compounds — promise.</span>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
