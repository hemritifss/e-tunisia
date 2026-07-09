// ============================================
// E-TUNISIA — Referral capture
// ============================================
// A shared referral link can land on ANY page (the OG passport card, a place,
// the register form). We stash the `ref` handle the moment it appears in the URL
// so it survives in-app navigation and is still there when the visitor finally
// signs up — closing the "share → visit → later signup" loop.

const KEY = 'etunisia_ref';

function readRefFromUrl(): string | null {
  try {
    const q = new URLSearchParams(location.search).get('ref');
    if (q) return q;
    // Hash-routed links: #/u/handle?ref=...
    const h = location.hash;
    const i = h.indexOf('?');
    if (i !== -1) {
      const r = new URLSearchParams(h.slice(i + 1)).get('ref');
      if (r) return r;
    }
  } catch { /* ignore */ }
  return null;
}

/** Persist a `ref` from the current URL, if present. Safe to call repeatedly. */
export function captureRefFromUrl(): void {
  const r = readRefFromUrl();
  if (r && r.trim()) {
    try { localStorage.setItem(KEY, r.trim().toLowerCase()); } catch { /* quota */ }
  }
}

/** The stored referrer handle, if the visitor arrived via a referral link. */
export function getStoredRef(): string | undefined {
  try { return localStorage.getItem(KEY) || undefined; } catch { return undefined; }
}

/** Clear after a successful signup so it can't leak into a later account. */
export function clearStoredRef(): void {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
}

// Capture immediately on import (app boot).
captureRefFromUrl();
