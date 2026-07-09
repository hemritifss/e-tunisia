export type PassportLevel = 'Bronze' | 'Silver' | 'Gold' | 'Platinum';

export interface PassportStats {
    citiesVisited: number;
    tripsPlanned: number;
    reviewsCount: number;
    savesCount: number;
}

export interface PassportDto {
    handle: string;
    fullName: string;
    avatar: string | null;
    country: string | null;
    bio: string | null;
    website: string | null;
    interests: string[];
    badges: string[];
    points: number;
    passportLevel: PassportLevel;
    role: 'user' | 'creator' | 'admin';
    joinedAt: string;
    stats: PassportStats;
    visitedCities: string[];
    /** Total followers + following (denormalized counts on User). */
    followersCount: number;
    followingCount: number;
    /** True only when the request was made by a signed-in viewer who follows this passport. */
    viewerIsFollowing?: boolean;
    /** True when the request was made by the passport owner themselves. */
    isOwner?: boolean;
    /** Top 3 endorsement topics by count, for the hero badge strip. */
    topEndorsements: Array<{ topic: string; count: number }>;
    /** Topic ids the current viewer has already endorsed this user for. Omitted for anon. */
    viewerEndorsedTopics?: string[];
    /** Set only when the user is top-3 by review count in at least one city. */
    topCityRank: { city: string; rank: number; total: number } | null;
    /** Effective subscription plan (resolves expired Pro/Biz back to Free). */
    plan: 'free' | 'premium' | 'business';
    /** Pro perk: chosen hero theme (sahara | mediterranean | medina), or null. */
    passportTheme?: string | null;
    /** Honest stamp rarity: visited-city → distinct explorer count. */
    stampRarity?: Record<string, number>;
    /** Founders' program: №1–1000 for the first real accounts, else null. */
    founderNumber?: number | null;
}

export function deriveLevel(points: number): PassportLevel {
    if (points >= 2000) return 'Platinum';
    if (points >= 500) return 'Gold';
    if (points >= 100) return 'Silver';
    return 'Bronze';
}
