import { Review } from '../reviews/review.entity';
export declare enum UserRole {
    USER = "user",
    CREATOR = "creator",
    ADMIN = "admin",
    SUPERADMIN = "superadmin"
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
    plan: UserPlan;
    favoriteIds: string[];
    visitedPlaceIds: string[];
    isActive: boolean;
    subscriptionExpiresAt: Date;
    stripeCustomerId: string | null;
    passportTheme: string | null;
    referredBy: string | null;
    badges: string[];
    points: number;
    followersCount: number;
    followingCount: number;
    passwordResetToken: string | null;
    passwordResetExpires: Date | null;
    tokenVersion: number;
    reviews: Review[];
    createdAt: Date;
    updatedAt: Date;
}
