import React from 'react';
import { motion } from 'framer-motion';

// Odometer-style number: each digit lives in a vertical 0–9 strip that slides to
// the current value, so counts "roll" when they change. Non-digit characters
// (thousands separators) render static. Respects reduced motion automatically via
// the app-level MotionConfig (the spring resolves instantly).

function Digit({ d }: { d: number }) {
  return (
    <span style={{ display: 'inline-block', height: '1em', lineHeight: 1, overflow: 'hidden', verticalAlign: 'bottom' }}>
      <motion.span
        style={{ display: 'flex', flexDirection: 'column' }}
        animate={{ y: `-${d}em` }}
        transition={{ type: 'spring', stiffness: 320, damping: 30 }}
      >
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <span key={n} style={{ height: '1em', lineHeight: 1 }}>{n}</span>
        ))}
      </motion.span>
    </span>
  );
}

export function RollingNumber({ value, className }: { value: number; className?: string }) {
  const safe = Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
  const str = safe.toLocaleString();
  return (
    <span
      className={className}
      style={{ display: 'inline-flex', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}
      aria-label={String(safe)}
    >
      {str.split('').map((ch, i) =>
        /\d/.test(ch)
          ? <Digit key={`${i}-${str.length}`} d={Number(ch)} />
          : <span key={`s-${i}`} aria-hidden="true">{ch}</span>,
      )}
    </span>
  );
}
