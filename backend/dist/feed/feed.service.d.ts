import { Repository } from 'typeorm';
import { PostsService } from '../posts/posts.service';
import { ReviewsService } from '../reviews/reviews.service';
import { AdsService } from '../ads/ads.service';
import { PlacesService } from '../places/places.service';
import { Follow } from '../social/follow.entity';
import { SafetyService } from '../safety/safety.service';
import { User } from '../users/user.entity';
import { PlaceVisit } from '../users/place-visit.entity';
type FeedSort = 'new' | 'top' | 'hot' | 'foryou';
interface FeedOpts {
    page?: number;
    limit?: number;
    sort?: FeedSort;
    mine?: boolean;
    following?: boolean;
    userId?: string;
    category?: string;
    hashtag?: string;
    hasVideo?: boolean;
}
export declare class FeedService {
    private posts;
    private reviews;
    private ads;
    private places;
    private follows;
    private users;
    private placeVisits;
    private safety;
    constructor(posts: PostsService, reviews: ReviewsService, ads: AdsService, places: PlacesService, follows: Repository<Follow>, users: Repository<User>, placeVisits: Repository<PlaceVisit>, safety: SafetyService);
    unified(opts?: FeedOpts): Promise<{
        data: any[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    private buildDiscoveryPool;
    private discoveryItem;
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
