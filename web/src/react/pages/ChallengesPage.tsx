import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Flame,
  Trophy,
  Target,
  Zap,
  MapPin,
  Camera,
  MessageSquare,
  Share2,
  Check,
  Lock,
  Star,
  ChevronRight,
  Calendar,
  TrendingUp,
} from 'lucide-react';
import { Card, CardContent } from '../components/Card';
import { Button } from '../components/Button';
import { Skeleton } from '../components/Skeleton';
import * as api from '../../api';
import { useUIStore } from '../stores/ui-store';

interface Challenge {
  id: string;
  title: string;
  description: string;
  category: string;
  pointsReward: number;
  xpReward: number;
  type: string;
  userProgress?: {
    status: string;
    progress: number;
    target: number;
    completedAt?: string;
  } | null;
}

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  totalDaysActive: number;
  freezesRemaining?: number;
  lastCheckInDate?: string | null;
}

const categoryIcons: Record<string, React.ReactNode> = {
  explore: <MapPin size={18} />,
  photo: <Camera size={18} />,
  review: <MessageSquare size={18} />,
  social: <Share2 size={18} />,
};

const categoryColors: Record<string, string> = {
  explore: 'bg-green-500',
  photo: 'bg-purple-500',
  review: 'bg-blue-500',
  social: 'bg-orange-500',
};

function ChallengeCard({ challenge, onClaim }: { challenge: Challenge; onClaim: (id: string) => void }) {
  const progress = challenge.userProgress?.progress || 0;
  const target = challenge.userProgress?.target || 1;
  const percent = Math.min((progress / target) * 100, 100);
  const isCompleted = challenge.userProgress?.status === 'completed';
  const isClaimed = challenge.userProgress?.status === 'claimed';
  const isLocked = !challenge.userProgress;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        className={`relative overflow-hidden transition-all ${
          isClaimed ? 'opacity-60' : ''
        }`}
      >
        {isClaimed && (
          <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center z-10">
            <Check size={16} className="text-white" />
          </div>
        )}
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div
              className={`w-10 h-10 rounded-xl ${categoryColors[challenge.category] || 'bg-gray-500'} bg-opacity-10 flex items-center justify-center shrink-0`}
            >
              <span className={challenge.category ? '' : 'text-gray-500'}>
                {categoryIcons[challenge.category] || <Target size={18} />}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm">{challenge.title}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{challenge.description}</p>

              {/* Progress bar */}
              {!isLocked && (
                <div className="mt-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">
                      {progress} / {target}
                    </span>
                    <span className="font-medium text-brand">
                      {isCompleted ? 'Completed!' : `${Math.round(percent)}%`}
                    </span>
                  </div>
                  <div className="h-2 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percent}%` }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                      className={`h-full rounded-full ${
                        isCompleted || isClaimed ? 'bg-green-500' : 'bg-brand'
                      }`}
                    />
                  </div>
                </div>
              )}

              {isLocked && (
                <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                  <Lock size={12} />
                  Complete previous challenge to unlock
                </div>
              )}

              {/* Rewards */}
              <div className="flex items-center gap-3 mt-3">
                <span className="flex items-center gap-1 text-xs text-yellow-600 dark:text-yellow-400">
                  <Zap size={12} />
                  {challenge.xpReward} XP
                </span>
                <span className="flex items-center gap-1 text-xs text-brand">
                  <Star size={12} />
                  {challenge.pointsReward} pts
                </span>

                {isCompleted && !isClaimed && (
                  <Button
                    variant="primary"
                    size="sm"
                    className="ml-auto"
                    onClick={() => onClaim(challenge.id)}
                  >
                    Claim
                  </Button>
                )}

                {isClaimed && (
                  <span className="ml-auto text-xs text-green-600 dark:text-green-400 font-medium">
                    Claimed!
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function ChallengesPage() {
  const [activeTab, setActiveTab] = useState<'daily' | 'streaks' | 'leaderboard'>('daily');
  const showToast = useUIStore((s) => s.showToast);
  const queryClient = useQueryClient();

  const { data: challengesData, isLoading: challengesLoading } = useQuery({
    queryKey: ['challenges', 'daily'],
    queryFn: () => api.getDailyChallenges().catch(() => []),
  });

  const { data: streakData } = useQuery({
    queryKey: ['streak'],
    queryFn: () => api.getMyStreak().catch(() => null),
  });

  const { data: leaderboardData } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: () => api.getChallengeLeaderboard('weekly', 50).catch(() => []),
  });

  const claimMutation = useMutation({
    mutationFn: (userChallengeId: string) => api.claimChallenge(userChallengeId),
    onSuccess: (data: any) => {
      showToast(`+${data?.xpEarned || 0} XP earned!`, 'success');
    },
  });

  const checkInMutation = useMutation({
    mutationFn: () => api.challengeCheckIn(),
    onSuccess: (data) => {
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

  const challenges: Challenge[] = challengesData?.data || challengesData || [];
  const streak: StreakData = streakData?.data || streakData || { currentStreak: 0, longestStreak: 0, totalDaysActive: 0 };
  const leaderboard = leaderboardData?.data || leaderboardData || [];
  const todayStr = new Date().toISOString().split('T')[0];
  const checkedInToday = !!streak.lastCheckInDate && String(streak.lastCheckInDate).slice(0, 10) === todayStr;

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="text-center py-6">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center mb-3">
          <Flame size={32} className="text-white" />
        </div>
        <h1 className="text-2xl font-bold">Daily Challenges</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Complete challenges, maintain streaks, earn rewards
        </p>
      </div>

      {/* Streak banner */}
      <Card variant="elevated" className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border-orange-500/20">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {streak.currentStreak}
              </div>
              <div className="text-xs text-muted-foreground">Day Streak</div>
            </div>
            <div className="w-px h-10 bg-black/10 dark:bg-white/10" />
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {streak.longestStreak}
              </div>
              <div className="text-xs text-muted-foreground">Best</div>
            </div>
            <div className="w-px h-10 bg-black/10 dark:bg-white/10" />
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {streak.totalDaysActive}
              </div>
              <div className="text-xs text-muted-foreground">Total Days</div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <button
              type="button"
              onClick={() => checkInMutation.mutate()}
              disabled={checkedInToday || checkInMutation.isPending}
              className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-60 disabled:cursor-default transition-colors"
            >
              {checkedInToday ? '✓ Checked in' : checkInMutation.isPending ? 'Checking in…' : 'Daily check-in'}
            </button>
            <div className="text-xs text-muted-foreground">
              {typeof streak.freezesRemaining === 'number' && streak.freezesRemaining > 0
                ? `❄️ ${streak.freezesRemaining} streak freeze${streak.freezesRemaining === 1 ? '' : 's'} left`
                : streak.currentStreak >= 7 ? '🔥 Week streak!' : `${Math.max(0, 7 - streak.currentStreak)} days to week badge`}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-surface rounded-xl shadow-sm">
        {[
          { id: 'daily' as const, label: 'Daily', icon: <Calendar size={14} /> },
          { id: 'streaks' as const, label: 'Streaks', icon: <Flame size={14} /> },
          { id: 'leaderboard' as const, label: 'Rankings', icon: <Trophy size={14} /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-brand text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'daily' && (
          <motion.div
            key="daily"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-3"
          >
            {challengesLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-4 bg-surface rounded-2xl shadow-sm">
                  <Skeleton variant="text" width="60%" />
                  <Skeleton variant="text" width="80%" className="mt-2" />
                  <Skeleton variant="rect" height={8} className="mt-3 rounded-full" />
                </div>
              ))
            ) : challenges.length > 0 ? (
              challenges.map((challenge: any) => (
                <ChallengeCard
                  key={challenge.id}
                  challenge={challenge}
                  onClaim={(id) => claimMutation.mutate(id)}
                />
              ))
            ) : (
              <div className="text-center py-12">
                <Target size={48} className="mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No active challenges right now</p>
                <p className="text-sm text-muted-foreground">Check back tomorrow for new challenges!</p>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'streaks' && (
          <motion.div
            key="streaks"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-4">Streak Calendar</h3>
                <div className="grid grid-cols-7 gap-2">
                  {Array.from({ length: 28 }).map((_, i) => {
                    const day = i + 1;
                    const isActive = i < streak.currentStreak;
                    const isToday = i === streak.currentStreak - 1;
                    return (
                      <div
                        key={i}
                        className={`aspect-square rounded-lg flex items-center justify-center text-xs font-medium transition-all ${
                          isActive
                            ? 'bg-orange-500 text-white'
                            : 'bg-black/5 dark:bg-white/5 text-muted-foreground'
                        } ${isToday ? 'ring-2 ring-orange-300' : ''}`}
                      >
                        {isActive ? <Flame size={14} /> : day}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3">Streak Rewards</h3>
                <div className="space-y-3">
                  {[
                    { days: 3, reward: 'Explorer Badge', claimed: streak.longestStreak >= 3 },
                    { days: 7, reward: 'Week Warrior Badge + 100 XP', claimed: streak.longestStreak >= 7 },
                    { days: 14, reward: 'Dedicated Traveler Badge + 250 XP', claimed: streak.longestStreak >= 14 },
                    { days: 30, reward: 'Legend Badge + 1000 XP', claimed: streak.longestStreak >= 30 },
                    { days: 100, reward: 'Tunisia Master Badge + 5000 XP', claimed: streak.longestStreak >= 100 },
                  ].map((item) => (
                    <div key={item.days} className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                          item.claimed
                            ? 'bg-green-500 text-white'
                            : 'bg-black/5 dark:bg-white/5 text-muted-foreground'
                        }`}
                      >
                        {item.claimed ? <Check size={14} /> : item.days}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">{item.days} Days</div>
                        <div className="text-xs text-muted-foreground">{item.reward}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {activeTab === 'leaderboard' && (
          <motion.div
            key="leaderboard"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-2"
          >
            {leaderboard.length > 0 ? (
              leaderboard.map((entry: any, index: number) => (
                <Card
                  key={entry.userId || index}
                  className={index < 3 ? 'border-yellow-500/30' : ''}
                >
                  <CardContent className="p-3 flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        index === 0
                          ? 'bg-yellow-500 text-white'
                          : index === 1
                            ? 'bg-gray-400 text-white'
                            : index === 2
                              ? 'bg-orange-600 text-white'
                              : 'bg-black/5 dark:bg-white/5 text-muted-foreground'
                      }`}
                    >
                      {index < 3 ? <Trophy size={14} /> : index + 1}
                    </div>
                    <img
                      src={entry.avatar || `https://api.dicebear.com/9.x/thumbs/svg?seed=${index}`}
                      alt={entry.fullName}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-sm">{entry.fullName}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2">
                        <span className="flex items-center gap-1">
                          <Flame size={10} />
                          {entry.streak} day streak
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-brand">{entry.points}</div>
                      <div className="text-xs text-muted-foreground">pts</div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-12">
                <TrendingUp size={48} className="mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">Leaderboard loading...</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
