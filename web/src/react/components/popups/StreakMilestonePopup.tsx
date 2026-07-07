import React from 'react';
import { Flame, Trophy, ArrowRight } from 'lucide-react';
import { goTo } from '../../../router';
import type { PopupItem } from '../../stores/popup-store';

interface Props {
  item: PopupItem;
  onClose: () => void;
}

/**
 * Fired when the user's check-in streak crosses a reward milestone
 * (3 / 7 / 14 / 30 / 100 days). Data: { streak, milestone, reward? }.
 */
export function StreakMilestonePopup({ item, onClose }: Props) {
  const streak: number = Number(item.data?.streak) || Number(item.data?.milestone) || 0;
  const milestone: number = Number(item.data?.milestone) || streak;
  const reward: string | undefined = item.data?.reward;

  return (
    <div className="popup-body popup-streak text-center">
      <div className="popup-streak-flame" aria-hidden="true">
        <Flame size={30} />
        <span className="popup-streak-num">{milestone}</span>
      </div>
      <div className="popup-badge-kicker popup-streak-kicker">
        <Flame size={14} /> Streak milestone
      </div>
      <h2 className="popup-title">{milestone}-day streak! 🔥</h2>
      <p className="popup-sub">
        {streak > milestone
          ? `${streak} days strong — you're on fire.`
          : 'You showed up every day. That consistency pays off.'}
      </p>

      {reward && (
        <div className="popup-streak-reward">
          <Trophy size={15} /> {reward}
        </div>
      )}

      <div className="popup-actions">
        <button
          type="button"
          className="popup-btn primary"
          onClick={() => {
            onClose();
            goTo('/challenges');
          }}
        >
          <Flame size={16} /> View my streak <ArrowRight size={15} />
        </button>
        <button type="button" className="popup-btn ghost" onClick={onClose}>
          Keep it up!
        </button>
      </div>
    </div>
  );
}

export default StreakMilestonePopup;
