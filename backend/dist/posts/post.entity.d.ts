import { User } from '../users/user.entity';
export declare class Post {
    id: string;
    title: string;
    body: string;
    category: string;
    location: string;
    placeId: string;
    images: string[];
    tags: string[];
    author: User;
    authorId: string;
    upvotes: number;
    downvotes: number;
    commentCount: number;
    viewCount: number;
    isPinned: boolean;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
