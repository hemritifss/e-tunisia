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
    followersCount: number;
    followingCount: number;
    viewerIsFollowing?: boolean;
    isOwner?: boolean;
    topEndorsements: Array<{
        topic: string;
        count: number;
    }>;
    viewerEndorsedTopics?: string[];
    topCityRank: {
        city: string;
        rank: number;
        total: number;
    } | null;
    plan: 'free' | 'premium' | 'business';
    passportTheme?: string | null;
    stampRarity?: Record<string, number>;
}
export declare function deriveLevel(points: number): PassportLevel;
