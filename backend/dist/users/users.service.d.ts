import type { Cache } from 'cache-manager';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { Review } from '../reviews/review.entity';
import { Place } from '../places/place.entity';
import { TripPlan } from '../itineraries/trip-plan.entity';
import { SavedPost } from '../posts/saved-post.entity';
import { PassportDto } from './dto/passport.dto';
import { BadgesService } from '../badges/badges.service';
export declare class UsersService {
    private usersRepository;
    private reviewsRepo;
    private placesRepo;
    private tripsRepo;
    private savesRepo;
    private cache;
    private badges;
    constructor(usersRepository: Repository<User>, reviewsRepo: Repository<Review>, placesRepo: Repository<Place>, tripsRepo: Repository<TripPlan>, savesRepo: Repository<SavedPost>, cache: Cache, badges: BadgesService);
    findByEmail(email: string): Promise<User | null>;
    findByHandle(handle: string): Promise<User | null>;
    isHandleAvailable(handle: string): Promise<boolean>;
    findById(id: string): Promise<User>;
    create(data: Partial<User>): Promise<User>;
    update(id: string, data: Partial<User>): Promise<User>;
    toggleFavorite(userId: string, placeId: string): Promise<string[]>;
    getFavoriteIds(userId: string): Promise<string[]>;
    toggleVisited(userId: string, placeId: string): Promise<string[]>;
    getVisitedIds(userId: string): Promise<string[]>;
    suggestedUsers(limit?: number): Promise<{
        id: any;
        fullName: any;
        avatar: any;
        country: any;
        bio: any;
        level: any;
        points: any;
    }[]>;
    assemblePassport(handle: string): Promise<PassportDto>;
    seedFromDraft(userId: string, draft: {
        visitedCities?: string[];
        interests?: string[];
    }): Promise<{
        ok: boolean;
        visitedPlaceIds: number;
        interests: number;
    }>;
    invalidatePassportCache(userId: string): Promise<void>;
}
