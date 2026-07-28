import React, { useEffect, useRef, useState } from 'react';
import * as api from '../../api';
import { showToast } from '../../ui-utils';
import { MARKETING_STATS } from '../data/marketingStats';
import PublicMasthead from '../components/public/PublicMasthead';
import PublicFooter from '../components/public/PublicFooter';
// Ported onto the editorial carnet system (.ej-*) in Phase 2 stage 2. The old
// landing system and its always-dark canvas are gone, so this page now follows
// the app theme like every other route.
import '../../styles/landing-editorial.css';
import { Arrow, Postmark, RoundStamp } from './landing/ephemera';

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
    <div className="ej-almanac-cell" ref={ref}>
      <span className="ej-almanac-num">{val.toLocaleString()}{suffix}</span>
      <span className="ej-almanac-label">{label}</span>
    </div>
  );
}

const PRINTS = [
  { cls: 'ej-print-1', src: '/img/journey/djerba.webp', alt: 'Whitewashed courtyard of a guesthouse in Djerba', cap: 'a room worth the detour', meta: 'Djerba', eager: true },
  { cls: 'ej-print-2', src: '/img/journey/brik.webp', alt: 'A freshly fried brik served at a family table', cap: 'the table that fills up', meta: 'Tunis', eager: false },
  { cls: 'ej-print-3', src: '/img/journey/medina-tunis.webp', alt: 'Artisan workshop in the Medina of Tunis', cap: 'the craft, not the souvenir', meta: 'Medina', eager: false },
];

const BUSINESS_TYPES = [
  { img: '/img/journey/sidi-bou-said.webp', cat: 'Stay', title: 'Riads & hotels', desc: 'Fill rooms year-round with travelers seeking the real Tunisia.' },
  { img: '/img/journey/brik.webp', cat: 'Eat', title: 'Restaurants & cafés', desc: 'Put your table in front of hungry explorers, not tour buses.' },
  { img: '/img/journey/douz.webp', cat: 'Do', title: 'Tours & experiences', desc: 'Sell the desert trek, the medina walk, the dive, directly.' },
  { img: '/img/journey/medina-tunis.webp', cat: 'Make', title: 'Artisans & shops', desc: 'Show your craft to people who came to Tunisia to find it.' },
];

// Icons and the per-item accent colour were dropped in the Bled port: the
// manifesto pattern is typographic by design.
const BENEFITS = [
  { kicker: 'Nº 01', title: 'Visibility', desc: `Get discovered by ${MARKETING_STATS.travelers.display} active travelers searching for authentic Tunisian experiences, with no SEO needed.` },
  { kicker: 'Nº 02', title: 'Direct bookings', desc: 'Travelers book straight through the platform. You keep more, and our commission is lower than any competitor.' },
  { kicker: 'Nº 03', title: 'Real analytics', desc: 'Track views, bookings, revenue and customer demographics in real time. Make data-driven decisions.' },
  { kicker: 'Nº 04', title: 'Community trust', desc: 'Our verification badge signals quality. Verified partners get 3× more bookings than unverified listings.' },
];

const STEPS = [
  { n: 'Nº 01', title: 'Submit your application', desc: 'Tell us about your business. Takes under 5 minutes. No upfront costs.' },
  { n: 'Nº 02', title: 'Get verified', desc: 'Our team reviews and verifies your business within 48 hours.' },
  { n: 'Nº 03', title: 'Start earning', desc: 'Your listing goes live. Receive bookings and grow your business.' },
];

const TESTIMONIALS = [
  { pro: true, quote: 'Before e-Tunisia we relied on walk-ins and word of mouth. Now 60% of our bookings come through the platform. We hired 3 more staff and expanded our kitchen.', name: 'Hassan Trabelsi', sub: 'Owner, Dar El Medina · Tunis' },
  { pro: false, quote: 'My riad in Tozeur was empty in November. I listed it here and four bookings came through in two weeks, with no commission and no middlemen.', name: 'Amina Khelifi', sub: 'Riad owner · Tozeur' },
  { pro: false, quote: 'As a desert guide, I now reach travelers who want exactly the slow, off-grid trips I love giving. The platform actually understands.', name: 'Yasmine Ben Salah', sub: 'Local guide · Douz' },
];

const TIERS = [
  { name: 'Bronze', price: '500', featured: false, tagline: 'Perfect for small businesses', features: ['Listing on the platform', 'Basic analytics', 'Social media mention', 'Email support'] },
  { name: 'Silver', price: '2,500', featured: true, tagline: 'For growing businesses', features: ['Everything in Bronze', 'Priority placement', 'Banner advertising', 'Event co-hosting', 'Advanced analytics'] },
  { name: 'Gold', price: '7,500', featured: false, tagline: 'For established brands', features: ['Everything in Silver', 'Homepage featured', 'Dedicated account manager', 'Custom campaigns', 'API access'] },
];

const PARTNER_LOGOS = [
  { src: '/img/partenaires/OIM_Migration.png', alt: 'OIM — International Organization for Migration' },
  { src: '/img/partenaires/Logo%20SB%20ENET_Com_Color.png', alt: "ENET'Com" },
  { src: '/img/partenaires/APII.png', alt: 'APII' },
  { src: '/img/partenaires/Nafship-1_upscayl_3x_ultramix_balanced.png', alt: 'Nafship' },
  { src: '/img/partenaires/MPRR_LOGO_Draft-01__1.png', alt: 'MPRR' },
  { src: '/img/partenaires/Bussiness_Success.png', alt: 'Business Success' },
];

export default function PartnerPage() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', business: '', type: 'hotel', message: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add('is-in'); obs.unobserve(entry.target); } });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    root.querySelectorAll('.ej-reveal').forEach((el) => obs.observe(el));
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
    <div className="ej-landing ej-landing--page" ref={rootRef}>
      {!api.isLoggedIn() && <PublicMasthead />}

      {/* ── Hero — the opening spread ── */}
      <header className="ej-hero">
        <span className="ej-hero-watermark" aria-hidden="true">شركاء</span>
        <div className="ej-hero-copy">
          <p className="ej-hero-kicker">For business owners</p>
          <h1 className="ej-hero-title">Grow your business with <em>e-Tunisia.</em></h1>
          <p className="ej-hero-arabic">وصّل للسياح اللي يستاهلوك</p>
          <p className="ej-hero-sub">
            Join {MARKETING_STATS.localHosts.display} local hosts, restaurants and experience
            providers reaching {MARKETING_STATS.travelers.display} active travelers every
            month: the ones who want the real Tunisia.
          </p>
          <div className="ej-hero-actions">
            <a href="#partner-apply" className="ej-btn">Apply now, free<Arrow /></a>
            <a href="#partner-fares" className="ej-link">See the fares</a>
          </div>
          <div className="ej-hero-note">
            <span className="ej-hand">
              {MARKETING_STATS.localHosts.display} Tunisian businesses are already on the platform.
            </span>
          </div>
        </div>
        <div className="ej-hero-prints">
          {PRINTS.map((p) => (
            <figure className={`ej-print ${p.cls}`} key={p.cls}>
              <img src={p.src} alt={p.alt} loading={p.eager ? 'eager' : 'lazy'} fetchPriority={p.eager ? 'high' : undefined} />
              <figcaption>{p.cap} <span className="ej-print-meta">{p.meta}</span></figcaption>
            </figure>
          ))}
          <RoundStamp idSuffix="-partner" />
        </div>
      </header>

      {/* ── Almanac ── */}
      <section className="ej-almanac" aria-label="Platform numbers">
        <div className="ej-almanac-grid">
          <Stat target={MARKETING_STATS.localHosts.value} suffix={MARKETING_STATS.localHosts.suffix} label="Active partners" />
          <Stat target={MARKETING_STATS.travelers.value} suffix={MARKETING_STATS.travelers.suffix} label="Monthly travelers" />
          <Stat target={MARKETING_STATS.monthlyBookings.value} suffix={MARKETING_STATS.monthlyBookings.suffix} label="Monthly bookings" />
          <Stat target={MARKETING_STATS.partnerSatisfaction.value} suffix={MARKETING_STATS.partnerSatisfaction.suffix} label="Partner satisfaction" />
        </div>
        <div className="ej-almanac-footnote">
          <span className="ej-hand">counted by hand — no inflated numbers here.</span>
        </div>
      </section>

      {/* ── Why partner ── */}
      <section className="ej-section ej-manifesto">
        <div className="ej-section-head">
          <p className="ej-kicker"><span className="ej-no">Nº 01</span> Why partner with us</p>
          <h2 className="ej-h2">Everything you need <em>to succeed.</em></h2>
          <p className="ej-lede">No paid placements. No tourist traps. Just travelers looking for exactly what you offer.</p>
        </div>
        <div className="ej-manifesto-cols ej-manifesto-cols--4">
          {BENEFITS.map((b) => (
            <div className="ej-manifesto-col ej-reveal" key={b.title}>
              <h3>{b.kicker} · {b.title}</h3>
              <p>{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Who is growing with us ── */}
      <section className="ej-section">
        <div className="ej-section-head">
          <p className="ej-kicker"><span className="ej-no">Nº 02</span> Who is growing with us</p>
          <h2 className="ej-h2">Whatever you do, there is a traveler <em>looking for you.</em></h2>
          <p className="ej-lede">Hotels, riads, restaurants, guides, artisans. List it, and let the right travelers find it.</p>
        </div>
        <div className="ej-index-grid ej-index-grid--4">
          {BUSINESS_TYPES.map((t, i) => (
            <a className="ej-place ej-reveal" href="#partner-apply" key={t.title}>
              <div className="ej-place-img">
                <img src={t.img} alt={t.title} loading="lazy" />
                <span className="ej-place-cat">{t.cat}</span>
              </div>
              <div className="ej-place-body">
                <span className="ej-place-no">Nº {String(i + 1).padStart(2, '0')}</span>
                <h4>{t.title}</h4>
                <p>{t.desc}</p>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="ej-section ej-manifesto">
        <div className="ej-section-head">
          <p className="ej-kicker"><span className="ej-no">Nº 03</span> How it works</p>
          <h2 className="ej-h2">Start receiving bookings <em>in three steps.</em></h2>
        </div>
        <div className="ej-manifesto-cols">
          {STEPS.map((s) => (
            <div className="ej-manifesto-col ej-reveal" key={s.n}>
              <h3>{s.n} · {s.title}</h3>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Postcards from partners ── */}
      <section className="ej-section">
        <div className="ej-section-head">
          <p className="ej-kicker"><span className="ej-no">Nº 04</span> From our partners</p>
          <h2 className="ej-h2">Businesses, in their <em>own words.</em></h2>
        </div>
        <div className="ej-postcards">
          {TESTIMONIALS.map((t) => (
            <article className={`ej-postcard ej-reveal${t.pro ? ' is-pro' : ''}`} key={t.name}>
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

      {/* ── Fares ── */}
      <section className="ej-section" id="partner-fares">
        <div className="ej-section-head">
          <p className="ej-kicker"><span className="ej-no">Nº 05</span> Fair fares</p>
          <h2 className="ej-h2">Partnership tiers that <em>scale with you.</em></h2>
          <p className="ej-lede">No upfront payment for Bronze. Cancel anytime.</p>
        </div>
        <div className="ej-fares">
          {TIERS.map((tier) => (
            <div className={`ej-fare${tier.featured ? ' ej-fare--featured' : ''}`} key={tier.name}>
              {tier.featured && <span className="ej-fare-loved">Most loved</span>}
              <div className="ej-fare-name">{tier.name}</div>
              <div className="ej-fare-price">{tier.price}<span>TND / year</span></div>
              <p className="ej-fare-tagline">{tier.tagline}</p>
              <ul className="ej-fare-features">
                {tier.features.map((f) => <li key={f}>{f}</li>)}
              </ul>
              <a href="#partner-apply" className={tier.featured ? 'ej-btn' : 'ej-btn-ghost'}>Choose {tier.name}</a>
            </div>
          ))}
        </div>
      </section>

      {/* ── The letter — application ── */}
      <section className="ej-section" id="partner-apply">
        <div className="ej-letter">
          <div>
            <p className="ej-kicker"><span className="ej-no">Nº 06</span> Apply now</p>
            <h2 className="ej-h2">Ready to grow <em>your business?</em></h2>
            <p className="ej-letter-arabic">انضمّ لينا اليوم</p>
            <p className="ej-lede">
              Fill out the form and our partnerships team will get back to you within
              48 hours. No commitment required.
            </p>
            <ul className="ej-letter-benefits">
              <li><span className="ej-tick" aria-hidden="true">✓</span> Free to apply</li>
              <li><span className="ej-tick" aria-hidden="true">✓</span> 48-hour verification</li>
              <li><span className="ej-tick" aria-hidden="true">✓</span> No upfront payment for Bronze</li>
              <li><span className="ej-tick" aria-hidden="true">✓</span> Cancel anytime</li>
            </ul>
          </div>
          <form className="ej-letter-form" onSubmit={submit}>
            <div className="ej-letter-form-head"><span>Partner application</span><span>no commission, ever</span></div>
            <div className="ej-field">
              <label htmlFor="p-name">Full name</label>
              <input type="text" id="p-name" className="ej-input" placeholder="Your full name" required value={form.name} onChange={set('name')} autoComplete="name" />
            </div>
            <div className="ej-field">
              <label htmlFor="p-business">Business name</label>
              <input type="text" id="p-business" className="ej-input" placeholder="Your business or organization" value={form.business} onChange={set('business')} autoComplete="organization" />
            </div>
            <div className="ej-field">
              <label htmlFor="p-email">Email</label>
              <input type="email" id="p-email" className="ej-input" placeholder="you@business.com" required value={form.email} onChange={set('email')} autoComplete="email" />
            </div>
            <div className="ej-field">
              <label htmlFor="p-phone">Phone</label>
              <input type="tel" id="p-phone" className="ej-input" placeholder="+216 XX XXX XXX" value={form.phone} onChange={set('phone')} autoComplete="tel" />
            </div>
            <div className="ej-field">
              <label htmlFor="p-type">Business type</label>
              <select id="p-type" className="ej-input" value={form.type} onChange={set('type')}>
                <option value="hotel">Hotel / Riad</option>
                <option value="restaurant">Restaurant / Café</option>
                <option value="tour">Tour guide / Experience</option>
                <option value="artisan">Artisan / Shop</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="ej-field">
              <label htmlFor="p-message">Message</label>
              <textarea id="p-message" className="ej-input" rows={4} placeholder="Tell us about your partnership goals…" required value={form.message} onChange={set('message')} />
            </div>
            <button type="submit" className="ej-btn" disabled={submitting}>{submitting ? 'Sending…' : 'Submit application'}</button>
          </form>
        </div>
      </section>

      {/* ── Colophon strip ── */}
      <section className="ej-partners" aria-label="Partner organizations">
        <div className="ej-partners-inner">
          <p className="ej-partners-title">In good company — partners &amp; supporters</p>
          <p className="ej-partners-lede">
            We collaborate with forward-thinking institutions, NGOs and businesses committed
            to elevating Tunisian tourism and empowering local communities.
          </p>
          <div className="ej-partners-row">
            {PARTNER_LOGOS.map((l) => <img key={l.src} src={l.src} alt={l.alt} loading="lazy" />)}
          </div>
        </div>
      </section>

      {/* ── Final call ── */}
      <section className="ej-cta">
        <div className="ej-cta-inner">
          <RoundStamp idSuffix="-partner-cta" />
          <h2>Your <em>best customers</em> are already here.</h2>
          <p className="ej-cta-arabic">أهلا وسهلا</p>
          <div className="ej-hero-actions" style={{ justifyContent: 'center' }}>
            <a href="#partner-apply" className="ej-btn">Apply now, free<Arrow size={20} /></a>
          </div>
          <span className="ej-cta-note">
            <span className="ej-hand">
              {MARKETING_STATS.travelers.display} travelers are looking this month. Be the one they find.
            </span>
          </span>
        </div>
      </section>

      {!api.isLoggedIn() && <PublicFooter />}
    </div>
  );
}
