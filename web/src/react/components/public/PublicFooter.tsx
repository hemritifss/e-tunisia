import './public-chrome.css';

// Shared public footer (colophon) for guest island pages. Recreates Home's
// editorial footer with .pub-* classes. Link fixes (#12): Contact is a real
// mailto, Privacy and Terms point at routes that exist.

export default function PublicFooter() {
  return (
    <footer className="pub-footer">
      <div className="pub-footer-grid">
        <div className="pub-footer-brand">
          <a href="#/hero" className="pub-wordmark"><strong>e-Tunisia</strong><span>تونس</span></a>
          <p>The platform for discovering real Tunisia. Built by Tunisians, for the world.</p>
        </div>
        <div className="pub-footer-col">
          <h4>Explore</h4>
          <a href="#/explore">Places</a>
          <a href="#/map">Map</a>
          <a href="#/itineraries">Itineraries</a>
          <a href="#/events">Events</a>
        </div>
        <div className="pub-footer-col">
          <h4>Community</h4>
          <a href="#/">Feed</a>
          <a href="#/tips">Tips</a>
          <a href="#/leaderboard">Leaderboard</a>
          <a href="#/partner">Partner</a>
        </div>
        <div className="pub-footer-col">
          <h4>Company</h4>
          <a href="#/about">About</a>
          <a href="#/pro">Pricing</a>
          <a href="mailto:support@etunisia.com">Contact</a>
          <a href="#/privacy">Privacy</a>
          <a href="#/terms">Terms</a>
        </div>
      </div>
      <div className="pub-footer-bottom">
        <span>© 2026 e-Tunisia - Édition Nº 1</span>
        <span>
          Printed with
          {' '}<span className="pub-footer-heart" aria-hidden="true"><svg width="13" height="13" viewBox="0 0 24 24"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /></svg></span>
          <span className="pub-sr-only">love</span>
          {' '}in Tunis
        </span>
      </div>
    </footer>
  );
}
