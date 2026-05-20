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
}

export function deriveLevel(points: number): PassportLevel {
    if (points >= 2000) return 'Platinum';
    if (points >= 500) return 'Gold';
    if (points >= 100) return 'Silver';
    return 'Bronze';
}
