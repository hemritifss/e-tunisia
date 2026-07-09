import { Repository } from 'typeorm';
import { Review } from './review.entity';
import { PlacesService } from '../places/places.service';
import { PlaceInquiry } from '../places/place-inquiry.entity';
import { Place } from '../places/place.entity';
import { UsersService } from '../users/users.service';
import { BadgesService } from '../badges/badges.service';
export declare class ReviewsService {
    private reviewsRepo;
    private inquiriesRepo;
    private placesRepo;
    private placesService;
    private usersService;
    private badgesService;
    constructor(reviewsRepo: Repository<Review>, inquiriesRepo: Repository<PlaceInquiry>, placesRepo: Repository<Place>, placesService: PlacesService, usersService: UsersService, badgesService: BadgesService);
    listByHandle(handle: string): Promise<Review[]>;
    private static UUID_RE;
    create(userId: string, placeId: string, data: {
        rating: number;
        comment: string;
        images?: string[];
        inquiryId?: string | null;
    }): Promise<Review>;
    hostReply(reviewId: string, hostUserId: string, body: string): Promise<Review>;
    deleteHostReply(reviewId: string, hostUserId: string): Promise<Review>;
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
