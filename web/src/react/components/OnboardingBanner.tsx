import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles, X, ChevronRight } from 'lucide-react';
import { api } from '../../shared/api';
import { goTo } from '../../router';

const DISMISS_KEY = 'etunisia_onboarding_banner_dismissed_until';

function isDismissedNow(): boolean {
  try {
    const v = localStorage.getItem(DISMISS_KEY);
    if (!v) return false;
    const until = Number(v);
    if (!Number.isFinite(until)) return false;
    return Date.now() < until;
  } catch {
    return false;
  }
}

export function OnboardingBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const token = localStorage.getItem('etunisia_token');
    if (!token || isDismissedNow()) return;

    api.me()
      .then((me: any) => {
        if (cancelled) return;
        if (me && me.onboardingComplete === false) setShow(true);
      })
      .catch(() => {});

    return () => { cancelled = true; };
  }, []);

  const dismiss = () => {
    setShow(false);
    // Snooze for 24h — re-appears tomorrow if still incomplete
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now() + 24 * 60 * 60 * 1000));
    } catch {}
  };

  const goFinish = () => {
    goTo('/onboarding');
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="relative overflow-hidden rounded-2xl border border-brand/20 bg-gradient-to-br from-brand/10 via-coral/10 to-yellow-400/10 p-4 shadow-sm"
        >
          <button
            onClick={dismiss}
            className="absolute top-2 right-2 p-1.5 rounded-full text-muted-foreground hover:bg-black/10 dark:hover:bg-white/10"
            aria-label="Dismiss"
          >
            <X size={14} />
          </button>
          <div className="flex items-center gap-3 pr-8">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-brand/15 text-brand flex items-center justify-center">
              <Sparkles size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm text-foreground">Finish setting up your profile</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Add a bio, pick interests, and follow a few people — your feed gets a lot better.
              </div>
            </div>
            <button
              onClick={goFinish}
              className="flex-shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-brand text-white text-sm font-medium hover:bg-brand-dark transition-colors"
            >
              Continue
              <ChevronRight size={14} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
