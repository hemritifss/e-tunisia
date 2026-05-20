import { Repository } from 'typeorm';
import { PostsService } from '../posts/posts.service';
import { ReviewsService } from '../reviews/reviews.service';
import { AdsService } from '../ads/ads.service';
import { PlacesService } from '../places/places.service';
import { Follow } from '../social/follow.entity';
import { SafetyService } from '../safety/safety.service';
interface FeedOpts {
    page?: number;
    limit?: number;
    sort?: 'new' | 'top' | 'hot';
    mine?: boolean;
    following?: boolean;
    userId?: string;
    category?: string;
    hashtag?: string;
}
export declare class FeedService {
    private posts;
    private reviews;
    private ads;
    private places;
    private follows;
    private safety;
    constructor(posts: PostsService, reviews: ReviewsService, ads: AdsService, places: PlacesService, follows: Repository<Follow>, safety: SafetyService);
    unified(opts?: FeedOpts): Promise<{
        data: any[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    trendingHashtags(limit?: number): Promise<{
        tag: string;
        display: string;
        count: number;
    }[]>;
    stories(limit?: number): Promise<{
        stories: any;
    }>;
}
export {};
