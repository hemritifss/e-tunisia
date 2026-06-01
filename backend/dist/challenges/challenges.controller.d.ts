import { ChallengesService } from './challenges.service';
export declare class ChallengesController {
    private readonly challengesService;
    constructor(challengesService: ChallengesService);
    getDailyChallenges(userId: string): Promise<{
        userProgress: {
            status: import("./user-challenge.entity").UserChallengeStatus;
            progress: number;
            target: number;
            completedAt: Date;
        };
        id: string;
        title: string;
        description: string;
        type: import("./challenge.entity").ChallengeType;
        category: import("./challenge.entity").ChallengeCategory;
        imageUrl: string;
        pointsReward: number;
        xpReward: number;
        badgeId: string;
        requirements: {
            action: string;
            targetCount: number;
            targetPlaceId?: string;
            targetCategory?: string;
            targetGovernorate?: string;
        };
        startDate: Date;
        endDate: Date;
        isActive: boolean;
        metadata: Record<string, unknown>;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    getMyChallenges(userId: string): Promise<import("./user-challenge.entity").UserChallenge[]>;
    claimReward(userId: string, userChallengeId: string): Promise<{
        pointsEarned: number;
        xpEarned: number;
        badgeEarned?: string;
    }>;
    getStreak(userId: string): Promise<import("./streak.entity").UserStreak>;
    recordActivity(userId: string, action: string): Promise<import("./streak.entity").UserStreak>;
    checkIn(userId: string): Promise<{
        alreadyCheckedIn: boolean;
        pointsEarned: number;
        multiplier: number;
        freezeUsed: boolean;
        streak: import("./streak.entity").UserStreak;
    }>;
    getLeaderboard(period?: 'daily' | 'weekly' | 'all-time', limit?: number): Promise<import("./challenges.service").LeaderboardEntry[]>;
}
