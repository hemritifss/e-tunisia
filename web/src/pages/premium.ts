// ============================================
// PREMIUM / SUBSCRIPTIONS PAGE
// Mirrors Flutter PremiumScreen
// ============================================

import * as api from '../api';
import { replaceIcons } from '../icons';

export function renderPremiumPage(): string {
  return `
    <div class="premium-page page-enter">
      <div class="premium-hero">
        <div class="premium-hero-bg"></div>
        <div class="premium-hero-content">
          <div class="premium-icon">👑</div>
          <h1>Go Premium</h1>
          <p>Unlock the full e-Tunisia experience</p>
        </div>
      </div>

      <div class="premium-plans">
        <!-- Free Plan -->
        <div class="premium-card">
          <div class="premium-card-header">
            <h3 class="premium-plan-name" style="color: var(--text-muted);">Free</h3>
          </div>
          <div class="premium-price">
            <span class="premium-price-amount">0 TND</span>
            <span class="premium-price-period">forever</span>
          </div>
          <ul class="premium-features">
            <li><i class="lucide-check-circle"></i> Browse all places</li>
            <li><i class="lucide-check-circle"></i> Read reviews</li>
            <li><i class="lucide-check-circle"></i> Save favorites</li>
            <li><i class="lucide-check-circle"></i> Basic search</li>
          </ul>
          <button class="btn btn-outline premium-btn current" disabled>Current Plan</button>
        </div>

        <!-- Premium Plan -->
        <div class="premium-card featured">
          <div class="premium-badge-tag">BEST VALUE</div>
          <div class="premium-card-header">
            <h3 class="premium-plan-name" style="color: var(--amber);">Premium</h3>
          </div>
          <div class="premium-price">
            <span class="premium-price-amount">10 TND</span>
            <span class="premium-price-period">/month</span>
          </div>
          <ul class="premium-features">
            <li><i class="lucide-check-circle"></i> Everything in Free</li>
            <li><i class="lucide-check-circle"></i> Premium itineraries & guides</li>
            <li><i class="lucide-check-circle"></i> Offline map access</li>
            <li><i class="lucide-check-circle"></i> Ad-free experience</li>
            <li><i class="lucide-check-circle"></i> Priority support</li>
            <li><i class="lucide-check-circle"></i> Exclusive tips & insider content</li>
            <li><i class="lucide-check-circle"></i> Early event access</li>
          </ul>
          <button class="btn btn-primary premium-btn" data-plan="premium">Upgrade Now</button>
        </div>

        <!-- Annual Plan -->
        <div class="premium-card">
          <div class="premium-card-header">
            <h3 class="premium-plan-name" style="color: var(--success);">Premium Annual</h3>
          </div>
          <div class="premium-price">
            <span class="premium-price-amount">100 TND</span>
            <span class="premium-price-period">/year (save 17%)</span>
          </div>
          <ul class="premium-features">
            <li><i class="lucide-check-circle"></i> All Premium features</li>
            <li><i class="lucide-check-circle"></i> 2 months free!</li>
            <li><i class="lucide-check-circle"></i> Founding member badge</li>
          </ul>
          <button class="btn btn-primary premium-btn" style="background: var(--success);" data-plan="annual">Upgrade Now</button>
        </div>

        <!-- Business Plan -->
        <div class="premium-card">
          <div class="premium-card-header">
            <h3 class="premium-plan-name" style="color: var(--purple, #8B5CF6);">Business</h3>
          </div>
          <div class="premium-price">
            <span class="premium-price-amount">49 TND</span>
            <span class="premium-price-period">/month</span>
          </div>
          <ul class="premium-features">
            <li><i class="lucide-check-circle"></i> Everything in Premium</li>
            <li><i class="lucide-check-circle"></i> Boosted place listing</li>
            <li><i class="lucide-check-circle"></i> Business analytics dashboard</li>
            <li><i class="lucide-check-circle"></i> Verified badge ✓</li>
            <li><i class="lucide-check-circle"></i> Featured homepage placement</li>
            <li><i class="lucide-check-circle"></i> API access & integrations</li>
            <li><i class="lucide-check-circle"></i> Dedicated account manager</li>
          </ul>
          <button class="btn btn-primary premium-btn" style="background: var(--purple, #8B5CF6);" data-plan="business">Upgrade Now</button>
        </div>
      </div>

      <!-- How We Earn -->
      <div class="premium-revenue">
        <h3>💡 How We Earn</h3>
        <div class="premium-revenue-grid">
          <div class="premium-revenue-item">
            <span class="premium-revenue-icon">💳</span>
            <div><strong>Subscriptions</strong><span>Premium & Business plans</span></div>
          </div>
          <div class="premium-revenue-item">
            <span class="premium-revenue-icon">📍</span>
            <div><strong>Sponsored Listings</strong><span>Boosted visibility for businesses</span></div>
          </div>
          <div class="premium-revenue-item">
            <span class="premium-revenue-icon">🎫</span>
            <div><strong>Event Tickets</strong><span>5% commission on paid events</span></div>
          </div>
          <div class="premium-revenue-item">
            <span class="premium-revenue-icon">💸</span>
            <div><strong>Creator Tips</strong><span>Tip creators, 10% platform cut</span></div>
          </div>
        </div>
      </div>

      <!-- Payment Modal -->
      <div class="premium-payment-overlay" id="premium-payment-overlay"></div>
      <div class="premium-payment-modal" id="premium-payment-modal">
        <div class="premium-payment-header">
          <h3 id="premium-payment-title">Upgrade to Premium</h3>
          <button class="btn-icon" id="premium-payment-close" aria-label="Close"><i class="lucide-x"></i></button>
        </div>
        <p class="premium-payment-price" id="premium-payment-price">10 TND / month</p>
        <div class="premium-payment-methods">
          <h4>Payment Method</h4>
          <label class="premium-method active" data-method="card">
            <i class="lucide-credit-card"></i>
            <span>Card Payment</span>
            <i class="lucide-check-circle method-check"></i>
          </label>
          <label class="premium-method" data-method="bank">
            <i class="lucide-landmark"></i>
            <span>Bank Transfer</span>
            <i class="lucide-check-circle method-check"></i>
          </label>
          <label class="premium-method" data-method="cash">
            <i class="lucide-banknote"></i>
            <span>Cash (Office)</span>
            <i class="lucide-check-circle method-check"></i>
          </label>
        </div>
        <button class="btn btn-primary btn-lg" style="width:100%;" id="premium-confirm-btn">
          Confirm Payment
        </button>
      </div>
    </div>
  `;
}

export function initPremiumPage() {
  const overlay = document.getElementById('premium-payment-overlay');
  const modal = document.getElementById('premium-payment-modal');
  const closeBtn = document.getElementById('premium-payment-close');
  const confirmBtn = document.getElementById('premium-confirm-btn');
  const titleEl = document.getElementById('premium-payment-title');
  const priceEl = document.getElementById('premium-payment-price');

  let selectedPlan = '';
  let selectedMethod = 'card';

  // Open payment modal
  document.querySelectorAll('.premium-btn[data-plan]').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedPlan = (btn as HTMLElement).dataset.plan || '';
      const prices: Record<string, string> = {
        premium: '10 TND / month',
        annual: '100 TND / year',
        business: '49 TND / month',
      };
      if (titleEl) titleEl.textContent = `Upgrade to ${selectedPlan.toUpperCase()}`;
      if (priceEl) priceEl.textContent = prices[selectedPlan] || '';
      modal?.classList.add('open');
      overlay?.classList.add('open');
      replaceIcons(modal as HTMLElement);
    });
  });

  // Close
  function closeModal() {
    modal?.classList.remove('open');
    overlay?.classList.remove('open');
  }
  closeBtn?.addEventListener('click', closeModal);
  overlay?.addEventListener('click', closeModal);

  // Method selection
  document.querySelectorAll('.premium-method').forEach(m => {
    m.addEventListener('click', () => {
      document.querySelectorAll('.premium-method').forEach(mm => mm.classList.remove('active'));
      m.classList.add('active');
      selectedMethod = (m as HTMLElement).dataset.method || 'card';
    });
  });

  // Confirm payment
  confirmBtn?.addEventListener('click', async () => {
    if (!selectedPlan) return;
    confirmBtn.textContent = 'Processing...';
    (confirmBtn as HTMLButtonElement).disabled = true;
    try {
      await api.upgradePlan(selectedPlan, selectedMethod);
      closeModal();
      alert(`🎉 Upgraded to ${selectedPlan}!`);
    } catch {
      alert('Payment submitted! We will process your upgrade shortly.');
      closeModal();
    }
    confirmBtn.textContent = 'Confirm Payment';
    (confirmBtn as HTMLButtonElement).disabled = false;
  });
}
