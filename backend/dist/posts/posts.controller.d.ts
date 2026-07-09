import { PostsService } from './posts.service';
import { ReactionType } from './post-reaction.entity';
declare class CreatePostDto {
    title: string;
    body: string;
    category?: string;
    location?: string;
    placeId?: string;
    images?: string[];
    videoUrl?: string;
    tags?: string[];
}
declare class VotePostDto {
    direction: 'up' | 'down' | 'clear';
}
declare class ReactPostDto {
    type?: ReactionType | null;
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
            videoUrl: any;
            tags: any;
            authorId: any;
            author: {
                id: any;
                fullName: any;
                avatar: any;
                handle: any;
            };
            upvotes: any;
            downvotes: any;
            commentCount: any;
            viewCount: any;
            isPinned: any;
            kind: any;
            meta: any;
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
            videoUrl: any;
            tags: any;
            authorId: any;
            author: {
                id: any;
                fullName: any;
                avatar: any;
                handle: any;
            };
            upvotes: any;
            downvotes: any;
            commentCount: any;
            viewCount: any;
            isPinned: any;
            kind: any;
            meta: any;
            createdAt: any;
        }[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    saved(req: any, page?: string, limit?: string): Promise<{
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
                handle: any;
                plan: "free" | "premium" | "business";
                role: any;
            };
            upvotes: any;
            downvotes: any;
            commentCount: any;
            isPinned: any;
            createdAt: any;
            savedAt: Date;
        }[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    savedByHandle(handle: string, page?: string, limit?: string): Promise<{
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
                handle: any;
                plan: "free" | "premium" | "business";
                role: any;
            };
            upvotes: any;
            downvotes: any;
            commentCount: any;
            isPinned: any;
            createdAt: any;
            savedAt: Date;
        }[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    save(req: any, id: string): Promise<{
        saved: boolean;
    }>;
    unsave(req: any, id: string): Promise<{
        saved: boolean;
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
            videoUrl: any;
            tags: any;
            authorId: any;
            author: {
                id: any;
                fullName: any;
                avatar: any;
                handle: any;
            };
            upvotes: any;
            downvotes: any;
            commentCount: any;
            viewCount: any;
            isPinned: any;
            kind: any;
            meta: any;
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
    listComments(req: any, id: string): Promise<any[]>;
    likeComment(req: any, id: string): Promise<{
        liked: boolean;
        likeCount: number;
    }>;
    reactions(req: any, id: string): Promise<{
        total: number;
        breakdown: Record<string, number>;
        mine: string;
    }>;
    reactors(id: string, type?: string, page?: string, limit?: string): Promise<{
        data: {
            userId: string;
            type: ReactionType;
            createdAt: Date;
            user: {
                id: any;
                fullName: any;
                avatar: any;
                country: any;
                handle: any;
                plan: "free" | "premium" | "business";
                role: any;
            };
        }[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    react(req: any, id: string, body: ReactPostDto): Promise<{
        total: number;
        breakdown: Record<string, number>;
        mine: string;
    }>;
    addComment(req: any, id: string, body: {
        body: string;
        parentId?: string;
    }): Promise<import("./comment.entity").Comment>;
    repost(req: any, id: string, body: {
        comment?: string;
    }): Promise<import("./repost.entity").Repost>;
    undoRepost(req: any, id: string): Promise<{
        removed: boolean;
    }>;
    listReposts(id: string): Promise<import("./repost.entity").Repost[]>;
}
export {};
