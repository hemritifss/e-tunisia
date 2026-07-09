import React, { useState } from 'react';
import { Compass, Sparkles, Flame, MessageCircle, ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { goTo } from '../../../router';
import type { PopupItem } from '../../stores/popup-store';

export const TUTORIAL_DONE_KEY = 'etunisia_tutorial_done';

interface Step {
  icon: React.ReactNode;
  title: string;
  body: string;
}

const STEPS: Step[] = [
  {
    icon: <Compass size={26} />,
    title: 'Discover Tunisia',
    body: 'Browse hidden medinas, beaches and cafés on Explore — saved by real travelers, not ads.',
  },
  {
    icon: <Sparkles size={26} />,
    title: 'Plan a trip in minutes',
    body: 'Tell us your vibe and dates; the AI planner builds a day-by-day itinerary you can tweak.',
  },
  {
    icon: <Flame size={26} />,
    title: 'Build your streak',
    body: 'Check in daily, finish challenges and earn Travel Dust, badges and a passport that levels up.',
  },
  {
    icon: <MessageCircle size={26} />,
    title: 'Connect with travelers',
    body: 'Follow people, message them and send a tip when a recommendation makes your trip.',
  },
];

interface Props {
  item: PopupItem;
  onClose: () => void;
}

/** First-run guided tour. Marks itself done in localStorage on finish/skip. */
export function TutorialPopup({ onClose }: Props) {
  const [i, setI] = useState(0);
  const step = STEPS[i];
  const isLast = i === STEPS.length - 1;

  const markDone = () => {
    try {
      localStorage.setItem(TUTORIAL_DONE_KEY, String(Date.now()));
    } catch {}
  };

  const finish = (go?: string) => {
    markDone();
    onClose();
    if (go) goTo(go);
  };

  return (
    <div className="popup-body popup-tutorial">
      <div className="popup-tutorial-icon" aria-hidden="true">
        {step.icon}
      </div>
      <div className="popup-tutorial-step">Step {i + 1} of {STEPS.length}</div>
      <h2 className="popup-title">{step.title}</h2>
      <p className="popup-sub">{step.body}</p>

      <div className="popup-dots" role="tablist" aria-label="Tutorial progress">
        {STEPS.map((_, idx) => (
          <button
            key={idx}
            type="button"
            className={`popup-dot ${idx === i ? 'on' : ''}`}
            aria-label={`Go to step ${idx + 1}`}
            aria-selected={idx === i}
            role="tab"
            onClick={() => setI(idx)}
          />
        ))}
      </div>

      <div className="popup-actions">
        {i > 0 ? (
          <button type="button" className="popup-btn ghost" onClick={() => setI((v) => v - 1)}>
            <ArrowLeft size={15} /> Back
          </button>
        ) : (
          <button type="button" className="popup-btn ghost" onClick={() => finish()}>
            Skip
          </button>
        )}

        {isLast ? (
          <button type="button" className="popup-btn primary" onClick={() => finish('/onboarding')}>
            <Check size={16} /> Get started
          </button>
        ) : (
          <button type="button" className="popup-btn primary" onClick={() => setI((v) => v + 1)}>
            Next <ArrowRight size={15} />
          </button>
        )}
      </div>
    </div>
  );
}

export default TutorialPopup;
