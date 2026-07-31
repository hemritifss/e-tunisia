import React from 'react';
import { motion } from 'framer-motion';

// Odometer-style number: each digit lives in a vertical 0-9 strip that slides to
// the current value, so counts "roll" when they change. Non-digit characters
// (thousands separators) render static. Reduced motion is handled app-wide by
// the MotionConfig in react/lib/islands.tsx.

// Bled spec: 240ms per digit, tabular nums. The duration mirrors
// --duration-digit in tokens.css; framer needs a number, so it cannot read the
// custom property directly. Keep the two in step.
const DIGIT_MS = 0.24;
// var(--ease-out) === cubic-bezier(.16, 1, .3, 1)
const EASE_OUT = [0.16, 1, 0.3, 1] as const;
// "Per digit" reads as a cascade, not as every wheel moving in lockstep.
const STAGGER = 0.03;

function Digit({ d, index }: { d: number; index: number }) {
  return (
    <span style={{ display: 'inline-block', height: '1em', lineHeight: 1, overflow: 'hidden', verticalAlign: 'bottom' }}>
      <motion.span
        style={{ display: 'flex', flexDirection: 'column' }}
        animate={{ y: `-${d}em` }}
        transition={{ duration: DIGIT_MS, ease: EASE_OUT, delay: index * STAGGER }}
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
  const chars = str.split('');

  // Digit identity is keyed from the RIGHT (units = 0, tens = 1, …). Keying by
  // left-hand index tied the ones column to a different key every time the
  // number changed width, so 999 -> 1000 remounted every wheel and snapped
  // instead of rolling. Counting from the right keeps each column's identity
  // stable across a digit-count change; only the new leading digit mounts.
  let digitsFromRight = chars.filter((c) => /\d/.test(c)).length;

  return (
    <span
      className={className ? `rolling-count ${className}` : 'rolling-count'}
      aria-label={String(safe)}
    >
      {chars.map((ch, i) => {
        if (!/\d/.test(ch)) return <span key={`sep-${i}`} aria-hidden="true">{ch}</span>;
        digitsFromRight -= 1;
        const place = digitsFromRight;
        // Least significant digit leads the cascade.
        return <Digit key={`d${place}`} d={Number(ch)} index={place} />;
      })}
    </span>
  );
}
