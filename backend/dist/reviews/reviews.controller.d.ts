import { ReviewsService } from './reviews.service';
declare class CreateReviewDto {
    rating: number;
    comment: string;
    images?: string[];
    inquiryId?: string;
}
declare class HostReplyDto {
    body: string;
}
export declare class ReviewsController {
    private reviewsService;
    constructor(reviewsService: ReviewsService);
    byHandle(handle: string): Promise<import("./review.entity").Review[]>;
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
    create(req: any, placeId: string, body: CreateReviewDto): Promise<import("./review.entity").Review>;
    hostReply(req: any, id: string, body: HostReplyDto): Promise<import("./review.entity").Review>;
    deleteHostReply(req: any, id: string): Promise<import("./review.entity").Review>;
    getMyReviews(req: any): Promise<import("./review.entity").Review[]>;
}
export {};
