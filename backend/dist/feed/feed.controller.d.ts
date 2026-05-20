import { JwtService } from '@nestjs/jwt';
import { FeedService } from './feed.service';
export declare class FeedController {
    private feed;
    private jwt;
    constructor(feed: FeedService, jwt: JwtService);
    private tryGetUserId;
    public(req: any, page?: string, limit?: string, sort?: 'new' | 'top' | 'hot', category?: string, hashtag?: string): Promise<{
        data: any[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    followingFeed(req: any, page?: string, limit?: string, sort?: 'new' | 'top' | 'hot'): Promise<{
        data: any[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    mine(req: any, page?: string, limit?: string, sort?: 'new' | 'top' | 'hot'): Promise<{
        data: any[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    stories(limit?: string): Promise<{
        stories: any;
    }>;
    trending(limit?: string): Promise<{
        tag: string;
        display: string;
        count: number;
    }[]>;
}
