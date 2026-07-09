import React, { useState, useRef, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Type, Smile, Move, Trash2, Download } from 'lucide-react';
import { api } from '../../shared/api';

interface TextOverlay {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  fontSize: number;
}

interface Props {
  imageUrl: string;
  onClose: () => void;
}

const COLORS = ['#ffffff', '#000000', '#ff4757', '#2ed573', '#1e90ff', '#ffa502', '#ff6b81', '#7bed9f'];
const EMOJIS = ['❤️', '🔥', '👏', '😂', '😍', '🎉', '✨', '🇹🇳', '📸', '🌅', '☀️', '🌊', '🏖️', '🕌', '🐪'];

export default function StoryComposer({ imageUrl, onClose }: Props) {
  const queryClient = useQueryClient();
  const containerRef = useRef<HTMLDivElement>(null);
  const [overlays, setOverlays] = useState<TextOverlay[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [tool, setTool] = useState<'text' | 'emoji' | 'move' | null>(null);
  const [textInput, setTextInput] = useState('');
  const [showTextInput, setShowTextInput] = useState(false);
  const [selectedColor, setSelectedColor] = useState('#ffffff');

  const createMutation = useMutation({
    mutationFn: async () => {
      // For now, upload the base image with caption describing overlays
      // In production, you'd render overlays to canvas and upload the composite
      const hosted = await uploadDataUrl(imageUrl, 'stories');
      const caption = overlays.map((o) => o.text).filter(Boolean).join(' ') || undefined;
      return api.createStory({ imageUrl: hosted, caption });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stories'] });
      onClose();
    },
  });

  const uploadDataUrl = async (dataUrl: string, folder = 'uploads'): Promise<string> => {
    if (!dataUrl || !dataUrl.startsWith('data:')) return dataUrl;
    const token = localStorage.getItem('etunisia_token');
    const res = await fetch('/api/v1/media/from-data-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ dataUrl, folder }),
    });
    const body = await res.json().catch(() => ({}));
    return body?.data?.url || body?.url || dataUrl;
  };

  const addTextOverlay = useCallback(() => {
    if (!textInput.trim()) return;
    const id = `txt_${Date.now()}`;
    setOverlays((prev) => [...prev, {
      id,
      text: textInput.trim(),
      x: 50,
      y: 50,
      color: selectedColor,
      fontSize: 24,
    }]);
    setTextInput('');
    setShowTextInput(false);
    setTool('move');
    setActiveId(id);
  }, [textInput, selectedColor]);

  const addEmoji = useCallback((emoji: string) => {
    const id = `emj_${Date.now()}`;
    setOverlays((prev) => [...prev, {
      id,
      text: emoji,
      x: 50,
      y: 50,
      color: '#ffffff',
      fontSize: 40,
    }]);
    setTool('move');
    setActiveId(id);
  }, []);

  const handleContainerClick = useCallback((e: React.MouseEvent) => {
    if (tool === 'text') {
      setShowTextInput(true);
      return;
    }
    if (tool === 'emoji') return;
    // Deselect when clicking empty space in move mode
    if (tool === 'move' && e.target === containerRef.current) {
      setActiveId(null);
    }
  }, [tool]);

  const handleOverlayMouseDown = useCallback((id: string, e: React.MouseEvent) => {
    if (tool !== 'move') return;
    e.stopPropagation();
    setActiveId(id);

    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    const overlay = overlays.find((o) => o.id === id);
    if (!overlay) return;
    const origX = overlay.x;
    const origY = overlay.y;

    const onMove = (ev: MouseEvent) => {
      const dx = ((ev.clientX - startX) / rect.width) * 100;
      const dy = ((ev.clientY - startY) / rect.height) * 100;
      setOverlays((prev) => prev.map((o) =>
        o.id === id ? { ...o, x: Math.max(5, Math.min(95, origX + dx)), y: Math.max(5, Math.min(95, origY + dy)) } : o
      ));
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [tool, overlays]);

  const deleteOverlay = useCallback((id: string) => {
    setOverlays((prev) => prev.filter((o) => o.id !== id));
    setActiveId(null);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-black flex flex-col"
    >
      {/* Top toolbar */}
      <div className="flex items-center justify-between px-4 py-3 z-10">
        <button onClick={onClose} className="text-white/80 hover:text-white p-2 rounded-full bg-white/10">
          <X size={20} />
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTool(tool === 'text' ? null : 'text')}
            className={`p-2.5 rounded-full transition ${tool === 'text' ? 'bg-brand text-white' : 'bg-white/10 text-white/80 hover:text-white'}`}
          >
            <Type size={18} />
          </button>
          <button
            onClick={() => setTool(tool === 'emoji' ? null : 'emoji')}
            className={`p-2.5 rounded-full transition ${tool === 'emoji' ? 'bg-brand text-white' : 'bg-white/10 text-white/80 hover:text-white'}`}
          >
            <Smile size={18} />
          </button>
          <button
            onClick={() => setTool(tool === 'move' ? null : 'move')}
            className={`p-2.5 rounded-full transition ${tool === 'move' ? 'bg-brand text-white' : 'bg-white/10 text-white/80 hover:text-white'}`}
          >
            <Move size={18} />
          </button>
        </div>
        <button
          onClick={() => createMutation.mutate()}
          disabled={createMutation.isPending}
          className="px-4 py-2 rounded-full bg-brand text-white font-semibold text-sm disabled:opacity-50"
        >
          {createMutation.isPending ? 'Sharing…' : 'Share'}
        </button>
      </div>

      {/* Image canvas */}
      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden cursor-crosshair"
        onClick={handleContainerClick}
      >
        <img
          src={imageUrl}
          alt="Story preview"
          className="w-full h-full object-contain"
          draggable={false}
        />

        {/* Overlays */}
        {overlays.map((o) => (
          <div
            key={o.id}
            className={`absolute select-none ${tool === 'move' ? 'cursor-move' : 'cursor-default'} ${activeId === o.id ? 'ring-2 ring-brand/50 rounded' : ''}`}
            style={{
              left: `${o.x}%`,
              top: `${o.y}%`,
              transform: 'translate(-50%, -50%)',
              color: o.color,
              fontSize: `${o.fontSize}px`,
              fontWeight: 700,
              textShadow: '0 1px 4px rgba(0,0,0,0.6)',
              fontFamily: 'system-ui, sans-serif',
            }}
            onMouseDown={(e) => handleOverlayMouseDown(o.id, e)}
          >
            {o.text}
            {activeId === o.id && tool === 'move' && (
              <button
                onClick={(e) => { e.stopPropagation(); deleteOverlay(o.id); }}
                className="absolute -top-6 -right-6 p-1 rounded-full bg-red-500 text-white"
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Bottom tool panels */}
      <AnimatePresence>
        {tool === 'text' && showTextInput && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="absolute bottom-0 left-0 right-0 bg-black/80 backdrop-blur-md p-4 z-20"
          >
            <div className="flex gap-2 mb-3 overflow-x-auto">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setSelectedColor(c)}
                  className={`w-8 h-8 rounded-full border-2 flex-shrink-0 ${selectedColor === c ? 'border-white scale-110' : 'border-transparent'}`}
                  style={{ background: c }}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addTextOverlay()}
                placeholder="Type something…"
                className="flex-1 px-4 py-2.5 rounded-xl bg-white/10 text-white placeholder:text-white/40 border border-white/10 focus:outline-none focus:border-brand/50"
                autoFocus
              />
              <button onClick={addTextOverlay} className="px-4 py-2 rounded-xl bg-brand text-white font-medium">
                Add
              </button>
            </div>
          </motion.div>
        )}

        {tool === 'emoji' && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="absolute bottom-0 left-0 right-0 bg-black/80 backdrop-blur-md p-4 z-20"
          >
            <div className="flex gap-3 justify-center flex-wrap">
              {EMOJIS.map((em) => (
                <button
                  key={em}
                  onClick={() => addEmoji(em)}
                  className="text-3xl p-2 hover:bg-white/10 rounded-xl transition"
                >
                  {em}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hint */}
      {!tool && overlays.length === 0 && (
        <div className="absolute bottom-20 left-0 right-0 text-center text-white/50 text-sm pointer-events-none">
          Tap the tools above to add text or stickers
        </div>
      )}
    </motion.div>
  );
}
