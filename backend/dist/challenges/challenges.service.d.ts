import { Repository } from 'typeorm';
import { Challenge } from './challenge.entity';
import { UserChallenge } from './user-challenge.entity';
import { UserStreak } from './streak.entity';
import { RedisService } from '../redis/redis.service';
export interface LeaderboardEntry {
    userId: string;
    fullName: string;
    avatar?: string;
    points: number;
    streak: number;
}
export declare class ChallengesService {
    private challengeRepo;
    private userChallengeRepo;
    private streakRepo;
    private redisService;
    private readonly logger;
    constructor(challengeRepo: Repository<Challenge>, userChallengeRepo: Repository<UserChallenge>, streakRepo: Repository<UserStreak>, redisService: RedisService);
    generateDailyChallenges(): Promise<Challenge[]>;
    getOrCreateUserChallenges(userId: string): Promise<UserChallenge[]>;
    updateChallengeProgress(userId: string, action: string, metadata?: Record<string, unknown>): Promise<void>;
    claimChallengeReward(userId: string, userChallengeId: string): Promise<{
        pointsEarned: number;
        xpEarned: number;
        badgeEarned?: string;
    }>;
    getOrCreateStreak(userId: string): Promise<UserStreak>;
    recordActivity(userId: string, action: string): Promise<UserStreak>;
    getLeaderboard(period?: 'daily' | 'weekly' | 'all-time', limit?: number): Promise<LeaderboardEntry[]>;
    private shuffleArray;
}
