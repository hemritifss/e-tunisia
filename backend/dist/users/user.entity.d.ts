import { Review } from '../reviews/review.entity';
export declare enum UserRole {
    USER = "user",
    CREATOR = "creator",
    ADMIN = "admin"
}
export declare enum UserPlan {
    FREE = "free",
    PREMIUM = "premium",
    BUSINESS = "business"
}
export declare class User {
    id: string;
    fullName: string;
    email: string;
    handle: string | null;
    password: string;
    avatar: string;
    phone: string;
    country: string;
    bio: string;
    website: string;
    interests: string[];
    onboardingComplete: boolean;
    role: UserRole;
    favoriteIds: string[];
    visitedPlaceIds: string[];
    isActive: boolean;
    plan: UserPlan;
    subscriptionExpiresAt: Date;
    badges: string[];
    points: number;
    followersCount: number;
    followingCount: number;
    reviews: Review[];
    createdAt: Date;
    updatedAt: Date;
}
