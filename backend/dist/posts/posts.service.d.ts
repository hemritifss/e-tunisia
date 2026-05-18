import { Repository } from 'typeorm';
import { Post } from './post.entity';
import { Comment } from './comment.entity';
import { NotificationsService } from '../notifications/notifications.service';
interface ListOpts {
    page?: number;
    limit?: number;
    sort?: 'new' | 'top' | 'hot';
    authorId?: string;
    category?: string;
}
export declare class PostsService {
    private postsRepo;
    private commentsRepo;
    private notifications;
    constructor(postsRepo: Repository<Post>, commentsRepo: Repository<Comment>, notifications: NotificationsService);
    listComments(postId: string): Promise<{
        id: any;
        postId: any;
        body: any;
        upvotes: any;
        createdAt: any;
        author: {
            id: any;
            fullName: any;
            avatar: any;
        };
    }[]>;
    addComment(postId: string, authorId: string, body: string): Promise<Comment>;
    create(authorId: string, data: Partial<Post>): Promise<Post>;
    list(opts?: ListOpts): Promise<{
        data: {
            id: any;
            type: "post";
            title: any;
            body: any;
            category: any;
            location: any;
            placeId: any;
            images: any;
            tags: any;
            authorId: any;
            author: {
                id: any;
                fullName: any;
                avatar: any;
            };
            upvotes: any;
            downvotes: any;
            commentCount: any;
            isPinned: any;
            createdAt: any;
        }[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    findOne(id: string): Promise<Post>;
    vote(id: string, dir: 'up' | 'down' | 'clear'): Promise<Post>;
    remove(id: string, requesterId: string): Promise<{
        deleted: boolean;
    }>;
}
export {};
