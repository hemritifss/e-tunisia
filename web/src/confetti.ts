// Lightweight, dependency-free confetti burst. Spawns a one-shot full-screen
// canvas, animates particles for ~1.6s, then removes itself. No-ops when the
// user prefers reduced motion.

interface ConfettiOptions {
  count?: number;
  /** Burst origin as a fraction of viewport height (0 = top, 1 = bottom). */
  originY?: number;
}

// Canvas cannot read CSS variables, so the palette tokens are inlined.
const PALETTE = ['#1E5FA8', '#4B8FD4', '#6BA6E8', '#8A7550', '#E7DECC', '#4A7A47'];

export function fireConfetti(opts: ConfettiOptions = {}): void {
  if (typeof window === 'undefined') return;
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

  const count = opts.count ?? 130;
  const W = window.innerWidth;
  const H = window.innerHeight;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  const canvas = document.createElement('canvas');
  canvas.style.cssText =
    'position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:99999';
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  if (!ctx) { canvas.remove(); return; }
  ctx.scale(dpr, dpr);

  const originX = W / 2;
  const originY = (opts.originY ?? 0.42) * H;

  const parts = Array.from({ length: count }, () => {
    const angle = Math.random() * Math.PI * 2;
    const speed = 6 + Math.random() * 9;
    return {
      x: originX,
      y: originY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - (5 + Math.random() * 5),
      size: 5 + Math.random() * 6,
      color: PALETTE[(Math.random() * PALETTE.length) | 0],
      rot: Math.random() * Math.PI,
      vrot: (Math.random() - 0.5) * 0.32,
    };
  });

  const GRAVITY = 0.26;
  const DURATION = 1600;
  const start = performance.now();

  const tick = (now: number) => {
    const t = now - start;
    ctx.clearRect(0, 0, W, H);
    const alpha = Math.max(0, 1 - t / DURATION);
    for (const p of parts) {
      p.vy += GRAVITY;
      p.vx *= 0.99;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vrot;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      ctx.restore();
    }
    if (t < DURATION) requestAnimationFrame(tick);
    else canvas.remove();
  };
  requestAnimationFrame(tick);
}
