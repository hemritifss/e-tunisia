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
    findByUser(userId: string): Promise<Review[]>;
}
