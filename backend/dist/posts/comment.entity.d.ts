import { User } from '../users/user.entity';
export declare class Comment {
    id: string;
    postId: string;
    author: User;
    authorId: string;
    body: string;
    upvotes: number;
    parentId: string | null;
    likeCount: number;
    replyCount: number;
    createdAt: Date;
}
