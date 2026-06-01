import { User } from '../users/user.entity';
export declare class Collection {
    id: string;
    title: string;
    description: string;
    coverImage: string;
    owner: User;
    ownerId: string;
    placeIds: string[];
    isPublic: boolean;
    isPremium: boolean;
    likeCount: number;
    isActive: boolean;
    createdAt: Date;
}
