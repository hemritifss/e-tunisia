import { Repository } from 'typeorm';
import { Review } from './review.entity';
import { PlacesService } from '../places/places.service';
export declare class ReviewsService {
    private reviewsRepo;
    private placesService;
    constructor(reviewsRepo: Repository<Review>, placesService: PlacesService);
    create(userId: string, placeId: string, data: {
        rating: number;
        comment: string;
        images?: string[];
    }): Promise<Review>;
    findByPlace(placeId: string): Promise<Review[]>;
    findFeed(opts?: {
        page?: number;
        limit?: number;
        sort?: 'new' | 'top' | 'hot';
    }): Promise<{
        data: any[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    findByUser(userId: string): Promise<Review[]>;
}
