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
    freezesRemaining: number;
    freezeMonth: string;
    lastCheckInDate: Date;
    createdAt: Date;
    updatedAt: Date;
}
