// ============================================
// ABOUT PAGE — Brand story & mission
// ============================================

import { replaceIcons } from '../icons';

export function renderAboutPage(): string {
  return `
    <div class="about-page page-enter">
      <!-- Hero -->
      <section class="about-hero">
        <div class="about-hero-bg"></div>
        <div class="about-hero-content">
          <span class="about-eyebrow">Our Story</span>
          <h1>We're Building the Future of <span class="about-accent">Tunisian Travel</span></h1>
          <p>e-Tunisia was born from a simple frustration: the most magical places in Tunisia are nowhere to be found online. We're fixing that.</p>
        </div>
      </section>

      <!-- Story -->
      <section class="about-section">
        <div class="about-container">
          <div class="about-story-grid">
            <div class="about-story-text">
              <h2>The Problem</h2>
              <p>Existing travel platforms list the same 20 tourist spots copied from each other. The real Tunisia — the cave restaurants, the secret beaches, the family-run guesthouses, the hidden Roman ruins — stays invisible.</p>
              <p>Local businesses lose tourists to all-inclusive resorts. Travelers miss experiences they'll remember forever. Everyone loses.</p>
            </div>
            <div class="about-story-text">
              <h2>Our Solution</h2>
              <p>e-Tunisia is a community-driven platform where locals and travelers share the spots that don't make it into guidebooks. We verify, curate, and make them bookable.</p>
              <p>Every place, tip, and itinerary is tested by real people. No paid placements. No fake reviews. Just authentic Tunisia.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Stats -->
      <div class="about-stats">
        <div class="about-stat-item">
          <span class="about-stat-num" data-count="2500">0</span>
          <span class="about-stat-label">Hidden Places</span>
        </div>
        <div class="about-stat-divider"></div>
        <div class="about-stat-item">
          <span class="about-stat-num" data-count="12400">0</span>
          <span class="about-stat-label">Travelers</span>
        </div>
        <div class="about-stat-divider"></div>
        <div class="about-stat-item">
          <span class="about-stat-num" data-count="890">0</span>
          <span class="about-stat-label">Local Hosts</span>
        </div>
        <div class="about-stat-divider"></div>
        <div class="about-stat-item">
          <span class="about-stat-num" data-count="45000">0</span>
          <span class="about-stat-label">Reviews</span>
        </div>
      </div>

      <!-- Values -->
      <section class="about-section">
        <div class="about-container">
          <div class="about-section-header">
            <span class="about-eyebrow">What We Believe</span>
            <h2>Values that drive us</h2>
          </div>
          <div class="about-values-grid">
            <div class="about-value-card">
              <div class="about-value-icon" style="color: var(--coral)">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
              </div>
              <h3>Community-Driven</h3>
              <p>Real travelers, real locals, real experiences. Our community curates everything. No corporate editorial team deciding what's worth seeing.</p>
            </div>
            <div class="about-value-card">
              <div class="about-value-icon" style="color: var(--olive)">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
              <h3>Support Local</h3>
              <p>We prioritize family-run businesses, artisans, and independent hosts. Every booking directly supports Tunisian entrepreneurs.</p>
            </div>
            <div class="about-value-card">
              <div class="about-value-icon" style="color: var(--mediterranean)">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="currentColor" stroke="none"/></svg>
              </div>
              <h3>Authentic Experiences</h3>
              <p>No tourist traps, no paid placements. Every recommendation is tested and verified by our community of explorers.</p>
            </div>
            <div class="about-value-card">
              <div class="about-value-icon" style="color: var(--gold)">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"/></svg>
              </div>
              <h3>Sustainable Tourism</h3>
              <p>We promote responsible travel that preserves Tunisia's natural beauty and cultural heritage for future generations.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Team -->
      <section class="about-section">
        <div class="about-container">
          <div class="about-section-header">
            <span class="about-eyebrow">The Team</span>
            <h2>Built by Tunisians, for the world</h2>
          </div>
          <div class="about-team-grid">
            <div class="about-team-card">
              <img src="https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&h=200&fit=crop&crop=face" alt="Founder" />
              <h3>Ahmed Ben Ali</h3>
              <span>Founder & CEO</span>
              <p>Former tour guide turned tech entrepreneur. 10+ years showing travelers the real Tunisia.</p>
            </div>
            <div class="about-team-card">
              <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop&crop=face" alt="CTO" />
              <h3>Sarah Khelil</h3>
              <span>Co-Founder & CTO</span>
              <p>Full-stack engineer passionate about building products that connect people and places.</p>
            </div>
            <div class="about-team-card">
              <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face" alt="Head of Community" />
              <h3>Karim Ferchichi</h3>
              <span>Head of Community</span>
              <p>Travel blogger with 500K followers. Knows every hidden corner of Tunisia.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- CTA -->
      <section class="about-cta">
        <div class="about-cta-bg"></div>
        <div class="about-cta-content">
          <h2>Be part of the story.</h2>
          <p>Whether you're a traveler seeking adventure or a local business ready to grow, there's a place for you here.</p>
          <div class="about-cta-actions">
            <a href="#/register" class="hero2-btn-cta">Join the Community</a>
            <a href="#/partner" class="hero2-pricing-btn hero2-pricing-btn-outline">Partner With Us</a>
          </div>
        </div>
      </section>
    </div>
  `;
}

export function initAboutPage() {
  // Animated counters
  const counters = document.querySelectorAll('.about-stat-num[data-count]');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const el = entry.target as HTMLElement;
        const target = parseInt(el.dataset.count || '0');
        let current = 0;
        const increment = target / 60;
        const timer = setInterval(() => {
          current += increment;
          if (current >= target) {
            current = target;
            clearInterval(timer);
          }
          el.textContent = Math.floor(current).toLocaleString() + (current >= target ? '+' : '');
        }, 16);
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach((c) => observer.observe(c));

  // Scroll reveal
  const revealEls = document.querySelectorAll('.about-value-card, .about-team-card, .about-story-text');
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
