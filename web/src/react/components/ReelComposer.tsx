import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Film, MapPin, Loader2, Sparkles, UploadCloud, RefreshCw } from 'lucide-react';
import { api, uploadMedia } from '../../shared/api';
import { useUIStore } from '../stores/ui-store';

// Backend (media.controller) only accepts these video MIME types. Phone-recorded
// .mov (video/quicktime) is intentionally excluded so we can fail fast client-side
// instead of after a 50MB upload.
const ALLOWED_VIDEO = ['video/mp4', 'video/webm'];
const MAX_BYTES = 50 * 1024 * 1024; // 50MB — matches the server-side multer limit.

const TUNISIAN_LOCATIONS = [
  'Sidi Bou Said', 'Carthage', 'Djerba', 'Douz', 'Tunis Medina',
  'Sousse', 'Bizerte', 'Tozeur', 'Kairouan', 'Tabarka', 'Hammamet', 'Matmata',
];

interface Props {
  onClose: () => void;
  /** Called after a reel is successfully published, so the page can refresh + switch to "My Reels". */
  onPosted: () => void;
}

export function ReelComposer({ onClose, onPosted }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [showLocations, setShowLocations] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const showToast = useUIStore((s) => s.showToast);

  // Object URL lifecycle — revoke the previous preview whenever the file changes/unmounts.
  useEffect(() => {
    if (!file) { setPreviewUrl(''); return; }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // Lock body scroll while the composer is open.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  const acceptFile = useCallback((f: File | null | undefined) => {
    if (!f) return;
    if (!f.type.startsWith('video/') || !ALLOWED_VIDEO.includes(f.type)) {
      showToast('Please choose an MP4 or WebM video.', 'error');
      return;
    }
    if (f.size > MAX_BYTES) {
      showToast('That video is over 50MB. Trim it down and try again.', 'error');
      return;
    }
    setFile(f);
  }, [showToast]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    acceptFile(e.target.files?.[0]);
    e.target.value = ''; // allow re-picking the same file after a reset
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    acceptFile(e.dataTransfer.files?.[0]);
  };

  const [genLoading, setGenLoading] = useState(false);
  const generateCaption = async () => {
    if (genLoading) return;
    setGenLoading(true);
    try {
      const r: any = await api.aiCaption({
        topic: caption.trim() || undefined,
        location: location.trim() || undefined,
      });
      if (r?.caption) setCaption(r.caption);
    } catch (err: any) {
      showToast(err?.message || 'Could not generate a caption right now.', 'error');
    } finally {
      setGenLoading(false);
    }
  };

  const reset = () => { setFile(null); setCaption(''); setLocation(''); };

  const publish = async () => {
    if (!file) return;
    const cap = caption.trim();
    if (!cap) { showToast('Add a caption for your reel.', 'error'); return; }
    setUploading(true);
    try {
      const videoUrl = await uploadMedia(file, 'reels');
      await api.createPost({
        title: cap.slice(0, 240),
        body: cap,
        category: 'Reels',
        location: location.trim() || undefined,
        videoUrl,
      });
      showToast('Your reel is live! 🎬', 'success');
      // Tell every feed surface to refetch (home feed + reels).
      window.dispatchEvent(new CustomEvent('etunisia:post-created'));
      onPosted();
      onClose();
    } catch (err: any) {
      showToast(err?.message || 'Could not publish your reel. Try again.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const locationMatches = location.trim()
    ? TUNISIAN_LOCATIONS.filter((l) => l.toLowerCase().includes(location.toLowerCase().trim()))
    : TUNISIAN_LOCATIONS;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-stretch md:items-center justify-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 24, opacity: 0, scale: 0.98 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 24, opacity: 0 }}
          transition={{ type: 'spring', damping: 26, stiffness: 320 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full md:max-w-3xl md:rounded-3xl bg-neutral-950 text-white overflow-hidden md:max-h-[92vh] flex flex-col shadow-2xl ring-1 ring-white/10"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0">
            <div className="flex items-center gap-2">
              <span className="grid place-items-center w-8 h-8 rounded-full bg-gradient-to-br from-fuchsia-500 to-rose-500">
                <Film size={16} />
              </span>
              <h2 className="text-base font-semibold">Create a reel</h2>
            </div>
            <button onClick={onClose} className="p-2 -mr-2 rounded-full hover:bg-white/10" aria-label="Close">
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto md:grid md:grid-cols-[1fr_minmax(280px,360px)]">
            {/* Preview / picker */}
            <div className="p-5 flex items-center justify-center bg-black/40 min-h-[320px] md:min-h-0">
              {previewUrl ? (
                <div className="relative w-full max-w-[260px] aspect-[9/16] rounded-2xl overflow-hidden bg-black ring-1 ring-white/10">
                  <video
                    src={previewUrl}
                    className="absolute inset-0 w-full h-full object-cover"
                    autoPlay
                    muted
                    loop
                    playsInline
                  />
                  <button
                    onClick={reset}
                    className="absolute top-2 right-2 flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-black/60 backdrop-blur text-xs font-medium hover:bg-black/80"
                  >
                    <RefreshCw size={13} /> Change
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={onDrop}
                  className={`w-full max-w-[320px] aspect-[9/16] rounded-2xl border-2 border-dashed grid place-content-center gap-3 text-center px-6 transition-colors ${
                    dragOver ? 'border-fuchsia-400 bg-fuchsia-500/10' : 'border-white/20 hover:border-white/40 hover:bg-white/5'
                  }`}
                >
                  <UploadCloud size={40} className="mx-auto text-white/50" />
                  <div className="space-y-1">
                    <p className="font-semibold">Upload a video</p>
                    <p className="text-xs text-white/50 leading-relaxed">
                      Drag &amp; drop or click to browse.<br />MP4 or WebM · up to 50MB · vertical works best.
                    </p>
                  </div>
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="video/mp4,video/webm"
                className="hidden"
                onChange={onFileChange}
              />
            </div>

            {/* Details form */}
            <div className="p-5 md:border-l border-white/10 space-y-5">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-white/60 flex items-center gap-1.5">
                    <Sparkles size={13} /> Caption
                  </label>
                  <button
                    type="button"
                    onClick={generateCaption}
                    disabled={genLoading}
                    className="flex items-center gap-1 text-[11px] font-medium text-fuchsia-300 hover:text-fuchsia-200 disabled:opacity-50 transition-colors"
                  >
                    {genLoading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                    {genLoading ? 'Writing…' : 'Generate'}
                  </button>
                </div>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  maxLength={2200}
                  rows={4}
                  placeholder="Say something about this moment…"
                  className="w-full resize-none rounded-xl bg-white/5 border border-white/10 px-3.5 py-3 text-sm placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/60"
                />
                <div className="text-right text-[11px] text-white/40">{caption.length}/2200</div>
              </div>

              <div className="space-y-1.5 relative">
                <label className="text-xs font-medium text-white/60 flex items-center gap-1.5">
                  <MapPin size={13} /> Location <span className="text-white/30">(optional)</span>
                </label>
                <input
                  value={location}
                  onChange={(e) => { setLocation(e.target.value); setShowLocations(true); }}
                  onFocus={() => setShowLocations(true)}
                  onBlur={() => setTimeout(() => setShowLocations(false), 150)}
                  placeholder="Where in Tunisia?"
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-3.5 py-2.5 text-sm placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/60"
                />
                {showLocations && locationMatches.length > 0 && (
                  <div className="absolute z-10 left-0 right-0 mt-1 max-h-44 overflow-y-auto rounded-xl bg-neutral-900 border border-white/10 shadow-xl py-1">
                    {locationMatches.map((loc) => (
                      <button
                        key={loc}
                        type="button"
                        onMouseDown={(e) => { e.preventDefault(); setLocation(loc); setShowLocations(false); }}
                        className="w-full flex items-center gap-2 px-3.5 py-2 text-sm text-left hover:bg-white/10"
                      >
                        <MapPin size={13} className="text-white/40" /> {loc}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={publish}
                disabled={!file || !caption.trim() || uploading}
                className="w-full flex items-center justify-center gap-2 rounded-xl py-3 font-semibold bg-gradient-to-r from-fuchsia-500 to-rose-500 hover:opacity-95 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                {uploading ? (<><Loader2 size={18} className="animate-spin" /> Publishing…</>) : (<>Share reel</>)}
              </button>
              <p className="text-[11px] text-white/40 text-center leading-relaxed">
                Your reel posts to the feed and the Reels tab. You can delete it anytime from “My Reels”.
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
