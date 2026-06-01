import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Flame, Check, Target, ArrowRight } from 'lucide-react';
import * as api from '../../../api';
import { goTo } from '../../../router';
import { useUIStore } from '../../stores/ui-store';
import type { PopupItem } from '../../stores/popup-store';

interface Props {
  item: PopupItem;
  onClose: () => void;
}

/**
 * Once-a-day nudge: streak count, a one-tap daily check-in, and today's
 * open challenges. Reuses the same backend as ChallengesPage.
 */
export function DailyTaskPopup({ onClose }: Props) {
  const showToast = useUIStore((s) => s.showToast);
  const queryClient = useQueryClient();

  const { data: streakData } = useQuery({
    queryKey: ['streak'],
    queryFn: () => api.getMyStreak().catch(() => null),
  });
  const { data: challengesData } = useQuery({
    queryKey: ['challenges', 'daily'],
    queryFn: () => api.getDailyChallenges().catch(() => []),
  });

  const streak: any = (streakData as any)?.data || streakData || { currentStreak: 0, longestStreak: 0 };
  const challenges: any[] = (challengesData as any)?.data || challengesData || [];

  const todayStr = new Date().toISOString().split('T')[0];
  const checkedInToday =
    !!streak.lastCheckInDate && String(streak.lastCheckInDate).slice(0, 10) === todayStr;

  const checkIn = useMutation({
    mutationFn: () => api.challengeCheckIn(),
    onSuccess: (data: any) => {
      const d = data?.data || data || {};
      if (d.alreadyCheckedIn) {
        showToast('Already checked in today — see you tomorrow!', 'info');
      } else {
        const mult = d.multiplier > 1 ? ` · ${d.multiplier}× streak bonus` : '';
        const froze = d.freezeUsed ? ' ❄️ A freeze saved your streak!' : '';
        showToast(`+${d.pointsEarned || 0} Travel Dust${mult}${froze}`, 'success');
      }
      queryClient.invalidateQueries({ queryKey: ['streak'] });
    },
    onError: () => showToast('Check-in failed — try again.', 'error'),
  });

  const openChallenges = challenges
    .filter((c) => c.userProgress && c.userProgress.status !== 'claimed')
    .slice(0, 3);

  return (
    <div className="popup-body popup-daily">
      <div className="popup-daily-flame" aria-hidden="true">
        <Flame size={32} strokeWidth={1.75} />
      </div>
      <h2 className="popup-title">
        {streak.currentStreak > 0 ? `${streak.currentStreak}-day streak 🔥` : 'Start your streak'}
      </h2>
      <p className="popup-sub">
        {checkedInToday
          ? "You're checked in for today. Keep exploring!"
          : 'Check in to keep your streak alive and earn Travel Dust.'}
      </p>

      <button
        type="button"
        className={`popup-daily-checkin ${checkedInToday ? 'done' : ''}`}
        onClick={() => checkIn.mutate()}
        disabled={checkedInToday || checkIn.isPending}
      >
        {checkedInToday ? (
          <><Check size={18} /> Checked in today</>
        ) : checkIn.isPending ? (
          'Checking in…'
        ) : (
          <><Flame size={18} /> Daily check-in</>
        )}
      </button>

      {openChallenges.length > 0 && (
        <div className="popup-daily-tasks">
          <div className="popup-daily-tasks-head">Today's tasks</div>
          {openChallenges.map((c) => {
            const progress = c.userProgress?.progress || 0;
            const target = c.userProgress?.target || 1;
            const pct = Math.min((progress / target) * 100, 100);
            const completed = c.userProgress?.status === 'completed';
            return (
              <div key={c.id} className="popup-task">
                <div className="popup-task-top">
                  <span className="popup-task-title">{c.title}</span>
                  <span className="popup-task-count">
                    {completed ? <Check size={13} /> : `${progress}/${target}`}
                  </span>
                </div>
                <div className="popup-task-bar">
                  <div className="popup-task-fill" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
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
          <Target size={16} /> View all challenges <ArrowRight size={15} />
        </button>
        <button type="button" className="popup-btn ghost" onClick={onClose}>
          Later
        </button>
      </div>
    </div>
  );
}

export default DailyTaskPopup;
