import { User } from '../users/user.entity';
export declare class Story {
    id: string;
    author: User;
    authorId: string;
    imageUrl: string;
    caption: string;
    viewCount: number;
    isActive: boolean;
    isHighlight: boolean;
    createdAt: Date;
    expiresAt: Date;
}
