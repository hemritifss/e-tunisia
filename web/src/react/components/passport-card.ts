// Canvas-rendered shareable passport card — the "Wrapped" artifact.
//
// Draws a 1080×1350 (4:5, Instagram/WhatsApp-friendly) portrait card in the
// "Bled" night palette: deep navy base, Sidi Bou Said blue / azure glows and a
// stone-deep warm note. No dependencies, no external assets (avatars are
// skipped in favor of a monogram disc so the canvas never taints).
//
// Canvas cannot resolve CSS variables, so the tokens are inlined as hex here.
// They mirror the dark-theme values in styles/tokens.css.

export interface PassportCardData {
  fullName: string;
  handle: string;
  level?: string; // Bronze | Silver | Gold | ...
  country?: string | null;
  citiesVisited?: number;
  tripsPlanned?: number;
  reviewsCount?: number;
  badgesCount?: number;
  /** Founders' program: №1–1000 for the first accounts — gold edition card. */
  founderNumber?: number | null;
  url: string;
}

const W = 1080;
const H = 1350;

/** Night-palette ink and trim (dark-theme --text-primary / --warning). */
const INK = '#E8EEF7';
const GOLD_INK = '#C6B48C';

const LEVEL_COLORS: Record<string, string> = {
  bronze: '#c98a5a',
  silver: '#b8c0cc',
  gold: GOLD_INK,
  platinum: '#9fd8d0',
};

function glow(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, alpha: number) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color);
  g.addColorStop(1, 'transparent');
  ctx.globalAlpha = alpha;
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = 1;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Letter-spaced centered text (canvas has no letter-spacing of its own pre-2023). */
function spacedText(ctx: CanvasRenderingContext2D, text: string, cx: number, y: number, tracking: number) {
  const widths = [...text].map((ch) => ctx.measureText(ch).width);
  const total = widths.reduce((a, b) => a + b, 0) + tracking * (text.length - 1);
  let x = cx - total / 2;
  [...text].forEach((ch, i) => {
    ctx.fillText(ch, x, y);
    x += widths[i] + tracking;
  });
}

/** Dashed "visa stamp" ring with text on the arc — the editorial signature. */
function stamp(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number) {
  ctx.save();
  ctx.strokeStyle = 'rgba(198, 180, 140, 0.75)';
  ctx.lineWidth = 3;
  ctx.setLineDash([10, 7]);
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.arc(cx, cy, radius - 22, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = 'rgba(198, 180, 140, 0.9)';
  ctx.font = '700 30px "Noto Kufi Arabic", "Instrument Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('تونس', cx, cy + 2);

  ctx.font = '700 15px "Instrument Sans", sans-serif';
  const ringText = 'CARNET DE VOYAGE • E-TUNISIA • ';
  const chars = [...ringText];
  const step = (Math.PI * 2) / chars.length;
  chars.forEach((ch, i) => {
    const a = i * step - Math.PI / 2;
    ctx.save();
    ctx.translate(cx + Math.cos(a) * (radius - 11), cy + Math.sin(a) * (radius - 11));
    ctx.rotate(a + Math.PI / 2);
    ctx.fillText(ch, 0, 0);
    ctx.restore();
  });
  ctx.restore();
}

export async function renderPassportCard(data: PassportCardData): Promise<HTMLCanvasElement> {
  try { await (document as any).fonts?.ready; } catch { /* draw with fallbacks */ }

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // ── Night backdrop ──
  ctx.fillStyle = '#0E1520';
  ctx.fillRect(0, 0, W, H);
  glow(ctx, W * 0.15, H * 0.12, 620, '#1E5FA8', 0.55); // Sidi Bou Said blue
  glow(ctx, W * 0.95, H * 0.35, 560, '#4B8FD4', 0.45); // azure
  glow(ctx, W * 0.35, H * 0.95, 640, '#8A7550', 0.5);  // stone-deep
  // Frame — founders get the permanent stone-trimmed edition.
  const isFounder = !!data.founderNumber;
  ctx.strokeStyle = isFounder ? 'rgba(198,180,140,0.85)' : 'rgba(255,255,255,0.14)';
  ctx.lineWidth = isFounder ? 5 : 2;
  roundRect(ctx, 36, 36, W - 72, H - 72, 40);
  ctx.stroke();
  if (isFounder) {
    ctx.strokeStyle = 'rgba(198,180,140,0.35)';
    ctx.lineWidth = 1.5;
    roundRect(ctx, 52, 52, W - 104, H - 104, 32);
    ctx.stroke();
  }

  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  // ── Kicker ──
  ctx.fillStyle = GOLD_INK;
  ctx.font = '700 26px "Instrument Sans", sans-serif';
  spacedText(ctx, 'E-TUNISIA — TRAVEL PASSPORT', W / 2, 132, 8);

  // ── Founder ribbon ──
  if (isFounder) {
    const fText = `FOUNDER #${String(data.founderNumber).padStart(4, '0')}`;
    // Instrument Sans tops out at 700; heavier weights would only be faux-bolded.
    ctx.font = '700 24px "Instrument Sans", sans-serif';
    const fW = ctx.measureText(fText).width + 70;
    roundRect(ctx, W / 2 - fW / 2, 158, fW, 52, 26);
    ctx.fillStyle = 'rgba(198,180,140,0.14)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(198,180,140,0.9)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#E3D5B5';
    spacedText(ctx, fText, W / 2, 192, 3);
  }

  // ── Monogram disc ──
  const mx = W / 2;
  const my = 330;
  const ringGrad = ctx.createLinearGradient(mx - 90, my - 90, mx + 90, my + 90);
  ringGrad.addColorStop(0, '#1E5FA8');
  ringGrad.addColorStop(1, '#6BA6E8');
  ctx.beginPath();
  ctx.arc(mx, my, 96, 0, Math.PI * 2);
  ctx.strokeStyle = ringGrad;
  ctx.lineWidth = 6;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(mx, my, 84, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.fill();
  ctx.fillStyle = INK;
  // Instrument Serif ships a single 400 weight — asking for bold gets a fake one.
  ctx.font = '400 84px "Instrument Serif", Georgia, serif';
  ctx.textBaseline = 'middle';
  ctx.fillText((data.fullName || '?').trim().charAt(0).toUpperCase(), mx, my + 6);
  ctx.textBaseline = 'alphabetic';

  // ── Identity ──
  ctx.fillStyle = INK;
  ctx.font = '400 68px "Instrument Serif", Georgia, serif';
  ctx.fillText(data.fullName, W / 2, 540, W - 160);
  ctx.fillStyle = 'rgba(232,238,247,0.55)';
  ctx.font = '500 32px "Instrument Sans", sans-serif';
  ctx.fillText(`@${data.handle}${data.country ? `  ·  ${data.country}` : ''}`, W / 2, 596, W - 200);

  // ── Level chip ──
  const levelRaw = (data.level || 'Explorer').trim();
  const levelColor = LEVEL_COLORS[levelRaw.toLowerCase()] || GOLD_INK;
  const chipText = `${levelRaw.toUpperCase()} EXPLORER`;
  ctx.font = '700 28px "Instrument Sans", sans-serif';
  const chipW = ctx.measureText(chipText).width + 96;
  roundRect(ctx, W / 2 - chipW / 2, 646, chipW, 66, 33);
  ctx.fillStyle = 'rgba(255,255,255,0.07)';
  ctx.fill();
  ctx.strokeStyle = levelColor;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.fillStyle = levelColor;
  ctx.fillText(chipText, W / 2, 690);

  // ── Stats row ──
  const stats: Array<[number, string]> = [
    [data.citiesVisited ?? 0, 'CITIES'],
    [data.tripsPlanned ?? 0, 'TRIPS'],
    [data.reviewsCount ?? 0, 'REVIEWS'],
    [data.badgesCount ?? 0, 'BADGES'],
  ];
  const rowY = 880;
  const colW = (W - 160) / stats.length;
  stats.forEach(([num, label], i) => {
    const cx = 80 + colW * i + colW / 2;
    ctx.fillStyle = INK;
    ctx.font = '700 76px "Instrument Sans", sans-serif';
    ctx.fillText(String(num), cx, rowY);
    ctx.fillStyle = 'rgba(232,238,247,0.45)';
    ctx.font = '700 22px "Instrument Sans", sans-serif';
    spacedText(ctx, label, cx, rowY + 46, 4);
    if (i > 0) {
      ctx.strokeStyle = 'rgba(255,255,255,0.12)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(80 + colW * i, rowY - 66);
      ctx.lineTo(80 + colW * i, rowY + 40);
      ctx.stroke();
    }
  });

  // ── Stamp ──
  stamp(ctx, W - 230, H - 250, 105);

  // ── Footer URL ──
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(232,238,247,0.5)';
  ctx.font = '500 28px "JetBrains Mono", monospace';
  ctx.fillText(data.url.replace(/^https?:\/\//, ''), W / 2, H - 96, W - 160);

  return canvas;
}

export async function passportCardBlob(data: PassportCardData): Promise<Blob | null> {
  const canvas = await renderPassportCard(data);
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/png'));
}
