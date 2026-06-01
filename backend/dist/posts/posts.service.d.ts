import { Repository } from 'typeorm';
import { Post } from './post.entity';
import { Comment } from './comment.entity';
import { CommentLike } from './comment-like.entity';
import { PostReaction, ReactionType } from './post-reaction.entity';
import { SavedPost } from './saved-post.entity';
import { Repost } from './repost.entity';
import { BillingService } from '../billing/billing.service';
import { BadgesService } from '../badges/badges.service';
import { User } from '../users/user.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { ModerationService } from '../ai/moderation.service';
import { AIService } from '../ai/ai.service';
import { SafetyService } from '../safety/safety.service';
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
    private commentLikesRepo;
    private reactionsRepo;
    private savedRepo;
    private repostsRepo;
    private usersRepo;
    private notifications;
    private badges;
    private billing;
    private moderation;
    private safety;
    private ai;
    constructor(postsRepo: Repository<Post>, commentsRepo: Repository<Comment>, commentLikesRepo: Repository<CommentLike>, reactionsRepo: Repository<PostReaction>, savedRepo: Repository<SavedPost>, repostsRepo: Repository<Repost>, usersRepo: Repository<User>, notifications: NotificationsService, badges: BadgesService, billing: BillingService, moderation: ModerationService, safety: SafetyService, ai: AIService);
    private autoEnrich;
    private screenContent;
    private fileAutoReport;
    listReactors(postId: string, opts?: {
        type?: string | null;
        page?: number;
        limit?: number;
    }): Promise<{
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
    private isUuid;
    savePost(postId: string, userId: string): Promise<{
        saved: boolean;
    }>;
    unsavePost(postId: string, userId: string): Promise<{
        saved: boolean;
    }>;
    listSavedByHandle(handle: string, opts?: {
        page?: number;
        limit?: number;
    }): Promise<{
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
    listSaved(userId: string, opts?: {
        page?: number;
        limit?: number;
    }): Promise<{
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
    savedBulk(postIds: string[], viewerId?: string): Promise<Record<string, boolean>>;
    react(postId: string, userId: string, type: ReactionType | null): Promise<{
        total: number;
        breakdown: Record<string, number>;
        mine: string;
    }>;
    aggregate(postId: string, viewerId?: string): Promise<{
        total: number;
        breakdown: Record<string, number>;
        mine: string;
    }>;
    aggregateBulk(postIds: string[], viewerId?: string): Promise<Record<string, any>>;
    listComments(postId: string, viewerId?: string): Promise<any[]>;
    addComment(postId: string, authorId: string, body: string, parentId?: string | null): Promise<Comment>;
    toggleCommentLike(commentId: string, userId: string): Promise<{
        liked: boolean;
        likeCount: number;
    }>;
    trackView(postId: string): Promise<void>;
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
    repost(postId: string, userId: string, comment?: string): Promise<Repost>;
    undoRepost(postId: string, userId: string): Promise<{
        removed: boolean;
    }>;
    listReposts(postId: string): Promise<Repost[]>;
}
export {};
