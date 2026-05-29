import React, { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import * as api from '../../api';

// Migrated from vanilla pages/hero.ts — the landing page. Mostly static marketing,
// plus: canvas particles, real places/itineraries (with fallbacks), count-up stats,
// scroll-reveal, governorate marquee, and a landing partner form.

const LOCAL_HERO_IMAGES = ['/img/hero1.png', '/img/hero2.png', '/img/hero3.png'];

interface Place { id: string; name: string; city: string; category?: { name: string }; rating: number; reviewCount: number; images?: string[]; image?: string; }

const fallbackPlaces: Place[] = [
  { id: '1', name: 'Amphitheatre of El Jem', city: 'El Jem', rating: 4.9, reviewCount: 1240, category: { name: 'Historical' }, images: ['/img/hero3.png'] },
  { id: '2', name: 'Sidi Bou Said', city: 'Sidi Bou Said', rating: 4.8, reviewCount: 2100, category: { name: 'Cultural' }, images: ['/img/hero1.png'] },
  { id: '3', name: 'Medina of Tunis', city: 'Tunis', rating: 4.7, reviewCount: 1850, category: { name: 'Historical' } },
  { id: '4', name: 'Dougga', city: 'Téboursouk', rating: 4.9, reviewCount: 890, category: { name: 'Historical' } },
  { id: '5', name: 'Djerba Island', city: 'Houmt Souk', rating: 4.6, reviewCount: 1560, category: { name: 'Beach' } },
  { id: '6', name: 'Kairouan Great Mosque', city: 'Kairouan', rating: 4.8, reviewCount: 980, category: { name: 'Religious' } },
];

const fallbackItineraries = [
  { id: '1', title: 'Sahara Desert Adventure (5 Days)', description: "An unforgettable journey into Tunisia's vast Saharan landscapes — from oases to dune seas to underground cave homes.", duration: 5, difficulty: 'challenging', likeCount: 87, viewCount: 1020 },
  { id: '2', title: 'Coastal Road Trip (7 Days)', description: "Drive along Tunisia's stunning Mediterranean coast from Tabarka to Djerba, visiting ancient ports, beaches, and island paradises.", duration: 7, difficulty: 'moderate', likeCount: 126, viewCount: 1540 },
  { id: '3', title: 'Star Wars Filming Locations', description: 'Visit the real-world locations of Tatooine! A pilgrimage for sci-fi fans through the surreal landscapes of southern Tunisia.', duration: 3, difficulty: 'moderate', likeCount: 203, viewCount: 2800 },
];

const GOVERNORATES = ['Tunis', 'Sfax', 'Sousse', 'Kairouan', 'Bizerte', 'Gabès', 'Ariana', 'Gafsa', 'Monastir', 'Ben Arous', 'Kasserine', 'Médenine', 'Nabeul', 'Tataouine', 'Béja', 'Jendouba', 'Mahdia', 'Sidi Bouzid', 'Siliana', 'Tozeur', 'Kébili', 'Le Kef', 'Manouba', 'Zaghouan'];

const Arrow = ({ size = 18 }: { size?: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>;
const Check = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>;
const StarSvg = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>;

function useInView(threshold = 0.4) {
  const ref = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const o = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { setSeen(true); o.unobserve(e.target); } }), { threshold });
    o.observe(el);
    return () => o.disconnect();
  }, [threshold]);
  return [ref, seen] as const;
}

// Mirrors vanilla animateCounter: rounds large targets, '+' suffix at >=1000.
function CountUp({ target, start, initial = '0' }: { target: number; start: boolean; initial?: string }) {
  const [val, setVal] = useState<number | null>(null);
  const started = useRef(false);
  useEffect(() => {
    if (!start || started.current || !target) return;
    started.current = true;
    const displayTarget = target >= 1000 ? Math.round(target / 100) * 100 : target;
    let current = 0;
    const step = displayTarget / 50;
    const timer = setInterval(() => {
      current += step;
      if (current >= displayTarget) { current = displayTarget; clearInterval(timer); }
      setVal(Math.floor(current));
    }, 20);
    return () => clearInterval(timer);
  }, [start, target]);
  const suffix = target >= 1000 ? '+' : '';
  if (val === null) return <>{initial}</>;
  return <>{val.toLocaleString()}{suffix}</>;
}

function PlaceCard({ p }: { p: Place }) {
  const img = p.images?.[0] || p.image || '/img/hero1.png';
  const cat = p.category?.name || 'Place';
  const filled = Math.floor(p.rating || 0);
  return (
    <a href={`#/place/${p.id}`} className="tn-place-card">
      <div className="tn-place-img">
        <img src={img} alt={p.name} loading="lazy" />
        <span className="tn-place-cat">{cat}</span>
      </div>
      <div className="tn-place-body">
        <h4>{p.name}</h4>
        <div className="tn-place-meta">
          <span className="tn-place-city">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>
            {p.city}
          </span>
          <span className="tn-place-stars" title={`${p.rating || 0}/5`} aria-label={`${filled} out of 5 stars`}>
            {Array.from({ length: 5 }).map((_, i) => <span key={i} className={`tn-place-star${i < filled ? ' is-filled' : ''}`}><StarSvg /></span>)}
          </span>
        </div>
      </div>
    </a>
  );
}

function ItinCard({ it }: { it: any }) {
  const diffColor = it.difficulty === 'easy' ? 'var(--olive)' : it.difficulty === 'challenging' ? 'var(--coral)' : 'var(--tn-gold)';
  const diffLabel = it.difficulty === 'easy' ? 'Easy' : it.difficulty === 'challenging' ? 'Challenging' : 'Moderate';
  return (
    <a href="#/itineraries" className="tn-itin-card">
      <div className="tn-itin-header">
        <span className="tn-itin-duration">{it.duration} Days</span>
        <span className="tn-itin-diff" style={{ ['--diff-color' as any]: diffColor }}>{diffLabel}</span>
      </div>
      <h4>{it.title}</h4>
      <p>{it.description}</p>
      <div className="tn-itin-footer">
        <span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" /></svg> {it.likeCount || 0}</span>
        <span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg> {(it.viewCount || 0).toLocaleString()}</span>
      </div>
    </a>
  );
}

export default function HeroPage() {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pulseRef, pulseSeen] = useInView(0.4);

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
  const totalReviews = places ? Math.max(places.reduce((s, p) => s + (p.reviewCount || 0), 0), 8500) : 0;
  const itineraries = itinQ.data;

  // Canvas particles
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let width = window.innerWidth, height = window.innerHeight;
    canvas.width = width; canvas.height = height;
    const COUNT = width < 768 ? 60 : 120;
    const particles = Array.from({ length: COUNT }, () => ({
      x: Math.random() * width, y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.3, vy: -Math.random() * 0.4 - 0.1,
      size: Math.random() * 2 + 0.5, alpha: Math.random() * 0.6 + 0.2, glow: Math.random() * 15 + 5,
    }));
    let animId = 0;
    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      for (const p of particles) {
        p.x += p.vx; p.y += p.vy;
        if (p.y < -10) { p.y = height + 10; p.x = Math.random() * width; }
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(212, 165, 116, ${p.alpha})`;
        ctx.shadowBlur = p.glow; ctx.shadowColor = 'rgba(212, 165, 116, 0.4)';
        ctx.fill(); ctx.shadowBlur = 0;
      }
      animId = requestAnimationFrame(animate);
    };
    animate();
    const onResize = () => { width = window.innerWidth; height = window.innerHeight; canvas.width = width; canvas.height = height; };
    const onVis = () => { if (document.hidden) cancelAnimationFrame(animId); else animate(); };
    window.addEventListener('resize', onResize);
    document.addEventListener('visibilitychange', onVis);
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', onResize); document.removeEventListener('visibilitychange', onVis); };
  }, []);

  // Scroll reveal — re-run when async cards render so they get observed.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add('tn-revealed'); obs.unobserve(entry.target); } });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    root.querySelectorAll('.tn-why-card, .tn-place-card, .tn-mood-tile, .tn-testimonial, .tn-logo-card, .tn-itin-card').forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [places, itineraries]);

  // Landing partner form
  const [lp, setLp] = useState({ name: '', business: '', email: '', type: 'hotel' });
  const [lpBtn, setLpBtn] = useState('Apply Now — Free');
  const [lpDisabled, setLpDisabled] = useState(false);
  const lpSet = (k: keyof typeof lp) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setLp((s) => ({ ...s, [k]: e.target.value }));
  const submitLp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLpDisabled(true); setLpBtn('Sending…');
    try {
      await api.submitContactForm({ name: lp.name.trim(), email: lp.email.trim(), businessName: lp.business.trim(), type: lp.type, message: 'Partner application from landing page' });
      setLpBtn('Application Sent!');
      setLp({ name: '', business: '', email: '', type: 'hotel' });
      setTimeout(() => { setLpDisabled(false); setLpBtn('Apply Now — Free'); }, 3000);
    } catch (err: any) {
      setLpBtn('Apply Now — Free'); setLpDisabled(false);
      alert(`Couldn't submit: ${err?.message || 'network error'}.\nEmail support@etunisia.com and we'll follow up.`);
    }
  };

  return (
    <div className="tn-landing" ref={rootRef}>
      <canvas id="tn-particles" className="tn-particles" ref={canvasRef} />

      <section className="tn-hero">
        <div className="tn-hero-slideshow">
          {LOCAL_HERO_IMAGES.map((src, i) => (
            <div key={src} className={`tn-hero-slide${i === 0 ? ' active' : ''}`} style={{ ['--delay' as any]: `${i * 8}s` }}><img src={src} alt="Tunisia" /></div>
          ))}
        </div>
        <div className="tn-hero-overlay" />
        <div className="tn-hero-vignette" />
        <div className="tn-mesh-orbs" aria-hidden="true">
          <div className="tn-mesh-orb tn-mesh-orb-1" /><div className="tn-mesh-orb tn-mesh-orb-2" /><div className="tn-mesh-orb tn-mesh-orb-3" />
        </div>
        <div className="tn-hero-content">
          <div className="tn-hero-badge"><span className="tn-pulse" />Made in Tunisia</div>
          <h1 className="tn-hero-title"><span className="tn-grad">Tunisia</span> is Calling</h1>
          <p className="tn-hero-arabic">تونس تستدعيك</p>
          <p className="tn-hero-sub">From the blue doors of Sidi Bou Said to the dunes of Douz. From the Roman stones of El Jem to the olive groves of Kairouan. This is the Tunisia locals live — not the one tour buses visit.</p>
          <div className="tn-hero-actions">
            <a href="#/explore" className="tn-btn-primary">Explore Places<Arrow /></a>
            <a href="#/register" className="tn-btn-secondary">Join Free</a>
          </div>
          <div className="tn-hero-meta">
            <span className="tn-hero-meta-avatars" aria-hidden="true">
              <img src="https://api.dicebear.com/9.x/thumbs/svg?seed=yasmine" alt="" loading="lazy" />
              <img src="https://api.dicebear.com/9.x/thumbs/svg?seed=marco" alt="" loading="lazy" />
              <img src="https://api.dicebear.com/9.x/thumbs/svg?seed=amina" alt="" loading="lazy" />
              <img src="https://api.dicebear.com/9.x/thumbs/svg?seed=david" alt="" loading="lazy" />
            </span>
            <span>Join <strong>12,400+</strong> travelers already exploring</span>
          </div>
        </div>
        <div className="tn-hero-scroll"><span>Scroll</span><div className="tn-scroll-line" /></div>
      </section>

      <section className="tn-pulse-strip" aria-label="Community activity" ref={pulseRef}>
        <div className="tn-pulse-online">
          <span className="tn-pulse-online-dot" aria-hidden="true" />
          <span><strong><CountUp target={342} start={pulseSeen} /></strong> online now</span>
        </div>
        <div className="tn-pulse-stats">
          <div className="tn-pulse-stat"><strong><CountUp target={89} start={pulseSeen} /></strong><span>Posts today</span></div>
          <div className="tn-pulse-stat"><strong><CountUp target={1240} start={pulseSeen} /></strong><span>Reviews this week</span></div>
          <div className="tn-pulse-stat"><strong><CountUp target={312} start={pulseSeen} /></strong><span>Trips planned</span></div>
        </div>
        <div className="tn-pulse-avatars" aria-hidden="true">
          <img src="https://api.dicebear.com/9.x/thumbs/svg?seed=emma" alt="" loading="lazy" />
          <img src="https://api.dicebear.com/9.x/thumbs/svg?seed=sarah" alt="" loading="lazy" />
          <img src="https://api.dicebear.com/9.x/thumbs/svg?seed=david" alt="" loading="lazy" />
          <img src="https://api.dicebear.com/9.x/thumbs/svg?seed=marco" alt="" loading="lazy" />
          <span className="tn-pulse-more">+88</span>
        </div>
      </section>

      <div className="tn-stats" id="tn-stats">
        <div className="tn-stat"><span className="tn-stat-num"><CountUp target={totalPlaces} start={!!places} initial="—" /></span><span className="tn-stat-label">Places Discovered</span></div>
        <div className="tn-stat-divider" />
        <div className="tn-stat"><span className="tn-stat-num"><CountUp target={totalReviews} start={!!places} initial="—" /></span><span className="tn-stat-label">Community Reviews</span></div>
        <div className="tn-stat-divider" />
        <div className="tn-stat"><span className="tn-stat-num">24</span><span className="tn-stat-label">Governorates</span></div>
        <div className="tn-stat-divider" />
        <div className="tn-stat"><span className="tn-stat-num">3000+</span><span className="tn-stat-label">Years of History</span></div>
      </div>

      <section className="tn-section">
        <div className="tn-container">
          <div className="tn-section-head">
            <span className="tn-eyebrow">Discover</span>
            <h2>Real places. Real people. Real Tunisia.</h2>
            <p>Every listing is verified by our community. No paid placements. No tourist traps.</p>
          </div>
          <div className="tn-places-grid" id="tn-places">
            {places
              ? places.map((p) => <PlaceCard key={p.id} p={p} />)
              : Array.from({ length: 6 }).map((_, i) => (
                <div className="tn-place-skeleton" key={i}>
                  <div className="skeleton" style={{ height: 220, borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0' }} />
                  <div style={{ padding: '1.25rem' }}>
                    <div className="skeleton skeleton-text" style={{ width: '70%', height: 18, marginBottom: '0.5rem' }} />
                    <div className="skeleton skeleton-text" style={{ width: '50%', height: 14 }} />
                  </div>
                </div>
              ))}
          </div>
          <div className="tn-section-foot"><a href="#/explore" className="tn-btn-outline">See All Places</a></div>
        </div>
      </section>

      <section className="tn-section">
        <div className="tn-container">
          <div className="tn-section-head">
            <span className="tn-eyebrow">Curated Journeys</span>
            <h2>Itineraries built by people who've actually been there.</h2>
            <p>From a foodie weekend in Tunis to a 5-day Sahara adventure. Real plans, tested by real travelers.</p>
          </div>
          <div className="tn-itin-grid" id="tn-itineraries">
            {itineraries
              ? itineraries.map((it: any) => <ItinCard key={it.id} it={it} />)
              : Array.from({ length: 3 }).map((_, i) => (
                <div className="tn-itin-skeleton" key={i}>
                  <div className="skeleton" style={{ height: 160, borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0' }} />
                  <div style={{ padding: '1.25rem' }}>
                    <div className="skeleton skeleton-text" style={{ width: '60%', height: 16, marginBottom: '0.5rem' }} />
                    <div className="skeleton skeleton-text" style={{ width: '40%', height: 12 }} />
                  </div>
                </div>
              ))}
          </div>
        </div>
      </section>

      <section className="tn-section">
        <div className="tn-container">
          <div className="tn-section-head">
            <span className="tn-eyebrow">Find Your Mood</span>
            <h2>What kind of trip are you in for?</h2>
            <p>Five moods. Twenty-four governorates. One country that fits all of them.</p>
          </div>
          <div className="tn-mood-bento">
            {[
              { href: '#/mood/adventure', img: '/img/hero3.png', title: 'Adventure', desc: 'Sahara dunes, kitesurfing, canyoning, troglodyte caves.', icon: <path d="m8 3 4 8 5-5 5 15H2L8 3z" /> },
              { href: '#/mood/culture', img: '/img/hero2.png', title: 'Culture', desc: 'Roman ruins, medinas, mosques, Berber heritage.', icon: <><path d="M3 22V10l9-7 9 7v12" /><path d="M9 22V12h6v10" /></> },
              { href: '#/mood/relax', img: '/img/hero1.png', title: 'Relax', desc: 'Hammams, blue doors, Djerba beaches, sunset terraces.', icon: <><path d="M2 12h20" /><path d="M5 12V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v5" /><path d="M2 16h20" /></> },
              { href: '#/mood/foodie', img: '/img/hero3.png', title: 'Foodie', desc: 'Brik, harissa, couscous royale, mint tea on rooftops.', icon: <path d="M3 11h18a2 2 0 0 1-2 2h-3l-2 5H8l-2-5H4a2 2 0 0 1-1-2z" /> },
              { href: '#/mood/spiritual', img: '/img/hero2.png', title: 'Spiritual & Slow', desc: 'Kairouan, Sufi gatherings, desert silence, monastery walls.', icon: <><path d="M12 2v20" /><path d="M5 8a7 7 0 0 1 14 0" /><path d="M5 14a7 7 0 0 0 14 0" /></> },
            ].map((m, i) => (
              <a key={m.href} className="tn-mood-tile" href={m.href} style={{ transitionDelay: `${i * 0.06}s` }}>
                <img src={m.img} alt="" loading="lazy" />
                <span className="tn-mood-emoji" aria-hidden="true"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{m.icon}</svg></span>
                <div className="tn-mood-body"><h4>{m.title}</h4><p>{m.desc}</p></div>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="tn-marquee-section" aria-label="Governorates of Tunisia">
        <div className="tn-marquee" id="tn-marquee">
          {[...GOVERNORATES, ...GOVERNORATES].map((g, i) => (
            <React.Fragment key={i}><span className="tn-marquee-item">{g}</span><span className="tn-marquee-dot">✦</span></React.Fragment>
          ))}
        </div>
      </section>

      <section className="tn-section tn-why">
        <div className="tn-container">
          <div className="tn-section-head"><span className="tn-eyebrow">Why e-Tunisia</span><h2>Built different. Built Tunisian.</h2></div>
          <div className="tn-why-grid">
            <div className="tn-why-card">
              <div className="tn-why-icon"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="currentColor" stroke="none" /></svg></div>
              <h3>For Travelers</h3>
              <p>Find the cave café in Tabarka that has no Google Maps pin. The family in Matmata that still lives in a troglodyte house. The brik stand in La Goulette that locals queue 20 minutes for.</p>
            </div>
            <div className="tn-why-card">
              <div className="tn-why-icon"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" /></svg></div>
              <h3>For Locals</h3>
              <p>List your riad, your tour, your restaurant, your handicraft shop. Keep what you earn. No Booking.com commission. No TripAdvisor games. Just you and the traveler.</p>
            </div>
            <div className="tn-why-card">
              <div className="tn-why-icon"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg></div>
              <h3>For Tunisia</h3>
              <p>Every dinar spent through e-Tunisia stays in Tunisia. Supports a Tunisian family. Preserves a Tunisian tradition. This is not tourism extraction. This is tourism that gives back.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="tn-section">
        <div className="tn-container">
          <div className="tn-section-head"><span className="tn-eyebrow">From the Community</span><h2>Travelers and locals, in their own words.</h2></div>
          <div className="tn-testimonials">
            {[
              { pro: true, quote: '"I planned a 9-day trip end-to-end on e-Tunisia. Every place was where the locals said it would be — and half were missing from every guidebook I had."', seed: 'marco', name: 'Marco Rossi', sub: 'Pro traveler · Milan, Italy' },
              { pro: false, quote: '"My riad in Tozeur was empty in November. I listed it on e-Tunisia and four bookings came through in two weeks — no commission, no middlemen."', seed: 'amina', name: 'Amina Trabelsi', sub: 'Riad owner · Tozeur' },
              { pro: false, quote: '"The brik stand the app sent me to in La Goulette had a 20-person line. Now I get why. Best 4 dinars I\'ve ever spent."', seed: 'sarah', name: 'Sarah Chen', sub: 'Solo traveler · Singapore' },
              { pro: true, quote: '"Took my family to the Star Wars filming locations using a community itinerary. The kids think I\'m a wizard. The badges system kept them engaged the whole trip."', seed: 'david', name: 'David Park', sub: 'Pro traveler · Seoul, Korea' },
              { pro: false, quote: '"As a local guide, I now match travelers with exactly the kind of trip I love giving — desert, slow, no rush. The platform actually understands."', seed: 'yasmine', name: 'Yasmine Khelil', sub: 'Local guide · Douz' },
              { pro: false, quote: '"The blue-door route through Sidi Bou Said with the photographer who actually lives there? Worth every cent. This is what travel is supposed to be."', seed: 'emma', name: 'Emma Laurent', sub: 'Photographer · Paris' },
            ].map((t, i) => (
              <article key={t.seed} className={`tn-testimonial${t.pro ? ' is-pro' : ''}`} style={{ transitionDelay: `${i * 0.05}s` }}>
                <p className="tn-testimonial-quote">{t.quote}</p>
                <div className="tn-testimonial-user">
                  <img src={`https://api.dicebear.com/9.x/thumbs/svg?seed=${t.seed}`} alt={t.name} loading="lazy" />
                  <div><strong>{t.name}</strong><span>{t.sub}</span></div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="tn-section tn-partner-cta">
        <div className="tn-partner-cta-bg" />
        <div className="tn-container">
          <div className="tn-partner-cta-grid">
            <div className="tn-partner-cta-text">
              <span className="tn-eyebrow">For Business Owners</span>
              <h2>List Your Business</h2>
              <p className="tn-partner-cta-arabic">وصل للسياح اللي يستحقو</p>
              <p className="tn-partner-cta-desc">Hotels, riads, restaurants, tour guides, artisans — whatever you do, there's a traveler looking for you. Join 890+ Tunisian businesses already on the platform.</p>
              <div className="tn-partner-cta-benefits">
                <span><Check /> Direct bookings, no middlemen</span>
                <span><Check /> You keep what you earn</span>
                <span><Check /> Verified by our community</span>
              </div>
            </div>
            <div className="tn-partner-cta-formwrap">
              <form className="tn-partner-cta-form" onSubmit={submitLp}>
                <div className="tn-auth-field"><label htmlFor="lp-name">Full Name</label><input type="text" id="lp-name" className="tn-auth-input" placeholder="Your name" required value={lp.name} onChange={lpSet('name')} /></div>
                <div className="tn-auth-field"><label htmlFor="lp-business">Business Name</label><input type="text" id="lp-business" className="tn-auth-input" placeholder="Your business" required value={lp.business} onChange={lpSet('business')} /></div>
                <div className="tn-auth-field"><label htmlFor="lp-email">Email</label><input type="email" id="lp-email" className="tn-auth-input" placeholder="you@business.com" required value={lp.email} onChange={lpSet('email')} /></div>
                <div className="tn-auth-field"><label htmlFor="lp-type">Business Type</label>
                  <select id="lp-type" className="tn-auth-input" value={lp.type} onChange={lpSet('type')}>
                    <option value="hotel">Hotel / Riad</option>
                    <option value="restaurant">Restaurant / Café</option>
                    <option value="tour">Tour Guide / Experience</option>
                    <option value="artisan">Artisan / Shop</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <button type="submit" className="tn-auth-btn" disabled={lpDisabled}>{lpBtn}</button>
              </form>
            </div>
          </div>
        </div>
      </section>

      <section className="tn-section tn-logos-section">
        <div className="tn-container">
          <div className="tn-logos-stack">
            <div className="tn-logos-header">
              <h2 className="tn-logos-heading">Trusted by organizations shaping Tunisia's future</h2>
              <p className="tn-logos-description">We collaborate with forward-thinking institutions, NGOs, and businesses committed to elevating Tunisian tourism and empowering local communities.</p>
              <div className="tn-logos-links">
                <a href="#/partner" className="tn-logos-link">Become a partner →</a>
                <a href="#/about" className="tn-logos-link">Learn more about us →</a>
              </div>
            </div>
            <div className="tn-logos-grid">
              {[
                { src: '/img/partenaires/OIM_Migration.png', alt: 'OIM — International Organization for Migration' },
                { src: '/img/partenaires/Logo%20SB%20ENET_Com_Color.png', alt: "ENET'Com" },
                { src: "/img/partenaires/APII.png", alt: "APII — Agence de Promotion de l'Industrie et de l'Innovation" },
                { src: '/img/partenaires/Nafship-1_upscayl_3x_ultramix_balanced.png', alt: 'Nafship' },
                { src: '/img/partenaires/MPRR_LOGO_Draft-01__1.png', alt: 'MPRR' },
                { src: '/img/partenaires/Bussiness_Success.png', alt: 'Business Success' },
              ].map((l, i) => (
                <div className="tn-logo-card" key={l.src} style={{ transitionDelay: `${i * 0.08}s` }}><img src={l.src} alt={l.alt} /></div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="tn-section">
        <div className="tn-container">
          <div className="tn-section-head">
            <span className="tn-eyebrow">Pricing</span>
            <h2>Start free. Upgrade when you're hooked.</h2>
            <p>Every plan supports Tunisian local businesses. No hidden fees.</p>
          </div>
          <div className="tn-pricing-grid">
            <div className="tn-pricing-card">
              <div className="tn-pricing-name">Free</div>
              <div className="tn-pricing-price">0 <span>TND</span></div>
              <p className="tn-pricing-desc">For casual explorers</p>
              <ul className="tn-pricing-features">
                <li><Check /> Browse all places</li><li><Check /> Read community reviews</li><li><Check /> Basic map features</li><li><Check /> Join challenges</li>
              </ul>
              <a href="#/register" className="tn-btn-outline" style={{ width: '100%', justifyContent: 'center' }}>Get Started</a>
            </div>
            <div className="tn-pricing-card tn-pricing-popular">
              <div className="tn-pricing-badge">Most Popular</div>
              <div className="tn-pricing-name">Explorer</div>
              <div className="tn-pricing-price">9.99 <span>TND/mo</span></div>
              <p className="tn-pricing-desc">For serious travelers</p>
              <ul className="tn-pricing-features">
                <li><Check /> Everything in Free</li><li><Check /> AI Trip Planner</li><li><Check /> Offline maps</li><li><Check /> No ads</li><li><Check /> Priority support</li>
              </ul>
              <a href="#/register" className="tn-btn-primary" style={{ width: '100%', justifyContent: 'center' }}>Start Free Trial</a>
            </div>
            <div className="tn-pricing-card">
              <div className="tn-pricing-name">Nomad</div>
              <div className="tn-pricing-price">29.99 <span>TND/mo</span></div>
              <p className="tn-pricing-desc">For the ultimate traveler</p>
              <ul className="tn-pricing-features">
                <li><Check /> Everything in Explorer</li><li><Check /> Exclusive hidden gems</li><li><Check /> VIP host discounts</li><li><Check /> Rare badges & status</li>
              </ul>
              <a href="#/register" className="tn-btn-outline" style={{ width: '100%', justifyContent: 'center' }}>Go Nomad</a>
            </div>
          </div>
        </div>
      </section>

      <section className="tn-cta">
        <div className="tn-cta-bg" />
        <div className="tn-cta-content">
          <img src="/logo-chechia.svg" alt="" className="tn-cta-chechia" />
          <h2>The <span className="tn-grad">real Tunisia</span> is waiting.</h2>
          <p>No tour buses. No all-inclusive compounds. Just the Tunisia that Tunisians know and love.</p>
          <a href="#/register" className="tn-btn-primary tn-btn-large">Create Free Account<Arrow size={20} /></a>
          <p className="tn-cta-small">Ahlan wa Sahlan. Welcome.</p>
        </div>
      </section>

      <footer className="tn-footer">
        <div className="tn-footer-grid">
          <div className="tn-footer-brand">
            <div className="tn-logo"><img src="/icon.png" alt="" /><span>e-Tunisia</span></div>
            <p>The platform for discovering real Tunisia. Built by Tunisians, for the world.</p>
          </div>
          <div className="tn-footer-col"><h4>Explore</h4><a href="#/explore">Places</a><a href="#/map">Map</a><a href="#/itineraries">Itineraries</a><a href="#/events">Events</a></div>
          <div className="tn-footer-col"><h4>Community</h4><a href="#/">Feed</a><a href="#/tips">Tips</a><a href="#/leaderboard">Leaderboard</a><a href="#/partner">Partner</a></div>
          <div className="tn-footer-col"><h4>Company</h4><a href="#/about">About</a><a href="#/premium">Pricing</a><a href="#/partner">Contact</a></div>
        </div>
        <div className="tn-footer-bottom">
          <span>2026 e-Tunisia</span>
          <span className="tn-footer-made">Made with
            <span className="tn-footer-heart" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /></svg></span>
            <span className="tn-footer-made-sr">love</span>
            in Tunisia
          </span>
        </div>
      </footer>
    </div>
  );
}
