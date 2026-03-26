import { User } from '../users/user.entity';
export declare class Tip {
    id: string;
    title: string;
    content: string;
    category: string;
    coverImage: string;
    author: User;
    authorId: string;
    likes: number;
    isApproved: boolean;
    isActive: boolean;
    createdAt: Date;
}
