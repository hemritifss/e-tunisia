import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Challenge, ChallengeType } from './challenge.entity';
import { UserChallenge, UserChallengeStatus } from './user-challenge.entity';
import { UserStreak } from './streak.entity';
import { User, UserPlan } from '../users/user.entity';
import { effectivePlanFor } from '../billing/plan-catalog';
import { RedisService } from '../redis/redis.service';

export interface LeaderboardEntry {
  userId: string;
  fullName: string;
  avatar?: string;
  points: number;
  streak: number;
}

@Injectable()
export class ChallengesService {
  private readonly logger = new Logger(ChallengesService.name);

  constructor(
    @InjectRepository(Challenge)
    private challengeRepo: Repository<Challenge>,
    @InjectRepository(UserChallenge)
    private userChallengeRepo: Repository<UserChallenge>,
    @InjectRepository(UserStreak)
    private streakRepo: Repository<UserStreak>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private redisService: RedisService,
  ) {}

  // ─── Streak-freeze helpers (Pro/Business retention perk) ───
  private monthKey(d = new Date()): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }

  private freezesForPlan(plan: UserPlan): number {
    if (plan === UserPlan.BUSINESS) return Number(process.env.STREAK_FREEZES_BUSINESS || 3);
    if (plan === UserPlan.PREMIUM) return Number(process.env.STREAK_FREEZES_PREMIUM || 1);
    return 0;
  }

  /** Refill the monthly freeze allowance if we've rolled into a new month. */
  private refillFreezes(streak: UserStreak, plan: UserPlan): void {
    const mk = this.monthKey();
    if (streak.freezeMonth !== mk) {
      streak.freezeMonth = mk;
      streak.freezesRemaining = this.freezesForPlan(plan);
    }
  }

  private async effectivePlanOf(userId: string): Promise<UserPlan> {
    const u = await this.userRepo.findOne({ where: { id: userId }, select: ['id', 'plan', 'subscriptionExpiresAt'] as any });
    return u ? effectivePlanFor(u) : UserPlan.FREE;
  }

  async generateDailyChallenges(): Promise<Challenge[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existing = await this.challengeRepo.find({
      where: {
        type: ChallengeType.DAILY,
        startDate: today,
      },
    });

    if (existing.length > 0) return existing;

    const dailyTemplates = [
      {
        title: 'Hidden Gem Hunter',
        description: 'Visit a place you\'ve never been to before today',
        category: 'explore',
        pointsReward: 50,
        xpReward: 25,
        requirements: { action: 'visit_new_place', targetCount: 1 },
      },
      {
        title: 'Sunrise Chaser',
        description: 'Upload a photo of a sunrise or sunset from any Tunisian location',
        category: 'photo',
        pointsReward: 75,
        xpReward: 30,
        requirements: { action: 'upload_photo', targetCount: 1 },
      },
      {
        title: 'Local Storyteller',
        description: 'Write a review for a place you visited today',
        category: 'review',
        pointsReward: 60,
        xpReward: 20,
        requirements: { action: 'write_review', targetCount: 1 },
      },
      {
        title: 'Social Butterfly',
        description: 'Share a post or tip with the community',
        category: 'social',
        pointsReward: 40,
        xpReward: 15,
        requirements: { action: 'share_post', targetCount: 1 },
      },
      {
        title: 'Governorate Explorer',
        description: 'Visit a place in a different governorate than yesterday',
        category: 'explore',
        pointsReward: 100,
        xpReward: 50,
        requirements: { action: 'visit_new_governorate', targetCount: 1 },
      },
      {
        title: 'Foodie Adventure',
        description: 'Visit a restaurant or food spot and share your experience',
        category: 'explore',
        pointsReward: 55,
        xpReward: 20,
        requirements: { action: 'visit_food_place', targetCount: 1 },
      },
    ];

    const selected = this.shuffleArray(dailyTemplates).slice(0, 3);

    const challenges: Challenge[] = [];
    for (const template of selected) {
      const challenge = new Challenge();
      challenge.title = template.title;
      challenge.description = template.description;
      challenge.category = template.category as any;
      challenge.pointsReward = template.pointsReward;
      challenge.xpReward = template.xpReward;
      challenge.requirements = template.requirements;
      challenge.type = ChallengeType.DAILY;
      challenge.startDate = today;
      challenge.endDate = tomorrow;
      challenge.isActive = true;
      challenges.push(challenge);
    }

    return this.challengeRepo.save(challenges);
  }

  async getOrCreateUserChallenges(userId: string): Promise<UserChallenge[]> {
    const dailyChallenges = await this.generateDailyChallenges();
    const userChallenges: UserChallenge[] = [];

    for (const challenge of dailyChallenges) {
      let userChallenge = await this.userChallengeRepo.findOne({
        where: { userId, challengeId: challenge.id },
        relations: ['challenge'],
      });

      if (!userChallenge) {
        userChallenge = new UserChallenge();
        userChallenge.userId = userId;
        userChallenge.challengeId = challenge.id;
        userChallenge.status = UserChallengeStatus.IN_PROGRESS;
        userChallenge.progress = 0;
        userChallenge.target = challenge.requirements?.targetCount || 1;
        await this.userChallengeRepo.save(userChallenge);
      }

      userChallenges.push(userChallenge);
    }

    return userChallenges;
  }

  async updateChallengeProgress(
    userId: string,
    action: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const userChallenges = await this.userChallengeRepo
      .createQueryBuilder('uc')
      .innerJoinAndSelect('uc.challenge', 'challenge')
      .where('uc.userId = :userId', { userId })
      .andWhere('uc.status = :status', { status: UserChallengeStatus.IN_PROGRESS })
      .andWhere('challenge.startDate <= :today', { today })
      .andWhere('challenge.endDate >= :today', { today })
      .getMany();

    for (const userChallenge of userChallenges) {
      if (userChallenge.challenge?.requirements?.action === action) {
        userChallenge.progress += 1;

        if (userChallenge.progress >= userChallenge.target) {
          userChallenge.status = UserChallengeStatus.COMPLETED;
          userChallenge.completedAt = new Date();
        }

        await this.userChallengeRepo.save(userChallenge);
      }
    }
  }

  async claimChallengeReward(userId: string, userChallengeId: string): Promise<{
    pointsEarned: number;
    xpEarned: number;
    badgeEarned?: string;
  }> {
    const userChallenge = await this.userChallengeRepo.findOne({
      where: { id: userChallengeId, userId },
      relations: ['challenge'],
    });

    if (!userChallenge) throw new NotFoundException('Challenge not found');
    if (userChallenge.status === UserChallengeStatus.CLAIMED) {
      throw new Error('Reward already claimed');
    }
    if (userChallenge.status !== UserChallengeStatus.COMPLETED) {
      throw new Error('Challenge not completed yet');
    }

    userChallenge.status = UserChallengeStatus.CLAIMED;
    userChallenge.claimedAt = new Date();
    await this.userChallengeRepo.save(userChallenge);

    return {
      pointsEarned: userChallenge.challenge?.pointsReward || 0,
      xpEarned: userChallenge.challenge?.xpReward || 0,
      badgeEarned: userChallenge.challenge?.badgeId,
    };
  }

  async getOrCreateStreak(userId: string): Promise<UserStreak> {
    let streak = await this.streakRepo.findOne({ where: { userId } });

    if (!streak) {
      streak = new UserStreak();
      streak.userId = userId;
      streak.currentStreak = 0;
      streak.longestStreak = 0;
      streak.streakHistory = [];
      await this.streakRepo.save(streak);
    }

    return streak;
  }

  async recordActivity(userId: string, action: string): Promise<UserStreak> {
    const streak = await this.getOrCreateStreak(userId);
    const plan = await this.effectivePlanOf(userId);
    this.refillFreezes(streak, plan);
    (streak as any).__freezeUsed = false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastActive = streak.lastActiveDate
      ? new Date(streak.lastActiveDate)
      : null;

    if (lastActive) {
      lastActive.setHours(0, 0, 0, 0);
      const diffDays = Math.floor(
        (today.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (diffDays === 0) {
        streak.streakHistory = [
          ...(streak.streakHistory || []),
          {
            date: today.toISOString().split('T')[0],
            action,
            pointsEarned: 10,
          },
        ];
      } else if (diffDays === 1) {
        streak.currentStreak += 1;
        streak.longestStreak = Math.max(streak.currentStreak, streak.longestStreak);
        streak.totalDaysActive += 1;
        streak.lastActiveDate = today;
        streak.streakHistory = [
          ...(streak.streakHistory || []),
          {
            date: today.toISOString().split('T')[0],
            action,
            pointsEarned: 10 + streak.currentStreak * 2,
          },
        ];
      } else {
        // Missed one or more days. A single missed day can be rescued by a streak
        // freeze (Pro/Business perk) — otherwise the streak resets.
        if (diffDays === 2 && streak.freezesRemaining > 0) {
          streak.freezesRemaining -= 1;
          (streak as any).__freezeUsed = true;
          streak.currentStreak += 1;
          streak.longestStreak = Math.max(streak.currentStreak, streak.longestStreak);
          streak.totalDaysActive += 1;
          streak.lastActiveDate = today;
          streak.streakHistory = [
            ...(streak.streakHistory || []),
            {
              date: today.toISOString().split('T')[0],
              action: `${action} (freeze used)`,
              pointsEarned: 10 + streak.currentStreak * 2,
            },
          ];
        } else {
          streak.currentStreak = 1;
          streak.totalDaysActive += 1;
          streak.lastActiveDate = today;
          streak.streakHistory = [
            ...(streak.streakHistory || []),
            {
              date: today.toISOString().split('T')[0],
              action,
              pointsEarned: 10,
            },
          ];
        }
      }
    } else {
      streak.currentStreak = 1;
      streak.longestStreak = 1;
      streak.totalDaysActive = 1;
      streak.lastActiveDate = today;
      streak.streakHistory = [
        {
          date: today.toISOString().split('T')[0],
          action,
          pointsEarned: 10,
        },
      ];
    }

    return this.streakRepo.save(streak);
  }

  /**
   * Daily check-in — the retention hook. Idempotent per calendar day. Advances the
   * streak (freeze-aware) and awards "Travel Dust" points (base 10, doubled on a
   * 7+ day streak). Returns a summary for the UI.
   */
  async checkIn(userId: string): Promise<{
    alreadyCheckedIn: boolean;
    pointsEarned: number;
    multiplier: number;
    freezeUsed: boolean;
    streak: UserStreak;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const existing = await this.getOrCreateStreak(userId);
    if (existing.lastCheckInDate) {
      const last = new Date(existing.lastCheckInDate);
      last.setHours(0, 0, 0, 0);
      if (last.getTime() === today.getTime()) {
        return { alreadyCheckedIn: true, pointsEarned: 0, multiplier: 1, freezeUsed: false, streak: existing };
      }
    }

    // Advance the streak (handles increment / freeze / reset + monthly freeze refill).
    const streak = await this.recordActivity(userId, 'daily-check-in');
    const freezeUsed = !!(streak as any).__freezeUsed;

    const multiplier = streak.currentStreak >= 7 ? 2 : 1; // 7-day streak doubles the reward
    const pointsEarned = 10 * multiplier;

    streak.lastCheckInDate = today;
    await this.streakRepo.save(streak);

    // "Travel Dust" = the existing XP/points wallet on the user.
    await this.userRepo.increment({ id: userId }, 'points', pointsEarned);

    return { alreadyCheckedIn: false, pointsEarned, multiplier, freezeUsed, streak };
  }

  async getLeaderboard(
    period: 'daily' | 'weekly' | 'all-time' = 'weekly',
    limit: number = 50,
  ): Promise<LeaderboardEntry[]> {
    const cacheKey = `leaderboard:${period}`;
    const cached = await this.redisService.getJson<LeaderboardEntry[]>(cacheKey);

    if (cached) return cached;

    const leaderboard: LeaderboardEntry[] = Array.from({ length: limit }).map((_, i) => ({
      userId: `user-${i}`,
      fullName: [
        'Yasmine Khelil', 'Marco Rossi', 'Sarah Chen', 'David Park',
        'Amina Trabelsi', 'Emma Laurent', 'Omar Ben Ali', 'Lisa Müller',
        'Karim Hadj', 'Nadia Ferchichi',
      ][i % 10],
      avatar: `https://api.dicebear.com/9.x/thumbs/svg?seed=${i}`,
      points: Math.floor(5000 - i * 80 + Math.random() * 100),
      streak: Math.floor(Math.random() * 30) + 1,
    }));

    await this.redisService.setJson(cacheKey, leaderboard, 300);
    return leaderboard;
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}
