import { ReviewsService } from './reviews.service';
export declare class ReviewsController {
    private reviewsService;
    constructor(reviewsService: ReviewsService);
    findFeed(page?: string, limit?: string, sort?: 'new' | 'top' | 'hot'): Promise<{
        data: any[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    findByPlace(placeId: string): Promise<import("./review.entity").Review[]>;
    create(req: any, placeId: string, body: {
        rating: number;
        comment: string;
        images?: string[];
    }): Promise<import("./review.entity").Review>;
    getMyReviews(req: any): Promise<import("./review.entity").Review[]>;
}
