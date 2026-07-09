import React, { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { RefreshCcw } from 'lucide-react';

interface Props {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}

export function PullToRefresh({ onRefresh, children }: Props) {
  const [pulling, setPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const isAtTop = () => {
    const el = containerRef.current;
    if (!el) return true;
    return el.scrollTop <= 0;
  };

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!isAtTop()) return;
    startY.current = e.touches[0].clientY;
    setPulling(true);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!pulling || !isAtTop()) {
      setPullDistance(0);
      return;
    }
    const y = e.touches[0].clientY;
    const diff = y - startY.current;
    if (diff > 0) {
      // Resistance: pull distance grows slower as user pulls further
      const resisted = Math.min(diff * 0.5, 100);
      setPullDistance(resisted);
      e.preventDefault();
    }
  }, [pulling]);

  const handleTouchEnd = useCallback(async () => {
    setPulling(false);
    if (pullDistance > 60 && !refreshing) {
      setRefreshing(true);
      setPullDistance(80);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, refreshing, onRefresh]);

  const progress = Math.min(pullDistance / 60, 1);
  const ready = pullDistance > 60;

  return (
    <div
      ref={containerRef}
      className="relative overflow-y-auto"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ touchAction: pulling ? 'none' : 'auto' }}
    >
      {/* Pull indicator — tracks the finger 1:1 while pulling, then springs back elastically on release */}
      <motion.div
        className="flex items-center justify-center overflow-hidden"
        animate={{ height: pulling ? pullDistance : refreshing ? 56 : 0 }}
        transition={pulling ? { duration: 0 } : { type: 'spring', stiffness: 380, damping: 26 }}
        style={{ opacity: pullDistance > 6 || refreshing ? 1 : 0 }}
      >
        <motion.div
          className="grid place-items-center w-9 h-9 rounded-full bg-surface shadow-md"
          style={{ color: ready || refreshing ? 'var(--olive)' : 'var(--coral)' }}
          animate={refreshing ? { rotate: 360, scale: 1 } : { rotate: progress * 270, scale: 0.6 + progress * 0.4 }}
          transition={refreshing
            ? { repeat: Infinity, ease: 'linear', duration: 0.8 }
            : { type: 'spring', stiffness: 300, damping: 20 }}
        >
          <RefreshCcw size={18} />
        </motion.div>
      </motion.div>
      {children}
    </div>
  );
}
