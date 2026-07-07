// Canvas-rendered shareable passport card — the "Wrapped" artifact.
//
// Draws a 1080×1350 (4:5, Instagram/WhatsApp-friendly) portrait card with the
// aurora-mesh identity from the design system: deep navy base, mediterranean /
// violet / terracotta glows, gold accents. No dependencies, no external assets
// (avatars are skipped in favor of a monogram disc so the canvas never taints).

export interface PassportCardData {
  fullName: string;
  handle: string;
  level?: string; // Bronze | Silver | Gold | ...
  country?: string | null;
  citiesVisited?: number;
  tripsPlanned?: number;
  reviewsCount?: number;
  badgesCount?: number;
  url: string;
}

const W = 1080;
const H = 1350;

const LEVEL_COLORS: Record<string, string> = {
  bronze: '#c98a5a',
  silver: '#b8c0cc',
  gold: '#e8b04b',
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
  ctx.strokeStyle = 'rgba(232, 176, 75, 0.75)';
  ctx.lineWidth = 3;
  ctx.setLineDash([10, 7]);
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.arc(cx, cy, radius - 22, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = 'rgba(232, 176, 75, 0.9)';
  ctx.font = '700 30px "Noto Kufi Arabic", Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('تونس', cx, cy + 2);

  ctx.font = '700 15px Inter, sans-serif';
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

  // ── Aurora backdrop ──
  ctx.fillStyle = '#0b0f1d';
  ctx.fillRect(0, 0, W, H);
  glow(ctx, W * 0.15, H * 0.12, 620, '#274b86', 0.55); // mediterranean
  glow(ctx, W * 0.95, H * 0.35, 560, '#5b3d8f', 0.45); // violet
  glow(ctx, W * 0.35, H * 0.95, 640, '#8a4a2c', 0.5);  // terracotta ember
  // Hairline frame
  ctx.strokeStyle = 'rgba(255,255,255,0.14)';
  ctx.lineWidth = 2;
  roundRect(ctx, 36, 36, W - 72, H - 72, 40);
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  // ── Kicker ──
  ctx.fillStyle = '#e8b04b';
  ctx.font = '700 26px Inter, sans-serif';
  spacedText(ctx, 'E-TUNISIA — TRAVEL PASSPORT', W / 2, 132, 8);

  // ── Monogram disc ──
  const mx = W / 2;
  const my = 330;
  const ringGrad = ctx.createLinearGradient(mx - 90, my - 90, mx + 90, my + 90);
  ringGrad.addColorStop(0, '#e8734a');
  ringGrad.addColorStop(1, '#e8b04b');
  ctx.beginPath();
  ctx.arc(mx, my, 96, 0, Math.PI * 2);
  ctx.strokeStyle = ringGrad;
  ctx.lineWidth = 6;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(mx, my, 84, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.fill();
  ctx.fillStyle = '#f5ede2';
  ctx.font = '800 84px Inter, sans-serif';
  ctx.textBaseline = 'middle';
  ctx.fillText((data.fullName || '?').trim().charAt(0).toUpperCase(), mx, my + 6);
  ctx.textBaseline = 'alphabetic';

  // ── Identity ──
  ctx.fillStyle = '#f5ede2';
  ctx.font = '800 68px Inter, sans-serif';
  ctx.fillText(data.fullName, W / 2, 540, W - 160);
  ctx.fillStyle = 'rgba(245,237,226,0.55)';
  ctx.font = '500 32px Inter, sans-serif';
  ctx.fillText(`@${data.handle}${data.country ? `  ·  ${data.country}` : ''}`, W / 2, 596, W - 200);

  // ── Level chip ──
  const levelRaw = (data.level || 'Explorer').trim();
  const levelColor = LEVEL_COLORS[levelRaw.toLowerCase()] || '#e8b04b';
  const chipText = `${levelRaw.toUpperCase()} EXPLORER`;
  ctx.font = '700 28px Inter, sans-serif';
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
    ctx.fillStyle = '#f5ede2';
    ctx.font = '800 76px Inter, sans-serif';
    ctx.fillText(String(num), cx, rowY);
    ctx.fillStyle = 'rgba(245,237,226,0.45)';
    ctx.font = '700 22px Inter, sans-serif';
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
  ctx.fillStyle = 'rgba(245,237,226,0.5)';
  ctx.font = '500 28px "JetBrains Mono", Inter, monospace';
  ctx.fillText(data.url.replace(/^https?:\/\//, ''), W / 2, H - 96, W - 160);

  return canvas;
}

export async function passportCardBlob(data: PassportCardData): Promise<Blob | null> {
  const canvas = await renderPassportCard(data);
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/png'));
}
