import React, { useEffect, useRef, useState } from 'react';
import * as api from '../../api';
import { showToast } from '../../ui-utils';

// Migrated from vanilla pages/partner.ts — B2B landing + contact form + count-up stats.
// Note: vanilla appended the suffix to the number AND rendered a separate suffix span
// (double "45KK"); fixed here — number counts plain, the suffix span supplies K/%.

function Check({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>;
}
function Star() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>;
}

function AnimatedStat({ target, append = '' }: { target: number; append?: string }) {
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
  return <span ref={ref} className="hero2-stat-num">{val.toLocaleString()}{done ? append : ''}</span>;
}

const TYPES = [
  { key: 'sponsor', label: 'Sponsor' },
  { key: 'partner', label: 'Partner' },
  { key: 'advertiser', label: 'Advertiser' },
];

export default function PartnerPage() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [type, setType] = useState('sponsor');
  const [form, setForm] = useState({ name: '', email: '', phone: '', business: '', message: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const els = root.querySelectorAll('.partner2-benefit-card, .hero2-step');
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { entry.target.classList.add('hero2-revealed'); obs.unobserve(entry.target); }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = form.name.trim(), email = form.email.trim(), message = form.message.trim();
    if (!name || !email || !message) return;
    setSubmitting(true);
    try {
      await api.submitContactForm({ name, email, phone: form.phone.trim(), businessName: form.business.trim(), type, message });
      showToast("Application submitted! We'll be in touch within 48 hours.");
      setForm({ name: '', email: '', phone: '', business: '', message: '' });
    } catch (err: any) {
      showToast(`Couldn't submit: ${err?.message || 'network error'}. Email support@etunisia.com and we'll follow up.`, { type: 'error' });
    }
    setSubmitting(false);
  };

  return (
    <div className="partner-page page-enter" ref={rootRef}>
      <section className="partner2-hero">
        <div className="partner2-hero-bg" />
        <div className="partner2-hero-content">
          <span className="partner2-eyebrow">For Businesses</span>
          <h1>Grow Your Business with <span className="partner2-accent">e-Tunisia</span></h1>
          <p>Join 890+ local hosts, restaurants, and experience providers reaching 12,400+ active travelers every month.</p>
          <div className="partner2-hero-actions">
            <a href="#partner-apply" className="hero2-btn-cta">Apply Now</a>
            <a href="#partner-tiers" className="hero2-btn-video">View Pricing</a>
          </div>
        </div>
      </section>

      <div className="hero2-stats-bar">
        <div className="hero2-stat-item"><AnimatedStat target={890} append="+" /><span className="hero2-stat-label">Active Partners</span></div>
        <div className="hero2-stat-divider" />
        <div className="hero2-stat-item"><AnimatedStat target={12400} append="+" /><span className="hero2-stat-label">Monthly Travelers</span></div>
        <div className="hero2-stat-divider" />
        <div className="hero2-stat-item"><AnimatedStat target={45} /><span className="hero2-stat-suffix">K</span><span className="hero2-stat-label">Monthly Bookings</span></div>
        <div className="hero2-stat-divider" />
        <div className="hero2-stat-item"><AnimatedStat target={98} /><span className="hero2-stat-suffix">%</span><span className="hero2-stat-label">Partner Satisfaction</span></div>
      </div>

      <section className="partner2-section">
        <div className="hero2-container">
          <div className="hero2-section-header">
            <span className="hero2-section-eyebrow">Why Partner With Us</span>
            <h2 className="hero2-section-title">Everything you need to succeed.</h2>
          </div>
          <div className="partner2-benefits-grid">
            <div className="partner2-benefit-card">
              <div className="partner2-benefit-icon"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg></div>
              <h3>Massive Visibility</h3>
              <p>Get discovered by 12,400+ active travelers searching for authentic Tunisian experiences. No SEO needed.</p>
            </div>
            <div className="partner2-benefit-card">
              <div className="partner2-benefit-icon"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg></div>
              <h3>Direct Bookings</h3>
              <p>Travelers book directly through our platform. You keep more of what you earn — our commission is lower than any competitor.</p>
            </div>
            <div className="partner2-benefit-card">
              <div className="partner2-benefit-icon"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg></div>
              <h3>Real Analytics</h3>
              <p>Track views, bookings, revenue, and customer demographics in real-time. Make data-driven decisions.</p>
            </div>
            <div className="partner2-benefit-card">
              <div className="partner2-benefit-icon"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg></div>
              <h3>Community Trust</h3>
              <p>Our verification badge signals quality to travelers. Verified partners get 3x more bookings than unverified listings.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="partner2-section">
        <div className="hero2-container">
          <div className="hero2-section-header">
            <span className="hero2-section-eyebrow">How It Works</span>
            <h2 className="hero2-section-title">Start receiving bookings in 3 steps.</h2>
          </div>
          <div className="hero2-steps-grid">
            <div className="hero2-step">
              <div className="hero2-step-icon"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg></div>
              <h3>Submit Application</h3>
              <p>Tell us about your business. Takes less than 5 minutes. No upfront costs.</p>
            </div>
            <div className="hero2-step-arrow"><svg width="40" height="24" viewBox="0 0 40 24" fill="none"><path d="M2 12h30M28 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg></div>
            <div className="hero2-step">
              <div className="hero2-step-icon"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg></div>
              <h3>Get Verified</h3>
              <p>Our team reviews your application and verifies your business within 48 hours.</p>
            </div>
            <div className="hero2-step-arrow"><svg width="40" height="24" viewBox="0 0 40 24" fill="none"><path d="M2 12h30M28 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg></div>
            <div className="hero2-step">
              <div className="hero2-step-icon"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" /></svg></div>
              <h3>Start Earning</h3>
              <p>Your listing goes live. Start receiving bookings and growing your business.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="partner2-section">
        <div className="hero2-container">
          <div className="hero2-proof-card hero2-proof-featured" style={{ maxWidth: 700, margin: '0 auto' }}>
            <div className="hero2-proof-stars" aria-label="5 out of 5 stars"><Star /><Star /><Star /><Star /><Star /></div>
            <p className="hero2-proof-text" style={{ fontSize: '1.125rem' }}>"Before e-Tunisia, we relied on walk-ins and word of mouth. Now 60% of our bookings come through the platform. We've hired 3 more staff and expanded our kitchen. This changed our business."</p>
            <div className="hero2-proof-author">
              <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face" alt="Hassan" />
              <div><strong>Hassan Trabelsi</strong><span>Owner, Dar El Medina — Tunis</span></div>
            </div>
          </div>
        </div>
      </section>

      <section className="partner2-section" id="partner-tiers">
        <div className="hero2-container">
          <div className="hero2-section-header">
            <span className="hero2-section-eyebrow">Pricing</span>
            <h2 className="hero2-section-title">Partnership tiers that scale with you.</h2>
          </div>
          <div className="hero2-pricing-grid" style={{ maxWidth: 900 }}>
            <div className="hero2-pricing-card">
              <div className="hero2-pricing-name">Bronze</div>
              <div className="hero2-pricing-price">500 <span>TND/yr</span></div>
              <p className="hero2-pricing-desc">Perfect for small businesses</p>
              <ul className="hero2-pricing-features">
                <li><Check /> Listing on platform</li>
                <li><Check /> Basic analytics</li>
                <li><Check /> Social media mention</li>
                <li><Check /> Email support</li>
              </ul>
            </div>
            <div className="hero2-pricing-card hero2-pricing-popular">
              <div className="hero2-pricing-badge">Most Popular</div>
              <div className="hero2-pricing-name">Silver</div>
              <div className="hero2-pricing-price">2,500 <span>TND/yr</span></div>
              <p className="hero2-pricing-desc">For growing businesses</p>
              <ul className="hero2-pricing-features">
                <li><Check /> Everything in Bronze</li>
                <li><Check /> Priority placement</li>
                <li><Check /> Banner advertising</li>
                <li><Check /> Event co-hosting</li>
                <li><Check /> Advanced analytics</li>
              </ul>
            </div>
            <div className="hero2-pricing-card">
              <div className="hero2-pricing-name">Gold</div>
              <div className="hero2-pricing-price">7,500 <span>TND/yr</span></div>
              <p className="hero2-pricing-desc">For established brands</p>
              <ul className="hero2-pricing-features">
                <li><Check /> Everything in Silver</li>
                <li><Check /> Homepage featured</li>
                <li><Check /> Dedicated account manager</li>
                <li><Check /> Custom campaigns</li>
                <li><Check /> API access</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="partner2-section partner2-form-section" id="partner-apply">
        <div className="hero2-container">
          <div className="partner2-form-grid">
            <div className="partner2-form-info">
              <span className="partner2-eyebrow">Apply Now</span>
              <h2>Ready to grow your business?</h2>
              <p>Fill out the form and our partnerships team will get back to you within 48 hours. No commitment required.</p>
              <ul className="partner2-form-bullets">
                <li><Check size={18} /> Free to apply</li>
                <li><Check size={18} /> 48-hour verification</li>
                <li><Check size={18} /> No upfront payment for Bronze</li>
                <li><Check size={18} /> Cancel anytime</li>
              </ul>
            </div>
            <div className="partner2-form-card">
              <div className="partner2-type-selector">
                {TYPES.map((t) => (
                  <button key={t.key} type="button" className={`partner2-type-chip${type === t.key ? ' active' : ''}`} onClick={() => setType(t.key)}>{t.label}</button>
                ))}
              </div>
              <form className="partner2-form" onSubmit={submit}>
                <div className="input-group">
                  <label className="input-label" htmlFor="partner-name">Full Name *</label>
                  <input type="text" id="partner-name" className="input" placeholder="Your full name" required value={form.name} onChange={set('name')} />
                </div>
                <div className="input-group">
                  <label className="input-label" htmlFor="partner-email">Email *</label>
                  <input type="email" id="partner-email" className="input" placeholder="you@business.com" required value={form.email} onChange={set('email')} />
                </div>
                <div className="input-group">
                  <label className="input-label" htmlFor="partner-phone">Phone</label>
                  <input type="tel" id="partner-phone" className="input" placeholder="+216 XX XXX XXX" value={form.phone} onChange={set('phone')} />
                </div>
                <div className="input-group">
                  <label className="input-label" htmlFor="partner-business">Business Name</label>
                  <input type="text" id="partner-business" className="input" placeholder="Your business or organization" value={form.business} onChange={set('business')} />
                </div>
                <div className="input-group">
                  <label className="input-label" htmlFor="partner-message">Message *</label>
                  <textarea id="partner-message" className="input" rows={4} placeholder="Tell us about your partnership goals…" required value={form.message} onChange={set('message')} />
                </div>
                <button type="submit" className="hero2-pricing-btn hero2-pricing-btn-primary" disabled={submitting}>{submitting ? 'Submitting…' : 'Submit Application'}</button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
