// Scene 8 — the calm valley: the partner letter, the partners strip and
// the fares. Deliberately quiet after three animated scenes; entries are
// simple settles, plus one stamp thunk on the featured fare.
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import * as api from '../../../api';
import { usePlanCatalog, fmtPrice } from '../../lib/plan-catalog';
import { settle, thunk, VIEWPORT_ONCE } from './choreo';

function FareStubs() {
  const { data: catalog } = usePlanCatalog();
  const plans = catalog?.plans || [];
  const currency = catalog?.currency || 'TND';
  return (
    <div className="ej-fares">
      {plans.map((plan, i) => (
        <motion.div
          key={plan.id}
          className={`ej-fare${plan.featured ? ' ej-fare--featured' : ''}`}
          variants={settle}
          custom={i * 0.1}
          initial="hidden"
          whileInView="show"
          viewport={VIEWPORT_ONCE}
        >
          {plan.featured && (
            <motion.span className="ej-fare-loved" variants={thunk} custom={0.55} initial="hidden" whileInView="show" viewport={VIEWPORT_ONCE}>
              Most loved
            </motion.span>
          )}
          <div className="ej-fare-name">{plan.name}</div>
          <div className="ej-fare-price">
            {plan.monthly === 0 ? '0' : fmtPrice(plan.monthly, currency).split(' ')[0]}
            <span>{plan.monthly === 0 ? currency : `${currency} / month`}</span>
          </div>
          <p className="ej-fare-tagline">{plan.tagline}</p>
          <ul className="ej-fare-features">
            {plan.features.slice(0, 4).map((feature, j) => <li key={j}>{feature}</li>)}
          </ul>
          <a href={plan.id === 'free' ? '#/register' : '#/pro'} className={plan.featured ? 'ej-btn' : 'ej-btn-ghost'}>
            {plan.id === 'free' ? 'Get started' : `Upgrade to ${plan.name}`}
          </a>
        </motion.div>
      ))}
    </div>
  );
}

const PARTNER_LOGOS = [
  { src: '/img/partenaires/OIM_Migration.png', alt: 'OIM — International Organization for Migration' },
  { src: '/img/partenaires/Logo%20SB%20ENET_Com_Color.png', alt: "ENET'Com" },
  { src: '/img/partenaires/APII.png', alt: "APII — Agence de Promotion de l'Industrie et de l'Innovation" },
  { src: '/img/partenaires/Nafship-1_upscayl_3x_ultramix_balanced.png', alt: 'Nafship' },
  { src: '/img/partenaires/MPRR_LOGO_Draft-01__1.png', alt: 'MPRR' },
  { src: '/img/partenaires/Bussiness_Success.png', alt: 'Business Success' },
];

export default function SceneLetter() {
  const [lp, setLp] = useState({ name: '', business: '', email: '', type: 'hotel' });
  const [lpBtn, setLpBtn] = useState('Send application — free');
  const [lpDisabled, setLpDisabled] = useState(false);
  const lpSet = (k: keyof typeof lp) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setLp((s) => ({ ...s, [k]: e.target.value }));

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
    <>
      {/* ── The letter — for business owners ── */}
      <section className="ej-section">
        <div className="ej-letter">
          <motion.div variants={settle} initial="hidden" whileInView="show" viewport={VIEWPORT_ONCE}>
            <p className="ej-kicker"><span className="ej-no">For business owners</span></p>
            <h2 className="ej-h2">Run a riad, a table, a tour? <em>Write to us.</em></h2>
            <p className="ej-letter-arabic">وصل للسياح اللي يستحقو</p>
            <p className="ej-lede">Hotels, riads, restaurants, guides, artisans — whatever you do, there's a traveler looking for you. Join 890+ Tunisian businesses already on the platform.</p>
            <ul className="ej-letter-benefits">
              <li><span className="ej-tick" aria-hidden="true">✓</span> Direct bookings, no middlemen</li>
              <li><span className="ej-tick" aria-hidden="true">✓</span> You keep what you earn</li>
              <li><span className="ej-tick" aria-hidden="true">✓</span> Verified by our community</li>
            </ul>
          </motion.div>
          <motion.form className="ej-letter-form" onSubmit={submitLp} variants={settle} custom={0.12} initial="hidden" whileInView="show" viewport={VIEWPORT_ONCE}>
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
          </motion.form>
        </div>
      </section>

      {/* ── Partners strip ── */}
      <section className="ej-partners" aria-label="Partner organizations">
        <div className="ej-partners-inner">
          <p className="ej-partners-title">In good company — partners &amp; supporters</p>
          <div className="ej-partners-row">
            {PARTNER_LOGOS.map((l, i) => (
              <motion.img
                key={l.src}
                src={l.src}
                alt={l.alt}
                loading="lazy"
                variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 0.4, delay: i * 0.07 } } }}
                initial="hidden"
                whileInView="show"
                viewport={VIEWPORT_ONCE}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── Nº 06 — Fares ── */}
      <section className="ej-section">
        <div className="ej-section-head ej-head-folio">
          <span className="ej-folio-bg" aria-hidden="true">06</span>
          <motion.p className="ej-kicker" variants={settle} initial="hidden" whileInView="show" viewport={VIEWPORT_ONCE}>
            <span className="ej-no">Nº 06</span> Fair fares
          </motion.p>
          <motion.h2 className="ej-h2" variants={settle} custom={0.08} initial="hidden" whileInView="show" viewport={VIEWPORT_ONCE}>
            Start free. Upgrade when you're <em>hooked.</em>
          </motion.h2>
          <motion.p className="ej-lede" variants={settle} custom={0.16} initial="hidden" whileInView="show" viewport={VIEWPORT_ONCE}>
            Every plan supports Tunisian local businesses. No hidden fees.
          </motion.p>
        </div>
        <FareStubs />
      </section>
    </>
  );
}
