export declare class UserStreak {
    id: string;
    userId: string;
    currentStreak: number;
    longestStreak: number;
    lastActiveDate: Date;
    streakHistory: Array<{
        date: string;
        action: string;
        pointsEarned: number;
    }>;
    totalDaysActive: number;
    createdAt: Date;
    updatedAt: Date;
}
