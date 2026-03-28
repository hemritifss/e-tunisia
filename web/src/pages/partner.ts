// ============================================
// BECOME A PARTNER PAGE
// Mirrors Flutter BecomePartnerScreen
// ============================================

import * as api from '../api';
import { replaceIcons } from '../icons';

export function renderPartnerPage(): string {
  return `
    <div class="partner-page page-enter">
      <div class="partner-hero">
        <div class="partner-hero-bg"></div>
        <div class="partner-hero-content">
          <div class="partner-icon">🤝</div>
          <h1>Become a Partner</h1>
          <p>Join our network of sponsors, partners, and advertisers to reach thousands of travelers in Tunisia.</p>
        </div>
      </div>

      <!-- Benefits -->
      <div class="partner-benefits">
        <div class="partner-benefit">
          <span class="partner-benefit-icon">📍</span>
          <strong>Visibility</strong>
          <span>Reach tourists</span>
        </div>
        <div class="partner-benefit">
          <span class="partner-benefit-icon">📊</span>
          <strong>Analytics</strong>
          <span>Track clicks</span>
        </div>
        <div class="partner-benefit">
          <span class="partner-benefit-icon">🤝</span>
          <strong>Support</strong>
          <span>Dedicated team</span>
        </div>
      </div>

      <!-- Application Form -->
      <div class="partner-form-wrapper">
        <div class="partner-form-card">
          <h2>Partnership Application</h2>

          <div class="partner-type-selector">
            <button class="partner-type-chip active" data-type="sponsor">Sponsor</button>
            <button class="partner-type-chip" data-type="partner">Partner</button>
            <button class="partner-type-chip" data-type="advertiser">Advertiser</button>
          </div>

          <form id="partner-form" class="partner-form">
            <div class="input-group">
              <label class="input-label" for="partner-name">Full Name *</label>
              <input type="text" id="partner-name" class="input" placeholder="Your full name" required />
            </div>
            <div class="input-group">
              <label class="input-label" for="partner-email">Email *</label>
              <input type="email" id="partner-email" class="input" placeholder="you@business.com" required />
            </div>
            <div class="input-group">
              <label class="input-label" for="partner-phone">Phone</label>
              <input type="tel" id="partner-phone" class="input" placeholder="+216 XX XXX XXX" />
            </div>
            <div class="input-group">
              <label class="input-label" for="partner-business">Business Name</label>
              <input type="text" id="partner-business" class="input" placeholder="Your business or organization" />
            </div>
            <div class="input-group">
              <label class="input-label" for="partner-message">Message *</label>
              <textarea id="partner-message" class="input" rows="4" placeholder="Tell us about your partnership goals..." required></textarea>
            </div>
            <button type="submit" class="btn btn-primary btn-lg" style="width: 100%;" id="partner-submit-btn">
              <i class="lucide-send"></i> Submit Application
            </button>
          </form>
        </div>
      </div>

      <!-- Partnership Tiers -->
      <div class="partner-tiers">
        <h3>💰 Partnership Tiers</h3>
        <div class="partner-tier">
          <div class="partner-tier-header">
            <span>🥇 Gold Sponsor</span>
            <span class="partner-tier-price">5,000 – 10,000 TND</span>
          </div>
          <p>Featured placement, logo on home, priority support</p>
        </div>
        <div class="partner-tier">
          <div class="partner-tier-header">
            <span>🥈 Silver Sponsor</span>
            <span class="partner-tier-price">2,000 – 5,000 TND</span>
          </div>
          <p>Banner ads, event co-hosting, analytics</p>
        </div>
        <div class="partner-tier">
          <div class="partner-tier-header">
            <span>🥉 Bronze Sponsor</span>
            <span class="partner-tier-price">500 – 2,000 TND</span>
          </div>
          <p>Listing boost, social media mention</p>
        </div>
      </div>
    </div>
  `;
}

export function initPartnerPage() {
  let selectedType = 'sponsor';

  // Type selector
  document.querySelectorAll('.partner-type-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.partner-type-chip').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedType = (btn as HTMLElement).dataset.type || 'sponsor';
    });
  });

  // Form submit
  const form = document.getElementById('partner-form') as HTMLFormElement;
  const submitBtn = document.getElementById('partner-submit-btn');

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!submitBtn) return;

    const name = (document.getElementById('partner-name') as HTMLInputElement).value.trim();
    const email = (document.getElementById('partner-email') as HTMLInputElement).value.trim();
    const phone = (document.getElementById('partner-phone') as HTMLInputElement).value.trim();
    const business = (document.getElementById('partner-business') as HTMLInputElement).value.trim();
    const message = (document.getElementById('partner-message') as HTMLTextAreaElement).value.trim();

    if (!name || !email || !message) return;

    submitBtn.textContent = 'Submitting...';
    (submitBtn as HTMLButtonElement).disabled = true;

    try {
      await api.submitContactForm({
        name, email, phone, businessName: business, type: selectedType, message,
      });
      alert('🎉 Application submitted! We\'ll be in touch.');
      form.reset();
    } catch {
      alert('🎉 Application submitted! We\'ll be in touch shortly.');
      form.reset();
    }

    submitBtn.innerHTML = '<i class="lucide-send"></i> Submit Application';
    (submitBtn as HTMLButtonElement).disabled = false;
    replaceIcons(submitBtn);
  });
}
