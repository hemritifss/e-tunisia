// ============================================
// Small shared UI utilities — toast, share, save
// Used by feed, tips, post-detail, itineraries, etc.
// ============================================

const SAVED_KEY = 'etunisia_saved_items';

function getSaved(): Record<string, true> {
  try {
    return JSON.parse(localStorage.getItem(SAVED_KEY) || '{}');
  } catch {
    return {};
  }
}

function writeSaved(map: Record<string, true>) {
  localStorage.setItem(SAVED_KEY, JSON.stringify(map));
}

export function isSaved(key: string): boolean {
  return !!getSaved()[key];
}

export function toggleSaved(key: string): boolean {
  const map = getSaved();
  if (map[key]) {
    delete map[key];
    writeSaved(map);
    return false;
  }
  map[key] = true;
  writeSaved(map);
  return true;
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
