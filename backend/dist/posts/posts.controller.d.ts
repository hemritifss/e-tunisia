import { PostsService } from './posts.service';
declare class CreatePostDto {
    title: string;
    body: string;
    category?: string;
    location?: string;
    placeId?: string;
    images?: string[];
    tags?: string[];
}
declare class VotePostDto {
    direction: 'up' | 'down' | 'clear';
}
export declare class PostsController {
    private posts;
    constructor(posts: PostsService);
    list(page?: string, limit?: string, sort?: 'new' | 'top' | 'hot', authorId?: string, category?: string): Promise<{
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
    mine(req: any, page?: string, limit?: string): Promise<{
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
    byUser(userId: string, page?: string, limit?: string): Promise<{
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
    create(req: any, body: CreatePostDto): Promise<import("./post.entity").Post>;
    vote(id: string, body: VotePostDto): Promise<import("./post.entity").Post>;
    remove(req: any, id: string): Promise<{
        deleted: boolean;
    }>;
    one(id: string): Promise<import("./post.entity").Post>;
    listComments(id: string): Promise<{
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
    addComment(req: any, id: string, body: {
        body: string;
    }): Promise<import("./comment.entity").Comment>;
}
export {};
