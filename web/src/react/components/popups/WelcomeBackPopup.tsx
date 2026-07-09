import React from 'react';
import { Compass, Flame, ArrowRight } from 'lucide-react';
import { goTo } from '../../../router';
import type { PopupItem } from '../../stores/popup-store';

interface Props {
  item: PopupItem;
  onClose: () => void;
}

/**
 * Fired when the user returns after an absence (client-side last-seen gap).
 * Data: { days }.
 */
export function WelcomeBackPopup({ item, onClose }: Props) {
  const days: number = Number(item.data?.days) || 0;
  const gap =
    days >= 30 ? 'a while' : days >= 7 ? `${Math.round(days / 7)} week${days >= 14 ? 's' : ''}` : `${days} days`;

  return (
    <div className="popup-body popup-welcome text-center">
      <div className="popup-welcome-wave" aria-hidden="true">
        👋
      </div>
      <h2 className="popup-title">Welcome back!</h2>
      <p className="popup-sub">
        It's been {gap}. Tunisia missed you — here's what's waiting.
      </p>

      <div className="popup-actions">
        <button
          type="button"
          className="popup-btn primary"
          onClick={() => {
            onClose();
            goTo('/explore');
          }}
        >
          <Compass size={16} /> See what's new <ArrowRight size={15} />
        </button>
        <button
          type="button"
          className="popup-btn ghost"
          onClick={() => {
            onClose();
            goTo('/challenges');
          }}
        >
          <Flame size={15} /> Restart my streak
        </button>
      </div>
    </div>
  );
}

export default WelcomeBackPopup;
