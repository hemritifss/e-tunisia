// ============================================
// HERO / LANDING PAGE — For unauthenticated users
// Highly dynamic, premium, animated UI
// ============================================

export function renderHeroPage(): string {
  return `
    <div class="hero-page page-enter">
      <!-- Ambient background blur blobs -->
      <div class="hero-ambient hero-ambient-1"></div>
      <div class="hero-ambient hero-ambient-2"></div>
      <div class="hero-ambient hero-ambient-3"></div>

      <!-- Navigation -->
      <nav class="hero-nav">
        <div class="hero-logo">
          <img src="/icon.png" alt="e-Tunisia" class="hero-logo-img spin-hover" />
          <span>e-Tunisia</span>
        </div>
        <div class="hero-nav-actions">
          <a href="#/login" class="hero-nav-link">Sign In</a>
          <a href="#/register" class="btn btn-primary hero-nav-btn">Join us</a>
        </div>
      </nav>

      <!-- Main Layout Split -->
      <div class="hero-split-container">
        
        <!-- Decorative Ambient Floaters -->
        <i class="lucide-sparkles float-animation" style="position:absolute; top: 15%; left: 5%; color: var(--accent); opacity: 0.6; font-size: 2rem;"></i>
        <i class="lucide-compass float-animation" style="position:absolute; bottom: 20%; left: 45%; color: var(--amber); opacity: 0.4; font-size: 3rem; animation-delay: 1s;"></i>

        <!-- Left: Typography & CTAs -->
        <div class="hero-content-left stagger-children">
          <div class="hero-badge-pill">
            <span class="pulse-dot"></span> The #1 Travel Community in North Africa
          </div>
          <h1 class="hero-title">
            Discover the Soul of<br>
            <span class="text-gradient">Tunisia</span> Together.
          </h1>
          <p class="hero-subtitle">
            Experience breathtaking landscapes from the golden Sahara to the Mediterranean breeze of Sidi Bou Said. Curate itineraries, earn badges, and share your journey with passionate explorers.
          </p>
          
          <div class="hero-actions">
            <a href="#/register" class="btn btn-primary btn-lg glow-btn">
              <span>Start Exploring</span> <i class="lucide-arrow-right"></i>
            </a>
            <a href="#/partner" class="btn btn-glass btn-lg">
              <i class="lucide-handshake"></i> Become a Partner
            </a>
          </div>

          <div class="hero-glass-stats">
            <div class="hero-stat avatar-stat">
              <div class="avatar-group">
                <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=64&q=80" alt="User 1" />
                <img src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=64&q=80" alt="User 2" />
                <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=64&q=80" alt="User 3" />
                <div class="avatar-more">+12K</div>
              </div>
              <span>Explorers</span>
            </div>
            <div class="hero-stat-divider"></div>
            <div class="hero-stat">
              <strong>2,500+</strong>
              <span>Destinations</span>
            </div>
            <div class="hero-stat-divider"></div>
            <div class="hero-stat">
              <strong>∞</strong>
              <span>Memories</span>
            </div>
          </div>
        </div>

        <!-- Right: Animated Image Collage -->
        <div class="hero-collage-right">
          <div class="hero-image-track hero-track-down">
            <div class="hero-img-card" style="background-image: url('https://images.unsplash.com/photo-1539020140153-e479b8c22e70?auto=format&fit=crop&q=80&w=600')">
              <div class="hero-img-caption"><i class="lucide-map-pin"></i> Sidi Bou Said</div>
            </div>
            <div class="hero-img-card" style="background-image: url('https://images.unsplash.com/photo-1503917988258-f87a78e3c995?auto=format&fit=crop&q=80&w=600')">
              <div class="hero-img-caption"><i class="lucide-map-pin"></i> Sahara Desert</div>
            </div>
          </div>
          <div class="hero-image-track hero-track-up">
            <div class="hero-img-card" style="background-image: url('https://images.unsplash.com/photo-1629807409243-984bb64d8518?auto=format&fit=crop&q=80&w=600')">
              <div class="hero-img-caption"><i class="lucide-map-pin"></i> El Jem Amphitheatre</div>
            </div>
            <div class="hero-img-card" style="background-image: url('https://images.unsplash.com/photo-1616086776162-811c7fae98b7?auto=format&fit=crop&q=80&w=600')">
              <div class="hero-img-caption"><i class="lucide-map-pin"></i> Carthage Ruins</div>
            </div>
          </div>
        </div>

      </div>

      <!-- Sponsors & Event Ads Marquee -->
      <div class="hero-sponsors-section reveal-on-scroll">
        <p class="hero-sponsors-title">TRUSTED BY & UPCOMING EVENTS</p>
        <marquee class="hero-marquee-container" scrollamount="15" scrolldelay="0" behavior="scroll" direction="left" loop="infinite" onmouseover="this.stop();" onmouseout="this.start();">
          <div class="hero-marquee-track">
            <div class="sponsor-item"><img src="/img/partenaires/APII.png" alt="APII" class="sponsor-partner-logo" /></div>
            <div class="sponsor-item"><img src="/img/partenaires/Best_Buy.png" alt="Best Buy" class="sponsor-partner-logo" /></div>
            <div class="sponsor-item"><img src="/img/partenaires/Bussiness_Success.png" alt="Business Success" class="sponsor-partner-logo" /></div>
            <div class="sponsor-item"><img src="/img/partenaires/Complexe_des_Jeunes.png" alt="Complexe des Jeunes" class="sponsor-partner-logo" /></div>
            <div class="sponsor-item"><img src="/img/partenaires/Jci%20Gremda.png" alt="JCI Gremda" class="sponsor-partner-logo" /></div>
            <div class="sponsor-item"><img src="/img/partenaires/Logo%20SB%20ENET_Com_Color.png" alt="ENET Com" class="sponsor-partner-logo" /></div>
            <div class="sponsor-item"><img src="/img/partenaires/MPRR_LOGO_Draft-01__1.png" alt="MPRR Logo" class="sponsor-partner-logo" /></div>
            <div class="sponsor-item"><img src="/img/partenaires/Nafship-1_upscayl_3x_ultramix_balanced.png" alt="Nafship" class="sponsor-partner-logo" /></div>
            <div class="sponsor-item"><img src="/img/partenaires/OIM_Migration.png" alt="OIM Migration" class="sponsor-partner-logo" /></div>
            <div class="sponsor-item"><img src="/img/partenaires/RNPE.png" alt="RNPE" class="sponsor-partner-logo" /></div>
            <div class="sponsor-item"><img src="/img/partenaires/Vie_art.png" alt="Vie Art" class="sponsor-partner-logo" /></div>
            <div class="sponsor-item"><img src="/img/partenaires/aisec.png" alt="Aisec" class="sponsor-partner-logo" /></div>
            <div class="sponsor-item"><img src="/img/partenaires/cafe_d_or.png" alt="Cafe d'Or" class="sponsor-partner-logo" /></div>
            <div class="sponsor-item"><img src="/img/partenaires/logo%20YE.png" alt="Logo YE" class="sponsor-partner-logo" /></div>
          </div>
        </marquee>
      </div>
      
      <!-- ABOUT US SECTION -->
      <section class="hero-about-section reveal-on-scroll">
        <div class="hero-container">
          <div class="hero-about-grid">
            <div class="hero-about-visuals float-animation">
              <div class="hero-about-img glow-effect" style="background-image: url('https://images.unsplash.com/photo-1588147775924-42f0b9f5e977?auto=format&fit=crop&q=80&w=800')"></div>
              
              <!-- Floating Badge over image -->
              <div class="floating-badge badge-top-right">
                <i class="lucide-check-circle-2 badge-icon"></i>
                <div class="badge-text">
                  <strong>Verified</strong>
                  <span>Local Guides</span>
                </div>
              </div>

              <!-- Secondary overlapping image overlay -->
              <div class="floating-visual-card">
                 <img src="https://images.unsplash.com/photo-1522881451255-f59ad836fdfb?auto=format&fit=crop&w=300&q=80" alt="Community gathering" />
              </div>
            </div>

            <div class="hero-about-content">
              <div class="pill-tag"><i class="lucide-shield"></i> Who we are</div>
              <h2>About e-Tunisia</h2>
              <p>We are a passionate community of local guides, photographers, and travelers dedicated to unveiling the true beauty of Tunisia. From the bustling medinas to the serene oases of the south, we empower authentic exploration while giving back to local businesses.</p>
              <ul class="hero-check-list stagger-children">
                <li><i class="lucide-heart-handshake"></i> Support local communities</li>
                <li><i class="lucide-leaf"></i> Sustainable & responsible tourism</li>
                <li><i class="lucide-map"></i> Uncover verified hidden gems</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <!-- PLATFORM DEEP DIVE (BENTO GRID) -->
      <section class="hero-bento-section">
        <div class="hero-container">
          <div class="text-center reveal-on-scroll" style="margin-bottom: var(--space-12);">
             <div class="pill-tag mx-auto mb-4"><i class="lucide-layers"></i> Features</div>
             <h2 class="section-title" style="font-size: 3rem; font-weight: 900;">Everything you need in one app</h2>
          </div>
          
          <div class="bento-grid stagger-children">
            <div class="bento-card bento-large has-bg-image group">
              <img class="bento-bg" src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=800&q=80" alt="Map interface" />
              <div class="bento-gradient"></div>
              <div class="bento-content">
                <div class="icon-blob"><i class="lucide-map" style="color: var(--accent);"></i></div>
                <h3>Interactive Maps</h3>
                <p>Find the best spots near you with our community-driven interactive map. Filter by categories, ratings, and accessibility.</p>
              </div>
            </div>
            
            <div class="bento-card has-bg-image group">
              <img class="bento-bg" src="https://images.unsplash.com/photo-1499696010180-025ef6e1a8f9?auto=format&fit=crop&w=600&q=80" alt="Curated paths" />
              <div class="bento-gradient"></div>
              <div class="bento-content">
                <div class="icon-blob blob-amber"><i class="lucide-route" style="color: var(--amber);"></i></div>
                <h3>Itineraries</h3>
                <p>Follow expert-curated adventure paths.</p>
              </div>
            </div>

            <div class="bento-card has-bg-image group">
               <img class="bento-bg" src="https://images.unsplash.com/photo-1555353540-64fd1b620924?auto=format&fit=crop&w=600&q=80" alt="Gamification" />
               <div class="bento-gradient"></div>
               <div class="bento-content">
                 <div class="icon-blob blob-primary"><i class="lucide-award" style="color: var(--primary);"></i></div>
                 <h3>Gamification</h3>
                 <p>Earn badges & reach the leaderboard top.</p>
               </div>
            </div>

            <div class="bento-card bento-wide has-bg-image group mt-2">
              <img class="bento-bg" src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80" alt="Community Social Feed" />
              <div class="bento-gradient"></div>
              <div class="bento-content bento-row">
                 <div class="icon-blob blob-success"><i class="lucide-message-square" style="color: var(--success);"></i></div>
                 <div>
                   <h3>Vibrant Social Feed</h3>
                   <p>Share your stories, photos, and tips with a network of thousands of daily active users discovering Tunisia.</p>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- COMMUNITY RULES -->
      <section class="hero-rules-section reveal-on-scroll">
        <div class="hero-container">
          <div class="text-center" style="margin-bottom: var(--space-12);">
             <div class="pill-tag mx-auto mb-4"><i class="lucide-book-open"></i> Guidelines</div>
             <h2 class="section-title" style="font-size: 3rem; font-weight: 900;">Community Rules</h2>
          </div>
          
          <div class="rules-grid stagger-children">
            <div class="rule-card">
              <div class="rule-img-banner">
                <img src="https://images.unsplash.com/photo-1473634047649-6f5dfa7fc8ed?auto=format&fit=crop&w=600&q=80" alt="Respect" />
              </div>
              <div class="rule-body">
                <div class="rule-icon float-animation" style="animation-delay: 0s"><i class="lucide-heart"></i></div>
                <h4>Be Respectful</h4>
                <p>Foster a welcoming environment for tourists and locals alike. Keep discussions civil.</p>
              </div>
            </div>

            <div class="rule-card">
              <div class="rule-img-banner">
                <img src="https://images.unsplash.com/photo-1452587925148-ce544e77e70d?auto=format&fit=crop&w=600&q=80" alt="Authenticity" />
              </div>
              <div class="rule-body">
                <div class="rule-icon float-animation" style="animation-delay: 1s"><i class="lucide-camera"></i></div>
                <h4>Authenticity</h4>
                <p>Share real experiences and genuine photos without misleading edits or filters.</p>
              </div>
            </div>

            <div class="rule-card">
              <div class="rule-img-banner">
                <img src="https://images.unsplash.com/photo-1556761175-5973e21e6ce4?auto=format&fit=crop&w=600&q=80" alt="No Spam" />
              </div>
              <div class="rule-body">
                <div class="rule-icon float-animation" style="animation-delay: 2s"><i class="lucide-shield-check"></i></div>
                <h4>No Spam</h4>
                <p>Keep the feed clean. Commercial promos belong strictly in the Partner Portal.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- FOOTER CTA -->
      <footer class="hero-footer-cta parallax-bg">
        <!-- Floating overlay assets for movement -->
        <img class="footer-float-asset f-asset-1 float-animation" src="https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=200&q=80" alt="Camera" style="animation-duration: 4s" />
        <img class="footer-float-asset f-asset-2 float-animation" src="https://images.unsplash.com/photo-1501504905252-473c47e087f8?auto=format&fit=crop&w=200&q=80" alt="Coffee" style="animation-duration: 5s" />
        <img class="footer-float-asset f-asset-3 float-animation" src="https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=200&q=80" alt="Passport" style="animation-duration: 6s" />

        <div class="footer-cta-content reveal-on-scroll">
          <h2>Ready to start your journey?</h2>
          <p>Join thousands of explorers discovering the magic of Tunisia.</p>
          <a href="#/register" class="btn btn-primary btn-lg glow-btn">
             <i class="lucide-user-plus"></i> Create Free Account
          </a>
        </div>
      </footer>

    </div>
  `;
}

export function initHeroPage() {
  // Simple cursor tracking for ambient glow
  const page = document.querySelector('.hero-page') as HTMLElement;
  if (page) {
    page.addEventListener('mousemove', (e) => {
      const x = e.clientX / window.innerWidth;
      const y = e.clientY / window.innerHeight;
      page.style.setProperty('--mouse-x', x.toString());
      page.style.setProperty('--mouse-y', y.toString());
    });
  }
}
