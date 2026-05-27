// ============================================
// PREMIUM / SUBSCRIPTIONS PAGE
// Per design-system/pages/premium.md.
// ============================================

import * as api from '../api';
import { replaceIcons } from '../icons';

interface PremiumPlan {
  id: string;
  name: string;
  price: string;
  period: string;
  /** Brand-token tint used as accent (border, button, plan-name color). */
  tint: string;
  /** Sash text shown on the featured card. */
  badge?: string;
  features: string[];
  ctaLabel: string;
  /** When true, the plan is the user's current one (renders as disabled). */
  isCurrent?: boolean;
  /** Marks the visually emphasized card. */
  featured?: boolean;
}

const PLANS: PremiumPlan[] = [
  {
    id: 'free',
    name: 'Free',
    price: '0 TND',
    period: 'forever',
    tint: 'var(--text-secondary)',
    features: [
      'Browse all places',
      'Read reviews',
      'Save favorites',
      'Basic search',
    ],
    ctaLabel: 'Current plan',
    isCurrent: true,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '10 TND',
    period: '/ month',
    tint: 'var(--gold)',
    badge: 'Best value',
    featured: true,
    features: [
      'Everything in Free',
      'Premium itineraries & guides',
      'Offline map access',
      'Ad-free experience',
      'Priority support',
      'Exclusive tips & insider content',
      'Early event access',
    ],
    ctaLabel: 'Upgrade now',
  },
  {
    id: 'annual',
    name: 'Premium Annual',
    price: '100 TND',
    period: '/ year · save 17%',
    tint: 'var(--olive)',
    features: [
      'All Premium features',
      '2 months free',
      'Founding member badge',
    ],
    ctaLabel: 'Upgrade now',
  },
  {
    id: 'business',
    name: 'Business',
    price: '49 TND',
    period: '/ month',
    tint: 'var(--violet)',
    features: [
      'Everything in Premium',
      'Boosted place listing',
      'Business analytics dashboard',
      'Verified business badge',
      'Featured homepage placement',
      'API access & integrations',
      'Dedicated account manager',
    ],
    ctaLabel: 'Upgrade now',
  },
];

interface RevenueItem {
  icon: string;
  title: string;
  desc: string;
  tint: string;
}

const REVENUE: RevenueItem[] = [
  { icon: 'credit-card',  title: 'Subscriptions',     desc: 'Premium & Business plans',         tint: 'var(--gold)' },
  { icon: 'map-pin',      title: 'Sponsored listings', desc: 'Boosted visibility for businesses', tint: 'var(--mediterranean)' },
  { icon: 'ticket',       title: 'Event tickets',     desc: '5% commission on paid events',     tint: 'var(--coral)' },
  { icon: 'hand-coins',   title: 'Creator tips',      desc: 'Tip creators · 10% platform cut',  tint: 'var(--olive)' },
];

function esc(v: unknown): string {
  return String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function renderPlanCard(plan: PremiumPlan): string {
  const cardClasses = ['premium-card'];
  if (plan.featured) cardClasses.push('is-featured');
  if (plan.isCurrent) cardClasses.push('is-current');
  return `
    <article class="${cardClasses.join(' ')}" style="--plan-tint: ${plan.tint}">
      ${plan.badge ? `<span class="premium-badge-tag"><i class="lucide-sparkles"></i> ${esc(plan.badge)}</span>` : ''}
      <header class="premium-card-header">
        <h3 class="premium-plan-name">${esc(plan.name)}</h3>
      </header>
      <div class="premium-price">
        <span class="premium-price-amount">${esc(plan.price)}</span>
        <span class="premium-price-period">${esc(plan.period)}</span>
      </div>
      <ul class="premium-features">
        ${plan.features.map((f) => `
          <li>
            <span class="premium-feature-check" aria-hidden="true"><i class="lucide-check"></i></span>
            <span>${esc(f)}</span>
          </li>
        `).join('')}
      </ul>
      ${plan.isCurrent
        ? '<button type="button" class="premium-btn is-current" disabled>Current plan</button>'
        : `<button type="button" class="premium-btn" data-plan="${esc(plan.id)}">${esc(plan.ctaLabel)} <i class="lucide-arrow-right"></i></button>`}
    </article>
  `;
}

export function renderPremiumPage(): string {
  return `
    <div class="premium-page page-enter">
      <section class="premium-hero">
        <div class="premium-hero-bg" aria-hidden="true"></div>
        <div class="premium-hero-mesh" aria-hidden="true"></div>
        <div class="premium-hero-orbs" aria-hidden="true">
          <span class="premium-hero-orb"></span>
          <span class="premium-hero-orb"></span>
        </div>
        <div class="premium-hero-content">
          <span class="premium-hero-icon" aria-hidden="true"><i class="lucide-crown"></i></span>
          <h1>Go <span class="premium-accent">Premium</span></h1>
          <p>Unlock the full e-Tunisia experience — premium guides, offline maps, ad-free browsing, and early event access.</p>
        </div>
      </section>

      <section class="premium-plans">
        ${PLANS.map(renderPlanCard).join('')}
      </section>

      <section class="premium-revenue">
        <header class="premium-revenue-head">
          <span class="premium-revenue-eyebrow"><i class="lucide-lightbulb"></i> Transparent</span>
          <h2>How we earn</h2>
          <p>Every dinar spent through e-Tunisia stays close to the community it serves.</p>
        </header>
        <div class="premium-revenue-grid">
          ${REVENUE.map((r) => `
            <div class="premium-revenue-item" style="--rev-tint: ${r.tint}">
              <span class="premium-revenue-icon" aria-hidden="true"><i class="lucide-${r.icon}"></i></span>
              <div class="premium-revenue-text">
                <strong>${esc(r.title)}</strong>
                <span>${esc(r.desc)}</span>
              </div>
            </div>
          `).join('')}
        </div>
      </section>

      <div class="premium-payment-overlay" id="premium-payment-overlay"></div>
      <div class="premium-payment-modal" id="premium-payment-modal" role="dialog" aria-modal="true" aria-labelledby="premium-payment-title">
        <header class="premium-payment-header">
          <h3 id="premium-payment-title">Upgrade to Premium</h3>
          <button type="button" class="premium-payment-close" id="premium-payment-close" aria-label="Close">
            <i class="lucide-x"></i>
          </button>
        </header>
        <p class="premium-payment-price" id="premium-payment-price">10 TND / month</p>
        <fieldset class="premium-payment-methods">
          <legend>Payment method</legend>
          <label class="premium-method is-active" data-method="card">
            <input type="radio" name="payment-method" value="card" checked />
            <span class="premium-method-icon"><i class="lucide-credit-card"></i></span>
            <span class="premium-method-label">Card payment</span>
            <span class="premium-method-check" aria-hidden="true"><i class="lucide-check"></i></span>
          </label>
          <label class="premium-method" data-method="bank">
            <input type="radio" name="payment-method" value="bank" />
            <span class="premium-method-icon"><i class="lucide-landmark"></i></span>
            <span class="premium-method-label">Bank transfer</span>
            <span class="premium-method-check" aria-hidden="true"><i class="lucide-check"></i></span>
          </label>
          <label class="premium-method" data-method="cash">
            <input type="radio" name="payment-method" value="cash" />
            <span class="premium-method-icon"><i class="lucide-banknote"></i></span>
            <span class="premium-method-label">Cash (office)</span>
            <span class="premium-method-check" aria-hidden="true"><i class="lucide-check"></i></span>
          </label>
        </fieldset>
        <button type="button" class="premium-confirm-btn" id="premium-confirm-btn">
          <i class="lucide-shield-check"></i> Confirm payment
        </button>
      </div>
    </div>
  `;
}

export function initPremiumPage() {
  const overlay = document.getElementById('premium-payment-overlay');
  const modal = document.getElementById('premium-payment-modal');
  const closeBtn = document.getElementById('premium-payment-close');
  const confirmBtn = document.getElementById('premium-confirm-btn') as HTMLButtonElement | null;
  const titleEl = document.getElementById('premium-payment-title');
  const priceEl = document.getElementById('premium-payment-price');

  let selectedPlan = '';
  let selectedMethod = 'card';

  const priceFor = (plan: string) => {
    const p = PLANS.find((x) => x.id === plan);
    return p ? `${p.price} ${p.period}`.trim() : '';
  };

  // Open payment modal
  document.querySelectorAll<HTMLButtonElement>('.premium-btn[data-plan]').forEach((btn) => {
    btn.addEventListener('click', () => {
      selectedPlan = btn.dataset.plan || '';
      const p = PLANS.find((x) => x.id === selectedPlan);
      if (titleEl) titleEl.textContent = `Upgrade to ${p?.name || selectedPlan}`;
      if (priceEl) priceEl.textContent = priceFor(selectedPlan);
      modal?.classList.add('open');
      overlay?.classList.add('open');
      document.body.style.overflow = 'hidden';
      if (modal) replaceIcons(modal);
    });
  });

  function closeModal() {
    modal?.classList.remove('open');
    overlay?.classList.remove('open');
    document.body.style.overflow = '';
  }
  closeBtn?.addEventListener('click', closeModal);
  overlay?.addEventListener('click', closeModal);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal?.classList.contains('open')) closeModal();
  });

  // Method selection
  document.querySelectorAll<HTMLLabelElement>('.premium-method').forEach((m) => {
    m.addEventListener('click', () => {
      document.querySelectorAll<HTMLLabelElement>('.premium-method').forEach((mm) => mm.classList.remove('is-active'));
      m.classList.add('is-active');
      selectedMethod = m.dataset.method || 'card';
    });
  });

  // Confirm payment
  confirmBtn?.addEventListener('click', async () => {
    if (!selectedPlan) return;
    const original = confirmBtn.innerHTML;
    confirmBtn.textContent = 'Processing…';
    confirmBtn.disabled = true;
    try {
      await api.upgradePlan(selectedPlan, selectedMethod);
      closeModal();
      const fn = (window as any).showToast;
      if (fn) fn({ message: `Upgraded to ${selectedPlan}!`, type: 'success' });
      else alert(`Upgraded to ${selectedPlan}!`);
    } catch (err: any) {
      const fn = (window as any).showToast;
      const msg = `Upgrade failed: ${err?.message || 'network error'}. No charge was made — please try again or email support@etunisia.com.`;
      if (fn) fn({ message: msg, type: 'error' });
      else alert(msg);
    }
    confirmBtn.innerHTML = original;
    replaceIcons(confirmBtn);
    confirmBtn.disabled = false;
  });
}
