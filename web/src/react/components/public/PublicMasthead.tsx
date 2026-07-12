import { useEffect, useState } from 'react';
import './public-chrome.css';

// Shared public masthead for guest island pages. Recreates Home's editorial
// masthead with .pub-* classes so it renders on any page without loading
// landing-editorial.css. Sticky (not fixed) so it plays well with the island
// entrance transform and does not overlap page heroes.

type NavKey = 'explore' | 'itineraries' | 'about' | 'pricing';

interface PublicMastheadProps {
  active?: NavKey;
}

const NAV: { key: NavKey; label: string; href: string }[] = [
  { key: 'explore', label: 'Explore', href: '#/explore' },
  { key: 'itineraries', label: 'Itineraries', href: '#/itineraries' },
  { key: 'about', label: 'About', href: '#/about' },
  { key: 'pricing', label: 'Pricing', href: '#/pro' },
];

const BurgerIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
);

const CloseIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

export default function PublicMasthead({ active }: PublicMastheadProps) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false); };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [menuOpen]);

  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const close = () => setMenuOpen(false);

  return (
    <nav className={`pub-masthead${scrolled ? ' is-scrolled' : ''}`} aria-label="Primary">
      <div className="pub-masthead-strip" aria-hidden="true">
        <span>Vol. I - The traveler's edition</span>
        <span>{today} · Tunis, Tunisia</span>
      </div>
      <div className="pub-masthead-inner">
        <a href="#/hero" className="pub-wordmark"><strong>e-Tunisia</strong><span>تونس</span></a>
        <div className="pub-masthead-links">
          {NAV.map((item) => (
            <a key={item.key} href={item.href} className={active === item.key ? 'is-active' : undefined}>{item.label}</a>
          ))}
        </div>
        <div className="pub-masthead-actions">
          <a href="#/login" className="pub-login">Log in</a>
          <a href="#/register" className="pub-btn pub-btn--sm">Join free</a>
        </div>
        <button
          type="button"
          className="pub-burger"
          aria-label="Open menu"
          aria-expanded={menuOpen}
          aria-controls="pub-drawer"
          onClick={() => setMenuOpen(true)}
        >
          <BurgerIcon />
        </button>
      </div>

      {menuOpen && (
        <>
          <div className="pub-drawer-backdrop" onClick={close} aria-hidden="true" />
          <div id="pub-drawer" className="pub-drawer" role="dialog" aria-modal="true" aria-label="Menu">
            <div className="pub-drawer-head">
              <a href="#/hero" className="pub-wordmark" onClick={close}><strong>e-Tunisia</strong><span>تونس</span></a>
              <button type="button" className="pub-drawer-close" aria-label="Close menu" onClick={close}><CloseIcon /></button>
            </div>
            <nav className="pub-drawer-links" aria-label="Mobile">
              {NAV.map((item) => (
                <a key={item.key} href={item.href} onClick={close} className={active === item.key ? 'is-active' : undefined}>{item.label}</a>
              ))}
            </nav>
            <div className="pub-drawer-actions">
              <a href="#/login" className="pub-drawer-login" onClick={close}>Log in</a>
              <a href="#/register" className="pub-btn pub-btn--block" onClick={close}>Join free</a>
            </div>
          </div>
        </>
      )}
    </nav>
  );
}
