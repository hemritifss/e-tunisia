import React, { useState, useRef, useCallback } from 'react';
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

  return (
    <div
      ref={containerRef}
      className="relative overflow-y-auto"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ touchAction: pulling ? 'none' : 'auto' }}
    >
      {/* Pull indicator */}
      <div
        className="flex items-center justify-center transition-all duration-200 overflow-hidden"
        style={{
          height: `${pullDistance}px`,
          opacity: pullDistance > 10 ? 1 : 0,
        }}
      >
        <RefreshCcw
          size={20}
          className={`text-brand ${refreshing ? 'animate-spin' : pullDistance > 60 ? 'rotate-180' : ''}`}
        />
      </div>
      {children}
    </div>
  );
}
