import { User } from '../users/user.entity';
export declare class Itinerary {
    id: string;
    title: string;
    description: string;
    coverImage: string;
    days: {
        day: number;
        title: string;
        placeIds: string[];
        notes: string;
    }[];
    placeIds: string[];
    duration: number;
    difficulty: string;
    author: User;
    authorId: string;
    isPublic: boolean;
    isPremium: boolean;
    likeCount: number;
    viewCount: number;
    isActive: boolean;
    createdAt: Date;
}
