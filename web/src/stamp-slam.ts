// The check-in "stamp slam" — the signature carnet moment. On a first-ever
// check-in, a rubber stamp thunks down over the screen, an ink ring ripples
// out, then it settles and fades. Same one-shot, self-removing, dependency-free
// idiom as confetti.ts. Honors prefers-reduced-motion (shows a calm static
// stamp instead of the slam).

import { renderStampSVG } from './stamp';

export interface StampSlamOptions {
  title: string;
  city?: string;
  /** Bottom arc text; defaults to today's date · TUNISIE. */
  bottom?: string;
}

let busy = false;

export function stampSlam(opts: StampSlamOptions): void {
  if (typeof document === 'undefined') return;
  if (busy) return; // never stack two slams
  busy = true;

  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const dateStr = new Date()
    .toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })
    .toUpperCase();

  const overlay = document.createElement('div');
  overlay.className = 'stamp-slam' + (reduced ? ' is-reduced' : '');
  overlay.setAttribute('role', 'status');
  overlay.setAttribute('aria-live', 'polite');
  overlay.innerHTML = `
    <div class="stamp-slam-stage">
      <span class="stamp-slam-ripple" aria-hidden="true"></span>
      <div class="stamp-slam-disc">
        ${renderStampSVG({ title: opts.title, city: opts.city, bottom: opts.bottom || `${dateStr} · TUNISIE` })}
      </div>
    </div>`;
  document.body.appendChild(overlay);

  const done = () => {
    overlay.remove();
    busy = false;
  };

  // Total on-screen time: slam+hold+fade (~1.5s) or a calm ~1.1s when reduced.
  const life = reduced ? 1100 : 1500;
  const t = window.setTimeout(() => {
    overlay.classList.add('is-leaving');
    window.setTimeout(done, 260);
  }, life);

  // Let a tap dismiss early (skip the hold).
  overlay.addEventListener('click', () => {
    window.clearTimeout(t);
    overlay.classList.add('is-leaving');
    window.setTimeout(done, 200);
  });
}
