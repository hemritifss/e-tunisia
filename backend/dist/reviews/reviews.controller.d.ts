import { ReviewsService } from './reviews.service';
export declare class ReviewsController {
    private reviewsService;
    constructor(reviewsService: ReviewsService);
    findByPlace(placeId: string): Promise<import("./review.entity").Review[]>;
    create(req: any, placeId: string, body: {
        rating: number;
        comment: string;
        images?: string[];
    }): Promise<import("./review.entity").Review>;
    getMyReviews(req: any): Promise<import("./review.entity").Review[]>;
}
