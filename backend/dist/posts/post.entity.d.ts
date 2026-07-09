import { User } from '../users/user.entity';
export declare class Post {
    id: string;
    title: string;
    body: string;
    category: string;
    kind: string | null;
    meta: Record<string, any> | null;
    location: string;
    placeId: string;
    images: string[];
    videoUrl: string | null;
    tags: string[];
    author: User;
    authorId: string;
    upvotes: number;
    downvotes: number;
    commentCount: number;
    viewCount: number;
    repostCount: number;
    isPinned: boolean;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
