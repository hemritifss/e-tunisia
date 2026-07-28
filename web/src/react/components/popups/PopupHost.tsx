import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { usePopupStore } from '../../stores/popup-store';
import { CelebrationPopup } from './CelebrationPopup';
import { TutorialPopup } from './TutorialPopup';
import { DailyTaskPopup } from './DailyTaskPopup';
import { BadgeUnlockedPopup } from './BadgeUnlockedPopup';
import { LevelUpPopup } from './LevelUpPopup';
import { WelcomeBackPopup } from './WelcomeBackPopup';
import { StreakMilestonePopup } from './StreakMilestonePopup';
import type { PopupItem } from '../../stores/popup-store';

/**
 * Whether scrim-click / Escape should be allowed to dismiss this kind.
 *
 * NOTE: 'tutorial' is no longer enqueued by anything — first-run guidance moved
 * to contextual hints (src/hints.ts), which explain each control when it is
 * actually on screen instead of front-loading a tour nobody had context for.
 * The case below is kept only so a manually-enqueued tutorial still renders.
 */
function isDismissibleByScrim(item: PopupItem): boolean {
  // Celebration & daily are casual — tapping outside closes them.
  // Tutorial uses its own Skip button so a stray tap doesn't abort the tour.
  return item.kind !== 'tutorial';
}

function renderPopup(item: PopupItem, onClose: () => void) {
  switch (item.kind) {
    case 'celebration':
      return <CelebrationPopup item={item} onClose={onClose} />;
    case 'tutorial':
      return <TutorialPopup item={item} onClose={onClose} />;
    case 'daily':
      return <DailyTaskPopup item={item} onClose={onClose} />;
    case 'badge':
      return <BadgeUnlockedPopup item={item} onClose={onClose} />;
    case 'levelup':
      return <LevelUpPopup item={item} onClose={onClose} />;
    case 'welcome':
      return <WelcomeBackPopup item={item} onClose={onClose} />;
    case 'streak':
      return <StreakMilestonePopup item={item} onClose={onClose} />;
    default:
      return null;
  }
}

/**
 * Globally-mounted popup surface. Center dialog on desktop, bottom-sheet on
 * mobile. Renders whatever the popup store has as `current` and advances the
 * queue on close.
 */
export function PopupHost() {
  const current = usePopupStore((s) => s.current);
  const dismiss = usePopupStore((s) => s.dismiss);

  // Lock body scroll + wire Escape while a popup is open.
  useEffect(() => {
    if (!current) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isDismissibleByScrim(current)) dismiss();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [current, dismiss]);

  return (
    <AnimatePresence>
      {current && (
        <motion.div
          key={current.id}
          className="popup-root"
          role="dialog"
          aria-modal="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <div
            className="popup-scrim"
            onClick={() => {
              if (isDismissibleByScrim(current)) dismiss();
            }}
          />
          <motion.div
            className={`popup-card popup-card-${current.kind}`}
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          >
            {isDismissibleByScrim(current) && (
              <button
                type="button"
                className="popup-close"
                onClick={dismiss}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            )}
            {renderPopup(current, dismiss)}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default PopupHost;
