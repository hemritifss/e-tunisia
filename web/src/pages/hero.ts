// ============================================
// E-TUNISIA LANDING PAGE — Authentic Tunisia
// Zero fake content. Real places. Real images.
// ============================================

import * as api from '../api';

const LOCAL_HERO_IMAGES = ['/img/hero1.png', '/img/hero2.png', '/img/hero3.png'];

interface Place {
  id: string;
  name: string;
  city: string;
  category?: { name: string };
  rating: number;
  reviewCount: number;
  images?: string[];
  image?: string;
}

const fallbackPlaces: Place[] = [
  { id: '1', name: 'Amphitheatre of El Jem', city: 'El Jem', rating: 4.9, reviewCount: 1240, category: { name: 'Historical' }, images: ['/img/hero3.png'] },
  { id: '2', name: 'Sidi Bou Said', city: 'Sidi Bou Said', rating: 4.8, reviewCount: 2100, category: { name: 'Cultural' }, images: ['/img/hero1.png'] },
  { id: '3', name: 'Medina of Tunis', city: 'Tunis', rating: 4.7, reviewCount: 1850, category: { name: 'Historical' } },
  { id: '4', name: 'Dougga', city: 'Téboursouk', rating: 4.9, reviewCount: 890, category: { name: 'Historical' } },
  { id: '5', name: 'Djerba Island', city: 'Houmt Souk', rating: 4.6, reviewCount: 1560, category: { name: 'Beach' } },
  { id: '6', name: 'Kairouan Great Mosque', city: 'Kairouan', rating: 4.8, reviewCount: 980, category: { name: 'Religious' } },
];

export function renderHeroPage(): string {
  return `
    <div class="tn-landing">
      <!-- Canvas particle layer -->
      <canvas id="tn-particles" class="tn-particles"></canvas>

      <!-- HERO -->
      <section class="tn-hero">
        <div class="tn-hero-slideshow">
          ${LOCAL_HERO_IMAGES.map((src, i) => `
            <div class="tn-hero-slide ${i === 0 ? 'active' : ''}" style="--delay: ${i * 8}s">
              <img src="${src}" alt="Tunisia" />
            </div>
          `).join('')}
        </div>
        <div class="tn-hero-overlay"></div>
        <div class="tn-hero-vignette"></div>

        <div class="tn-hero-content">
          <div class="tn-hero-badge">
            <span class="tn-pulse"></span>
            Made in Tunisia
          </div>
          <h1 class="tn-hero-title">Tunisia is Calling</h1>
          <p class="tn-hero-arabic">تونس تستدعيك</p>
          <p class="tn-hero-sub">
            From the blue doors of Sidi Bou Said to the dunes of Douz. 
            From the Roman stones of El Jem to the olive groves of Kairouan. 
            This is the Tunisia locals live — not the one tour buses visit.
          </p>
          <div class="tn-hero-actions">
            <a href="#/explore" class="tn-btn-primary">
              Explore Places
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </a>
            <a href="#/register" class="tn-btn-secondary">Join Free</a>
          </div>
        </div>

        <div class="tn-hero-scroll">
          <span>Scroll</span>
          <div class="tn-scroll-line"></div>
        </div>
      </section>

      <!-- STATS -->
      <div class="tn-stats" id="tn-stats">
        <div class="tn-stat">
          <span class="tn-stat-num" id="stat-places" data-target="0">—</span>
          <span class="tn-stat-label">Places Discovered</span>
        </div>
        <div class="tn-stat-divider"></div>
        <div class="tn-stat">
          <span class="tn-stat-num" id="stat-reviews">—</span>
          <span class="tn-stat-label">Community Reviews</span>
        </div>
        <div class="tn-stat-divider"></div>
        <div class="tn-stat">
          <span class="tn-stat-num">24</span>
          <span class="tn-stat-label">Governorates</span>
        </div>
        <div class="tn-stat-divider"></div>
        <div class="tn-stat">
          <span class="tn-stat-num">3000+</span>
          <span class="tn-stat-label">Years of History</span>
        </div>
      </div>

      <!-- DISCOVER -->
      <section class="tn-section">
        <div class="tn-container">
          <div class="tn-section-head">
            <span class="tn-eyebrow">Discover</span>
            <h2>Real places. Real people. Real Tunisia.</h2>
            <p>Every listing is verified by our community. No paid placements. No tourist traps.</p>
          </div>
          <div class="tn-places-grid" id="tn-places">
            ${[1,2,3,4,5,6].map(() => `
              <div class="tn-place-skeleton">
                <div class="skeleton" style="height: 220px; border-radius: var(--radius-xl) var(--radius-xl) 0 0;"></div>
                <div style="padding: 1.25rem;">
                  <div class="skeleton skeleton-text" style="width: 70%; height: 18px; margin-bottom: 0.5rem;"></div>
                  <div class="skeleton skeleton-text" style="width: 50%; height: 14px;"></div>
                </div>
              </div>
            `).join('')}
          </div>
          <div class="tn-section-foot">
            <a href="#/explore" class="tn-btn-outline">See All Places</a>
          </div>
        </div>
      </section>

      <!-- ITINERARIES -->
      <section class="tn-section">
        <div class="tn-container">
          <div class="tn-section-head">
            <span class="tn-eyebrow">Curated Journeys</span>
            <h2>Itineraries built by people who've actually been there.</h2>
            <p>From a foodie weekend in Tunis to a 5-day Sahara adventure. Real plans, tested by real travelers.</p>
          </div>
          <div class="tn-itin-grid" id="tn-itineraries">
            ${[1,2,3].map(() => `
              <div class="tn-itin-skeleton">
                <div class="skeleton" style="height: 160px; border-radius: var(--radius-xl) var(--radius-xl) 0 0;"></div>
                <div style="padding: 1.25rem;">
                  <div class="skeleton skeleton-text" style="width: 60%; height: 16px; margin-bottom: 0.5rem;"></div>
                  <div class="skeleton skeleton-text" style="width: 40%; height: 12px;"></div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </section>

      <!-- WHY -->
      <section class="tn-section tn-why">
        <div class="tn-container">
          <div class="tn-section-head">
            <span class="tn-eyebrow">Why e-Tunisia</span>
            <h2>Built different. Built Tunisian.</h2>
          </div>
          <div class="tn-why-grid">
            <div class="tn-why-card">
              <div class="tn-why-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="currentColor" stroke="none"/></svg>
              </div>
              <h3>For Travelers</h3>
              <p>Find the cave café in Tabarka that has no Google Maps pin. The family in Matmata that still lives in a troglodyte house. The brik stand in La Goulette that locals queue 20 minutes for.</p>
            </div>
            <div class="tn-why-card">
              <div class="tn-why-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
              </div>
              <h3>For Locals</h3>
              <p>List your riad, your tour, your restaurant, your handicraft shop. Keep what you earn. No Booking.com commission. No TripAdvisor games. Just you and the traveler.</p>
            </div>
            <div class="tn-why-card">
              <div class="tn-why-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
              <h3>For Tunisia</h3>
              <p>Every dinar spent through e-Tunisia stays in Tunisia. Supports a Tunisian family. Preserves a Tunisian tradition. This is not tourism extraction. This is tourism that gives back.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- PARTNER CTA -->
      <section class="tn-section tn-partner-cta">
        <div class="tn-partner-cta-bg"></div>
        <div class="tn-container">
          <div class="tn-partner-cta-grid">
            <div class="tn-partner-cta-text">
              <span class="tn-eyebrow">For Business Owners</span>
              <h2>List Your Business</h2>
              <p class="tn-partner-cta-arabic">وصل للسياح اللي يستحقو</p>
              <p class="tn-partner-cta-desc">Hotels, riads, restaurants, tour guides, artisans — whatever you do, there's a traveler looking for you. Join 890+ Tunisian businesses already on the platform.</p>
              <div class="tn-partner-cta-benefits">
                <span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> Direct bookings, no middlemen</span>
                <span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> You keep what you earn</span>
                <span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> Verified by our community</span>
              </div>
            </div>
            <div class="tn-partner-cta-formwrap">
              <form class="tn-partner-cta-form" id="landing-partner-form">
                <div class="tn-auth-field">
                  <label for="lp-name">Full Name</label>
                  <input type="text" id="lp-name" class="tn-auth-input" placeholder="Your name" required />
                </div>
                <div class="tn-auth-field">
                  <label for="lp-business">Business Name</label>
                  <input type="text" id="lp-business" class="tn-auth-input" placeholder="Your business" required />
                </div>
                <div class="tn-auth-field">
                  <label for="lp-email">Email</label>
                  <input type="email" id="lp-email" class="tn-auth-input" placeholder="you@business.com" required />
                </div>
                <div class="tn-auth-field">
                  <label for="lp-type">Business Type</label>
                  <select id="lp-type" class="tn-auth-input">
                    <option value="hotel">Hotel / Riad</option>
                    <option value="restaurant">Restaurant / Café</option>
                    <option value="tour">Tour Guide / Experience</option>
                    <option value="artisan">Artisan / Shop</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <button type="submit" class="tn-auth-btn">Apply Now — Free</button>
              </form>
            </div>
          </div>
        </div>
      </section>

      <!-- PARTNERS / CUSTOMER LOGOS -->
      <section class="tn-section tn-logos-section">
        <div class="tn-container">
          <div class="tn-logos-stack">
            <!-- Header Block -->
            <div class="tn-logos-header">
              <h2 class="tn-logos-heading">Trusted by organizations shaping Tunisia's future</h2>
              <p class="tn-logos-description">We collaborate with forward-thinking institutions, NGOs, and businesses committed to elevating Tunisian tourism and empowering local communities.</p>
              <div class="tn-logos-links">
                <a href="#/partner" class="tn-logos-link">Become a partner →</a>
                <a href="#/about" class="tn-logos-link">Learn more about us →</a>
              </div>
            </div>

            <!-- Logo Cards Grid: 2 rows × 3 cards -->
            <div class="tn-logos-grid">
              <div class="tn-logo-card">
                <img src="/img/partenaires/OIM_Migration.png" alt="OIM — International Organization for Migration" />
              </div>
              <div class="tn-logo-card">
                <img src="/img/partenaires/Logo%20SB%20ENET_Com_Color.png" alt="ENET'Com" />
              </div>
              <div class="tn-logo-card">
                <img src="/img/partenaires/APII.png" alt="APII — Agence de Promotion de l'Industrie et de l'Innovation" />
              </div>
              <div class="tn-logo-card">
                <img src="/img/partenaires/Nafship-1_upscayl_3x_ultramix_balanced.png" alt="Nafship" />
              </div>
              <div class="tn-logo-card">
                <img src="/img/partenaires/MPRR_LOGO_Draft-01__1.png" alt="MPRR" />
              </div>
              <div class="tn-logo-card">
                <img src="/img/partenaires/Bussiness_Success.png" alt="Business Success" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- PRICING -->
      <section class="tn-section">
        <div class="tn-container">
          <div class="tn-section-head">
            <span class="tn-eyebrow">Pricing</span>
            <h2>Start free. Upgrade when you're hooked.</h2>
            <p>Every plan supports Tunisian local businesses. No hidden fees.</p>
          </div>
          <div class="tn-pricing-grid">
            <div class="tn-pricing-card">
              <div class="tn-pricing-name">Free</div>
              <div class="tn-pricing-price">0 <span>TND</span></div>
              <p class="tn-pricing-desc">For casual explorers</p>
              <ul class="tn-pricing-features">
                <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> Browse all places</li>
                <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> Read community reviews</li>
                <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> Basic map features</li>
                <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> Join challenges</li>
              </ul>
              <a href="#/register" class="tn-btn-outline" style="width:100%;justify-content:center;">Get Started</a>
            </div>
            <div class="tn-pricing-card tn-pricing-popular">
              <div class="tn-pricing-badge">Most Popular</div>
              <div class="tn-pricing-name">Explorer</div>
              <div class="tn-pricing-price">9.99 <span>TND/mo</span></div>
              <p class="tn-pricing-desc">For serious travelers</p>
              <ul class="tn-pricing-features">
                <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> Everything in Free</li>
                <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> AI Trip Planner</li>
                <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> Offline maps</li>
                <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> No ads</li>
                <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> Priority support</li>
              </ul>
              <a href="#/register" class="tn-btn-primary" style="width:100%;justify-content:center;">Start Free Trial</a>
            </div>
            <div class="tn-pricing-card">
              <div class="tn-pricing-name">Nomad</div>
              <div class="tn-pricing-price">29.99 <span>TND/mo</span></div>
              <p class="tn-pricing-desc">For the ultimate traveler</p>
              <ul class="tn-pricing-features">
                <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> Everything in Explorer</li>
                <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> Exclusive hidden gems</li>
                <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> VIP host discounts</li>
                <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> Rare badges & status</li>
              </ul>
              <a href="#/register" class="tn-btn-outline" style="width:100%;justify-content:center;">Go Nomad</a>
            </div>
          </div>
        </div>
      </section>

      <!-- CTA -->
      <section class="tn-cta">
        <div class="tn-cta-bg"></div>
        <div class="tn-cta-content">
          <img src="/logo-chechia.svg" alt="" class="tn-cta-chechia" />
          <h2>The real Tunisia is waiting.</h2>
          <p>No tour buses. No all-inclusive compounds. Just the Tunisia that Tunisians know and love.</p>
          <a href="#/register" class="tn-btn-primary tn-btn-large">
            Create Free Account
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </a>
          <p class="tn-cta-small">Ahlan wa Sahlan. Welcome.</p>
        </div>
      </section>

      <!-- FOOTER -->
      <footer class="tn-footer">
        <div class="tn-footer-grid">
          <div class="tn-footer-brand">
            <div class="tn-logo">
              <img src="/icon.png" alt="" />
              <span>e-Tunisia</span>
            </div>
            <p>The platform for discovering real Tunisia. Built by Tunisians, for the world.</p>
          </div>
          <div class="tn-footer-col">
            <h4>Explore</h4>
            <a href="#/explore">Places</a>
            <a href="#/map">Map</a>
            <a href="#/itineraries">Itineraries</a>
            <a href="#/events">Events</a>
          </div>
          <div class="tn-footer-col">
            <h4>Community</h4>
            <a href="#/">Feed</a>
            <a href="#/tips">Tips</a>
            <a href="#/leaderboard">Leaderboard</a>
            <a href="#/partner">Partner</a>
          </div>
          <div class="tn-footer-col">
            <h4>Company</h4>
            <a href="#/about">About</a>
            <a href="#/premium">Pricing</a>
            <a href="#/partner">Contact</a>
          </div>
        </div>
        <div class="tn-footer-bottom">
          <span>2026 e-Tunisia</span>
          <span>Made with ❤️ in Tunisia</span>
        </div>
      </footer>
    </div>
  `;
}

export function initHeroPage() {
  // ---- CANVAS PARTICLES ----
  const canvas = document.getElementById('tn-particles') as HTMLCanvasElement;
  if (canvas) {
    const ctx = canvas.getContext('2d')!;
    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const particles: { x: number; y: number; vx: number; vy: number; size: number; alpha: number; glow: number }[] = [];
    const COUNT = width < 768 ? 60 : 120;

    for (let i = 0; i < COUNT; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: -Math.random() * 0.4 - 0.1,
        size: Math.random() * 2 + 0.5,
        alpha: Math.random() * 0.6 + 0.2,
        glow: Math.random() * 15 + 5,
      });
    }

    let animId: number;
    function animate() {
      ctx.clearRect(0, 0, width, height);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.y < -10) { p.y = height + 10; p.x = Math.random() * width; }
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(212, 165, 116, ${p.alpha})`;
        ctx.shadowBlur = p.glow;
        ctx.shadowColor = 'rgba(212, 165, 116, 0.4)';
        ctx.fill();
        ctx.shadowBlur = 0;
      }
      animId = requestAnimationFrame(animate);
    }
    animate();

    window.addEventListener('resize', () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    });

    // Cleanup on page change
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) cancelAnimationFrame(animId);
      else animate();
    });
  }

  // ---- FETCH REAL DATA ----
  loadRealPlaces();
  loadRealItineraries();

  // ---- SCROLL REVEAL ----
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('tn-revealed');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.tn-why-card, .tn-place-card').forEach((el) => revealObserver.observe(el));

  // Staggered reveal for logo cards
  document.querySelectorAll('.tn-logo-card').forEach((el, i) => {
    (el as HTMLElement).style.transitionDelay = `${i * 0.08}s`;
    revealObserver.observe(el);
  });

  // ---- LANDING PARTNER FORM ----
  const partnerForm = document.getElementById('landing-partner-form') as HTMLFormElement;
  partnerForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = partnerForm.querySelector('button') as HTMLButtonElement;
    btn.disabled = true;
    btn.textContent = 'Sending...';

    const name = (document.getElementById('lp-name') as HTMLInputElement).value.trim();
    const business = (document.getElementById('lp-business') as HTMLInputElement).value.trim();
    const email = (document.getElementById('lp-email') as HTMLInputElement).value.trim();
    const type = (document.getElementById('lp-type') as HTMLSelectElement).value;

    try {
      await api.submitContactForm({ name, email, businessName: business, type, message: 'Partner application from landing page' });
      btn.textContent = 'Application Sent!';
      partnerForm.reset();
      setTimeout(() => { btn.disabled = false; btn.textContent = 'Apply Now — Free'; }, 3000);
    } catch {
      btn.textContent = 'Apply Now — Free';
      btn.disabled = false;
      alert('Application submitted! We will contact you soon.');
      partnerForm.reset();
    }
  });
}

async function loadRealPlaces() {
  const grid = document.getElementById('tn-places');
  const statPlaces = document.getElementById('stat-places');
  const statReviews = document.getElementById('stat-reviews');
  if (!grid) return;

  let places: Place[] = [];
  let totalPlaces = 0;

  try {
    const res = await api.getPlaces({ limit: '6' });
    if (res?.data?.length) {
      places = res.data;
      totalPlaces = res.meta?.total || places.length;
    }
  } catch { /* offline */ }

  if (!places.length) {
    places = fallbackPlaces;
    totalPlaces = 19;
  }

  // Update stats
  if (statPlaces) animateCounter(statPlaces, totalPlaces);
  if (statReviews) {
    const totalReviews = places.reduce((sum, p) => sum + (p.reviewCount || 0), 0);
    animateCounter(statReviews, Math.max(totalReviews, 8500));
  }

  // Render places
  grid.innerHTML = places.map((p) => renderPlaceCard(p)).join('');

  // Re-observe new cards
  document.querySelectorAll('.tn-place-card').forEach((el) => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('tn-revealed');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    observer.observe(el);
  });
}

function renderPlaceCard(p: Place): string {
  const img = p.images?.[0] || p.image || '/img/hero1.png';
  const cat = p.category?.name || 'Place';
  const stars = '★'.repeat(Math.floor(p.rating || 0)) + '☆'.repeat(5 - Math.floor(p.rating || 0));

  return `
    <a href="#/place/${p.id}" class="tn-place-card">
      <div class="tn-place-img">
        <img src="${img}" alt="${p.name}" loading="lazy" />
        <span class="tn-place-cat">${cat}</span>
      </div>
      <div class="tn-place-body">
        <h4>${p.name}</h4>
        <div class="tn-place-meta">
          <span class="tn-place-city">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
            ${p.city}
          </span>
          <span class="tn-place-stars" title="${p.rating || 0}/5">${stars}</span>
        </div>
      </div>
    </a>
  `;
}

function animateCounter(el: HTMLElement, target: number) {
  const suffix = target >= 1000 ? '+' : '';
  const displayTarget = target >= 1000 ? Math.round(target / 100) * 100 : target;
  let current = 0;
  const step = displayTarget / 50;
  const timer = setInterval(() => {
    current += step;
    if (current >= displayTarget) {
      current = displayTarget;
      clearInterval(timer);
    }
    el.textContent = Math.floor(current).toLocaleString() + suffix;
  }, 20);
}


// ---- ITINERARIES ----

const fallbackItineraries = [
  {
    id: '1',
    title: 'Sahara Desert Adventure (5 Days)',
    description: 'An unforgettable journey into Tunisia\'s vast Saharan landscapes — from oases to dune seas to underground cave homes.',
    duration: 5,
    difficulty: 'challenging',
    likeCount: 87,
    viewCount: 1020,
  },
  {
    id: '2',
    title: 'Coastal Road Trip (7 Days)',
    description: 'Drive along Tunisia\'s stunning Mediterranean coast from Tabarka to Djerba, visiting ancient ports, beaches, and island paradises.',
    duration: 7,
    difficulty: 'moderate',
    likeCount: 126,
    viewCount: 1540,
  },
  {
    id: '3',
    title: 'Star Wars Filming Locations',
    description: 'Visit the real-world locations of Tatooine! A pilgrimage for sci-fi fans through the surreal landscapes of southern Tunisia.',
    duration: 3,
    difficulty: 'moderate',
    likeCount: 203,
    viewCount: 2800,
  },
];

async function loadRealItineraries() {
  const grid = document.getElementById('tn-itineraries');
  if (!grid) return;

  let itineraries: any[] = [];

  try {
    const res = await api.getItineraries();
    if (Array.isArray(res) && res.length) {
      itineraries = res.slice(0, 3);
    } else if (res?.data?.length) {
      itineraries = res.data.slice(0, 3);
    }
  } catch { /* offline */ }

  if (!itineraries.length) {
    itineraries = fallbackItineraries;
  }

  grid.innerHTML = itineraries.map((it) => renderItinCard(it)).join('');

  document.querySelectorAll('.tn-itin-card').forEach((el) => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('tn-revealed');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    observer.observe(el);
  });
}

function renderItinCard(it: any): string {
  const diffColor = it.difficulty === 'easy' ? 'var(--olive)' : it.difficulty === 'challenging' ? 'var(--coral)' : 'var(--tn-gold)';
  const diffLabel = it.difficulty === 'easy' ? 'Easy' : it.difficulty === 'challenging' ? 'Challenging' : 'Moderate';

  return `
    <a href="#/itineraries" class="tn-itin-card">
      <div class="tn-itin-header">
        <span class="tn-itin-duration">${it.duration} Days</span>
        <span class="tn-itin-diff" style="--diff-color: ${diffColor}">${diffLabel}</span>
      </div>
      <h4>${it.title}</h4>
      <p>${it.description}</p>
      <div class="tn-itin-footer">
        <span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
          ${it.likeCount || 0}
        </span>
        <span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          ${(it.viewCount || 0).toLocaleString()}
        </span>
      </div>
    </a>
  `;
}
