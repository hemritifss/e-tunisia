import React from 'react';
import { Coins, Heart, ArrowRight } from 'lucide-react';
import { goTo } from '../../../router';
import type { PopupItem } from '../../stores/popup-store';

/** Brand-tinted CSS confetti (mirrors PassportOnboarding's piece). */
function Confetti() {
  const pieces = Array.from({ length: 70 });
  const colors = [
    'oklch(55% 0.16 30)', // terracotta
    'oklch(52% 0.14 240)', // mediterranean
    'oklch(78% 0.17 80)', // gold
    'oklch(72% 0.18 200)', // cyan
    'oklch(58% 0.2 290)', // violet
  ];
  return (
    <div className="confetti" aria-hidden>
      {pieces.map((_, i) => (
        <span
          key={i}
          style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 0.6}s`,
            animationDuration: `${1.4 + Math.random() * 1.4}s`,
            background: colors[i % colors.length],
          }}
        />
      ))}
    </div>
  );
}

interface Props {
  item: PopupItem;
  onClose: () => void;
}

/**
 * Fired when the user receives a tip (donation) at or above the celebrate
 * threshold. Data: { amount, fromName?, message? }.
 */
export function CelebrationPopup({ item, onClose }: Props) {
  const amount = Number(item.data?.amount) || 0;
  const fromName: string = item.data?.fromName || 'Someone';
  const message: string | undefined = item.data?.message;

  return (
    <div className="popup-body popup-celebrate text-center">
      <Confetti />
      <div className="popup-celebrate-coin" aria-hidden="true">
        <Coins size={36} strokeWidth={1.75} />
      </div>
      <h2 className="popup-title">You got a tip! 🎉</h2>
      <div className="popup-celebrate-amount">
        +{amount} <span>TND</span>
      </div>
      <p className="popup-sub">
        <strong>{fromName}</strong> sent you a tip
      </p>
      {message && <p className="popup-celebrate-msg">“{message}”</p>}

      <div className="popup-actions">
        <button
          type="button"
          className="popup-btn primary"
          onClick={() => {
            onClose();
            goTo('/credits');
          }}
        >
          <Coins size={16} /> View wallet <ArrowRight size={15} />
        </button>
        <button type="button" className="popup-btn ghost" onClick={onClose}>
          <Heart size={15} /> Nice!
        </button>
      </div>
    </div>
  );
}

export default CelebrationPopup;
