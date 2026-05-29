import { Post } from './post.entity';
import { User } from '../users/user.entity';
export declare class Repost {
    id: string;
    postId: string;
    post: Post;
    userId: string;
    user: User;
    comment?: string;
    createdAt: Date;
}
