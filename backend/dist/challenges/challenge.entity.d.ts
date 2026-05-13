export declare enum ChallengeType {
    DAILY = "daily",
    WEEKLY = "weekly",
    SEASONAL = "seasonal",
    SPECIAL = "special"
}
export declare enum ChallengeCategory {
    EXPLORE = "explore",
    PHOTO = "photo",
    REVIEW = "review",
    SOCIAL = "social",
    STREAK = "streak"
}
export declare class Challenge {
    id: string;
    title: string;
    description: string;
    type: ChallengeType;
    category: ChallengeCategory;
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
}
