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
    password: string;
    avatar: string;
    phone: string;
    country: string;
    role: UserRole;
    favoriteIds: string[];
    visitedPlaceIds: string[];
    isActive: boolean;
    plan: UserPlan;
    subscriptionExpiresAt: Date;
    badges: string[];
    points: number;
    reviews: Review[];
    createdAt: Date;
    updatedAt: Date;
}
