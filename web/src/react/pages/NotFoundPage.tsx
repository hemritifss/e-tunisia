import '../../styles/not-found.css';
// 404 — the lost letter (UNIQUENESS §6.10, carnet Journal dialect).
// A wrong URL is a letter that couldn't be delivered: a returned envelope,
// postmarked, stamped ADDRESS UNKNOWN, with the way home in letterpress.
import React, { useEffect } from 'react';
import { track } from '../../analytics';
import { currentRoute } from '../../router';
import { Postmark } from './landing/ephemera';

export default function NotFoundPage() {
  // The router normalizes legacy #/ hashes onto the pathname — read the
  // route through it, not location.hash.
  const path = currentRoute() || '/';

  useEffect(() => {
    track('404_view', { path });
  }, [path]);

  return (
    <div className="nf-page cn-grain">
      <div className="nf-envelope" role="img" aria-label={`Page ${path} not found — returned to sender`}>
        {/* postage corner */}
        <span className="nf-stamp" aria-hidden="true"><img src="/logo-chechia.svg" alt="" /></span>
        <Postmark className="nf-postmark" />

        {/* the address that couldn't be found */}
        <div className="nf-address" aria-hidden="true">
          <span className="nf-hand">to: the page at</span>
          <span className="nf-path">{path}</span>
          <span className="nf-addr-line" />
          <span className="nf-hand">somewhere in tunisia…</span>
          <span className="nf-addr-line" />
        </div>

        {/* the cancellation */}
        <div className="nf-returned" aria-hidden="true">
          <span>Return to sender</span>
          <strong>Address unknown</strong>
          <span className="nf-returned-ar">عنوان مجهول</span>
        </div>
      </div>

      <p className="nf-note">
        <span className="nf-hand">this page wandered off the map — happens to the best travelers.</span>
      </p>

      <div className="nf-actions">
        <a href="#/" className="cn-btn nf-btn">Back to the carnet</a>
        <a href="#/explore" className="nf-link">Explore instead</a>
      </div>

      <span className="nf-code" aria-hidden="true">ERR Nº 404 — undeliverable</span>
    </div>
  );
}
