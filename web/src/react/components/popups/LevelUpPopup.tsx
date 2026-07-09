import React, { useEffect } from 'react';
import { TrendingUp, Star, ArrowRight } from 'lucide-react';
import { goTo } from '../../../router';
import { fireConfetti } from '../../../confetti';
import { RollingNumber } from '../RollingNumber';
import type { PopupItem } from '../../stores/popup-store';

interface Props {
  item: PopupItem;
  onClose: () => void;
}

/**
 * Fired when the user's gamification level increases (detected client-side by
 * comparing against the last-known level). Data: { level, points?, nextLevelPoints? }.
 *
 * This is the single most rewarding moment in the gamification loop, so it gets
 * the full treatment: confetti burst, rolling level number, and an XP progress
 * bar toward the next level. Confetti self-disables under reduced motion.
 */
export function LevelUpPopup({ item, onClose }: Props) {
  const level: number = Number(item.data?.level) || 1;
  const points: number = Number(item.data?.points) || 0;
  const next: number = Number(item.data?.nextLevelPoints) || 0;
  const toNext = next > points ? next - points : 0;
  const pct = next > 0 ? Math.min(100, Math.round((points / next) * 100)) : 0;

  useEffect(() => {
    const t = window.setTimeout(() => fireConfetti({ count: 150, originY: 0.35 }), 180);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div className="popup-body popup-levelup text-center">
      <div className="popup-levelup-ring" aria-hidden="true">
        <TrendingUp size={26} />
        <span className="popup-levelup-num"><RollingNumber value={level} /></span>
      </div>
      <div className="popup-badge-kicker">
        <Star size={14} /> Level up
      </div>
      <h2 className="popup-title">You reached level {level}!</h2>
      <p className="popup-sub">
        {toNext > 0
          ? `${points.toLocaleString()} pts · ${toNext.toLocaleString()} more to level ${level + 1}.`
          : 'Keep exploring to climb even higher.'}
      </p>

      {next > 0 && (
        <div className="popup-task-bar" aria-hidden="true" style={{ margin: '4px auto 8px', maxWidth: 260 }}>
          <div className="popup-task-fill" style={{ width: `${pct}%` }} />
        </div>
      )}

      <div className="popup-actions">
        <button
          type="button"
          className="popup-btn primary"
          onClick={() => {
            onClose();
            goTo('/badges');
          }}
        >
          <Star size={16} /> See achievements <ArrowRight size={15} />
        </button>
        <button type="button" className="popup-btn ghost" onClick={onClose}>
          Let's go!
        </button>
      </div>
    </div>
  );
}

export default LevelUpPopup;
