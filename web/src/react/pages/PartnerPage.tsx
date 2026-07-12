import React, { useEffect, useRef, useState } from 'react';
import * as api from '../../api';
import { showToast } from '../../ui-utils';
import { MARKETING_STATS } from '../data/marketingStats';
import PublicMasthead from '../components/public/PublicMasthead';
import PublicFooter from '../components/public/PublicFooter';
// PartnerPage is a lazy-loaded island; the tn-*/partner-v3-* classes it renders
// live in landing.css, which only HeroPage imported. Without this a deep link to
// #/partner loads the page unstyled.
import '../../styles/landing.css';

// Rebuilt on the .tn-landing design system so the partner page shares the
// landing page's cinematic, photo-driven vibe: a Ken-Burns photo hero, count-up
// stats, a photo "inspiration" gallery of business types, partner testimonials,
// tiers, the real partner-logo wall, and an application form.

const Arrow = ({ size = 18 }: { size?: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>;
const Check = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>;

// Count-up stat that fires when scrolled into view.
function Stat({ target, suffix = '', label }: { target: number; suffix?: string; label: string }) {
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

const BUSINESS_TYPES = [
  { img: '/img/hero1.png', title: 'Riads & Hotels', desc: 'Fill rooms year-round with travelers seeking the real Tunisia.' },
  { img: '/img/hero2.png', title: 'Restaurants & Cafés', desc: 'Put your table in front of hungry explorers, not tour buses.' },
  { img: '/img/hero3.png', title: 'Tours & Experiences', desc: 'Sell the desert trek, the medina walk, the dive — directly.' },
  { img: '/img/hero1.png', title: 'Artisans & Shops', desc: 'Show your craft to people who came to Tunisia to find it.' },
];

const BENEFITS = [
  { title: 'Massive Visibility', desc: `Get discovered by ${MARKETING_STATS.travelers.display} active travelers searching for authentic Tunisian experiences - no SEO needed.`, icon: <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></> },
  { title: 'Direct Bookings', desc: 'Travelers book straight through the platform. You keep more — our commission is lower than any competitor.', icon: <><rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" /></> },
  { title: 'Real Analytics', desc: 'Track views, bookings, revenue and customer demographics in real time. Make data-driven decisions.', icon: <><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></> },
  { title: 'Community Trust', desc: 'Our verification badge signals quality. Verified partners get 3× more bookings than unverified listings.', icon: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /> },
];

const STEPS = [
  { n: 1, title: 'Submit your application', desc: 'Tell us about your business. Takes under 5 minutes. No upfront costs.' },
  { n: 2, title: 'Get verified', desc: 'Our team reviews and verifies your business within 48 hours.' },
  { n: 3, title: 'Start earning', desc: 'Your listing goes live. Receive bookings and grow your business.' },
];

const TESTIMONIALS = [
  { pro: true, quote: '"Before e-Tunisia we relied on walk-ins and word of mouth. Now 60% of our bookings come through the platform. We hired 3 more staff and expanded our kitchen."', seed: 'hassan', name: 'Hassan Trabelsi', sub: 'Owner, Dar El Medina · Tunis' },
  { pro: false, quote: '"My riad in Tozeur was empty in November. I listed it here and four bookings came through in two weeks — no commission, no middlemen."', seed: 'amina', name: 'Amina Khelifi', sub: 'Riad owner · Tozeur' },
  { pro: false, quote: '"As a desert guide, I now reach travelers who want exactly the slow, off-grid trips I love giving. The platform actually understands."', seed: 'yasmine', name: 'Yasmine Ben Salah', sub: 'Local guide · Douz' },
];

const TIERS = [
  { name: 'Bronze', price: '500', popular: false, desc: 'Perfect for small businesses', features: ['Listing on the platform', 'Basic analytics', 'Social media mention', 'Email support'] },
  { name: 'Silver', price: '2,500', popular: true, desc: 'For growing businesses', features: ['Everything in Bronze', 'Priority placement', 'Banner advertising', 'Event co-hosting', 'Advanced analytics'] },
  { name: 'Gold', price: '7,500', popular: false, desc: 'For established brands', features: ['Everything in Silver', 'Homepage featured', 'Dedicated account manager', 'Custom campaigns', 'API access'] },
];

const PARTNER_LOGOS = [
  { src: '/img/partenaires/OIM_Migration.png', alt: 'OIM — International Organization for Migration' },
  { src: '/img/partenaires/Logo%20SB%20ENET_Com_Color.png', alt: "ENET'Com" },
  { src: '/img/partenaires/APII.png', alt: "APII" },
  { src: '/img/partenaires/Nafship-1_upscayl_3x_ultramix_balanced.png', alt: 'Nafship' },
  { src: '/img/partenaires/MPRR_LOGO_Draft-01__1.png', alt: 'MPRR' },
  { src: '/img/partenaires/Bussiness_Success.png', alt: 'Business Success' },
];

export default function PartnerPage() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', business: '', type: 'hotel', message: '' });
  const [submitting, setSubmitting] = useState(false);

  // Scroll-reveal — the tn-* cards start hidden and animate in on view.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add('tn-revealed'); obs.unobserve(entry.target); } });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    root.querySelectorAll('.tn-why-card, .tn-testimonial, .tn-logo-card, .partner-v3-tile').forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = form.name.trim(), email = form.email.trim(), message = form.message.trim();
    if (!name || !email || !message) return;
    setSubmitting(true);
    try {
      await api.submitContactForm({ name, email, phone: form.phone.trim(), businessName: form.business.trim(), type: form.type, message });
      showToast("Application submitted! We'll be in touch within 48 hours.");
      setForm({ name: '', email: '', phone: '', business: '', type: 'hotel', message: '' });
    } catch (err: any) {
      showToast(`Couldn't submit: ${err?.message || 'network error'}. Email support@etunisia.com and we'll follow up.`, { type: 'error' });
    }
    setSubmitting(false);
  };

  return (
    <div className="tn-landing partner-v3" ref={rootRef}>
      {!api.isLoggedIn() && <PublicMasthead />}
      {/* ── Hero ── */}
      <section className="partner-v3-hero">
        <div className="partner-v3-hero-bg"><img src="/img/hero2.png" alt="Tunisia" /></div>
        <div className="partner-v3-hero-overlay" />
        <div className="partner-v3-hero-content">
          <span className="partner-v3-badge"><span className="pv3-dot" />For Businesses</span>
          <h1>Grow your business with <span className="tn-grad">e-Tunisia</span></h1>
          <p className="partner-v3-hero-arabic">وصّل للسياح اللي يستاهلوك</p>
          <p className="partner-v3-hero-sub">Join {MARKETING_STATS.localHosts.display} local hosts, restaurants and experience providers reaching {MARKETING_STATS.travelers.display} active travelers every month - the ones who want the real Tunisia.</p>
          <div className="partner-v3-hero-actions">
            <a href="#partner-apply" className="tn-btn-primary">Apply Now — Free<Arrow /></a>
            <a href="#partner-tiers" className="tn-btn-secondary">View Pricing</a>
          </div>
          <div className="partner-v3-hero-meta">
            <span className="pv3-avatars" aria-hidden="true">
              <img src="https://api.dicebear.com/9.x/personas/svg?seed=hassan" alt="" loading="lazy" />
              <img src="https://api.dicebear.com/9.x/personas/svg?seed=amina" alt="" loading="lazy" />
              <img src="https://api.dicebear.com/9.x/personas/svg?seed=karim" alt="" loading="lazy" />
              <img src="https://api.dicebear.com/9.x/personas/svg?seed=leila" alt="" loading="lazy" />
            </span>
            <span>Join <strong>{MARKETING_STATS.localHosts.display}</strong> Tunisian businesses already growing</span>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <div className="tn-stats">
        <Stat target={MARKETING_STATS.localHosts.value} suffix={MARKETING_STATS.localHosts.suffix} label="Active Partners" />
        <div className="tn-stat-divider" />
        <Stat target={MARKETING_STATS.travelers.value} suffix={MARKETING_STATS.travelers.suffix} label="Monthly Travelers" />
        <div className="tn-stat-divider" />
        <Stat target={MARKETING_STATS.monthlyBookings.value} suffix={MARKETING_STATS.monthlyBookings.suffix} label="Monthly Bookings" />
        <div className="tn-stat-divider" />
        <Stat target={MARKETING_STATS.partnerSatisfaction.value} suffix={MARKETING_STATS.partnerSatisfaction.suffix} label="Partner Satisfaction" />
      </div>

      {/* ── Why partner ── */}
      <section className="tn-section">
        <div className="tn-container">
          <div className="tn-section-head">
            <span className="tn-eyebrow">Why Partner With Us</span>
            <h2>Everything you need to succeed.</h2>
            <p>No paid placements. No tourist traps. Just travelers looking for exactly what you offer.</p>
          </div>
          <div className="tn-why-grid">
            {BENEFITS.map((b, i) => (
              <div className="tn-why-card" key={b.title} style={{ transitionDelay: `${i * 70}ms` }}>
                <div className="tn-why-icon"><svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">{b.icon}</svg></div>
                <h3>{b.title}</h3>
                <p>{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Inspiration gallery ── */}
      <section className="tn-section">
        <div className="tn-container">
          <div className="tn-section-head">
            <span className="tn-eyebrow">Who's Growing With Us</span>
            <h2>Whatever you do, there's a traveler looking for you.</h2>
            <p>Hotels, riads, restaurants, guides, artisans — list it, and let the right travelers find it.</p>
          </div>
          <div className="partner-v3-gallery">
            {BUSINESS_TYPES.map((t, i) => (
              <a key={i} className="partner-v3-tile" href="#partner-apply" style={{ transitionDelay: `${i * 0.06}s` }}>
                <img src={t.img} alt={t.title} loading="lazy" />
                <span className="partner-v3-tile-overlay" />
                <div className="partner-v3-tile-body"><h4>{t.title}</h4><p>{t.desc}</p></div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="tn-section">
        <div className="tn-container">
          <div className="tn-section-head">
            <span className="tn-eyebrow">How It Works</span>
            <h2>Start receiving bookings in 3 steps.</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
            {STEPS.map((s) => (
              <div className="tn-why-card" key={s.n}>
                <span className="partner-v3-step-num">{s.n}</span>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="tn-section">
        <div className="tn-container">
          <div className="tn-section-head">
            <span className="tn-eyebrow">From Our Partners</span>
            <h2>Businesses, in their own words.</h2>
          </div>
          <div className="tn-testimonials">
            {TESTIMONIALS.map((t, i) => (
              <article key={t.seed} className={`tn-testimonial${t.pro ? ' is-pro' : ''}`} style={{ transitionDelay: `${i * 0.05}s` }}>
                <p className="tn-testimonial-quote">{t.quote}</p>
                <div className="tn-testimonial-user">
                  <img src={`https://api.dicebear.com/9.x/personas/svg?seed=${t.seed}`} alt={t.name} loading="lazy" />
                  <div><strong>{t.name}</strong><span>{t.sub}</span></div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing tiers ── */}
      <section className="tn-section" id="partner-tiers">
        <div className="tn-container">
          <div className="tn-section-head">
            <span className="tn-eyebrow">Pricing</span>
            <h2>Partnership tiers that scale with you.</h2>
            <p>No upfront payment for Bronze. Cancel anytime.</p>
          </div>
          <div className="tn-pricing-grid">
            {TIERS.map((tier) => (
              <div key={tier.name} className={`tn-pricing-card${tier.popular ? ' tn-pricing-popular' : ''}`}>
                {tier.popular && <div className="tn-pricing-badge">Most Popular</div>}
                <div className="tn-pricing-name">{tier.name}</div>
                <div className="tn-pricing-price">{tier.price} <span>TND/yr</span></div>
                <p className="tn-pricing-desc">{tier.desc}</p>
                <ul className="tn-pricing-features">
                  {tier.features.map((f, i) => <li key={i}><Check /> {f}</li>)}
                </ul>
                <a href="#partner-apply" className={tier.popular ? 'tn-btn-primary' : 'tn-btn-outline'} style={{ width: '100%', justifyContent: 'center' }}>
                  Choose {tier.name}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Partner logo wall ── */}
      <section className="tn-section tn-logos-section">
        <div className="tn-container">
          <div className="tn-logos-stack">
            <div className="tn-logos-header">
              <h2 className="tn-logos-heading">In good company.</h2>
              <p className="tn-logos-description">We collaborate with forward-thinking institutions, NGOs and businesses committed to elevating Tunisian tourism and empowering local communities.</p>
            </div>
            <div className="tn-logos-grid">
              {PARTNER_LOGOS.map((l, i) => (
                <div className="tn-logo-card" key={l.src} style={{ transitionDelay: `${i * 0.08}s` }}><img src={l.src} alt={l.alt} /></div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Apply form ── */}
      <section className="tn-section tn-partner-cta" id="partner-apply">
        <div className="tn-partner-cta-bg" />
        <div className="tn-container">
          <div className="tn-partner-cta-grid">
            <div className="tn-partner-cta-text">
              <span className="tn-eyebrow">Apply Now</span>
              <h2>Ready to grow your business?</h2>
              <p className="tn-partner-cta-arabic">انضمّ لينا اليوم</p>
              <p className="tn-partner-cta-desc">Fill out the form and our partnerships team will get back to you within 48 hours. No commitment required.</p>
              <div className="tn-partner-cta-benefits">
                <span><Check /> Free to apply</span>
                <span><Check /> 48-hour verification</span>
                <span><Check /> No upfront payment for Bronze</span>
                <span><Check /> Cancel anytime</span>
              </div>
            </div>
            <div className="tn-partner-cta-formwrap">
              <form className="tn-partner-cta-form" onSubmit={submit}>
                <div className="tn-auth-field"><label htmlFor="p-name">Full Name</label><input type="text" id="p-name" className="tn-auth-input" placeholder="Your full name" required value={form.name} onChange={set('name')} /></div>
                <div className="tn-auth-field"><label htmlFor="p-business">Business Name</label><input type="text" id="p-business" className="tn-auth-input" placeholder="Your business or organization" value={form.business} onChange={set('business')} /></div>
                <div className="tn-auth-field"><label htmlFor="p-email">Email</label><input type="email" id="p-email" className="tn-auth-input" placeholder="you@business.com" required value={form.email} onChange={set('email')} /></div>
                <div className="tn-auth-field"><label htmlFor="p-phone">Phone</label><input type="tel" id="p-phone" className="tn-auth-input" placeholder="+216 XX XXX XXX" value={form.phone} onChange={set('phone')} /></div>
                <div className="tn-auth-field"><label htmlFor="p-type">Business Type</label>
                  <select id="p-type" className="tn-auth-input" value={form.type} onChange={set('type')}>
                    <option value="hotel">Hotel / Riad</option>
                    <option value="restaurant">Restaurant / Café</option>
                    <option value="tour">Tour Guide / Experience</option>
                    <option value="artisan">Artisan / Shop</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="tn-auth-field"><label htmlFor="p-message">Message</label><textarea id="p-message" className="tn-auth-input" rows={4} placeholder="Tell us about your partnership goals…" required value={form.message} onChange={set('message')} /></div>
                <button type="submit" className="tn-auth-btn" disabled={submitting}>{submitting ? 'Submitting…' : 'Submit Application'}</button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* ── Closing CTA ── */}
      <section className="tn-cta">
        <div className="tn-cta-bg" />
        <div className="tn-cta-content">
          <h2>Your <span className="tn-grad">best customers</span> are already here.</h2>
          <p>{MARKETING_STATS.travelers.display} travelers are looking for authentic Tunisian places, food and experiences this month. Be the one they find.</p>
          <a href="#partner-apply" className="tn-btn-primary tn-btn-large">Apply Now — Free<Arrow size={20} /></a>
          <p className="tn-cta-small">Ahlan wa Sahlan. Welcome aboard.</p>
        </div>
      </section>
      {!api.isLoggedIn() && <PublicFooter />}
    </div>
  );
}
