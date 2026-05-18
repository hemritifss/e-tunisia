// ============================================
// Small shared UI utilities — toast, share, save, flags, votes
// Persists per-user-style toggles to localStorage so saves/likes/attends
// survive a page refresh until backend per-user tracking is in.
// ============================================

const SAVED_KEY = 'etunisia_saved_items'; // legacy bookmarks/saves namespace
const FLAGS_KEY = 'etunisia_flags';       // generic boolean flags ("event:abc:attend", "tip:xyz:like", etc.)
const VOTES_KEY = 'etunisia_votes';       // post-id → 'up'|'down'

function readMap<T>(key: string): Record<string, T> {
  try { return JSON.parse(localStorage.getItem(key) || '{}'); } catch { return {}; }
}
function writeMap<T>(key: string, m: Record<string, T>) {
  try { localStorage.setItem(key, JSON.stringify(m)); } catch {}
}

// ─── Saved bookmarks (legacy namespace) ───────────────────
export function isSaved(key: string): boolean {
  return !!readMap<true>(SAVED_KEY)[key];
}

export function toggleSaved(key: string): boolean {
  const map = readMap<true>(SAVED_KEY);
  if (map[key]) {
    delete map[key];
    writeMap(SAVED_KEY, map);
    return false;
  }
  map[key] = true;
  writeMap(SAVED_KEY, map);
  return true;
}

// ─── Generic flag (attend / like / etc.) ──────────────────
export function isFlagged(key: string): boolean {
  return !!readMap<true>(FLAGS_KEY)[key];
}

export function toggleFlag(key: string): boolean {
  const map = readMap<true>(FLAGS_KEY);
  if (map[key]) {
    delete map[key];
    writeMap(FLAGS_KEY, map);
    return false;
  }
  map[key] = true;
  writeMap(FLAGS_KEY, map);
  return true;
}

// ─── Post votes ───────────────────────────────────────────
export type VoteDir = 'up' | 'down' | null;

export function getVote(postId: string): VoteDir {
  const v = readMap<VoteDir>(VOTES_KEY)[postId];
  return v === 'up' || v === 'down' ? v : null;
}

export function setVote(postId: string, dir: VoteDir): void {
  const map = readMap<VoteDir>(VOTES_KEY);
  if (!dir) delete map[postId];
  else map[postId] = dir;
  writeMap(VOTES_KEY, map);
}

// ─── Guest-gate ───────────────────────────────────────────
// True if the user has a stored auth token.
export function isLoggedIn(): boolean {
  try {
    const t = localStorage.getItem('etunisia_token');
    return !!t && t !== 'undefined' && t !== 'null';
  } catch { return false; }
}

// Show a "Sign in to do this" toast + bounce to login. Returns true if the
// user is allowed to continue, false if redirected.
export function requireAuth(action = 'do this'): boolean {
  if (isLoggedIn()) return true;
  showToast(`Sign in to ${action}`, { type: 'info' });
  setTimeout(() => { location.hash = '#/login'; }, 700);
  return false;
}

let toastTimer: number | null = null;

export function showToast(message: string, opts: { type?: 'success' | 'info' | 'error' } = {}) {
  let toast = document.getElementById('ui-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'ui-toast';
    toast.className = 'ui-toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.dataset.type = opts.type || 'success';
  toast.classList.add('show');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    toast?.classList.remove('show');
  }, 2200);
}

/**
 * Auto-link #hashtags and @mentions inside post/comment bodies.
 * Returns safe HTML — does HTML-escape the surrounding text first.
 */
export function linkifyHashtagsAndMentions(text: string): string {
  if (!text) return '';
  // Escape HTML first
  const esc = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
  // Link hashtags (Unicode letter ranges so Arabic / French chars work)
  let out = esc.replace(
    /#([\p{L}\p{N}_]{1,40})/gu,
    (_, tag) => `<a class="hashtag-link" href="#/search?hashtag=${encodeURIComponent(tag)}">#${tag}</a>`,
  );
  // Link mentions: @first.last style — opens search for now since name→id resolution lives server-side later
  out = out.replace(
    /(^|\s)@([\p{L}\p{N}._-]{2,40})/gu,
    (_m, pre, name) => `${pre}<a class="mention-link" href="#/search?q=${encodeURIComponent('@' + name)}">@${name}</a>`,
  );
  return out;
}

export async function shareUrl(opts: { title?: string; text?: string; url?: string } = {}) {
  const url = opts.url || window.location.href;
  const title = opts.title || document.title;
  const text = opts.text || title;

  if (typeof navigator !== 'undefined' && (navigator as any).share) {
    try {
      await (navigator as any).share({ title, text, url });
      return;
    } catch {
      // user cancelled or share failed — fall through to clipboard
    }
  }

  try {
    await navigator.clipboard.writeText(url);
    showToast('Link copied to clipboard');
  } catch {
    showToast('Could not share link', { type: 'error' });
  }
}
