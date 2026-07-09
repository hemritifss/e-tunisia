import React from 'react';
import { Award, ArrowRight } from 'lucide-react';
import { goTo } from '../../../router';
import type { PopupItem } from '../../stores/popup-store';

interface Props {
  item: PopupItem;
  onClose: () => void;
}

/**
 * Fired when the user earns a badge (realtime `badge` notification).
 * Data: { name, emoji?, description? }.
 */
export function BadgeUnlockedPopup({ item, onClose }: Props) {
  const name: string = item.data?.name || 'New badge';
  const emoji: string = item.data?.emoji || '🏅';
  const description: string | undefined = item.data?.description;

  return (
    <div className="popup-body popup-badge text-center">
      <div className="popup-badge-medal" aria-hidden="true">
        <span className="popup-badge-emoji">{emoji}</span>
        <span className="popup-badge-ring" />
      </div>
      <div className="popup-badge-kicker">
        <Award size={14} /> Badge unlocked
      </div>
      <h2 className="popup-title">{name}</h2>
      {description && <p className="popup-sub">{description}</p>}

      <div className="popup-actions">
        <button
          type="button"
          className="popup-btn primary"
          onClick={() => {
            onClose();
            goTo('/badges');
          }}
        >
          <Award size={16} /> View my badges <ArrowRight size={15} />
        </button>
        <button type="button" className="popup-btn ghost" onClick={onClose}>
          Awesome!
        </button>
      </div>
    </div>
  );
}

export default BadgeUnlockedPopup;
