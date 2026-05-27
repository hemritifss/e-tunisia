// ============================================
// PARTNER PAGE — B2B Landing Page
// ============================================

import * as api from '../api';
import { replaceIcons } from '../icons';

export function renderPartnerPage(): string {
  return `
    <div class="partner-page page-enter">
      <!-- Hero -->
      <section class="partner2-hero">
        <div class="partner2-hero-bg"></div>
        <div class="partner2-hero-content">
          <span class="partner2-eyebrow">For Businesses</span>
          <h1>Grow Your Business with <span class="partner2-accent">e-Tunisia</span></h1>
          <p>Join 890+ local hosts, restaurants, and experience providers reaching 12,400+ active travelers every month.</p>
          <div class="partner2-hero-actions">
            <a href="#partner-apply" class="hero2-btn-cta">Apply Now</a>
            <a href="#partner-tiers" class="hero2-btn-video">View Pricing</a>
          </div>
        </div>
      </section>

      <!-- Stats -->
      <div class="hero2-stats-bar">
        <div class="hero2-stat-item">
          <span class="hero2-stat-num" data-count="890">0</span>
          <span class="hero2-stat-label">Active Partners</span>
        </div>
        <div class="hero2-stat-divider"></div>
        <div class="hero2-stat-item">
          <span class="hero2-stat-num" data-count="12400">0</span>
          <span class="hero2-stat-label">Monthly Travelers</span>
        </div>
        <div class="hero2-stat-divider"></div>
        <div class="hero2-stat-item">
          <span class="hero2-stat-num" data-count="45">0</span>
          <span class="hero2-stat-suffix">K</span>
          <span class="hero2-stat-label">Monthly Bookings</span>
        </div>
        <div class="hero2-stat-divider"></div>
        <div class="hero2-stat-item">
          <span class="hero2-stat-num" data-count="98">0</span>
          <span class="hero2-stat-suffix">%</span>
          <span class="hero2-stat-label">Partner Satisfaction</span>
        </div>
      </div>

      <!-- Benefits -->
      <section class="partner2-section">
        <div class="hero2-container">
          <div class="hero2-section-header">
            <span class="hero2-section-eyebrow">Why Partner With Us</span>
            <h2 class="hero2-section-title">Everything you need to succeed.</h2>
          </div>
          <div class="partner2-benefits-grid">
            <div class="partner2-benefit-card">
              <div class="partner2-benefit-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              </div>
              <h3>Massive Visibility</h3>
              <p>Get discovered by 12,400+ active travelers searching for authentic Tunisian experiences. No SEO needed.</p>
            </div>
            <div class="partner2-benefit-card">
              <div class="partner2-benefit-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
              </div>
              <h3>Direct Bookings</h3>
              <p>Travelers book directly through our platform. You keep more of what you earn — our commission is lower than any competitor.</p>
            </div>
            <div class="partner2-benefit-card">
              <div class="partner2-benefit-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
              </div>
              <h3>Real Analytics</h3>
              <p>Track views, bookings, revenue, and customer demographics in real-time. Make data-driven decisions.</p>
            </div>
            <div class="partner2-benefit-card">
              <div class="partner2-benefit-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
              <h3>Community Trust</h3>
              <p>Our verification badge signals quality to travelers. Verified partners get 3x more bookings than unverified listings.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- How it works -->
      <section class="partner2-section">
        <div class="hero2-container">
          <div class="hero2-section-header">
            <span class="hero2-section-eyebrow">How It Works</span>
            <h2 class="hero2-section-title">Start receiving bookings in 3 steps.</h2>
          </div>
          <div class="hero2-steps-grid">
            <div class="hero2-step">
              <div class="hero2-step-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
              </div>
              <h3>Submit Application</h3>
              <p>Tell us about your business. Takes less than 5 minutes. No upfront costs.</p>
            </div>
            <div class="hero2-step-arrow">
              <svg width="40" height="24" viewBox="0 0 40 24" fill="none"><path d="M2 12h30M28 5l7 7-7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </div>
            <div class="hero2-step">
              <div class="hero2-step-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              </div>
              <h3>Get Verified</h3>
              <p>Our team reviews your application and verifies your business within 48 hours.</p>
            </div>
            <div class="hero2-step-arrow">
              <svg width="40" height="24" viewBox="0 0 40 24" fill="none"><path d="M2 12h30M28 5l7 7-7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </div>
            <div class="hero2-step">
              <div class="hero2-step-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg>
              </div>
              <h3>Start Earning</h3>
              <p>Your listing goes live. Start receiving bookings and growing your business.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Testimonial -->
      <section class="partner2-section">
        <div class="hero2-container">
          <div class="hero2-proof-card hero2-proof-featured" style="max-width: 700px; margin: 0 auto;">
            <div class="hero2-proof-stars" aria-label="5 out of 5 stars">
              <i class="lucide-star"></i><i class="lucide-star"></i><i class="lucide-star"></i><i class="lucide-star"></i><i class="lucide-star"></i>
            </div>
            <p class="hero2-proof-text" style="font-size: 1.125rem;">"Before e-Tunisia, we relied on walk-ins and word of mouth. Now 60% of our bookings come through the platform. We've hired 3 more staff and expanded our kitchen. This changed our business."</p>
            <div class="hero2-proof-author">
              <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face" alt="Hassan" />
              <div>
                <strong>Hassan Trabelsi</strong>
                <span>Owner, Dar El Medina — Tunis</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Tiers -->
      <section class="partner2-section" id="partner-tiers">
        <div class="hero2-container">
          <div class="hero2-section-header">
            <span class="hero2-section-eyebrow">Pricing</span>
            <h2 class="hero2-section-title">Partnership tiers that scale with you.</h2>
          </div>
          <div class="hero2-pricing-grid" style="max-width: 900px;">
            <div class="hero2-pricing-card">
              <div class="hero2-pricing-name">Bronze</div>
              <div class="hero2-pricing-price">500 <span>TND/yr</span></div>
              <p class="hero2-pricing-desc">Perfect for small businesses</p>
              <ul class="hero2-pricing-features">
                <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> Listing on platform</li>
                <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> Basic analytics</li>
                <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> Social media mention</li>
                <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> Email support</li>
              </ul>
            </div>
            <div class="hero2-pricing-card hero2-pricing-popular">
              <div class="hero2-pricing-badge">Most Popular</div>
              <div class="hero2-pricing-name">Silver</div>
              <div class="hero2-pricing-price">2,500 <span>TND/yr</span></div>
              <p class="hero2-pricing-desc">For growing businesses</p>
              <ul class="hero2-pricing-features">
                <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> Everything in Bronze</li>
                <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> Priority placement</li>
                <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> Banner advertising</li>
                <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> Event co-hosting</li>
                <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> Advanced analytics</li>
              </ul>
            </div>
            <div class="hero2-pricing-card">
              <div class="hero2-pricing-name">Gold</div>
              <div class="hero2-pricing-price">7,500 <span>TND/yr</span></div>
              <p class="hero2-pricing-desc">For established brands</p>
              <ul class="hero2-pricing-features">
                <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> Everything in Silver</li>
                <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> Homepage featured</li>
                <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> Dedicated account manager</li>
                <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> Custom campaigns</li>
                <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> API access</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <!-- Application Form -->
      <section class="partner2-section partner2-form-section" id="partner-apply">
        <div class="hero2-container">
          <div class="partner2-form-grid">
            <div class="partner2-form-info">
              <span class="partner2-eyebrow">Apply Now</span>
              <h2>Ready to grow your business?</h2>
              <p>Fill out the form and our partnerships team will get back to you within 48 hours. No commitment required.</p>
              <ul class="partner2-form-bullets">
                <li><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> Free to apply</li>
                <li><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> 48-hour verification</li>
                <li><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> No upfront payment for Bronze</li>
                <li><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> Cancel anytime</li>
              </ul>
            </div>
            <div class="partner2-form-card">
              <div class="partner2-type-selector">
                <button class="partner2-type-chip active" data-type="sponsor">Sponsor</button>
                <button class="partner2-type-chip" data-type="partner">Partner</button>
                <button class="partner2-type-chip" data-type="advertiser">Advertiser</button>
              </div>
              <form id="partner-form" class="partner2-form">
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
                <button type="submit" class="hero2-pricing-btn hero2-pricing-btn-primary" id="partner-submit-btn">
                  Submit Application
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  `;
}

export function initPartnerPage() {
  let selectedType = 'sponsor';

  // Type selector
  document.querySelectorAll('.partner2-type-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.partner2-type-chip').forEach(b => b.classList.remove('active'));
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

    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Submitting...';
    (submitBtn as HTMLButtonElement).disabled = true;

    try {
      await api.submitContactForm({
        name, email, phone, businessName: business, type: selectedType, message,
      });
      alert('Application submitted! We\'ll be in touch within 48 hours.');
      form.reset();
    } catch (err: any) {
      alert(`Couldn't submit your application: ${err?.message || 'network error'}.\nEmail support@etunisia.com and we'll follow up.`);
    }

    submitBtn.textContent = originalText;
    (submitBtn as HTMLButtonElement).disabled = false;
  });

  // Animated counters
  const counters = document.querySelectorAll('.hero2-stat-num[data-count]');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const el = entry.target as HTMLElement;
        const target = parseInt(el.dataset.count || '0');
        const suffix = el.nextElementSibling?.classList.contains('hero2-stat-suffix') ? (el.nextElementSibling as HTMLElement).textContent || '' : '+';
        let current = 0;
        const increment = target / 60;
        const timer = setInterval(() => {
          current += increment;
          if (current >= target) {
            current = target;
            clearInterval(timer);
          }
          el.textContent = Math.floor(current).toLocaleString() + (current >= target ? suffix : '');
        }, 16);
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach((c) => observer.observe(c));

  // Scroll reveal
  const revealEls = document.querySelectorAll('.partner2-benefit-card, .hero2-step');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('hero2-revealed');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  revealEls.forEach((el) => revealObserver.observe(el));
}
