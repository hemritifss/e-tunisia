import React, { useEffect, useRef, useState } from 'react';

// Migrated from vanilla pages/about.ts — static brand story + count-up stats + scroll reveal.

function AnimatedStat({ target, label }: { target: number; label: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [val, setVal] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          let current = 0;
          const increment = target / 60;
          const timer = setInterval(() => {
            current += increment;
            if (current >= target) { current = target; clearInterval(timer); setDone(true); }
            setVal(Math.floor(current));
          }, 16);
          obs.unobserve(el);
        }
      });
    }, { threshold: 0.5 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [target]);

  return <span ref={ref} className="about-stat-num">{val.toLocaleString()}{done ? '+' : ''}</span>;
}

export default function AboutPage() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const els = root.querySelectorAll('.about-value-card, .about-team-card, .about-story-text');
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { entry.target.classList.add('hero2-revealed'); obs.unobserve(entry.target); }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  return (
    <div className="about-page page-enter" ref={rootRef}>
      <section className="about-hero">
        <div className="about-hero-bg" />
        <div className="about-hero-content">
          <span className="about-eyebrow">Our Story</span>
          <h1>We're Building the Future of <span className="about-accent">Tunisian Travel</span></h1>
          <p>e-Tunisia was born from a simple frustration: the most magical places in Tunisia are nowhere to be found online. We're fixing that.</p>
        </div>
      </section>

      <section className="about-section">
        <div className="about-container">
          <div className="about-story-grid">
            <div className="about-story-text">
              <h2>The Problem</h2>
              <p>Existing travel platforms list the same 20 tourist spots copied from each other. The real Tunisia — the cave restaurants, the secret beaches, the family-run guesthouses, the hidden Roman ruins — stays invisible.</p>
              <p>Local businesses lose tourists to all-inclusive resorts. Travelers miss experiences they'll remember forever. Everyone loses.</p>
            </div>
            <div className="about-story-text">
              <h2>Our Solution</h2>
              <p>e-Tunisia is a community-driven platform where locals and travelers share the spots that don't make it into guidebooks. We verify, curate, and make them bookable.</p>
              <p>Every place, tip, and itinerary is tested by real people. No paid placements. No fake reviews. Just authentic Tunisia.</p>
            </div>
          </div>
        </div>
      </section>

      <div className="about-stats">
        <div className="about-stat-item"><AnimatedStat target={2500} label="Hidden Places" /><span className="about-stat-label">Hidden Places</span></div>
        <div className="about-stat-divider" />
        <div className="about-stat-item"><AnimatedStat target={12400} label="Travelers" /><span className="about-stat-label">Travelers</span></div>
        <div className="about-stat-divider" />
        <div className="about-stat-item"><AnimatedStat target={890} label="Local Hosts" /><span className="about-stat-label">Local Hosts</span></div>
        <div className="about-stat-divider" />
        <div className="about-stat-item"><AnimatedStat target={45000} label="Reviews" /><span className="about-stat-label">Reviews</span></div>
      </div>

      <section className="about-section">
        <div className="about-container">
          <div className="about-section-header">
            <span className="about-eyebrow">What We Believe</span>
            <h2>Values that drive us</h2>
          </div>
          <div className="about-values-grid">
            <div className="about-value-card">
              <div className="about-value-icon" style={{ color: 'var(--coral)' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></svg>
              </div>
              <h3>Community-Driven</h3>
              <p>Real travelers, real locals, real experiences. Our community curates everything. No corporate editorial team deciding what's worth seeing.</p>
            </div>
            <div className="about-value-card">
              <div className="about-value-icon" style={{ color: 'var(--olive)' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
              </div>
              <h3>Support Local</h3>
              <p>We prioritize family-run businesses, artisans, and independent hosts. Every booking directly supports Tunisian entrepreneurs.</p>
            </div>
            <div className="about-value-card">
              <div className="about-value-icon" style={{ color: 'var(--mediterranean)' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="currentColor" stroke="none" /></svg>
              </div>
              <h3>Authentic Experiences</h3>
              <p>No tourist traps, no paid placements. Every recommendation is tested and verified by our community of explorers.</p>
            </div>
            <div className="about-value-card">
              <div className="about-value-icon" style={{ color: 'var(--gold)' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z" /></svg>
              </div>
              <h3>Sustainable Tourism</h3>
              <p>We promote responsible travel that preserves Tunisia's natural beauty and cultural heritage for future generations.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="about-section">
        <div className="about-container">
          <div className="about-section-header">
            <span className="about-eyebrow">The Team</span>
            <h2>Built by Tunisians, for the world</h2>
          </div>
          <div className="about-team-grid">
            <div className="about-team-card">
              <img src="https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&h=200&fit=crop&crop=face" alt="Founder" />
              <h3>Ahmed Ben Ali</h3>
              <span>Founder &amp; CEO</span>
              <p>Former tour guide turned tech entrepreneur. 10+ years showing travelers the real Tunisia.</p>
            </div>
            <div className="about-team-card">
              <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop&crop=face" alt="CTO" />
              <h3>Sarah Khelil</h3>
              <span>Co-Founder &amp; CTO</span>
              <p>Full-stack engineer passionate about building products that connect people and places.</p>
            </div>
            <div className="about-team-card">
              <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face" alt="Head of Community" />
              <h3>Karim Ferchichi</h3>
              <span>Head of Community</span>
              <p>Travel blogger with 500K followers. Knows every hidden corner of Tunisia.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="about-cta">
        <div className="about-cta-bg" />
        <div className="about-cta-content">
          <h2>Be part of the story.</h2>
          <p>Whether you're a traveler seeking adventure or a local business ready to grow, there's a place for you here.</p>
          <div className="about-cta-actions">
            <a href="#/register" className="hero2-btn-cta">Join the Community</a>
            <a href="#/partner" className="hero2-pricing-btn hero2-pricing-btn-outline">Partner With Us</a>
          </div>
        </div>
      </section>
    </div>
  );
}
