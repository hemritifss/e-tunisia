import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  X, Type, Smile, Trash2, ImageIcon, Undo2, ArrowLeft, Palette, Wand2, AlignLeft,
  Crop, RotateCw, RotateCcw, SlidersHorizontal, Maximize2, Minimize2, RefreshCw,
} from 'lucide-react';
import { api } from '../../shared/api';

/**
 * Facebook-style story creator.
 *
 * Two modes, one exporter:
 *  - Text story  — gradient/solid background + auto-fitting centered text.
 *  - Photo story — framed photo (zoom / pan / rotate / fit-fill) + filter +
 *    adjustments + draggable text and sticker overlays.
 *
 * WYSIWYG contract: the preview stage is measured, and `photoLayout()` drives
 * both the DOM preview and the 1080×1920 canvas export, so what you see is
 * exactly what is posted. (The previous version discarded every overlay and
 * flattened them into a caption string.)
 */

const OUT_W = 1080;
const OUT_H = 1920;

type Mode = 'choose' | 'text' | 'photo';
type Panel = 'none' | 'stickers' | 'background' | 'filters' | 'font' | 'crop' | 'adjust';

interface Overlay {
  id: string;
  kind: 'text' | 'emoji';
  text: string;
  /** Position + size as fractions of the stage, so preview and canvas agree. */
  x: number;
  y: number;
  size: number; // fraction of stage width
  color: string;
  fontId: string;
}

interface Transform {
  zoom: number;      // multiplier over the base fit
  offsetX: number;   // fraction of stage width
  offsetY: number;   // fraction of stage width (same unit → aspect-independent)
  rotation: number;  // degrees
  fit: 'fill' | 'fit';
}

interface Adjust {
  brightness: number;
  contrast: number;
  saturation: number;
}

interface Background { id: string; label: string; from: string; to: string }
interface FontSpec { id: string; label: string; css: string; weight: number }
interface FilterSpec { id: string; label: string; css: string }

const BACKGROUNDS: Background[] = [
  { id: 'ink', label: 'Ink', from: '#1f2937', to: '#0b1220' },
  { id: 'sunset', label: 'Sunset', from: '#ff8a3d', to: '#c9184a' },
  { id: 'sea', label: 'Sea', from: '#1e6091', to: '#48cae4' },
  { id: 'olive', label: 'Olive', from: '#606c38', to: '#283618' },
  { id: 'sand', label: 'Sand', from: '#e9c46a', to: '#c1121f' },
  { id: 'jasmine', label: 'Jasmine', from: '#f7f3e8', to: '#d9c9a3' },
  { id: 'night', label: 'Night', from: '#2b2d42', to: '#8d99ae' },
  { id: 'rose', label: 'Rose', from: '#ff7096', to: '#7b2d55' },
];

const FONTS: FontSpec[] = [
  { id: 'clean', label: 'Clean', css: "system-ui, -apple-system, 'Segoe UI', sans-serif", weight: 800 },
  { id: 'classic', label: 'Classic', css: "Georgia, 'Times New Roman', serif", weight: 700 },
  { id: 'typewriter', label: 'Typewriter', css: "'Courier New', Courier, monospace", weight: 700 },
  { id: 'poster', label: 'Poster', css: "Impact, 'Arial Black', system-ui, sans-serif", weight: 400 },
];

const FILTERS: FilterSpec[] = [
  { id: 'none', label: 'Original', css: '' },
  { id: 'mono', label: 'Mono', css: 'grayscale(1) contrast(1.1)' },
  { id: 'warm', label: 'Warm', css: 'saturate(1.3) sepia(0.22) contrast(1.05)' },
  { id: 'cool', label: 'Cool', css: 'saturate(1.1) hue-rotate(-12deg) brightness(1.05)' },
  { id: 'vintage', label: 'Vintage', css: 'sepia(0.5) contrast(0.95) saturate(0.85)' },
  { id: 'fade', label: 'Fade', css: 'contrast(0.88) brightness(1.12) saturate(0.8)' },
  { id: 'punch', label: 'Punch', css: 'contrast(1.25) saturate(1.5)' },
];

const TEXT_COLORS = ['#ffffff', '#111111', '#ffd166', '#ef476f', '#06d6a0', '#4cc9f0'];
const STICKERS = ['❤️', '🔥', '👏', '😂', '😍', '🎉', '✨', '🇹🇳', '📸', '🌅', '🌊', '🏖️', '🕌', '🐪', '🍵', '⭐'];

const DEFAULT_TRANSFORM: Transform = { zoom: 1, offsetX: 0, offsetY: 0, rotation: 0, fit: 'fill' };
const DEFAULT_ADJUST: Adjust = { brightness: 1, contrast: 1, saturation: 1 };

const fontById = (id: string) => FONTS.find((f) => f.id === id) || FONTS[0];
const bgById = (id: string) => BACKGROUNDS.find((b) => b.id === id) || BACKGROUNDS[0];
const filterById = (id: string) => FILTERS.find((f) => f.id === id) || FILTERS[0];

const gradientCss = (bg: Background) => `linear-gradient(135deg, ${bg.from} 0%, ${bg.to} 100%)`;

/** One filter string for preview and canvas alike. */
function filterString(preset: FilterSpec, adj: Adjust): string {
  const parts = [preset.css];
  if (adj.brightness !== 1) parts.push(`brightness(${adj.brightness})`);
  if (adj.contrast !== 1) parts.push(`contrast(${adj.contrast})`);
  if (adj.saturation !== 1) parts.push(`saturate(${adj.saturation})`);
  const s = parts.filter(Boolean).join(' ').trim();
  return s || 'none';
}

/**
 * Where the photo sits inside a stage of size (SW, SH).
 * Used by both the preview and the export — this is the WYSIWYG contract.
 * Rotation is applied about the centre, so bounds use the unrotated box.
 */
function photoLayout(iw: number, ih: number, SW: number, SH: number, t: Transform) {
  if (!iw || !ih) return { w: 0, h: 0, cx: SW / 2, cy: SH / 2 };
  const base = t.fit === 'fill'
    ? Math.max(SW / iw, SH / ih)
    : Math.min(SW / iw, SH / ih);
  const scale = base * t.zoom;
  return {
    w: iw * scale,
    h: ih * scale,
    cx: SW / 2 + t.offsetX * SW,
    cy: SH / 2 + t.offsetY * SW,
  };
}

/** Text-story sizing: long text shrinks, exactly like the native composers. */
function autoTextSize(len: number): number {
  if (len <= 24) return 0.13;
  if (len <= 60) return 0.10;
  if (len <= 120) return 0.078;
  if (len <= 200) return 0.062;
  return 0.05;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** Canvas word-wrap. Returns the lines that fit within maxWidth. */
function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const out: string[] = [];
  for (const paragraph of text.split('\n')) {
    if (!paragraph.trim()) { out.push(''); continue; }
    let line = '';
    for (const word of paragraph.split(/\s+/)) {
      const attempt = line ? `${line} ${word}` : word;
      if (ctx.measureText(attempt).width > maxWidth && line) {
        out.push(line);
        line = word;
      } else {
        line = attempt;
      }
    }
    if (line) out.push(line);
  }
  return out;
}

interface Props {
  onClose: () => void;
}

export default function StoryComposer({ onClose }: Props) {
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  const [mode, setMode] = useState<Mode>('choose');
  const [image, setImage] = useState<string | null>(null);
  const [imgSize, setImgSize] = useState<{ w: number; h: number } | null>(null);
  const [stageSize, setStageSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
  const [transform, setTransform] = useState<Transform>(DEFAULT_TRANSFORM);
  const [adjust, setAdjust] = useState<Adjust>(DEFAULT_ADJUST);
  const [bgId, setBgId] = useState(BACKGROUNDS[0].id);
  const [filterId, setFilterId] = useState(FILTERS[0].id);
  const [fontId, setFontId] = useState(FONTS[0].id);
  const [storyText, setStoryText] = useState('');
  const [textColor, setTextColor] = useState('#ffffff');
  const [overlays, setOverlays] = useState<Overlay[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [panel, setPanel] = useState<Panel>('none');
  const [caption, setCaption] = useState('');
  const [error, setError] = useState<string | null>(null);

  const bg = bgById(bgId);
  const preset = filterById(filterId);
  const font = fontById(fontId);
  const activeOverlay = overlays.find((o) => o.id === activeId) || null;
  const css = useMemo(() => filterString(preset, adjust), [preset, adjust]);

  const canShare = mode === 'photo' ? !!image : storyText.trim().length > 0;
  const isDirty = !!image || !!storyText.trim() || overlays.length > 0;

  // Measure the stage so preview px and export px stay proportional.
  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      setStageSize({ w: r.width, h: r.height });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [mode]);

  const requestClose = useCallback(() => {
    if (isDirty && !window.confirm('Discard this story?')) return;
    onClose();
  }, [isDirty, onClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') requestClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [requestClose]);

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = (ev.target?.result as string) || '';
      if (!dataUrl) return;
      try {
        const img = await loadImage(dataUrl);
        setImgSize({ w: img.naturalWidth, h: img.naturalHeight });
      } catch { setImgSize(null); }
      setImage(dataUrl);
      setTransform(DEFAULT_TRANSFORM);
      setAdjust(DEFAULT_ADJUST);
      setMode('photo');
    };
    reader.readAsDataURL(file);
  };

  const addOverlay = useCallback((kind: 'text' | 'emoji', text: string) => {
    const id = `${kind}_${Date.now()}`;
    setOverlays((prev) => [...prev, {
      id, kind, text,
      x: 0.5, y: 0.5,
      size: kind === 'emoji' ? 0.16 : 0.09,
      color: kind === 'emoji' ? '#ffffff' : textColor,
      fontId,
    }]);
    setActiveId(id);
    setPanel('none');
  }, [textColor, fontId]);

  // Adds an empty text overlay and focuses the inline editor, so the text is
  // typed live on the stage rather than through a blocking window.prompt().
  const addText = () => addOverlay('text', 'Your text');

  const updateActive = (patch: Partial<Overlay>) => {
    if (!activeId) return;
    setOverlays((prev) => prev.map((o) => (o.id === activeId ? { ...o, ...patch } : o)));
  };

  const deleteOverlay = (id: string) => {
    setOverlays((prev) => prev.filter((o) => o.id !== id));
    setActiveId(null);
  };

  const undo = () => { setOverlays((prev) => prev.slice(0, -1)); setActiveId(null); };

  const patchT = (p: Partial<Transform>) => setTransform((t) => ({ ...t, ...p }));
  const resetFrame = () => setTransform(DEFAULT_TRANSFORM);

  // Overlay drag — pointer events, so touch works (the old version was mouse-only).
  const startOverlayDrag = (id: string, e: React.PointerEvent) => {
    e.stopPropagation();
    setActiveId(id);
    const stage = stageRef.current;
    if (!stage) return;
    const rect = stage.getBoundingClientRect();
    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);

    const move = (ev: PointerEvent) => {
      const x = (ev.clientX - rect.left) / rect.width;
      const y = (ev.clientY - rect.top) / rect.height;
      setOverlays((prev) => prev.map((o) => (o.id === id
        ? { ...o, x: Math.min(0.97, Math.max(0.03, x)), y: Math.min(0.97, Math.max(0.03, y)) }
        : o)));
    };
    const up = () => {
      target.releasePointerCapture(e.pointerId);
      target.removeEventListener('pointermove', move);
      target.removeEventListener('pointerup', up);
    };
    target.addEventListener('pointermove', move);
    target.addEventListener('pointerup', up);
  };

  // Pan the photo by dragging the stage background.
  const startPan = (e: React.PointerEvent) => {
    setActiveId(null);
    if (mode !== 'photo' || !image) return;
    const stage = stageRef.current;
    if (!stage) return;
    const rect = stage.getBoundingClientRect();
    const target = e.currentTarget as HTMLElement;
    const startX = e.clientX;
    const startY = e.clientY;
    const t0 = transform;
    target.setPointerCapture(e.pointerId);

    const move = (ev: PointerEvent) => {
      patchT({
        offsetX: t0.offsetX + (ev.clientX - startX) / rect.width,
        offsetY: t0.offsetY + (ev.clientY - startY) / rect.width,
      });
    };
    const up = () => {
      target.releasePointerCapture(e.pointerId);
      target.removeEventListener('pointermove', move);
      target.removeEventListener('pointerup', up);
    };
    target.addEventListener('pointermove', move);
    target.addEventListener('pointerup', up);
  };

  const onWheel = (e: React.WheelEvent) => {
    if (mode !== 'photo' || !image) return;
    const next = Math.min(4, Math.max(0.5, transform.zoom * (e.deltaY < 0 ? 1.06 : 0.94)));
    patchT({ zoom: Number(next.toFixed(3)) });
  };

  /** Composite the real 1080×1920 image — the preview mirrors this exactly. */
  const renderToDataUrl = useCallback(async (): Promise<string> => {
    const canvas = document.createElement('canvas');
    canvas.width = OUT_W;
    canvas.height = OUT_H;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas unavailable');

    if (mode === 'photo' && image) {
      const img = await loadImage(image);
      const iw = img.naturalWidth;
      const ih = img.naturalHeight;

      // "Fit" leaves bars — fill them with a blurred cover copy, like Facebook.
      if (transform.fit === 'fit') {
        const cover = photoLayout(iw, ih, OUT_W, OUT_H, { ...DEFAULT_TRANSFORM, fit: 'fill' });
        ctx.save();
        ctx.filter = 'blur(48px) brightness(0.65)';
        ctx.drawImage(img, cover.cx - cover.w / 2, cover.cy - cover.h / 2, cover.w, cover.h);
        ctx.restore();
      }

      const { w, h, cx, cy } = photoLayout(iw, ih, OUT_W, OUT_H, transform);
      ctx.save();
      ctx.filter = css;
      ctx.translate(cx, cy);
      ctx.rotate((transform.rotation * Math.PI) / 180);
      ctx.drawImage(img, -w / 2, -h / 2, w, h);
      ctx.restore();
      ctx.filter = 'none';
    } else {
      const grad = ctx.createLinearGradient(0, 0, OUT_W, OUT_H); // mirrors 135deg
      grad.addColorStop(0, bg.from);
      grad.addColorStop(1, bg.to);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, OUT_W, OUT_H);
    }

    if (mode === 'text' && storyText.trim()) {
      const size = autoTextSize(storyText.trim().length) * OUT_W;
      ctx.font = `${font.weight} ${size}px ${font.css}`;
      ctx.fillStyle = textColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0,0,0,0.25)';
      ctx.shadowBlur = size * 0.08;
      const lines = wrapLines(ctx, storyText.trim(), OUT_W * 0.82);
      const lineHeight = size * 1.25;
      const start = OUT_H / 2 - ((lines.length - 1) * lineHeight) / 2;
      lines.forEach((line, i) => ctx.fillText(line, OUT_W / 2, start + i * lineHeight));
      ctx.shadowBlur = 0;
    }

    for (const o of overlays) {
      const size = o.size * OUT_W;
      const f = fontById(o.fontId);
      ctx.font = o.kind === 'emoji'
        ? `${size}px system-ui, "Apple Color Emoji", "Segoe UI Emoji", sans-serif`
        : `${f.weight} ${size}px ${f.css}`;
      ctx.fillStyle = o.color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      if (o.kind === 'text') {
        ctx.shadowColor = 'rgba(0,0,0,0.55)';
        ctx.shadowBlur = size * 0.16;
      }
      ctx.fillText(o.text, o.x * OUT_W, o.y * OUT_H);
      ctx.shadowBlur = 0;
    }

    return canvas.toDataURL('image/jpeg', 0.9);
  }, [mode, image, transform, css, bg, storyText, font, textColor, overlays]);

  const uploadDataUrl = async (dataUrl: string, folder = 'stories'): Promise<string> => {
    if (!dataUrl.startsWith('data:')) return dataUrl;
    const token = localStorage.getItem('etunisia_token');
    const res = await fetch('/api/v1/media/from-data-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ dataUrl, folder }),
    });
    if (!res.ok) throw new Error('Upload failed');
    const body = await res.json().catch(() => ({}));
    const url = body?.data?.url || body?.url;
    if (!url) throw new Error('Upload failed');
    return url;
  };

  const share = useMutation({
    mutationFn: async () => {
      setError(null);
      const composed = await renderToDataUrl();
      const hosted = await uploadDataUrl(composed);
      const cap = caption.trim() || (mode === 'text' ? storyText.trim().slice(0, 280) : undefined);
      return api.createStory({ imageUrl: hosted, caption: cap || undefined });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stories'] });
      onClose();
    },
    onError: () => setError('Could not share your story. Try again.'),
  });

  // ── Chooser ──
  if (mode === 'choose') {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="sc-scrim">
        <input ref={fileRef} type="file" accept="image/*" onChange={onFile} hidden aria-label="Choose a photo" />
        <div className="sc-choose">
          <header className="sc-choose-head">
            <h2>Create a story</h2>
            <button onClick={onClose} aria-label="Close"><X size={20} /></button>
          </header>
          <div className="sc-choose-grid">
            <button className="sc-choose-card sc-choose-photo" onClick={() => fileRef.current?.click()}>
              <ImageIcon size={26} />
              <strong>Photo story</strong>
              <small>Crop, filter, text and stickers</small>
            </button>
            <button
              className="sc-choose-card sc-choose-text"
              style={{ background: gradientCss(BACKGROUNDS[1]) }}
              onClick={() => setMode('text')}
            >
              <Type size={26} />
              <strong>Text story</strong>
              <small>Write on a background</small>
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  // ── Editor ──
  const layout = imgSize && stageSize.w
    ? photoLayout(imgSize.w, imgSize.h, stageSize.w, stageSize.h, transform)
    : null;
  const blurLayout = imgSize && stageSize.w && transform.fit === 'fit'
    ? photoLayout(imgSize.w, imgSize.h, stageSize.w, stageSize.h, { ...DEFAULT_TRANSFORM, fit: 'fill' })
    : null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="sc-scrim">
      <input ref={fileRef} type="file" accept="image/*" onChange={onFile} hidden aria-label="Choose a photo" />

      <div className="sc-shell">
        <header className="sc-bar">
          <button onClick={() => (isDirty ? requestClose() : setMode('choose'))} className="sc-icon" aria-label="Back">
            <ArrowLeft size={20} />
          </button>
          <span className="sc-bar-title">{mode === 'text' ? 'Text story' : 'Photo story'}</span>
          <button className="sc-share" onClick={() => share.mutate()} disabled={!canShare || share.isPending}>
            {share.isPending ? 'Sharing…' : 'Share'}
          </button>
        </header>

        <div className="sc-body">
          <div className="sc-stage-wrap">
            <div
              ref={stageRef}
              className="sc-stage"
              style={mode === 'text' ? { background: gradientCss(bg) } : { background: '#000' }}
              onPointerDown={startPan}
              onWheel={onWheel}
            >
              {mode === 'photo' && image && (
                <>
                  {blurLayout && (
                    <img
                      src={image}
                      alt=""
                      className="sc-photo-blur"
                      draggable={false}
                      style={{
                        width: blurLayout.w, height: blurLayout.h,
                        left: blurLayout.cx, top: blurLayout.cy,
                      }}
                    />
                  )}
                  <img
                    src={image}
                    alt=""
                    className="sc-photo"
                    draggable={false}
                    style={layout ? {
                      width: layout.w,
                      height: layout.h,
                      left: layout.cx,
                      top: layout.cy,
                      transform: `translate(-50%, -50%) rotate(${transform.rotation}deg)`,
                      filter: css,
                    } : { filter: css }}
                  />
                </>
              )}

              {mode === 'text' && (
                <div
                  className="sc-text-story"
                  style={{
                    color: textColor,
                    fontFamily: font.css,
                    fontWeight: font.weight,
                    fontSize: `${autoTextSize(storyText.trim().length) * 100}cqw`,
                  }}
                >
                  {storyText.trim() || <span className="sc-text-ph">Tap to write…</span>}
                </div>
              )}

              {overlays.map((o) => {
                const f = fontById(o.fontId);
                return (
                  <div
                    key={o.id}
                    className={`sc-overlay ${activeId === o.id ? 'is-active' : ''}`}
                    style={{
                      left: `${o.x * 100}%`,
                      top: `${o.y * 100}%`,
                      color: o.color,
                      fontSize: `${o.size * 100}cqw`,
                      fontFamily: o.kind === 'emoji' ? undefined : f.css,
                      fontWeight: o.kind === 'emoji' ? undefined : f.weight,
                    }}
                    onPointerDown={(e) => startOverlayDrag(o.id, e)}
                  >
                    {o.text}
                    {activeId === o.id && (
                      <button
                        className="sc-overlay-del"
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={() => deleteOverlay(o.id)}
                        aria-label="Remove"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {mode === 'photo' && image && (
              <p className="sc-hint">Drag to reposition · scroll to zoom</p>
            )}

            {mode === 'text' && (
              <textarea
                className="sc-text-input"
                value={storyText}
                onChange={(e) => setStoryText(e.target.value)}
                placeholder="What's on your mind?"
                maxLength={280}
                aria-label="Story text"
              />
            )}
          </div>

          <aside className="sc-tools">
            <div className="sc-toolrow">
              {mode === 'text' ? (
                <>
                  <button className={`sc-tool ${panel === 'background' ? 'is-on' : ''}`} onClick={() => setPanel(panel === 'background' ? 'none' : 'background')}>
                    <Palette size={17} /> Background
                  </button>
                  <button className={`sc-tool ${panel === 'font' ? 'is-on' : ''}`} onClick={() => setPanel(panel === 'font' ? 'none' : 'font')}>
                    <AlignLeft size={17} /> Font
                  </button>
                </>
              ) : (
                <>
                  <button className={`sc-tool ${panel === 'crop' ? 'is-on' : ''}`} onClick={() => setPanel(panel === 'crop' ? 'none' : 'crop')}>
                    <Crop size={17} /> Frame
                  </button>
                  <button className={`sc-tool ${panel === 'filters' ? 'is-on' : ''}`} onClick={() => setPanel(panel === 'filters' ? 'none' : 'filters')}>
                    <Wand2 size={17} /> Filters
                  </button>
                  <button className={`sc-tool ${panel === 'adjust' ? 'is-on' : ''}`} onClick={() => setPanel(panel === 'adjust' ? 'none' : 'adjust')}>
                    <SlidersHorizontal size={17} /> Adjust
                  </button>
                  <button className="sc-tool" onClick={addText}><Type size={17} /> Text</button>
                  <button className={`sc-tool ${panel === 'stickers' ? 'is-on' : ''}`} onClick={() => setPanel(panel === 'stickers' ? 'none' : 'stickers')}>
                    <Smile size={17} /> Stickers
                  </button>
                  <button className="sc-tool" onClick={() => fileRef.current?.click()}>
                    <ImageIcon size={17} /> Replace
                  </button>
                </>
              )}
              {!!overlays.length && <button className="sc-tool" onClick={undo}><Undo2 size={17} /> Undo</button>}
            </div>

            {activeOverlay?.kind === 'text' && (
              <input
                className="sc-overlay-input"
                value={activeOverlay.text}
                onChange={(e) => updateActive({ text: e.target.value })}
                placeholder="Type your text"
                maxLength={120}
                aria-label="Selected text"
                autoFocus
              />
            )}

            {(mode === 'text' || activeOverlay?.kind === 'text') && (
              <div className="sc-swatches" role="group" aria-label="Text colour">
                {TEXT_COLORS.map((c) => {
                  const on = mode === 'text' ? textColor === c : activeOverlay?.color === c;
                  return (
                    <button
                      key={c}
                      className={`sc-swatch ${on ? 'is-on' : ''}`}
                      style={{ background: c }}
                      onClick={() => (mode === 'text' ? setTextColor(c) : updateActive({ color: c }))}
                      aria-label={`Colour ${c}`}
                      aria-pressed={on}
                    />
                  );
                })}
              </div>
            )}

            {activeOverlay && (
              <label className="sc-range">
                <span>Size</span>
                <input
                  type="range" min={4} max={40}
                  value={Math.round(activeOverlay.size * 100)}
                  onChange={(e) => updateActive({ size: Number(e.target.value) / 100 })}
                />
              </label>
            )}

            {panel === 'crop' && (
              <div className="sc-panel sc-crop">
                <div className="sc-seg" role="group" aria-label="Framing">
                  <button
                    className={transform.fit === 'fill' ? 'is-on' : ''}
                    onClick={() => patchT({ fit: 'fill' })}
                  >
                    <Maximize2 size={14} /> Fill
                  </button>
                  <button
                    className={transform.fit === 'fit' ? 'is-on' : ''}
                    onClick={() => patchT({ fit: 'fit' })}
                  >
                    <Minimize2 size={14} /> Fit
                  </button>
                </div>

                <label className="sc-range">
                  <span>Zoom</span>
                  <input
                    type="range" min={50} max={400}
                    value={Math.round(transform.zoom * 100)}
                    onChange={(e) => patchT({ zoom: Number(e.target.value) / 100 })}
                  />
                  <b>{transform.zoom.toFixed(2)}×</b>
                </label>

                <label className="sc-range">
                  <span>Rotate</span>
                  <input
                    type="range" min={-180} max={180}
                    value={transform.rotation}
                    onChange={(e) => patchT({ rotation: Number(e.target.value) })}
                  />
                  <b>{transform.rotation}°</b>
                </label>

                <div className="sc-crop-btns">
                  <button onClick={() => patchT({ rotation: ((transform.rotation - 90 + 540) % 360) - 180 })}>
                    <RotateCcw size={14} /> 90° left
                  </button>
                  <button onClick={() => patchT({ rotation: ((transform.rotation + 90 + 540) % 360) - 180 })}>
                    <RotateCw size={14} /> 90° right
                  </button>
                  <button onClick={resetFrame}><RefreshCw size={14} /> Reset</button>
                </div>

                {imgSize && (
                  <p className="sc-meta">
                    Source {imgSize.w}×{imgSize.h} · exports 1080×1920
                  </p>
                )}
              </div>
            )}

            {panel === 'adjust' && (
              <div className="sc-panel">
                <label className="sc-range">
                  <span>Brightness</span>
                  <input type="range" min={50} max={150} value={Math.round(adjust.brightness * 100)}
                    onChange={(e) => setAdjust((a) => ({ ...a, brightness: Number(e.target.value) / 100 }))} />
                  <b>{Math.round(adjust.brightness * 100)}%</b>
                </label>
                <label className="sc-range">
                  <span>Contrast</span>
                  <input type="range" min={50} max={150} value={Math.round(adjust.contrast * 100)}
                    onChange={(e) => setAdjust((a) => ({ ...a, contrast: Number(e.target.value) / 100 }))} />
                  <b>{Math.round(adjust.contrast * 100)}%</b>
                </label>
                <label className="sc-range">
                  <span>Saturation</span>
                  <input type="range" min={0} max={200} value={Math.round(adjust.saturation * 100)}
                    onChange={(e) => setAdjust((a) => ({ ...a, saturation: Number(e.target.value) / 100 }))} />
                  <b>{Math.round(adjust.saturation * 100)}%</b>
                </label>
                <div className="sc-crop-btns">
                  <button onClick={() => setAdjust(DEFAULT_ADJUST)}><RefreshCw size={14} /> Reset</button>
                </div>
              </div>
            )}

            {panel === 'background' && (
              <div className="sc-panel sc-bgs">
                {BACKGROUNDS.map((b) => (
                  <button
                    key={b.id}
                    className={`sc-bg ${bgId === b.id ? 'is-on' : ''}`}
                    style={{ background: gradientCss(b) }}
                    onClick={() => setBgId(b.id)}
                    aria-label={b.label}
                    aria-pressed={bgId === b.id}
                  />
                ))}
              </div>
            )}

            {panel === 'font' && (
              <div className="sc-panel sc-fonts">
                {FONTS.map((f) => (
                  <button
                    key={f.id}
                    className={`sc-font ${fontId === f.id ? 'is-on' : ''}`}
                    style={{ fontFamily: f.css, fontWeight: f.weight }}
                    onClick={() => setFontId(f.id)}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            )}

            {panel === 'filters' && image && (
              <div className="sc-panel sc-filters">
                {FILTERS.map((f) => (
                  <button
                    key={f.id}
                    className={`sc-filter ${filterId === f.id ? 'is-on' : ''}`}
                    onClick={() => setFilterId(f.id)}
                  >
                    <img src={image} alt="" style={{ filter: f.css || 'none' }} />
                    <span>{f.label}</span>
                  </button>
                ))}
              </div>
            )}

            {panel === 'stickers' && (
              <div className="sc-panel sc-stickers">
                {STICKERS.map((s) => (
                  <button key={s} onClick={() => addOverlay('emoji', s)} aria-label={`Add ${s}`}>{s}</button>
                ))}
              </div>
            )}

            <input
              className="sc-caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Add a caption (optional)"
              maxLength={280}
              aria-label="Caption"
            />

            {error && <p className="sc-error">{error}</p>}
          </aside>
        </div>
      </div>
    </motion.div>
  );
}
