import React, { useEffect, useRef, useState } from 'react';

// Rebuilt on the .tn-landing cinematic system (shares the partner-v3 photo-hero
// template): photo hero, a story split with imagery, count-up stats, values, the
// real founding team, and a closing CTA.

const Arrow = ({ size = 18 }: { size?: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>;

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
    <div className="tn-stat" ref={ref}>
      <span className="tn-stat-num">{val.toLocaleString()}{suffix}</span>
      <span className="tn-stat-label">{label}</span>
    </div>
  );
}

const VALUES = [
  { color: 'var(--coral)', title: 'Community-Driven', desc: 'Real travelers, real locals, real experiences. Our community curates everything — no corporate editorial team deciding what is worth seeing.', icon: <><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></> },
  { color: 'var(--olive)', title: 'Support Local', desc: 'We prioritize family-run businesses, artisans, and independent hosts. Every booking directly supports Tunisian entrepreneurs.', icon: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /> },
  { color: 'var(--mediterranean)', title: 'Authentic Experiences', desc: 'No tourist traps, no paid placements. Every recommendation is tested and verified by our community of explorers.', icon: <><circle cx="12" cy="12" r="10" /><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="currentColor" stroke="none" /></> },
  { color: 'var(--gold)', title: 'Sustainable Tourism', desc: "Responsible travel that preserves Tunisia's natural beauty and cultural heritage for future generations.", icon: <path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z" /> },
];

const TEAM = [
  {
    kind: 'logo' as const,
    img: '/img/partenaires/Jci%20Gremda.png',
    name: 'JCI Gremda',
    role: 'Founder',
    bio: 'Junior Chamber International — Gremda, Sfax. A youth-led organization driving community impact projects across Tunisia. e-Tunisia is one of them.',
  },
  {
    kind: 'person' as const,
    img: 'https://api.dicebear.com/9.x/personas/svg?seed=zeinab',
    name: 'Zeinab Ben Ayed',
    role: 'Directrice de Projet',
    bio: 'Leads the vision, partnerships and roadmap — making sure e-Tunisia serves travelers and local businesses alike.',
  },
  {
    kind: 'person' as const,
    img: 'https://api.dicebear.com/9.x/personas/svg?seed=aminehemriti',
    name: 'Amine Hemriti',
    role: 'Developer',
    bio: 'Builds e-Tunisia end to end — web, backend, and the details that make the whole platform run.',
  },
];

export default function AboutPage() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add('tn-revealed'); obs.unobserve(entry.target); } });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    root.querySelectorAll('.tn-why-card, .about-v3-team-card').forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  return (
    <div className="tn-landing partner-v3 about-v3" ref={rootRef}>
      {/* ── Hero ── */}
      <section className="partner-v3-hero">
        <div className="partner-v3-hero-bg"><img src="/img/hero1.png" alt="Tunisia" /></div>
        <div className="partner-v3-hero-overlay" />
        <div className="partner-v3-hero-content">
          <span className="partner-v3-badge"><span className="pv3-dot" />Our Story</span>
          <h1>Building the future of <span className="tn-grad">Tunisian travel</span></h1>
          <p className="partner-v3-hero-arabic">نبنيو مستقبل السياحة التونسية</p>
          <p className="partner-v3-hero-sub">e-Tunisia was born from a simple frustration: the most magical places in Tunisia are nowhere to be found online. We're fixing that — together.</p>
        </div>
      </section>

      {/* ── Story (problem / solution + photo) ── */}
      <section className="tn-section">
        <div className="tn-container">
          <div className="about-v3-story">
            <div className="about-v3-story-media"><img src="/img/hero3.png" alt="The real Tunisia" loading="lazy" /></div>
            <div className="about-v3-story-text">
              <h2>The problem</h2>
              <p>Existing travel platforms list the same 20 tourist spots copied from each other. The real Tunisia — the cave restaurants, the secret beaches, the family-run guesthouses, the hidden Roman ruins — stays invisible.</p>
              <p>Local businesses lose travelers to all-inclusive resorts. Travelers miss experiences they'd remember forever. Everyone loses.</p>
              <h2>Our solution</h2>
              <p>e-Tunisia is a community-driven platform where locals and travelers share the spots that don't make it into guidebooks. We verify, curate, and make them bookable — no paid placements, no fake reviews.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <div className="tn-stats">
        <Stat target={2500} label="Hidden Places" />
        <div className="tn-stat-divider" />
        <Stat target={12400} label="Travelers" />
        <div className="tn-stat-divider" />
        <Stat target={890} label="Local Hosts" />
        <div className="tn-stat-divider" />
        <Stat target={45000} label="Reviews" />
      </div>

      {/* ── Values ── */}
      <section className="tn-section">
        <div className="tn-container">
          <div className="tn-section-head">
            <span className="tn-eyebrow">What We Believe</span>
            <h2>Values that drive us.</h2>
          </div>
          <div className="tn-why-grid">
            {VALUES.map((v, i) => (
              <div className="tn-why-card" key={v.title} style={{ transitionDelay: `${i * 70}ms` }}>
                <div className="tn-why-icon" style={{ color: v.color }}><svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">{v.icon}</svg></div>
                <h3>{v.title}</h3>
                <p>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Team ── */}
      <section className="tn-section">
        <div className="tn-container">
          <div className="tn-section-head">
            <span className="tn-eyebrow">The Team</span>
            <h2>Built by Tunisians, for the world.</h2>
            <p>A youth-led project, designed and built in Sfax.</p>
          </div>
          <div className="about-v3-team">
            {TEAM.map((m, i) => (
              <div className="about-v3-team-card" key={m.name} style={{ transitionDelay: `${i * 90}ms` }}>
                <img
                  src={m.img}
                  alt={m.name}
                  loading="lazy"
                  className={m.kind === 'logo' ? 'about-v3-team-logo' : 'about-v3-team-avatar'}
                />
                <h3>{m.name}</h3>
                <span className="about-v3-team-role">{m.role}</span>
                <p>{m.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Closing CTA ── */}
      <section className="tn-cta">
        <div className="tn-cta-bg" />
        <div className="tn-cta-content">
          <h2>Be part of the <span className="tn-grad">story</span>.</h2>
          <p>Whether you're a traveler seeking adventure or a local business ready to grow, there's a place for you here.</p>
          <div className="partner-v3-hero-actions" style={{ justifyContent: 'center' }}>
            <a href="#/register" className="tn-btn-primary">Join the Community<Arrow /></a>
            <a href="#/partner" className="tn-btn-secondary">Partner With Us</a>
          </div>
          <p className="tn-cta-small">Ahlan wa Sahlan. Welcome.</p>
        </div>
      </section>
    </div>
  );
}
