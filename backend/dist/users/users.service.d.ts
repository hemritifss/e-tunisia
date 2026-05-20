import type { Cache } from 'cache-manager';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { Review } from '../reviews/review.entity';
import { Place } from '../places/place.entity';
import { TripPlan } from '../itineraries/trip-plan.entity';
import { SavedPost } from '../posts/saved-post.entity';
import { PassportDto } from './dto/passport.dto';
import { BadgesService } from '../badges/badges.service';
import { EndorsementsService } from './endorsements.service';
export declare class UsersService {
    private usersRepository;
    private reviewsRepo;
    private placesRepo;
    private tripsRepo;
    private savesRepo;
    private cache;
    private badges;
    private endorsements;
    constructor(usersRepository: Repository<User>, reviewsRepo: Repository<Review>, placesRepo: Repository<Place>, tripsRepo: Repository<TripPlan>, savesRepo: Repository<SavedPost>, cache: Cache, badges: BadgesService, endorsements: EndorsementsService);
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
    listCitiesWithReviews(limit?: number): Promise<Array<{
        city: string;
        reviews: number;
    }>>;
    getCityReviewerLeaderboard(city: string, limit?: number): Promise<{
        rank: number;
        reviews: number;
        user: {
            id: any;
            handle: any;
            fullName: any;
            avatar: any;
            country: any;
            points: any;
            role: any;
        };
    }[]>;
    topCityRankForUser(userId: string): Promise<{
        city: string;
        rank: number;
        total: number;
    } | null>;
    applyLocalGuide(userId: string): Promise<{
        ok: boolean;
        role: import("./user.entity").UserRole.CREATOR | import("./user.entity").UserRole.ADMIN;
        alreadyGuide: boolean;
        reason?: undefined;
        progress?: undefined;
    } | {
        ok: boolean;
        role: import("./user.entity").UserRole.USER;
        reason: string;
        progress: {
            points: number;
            pointsRequired: number;
            reviewsCount: number;
            reviewsRequired: number;
            tripsCount: number;
            tripsRequired: number;
        };
        alreadyGuide?: undefined;
    } | {
        ok: boolean;
        role: string;
        alreadyGuide?: undefined;
        reason?: undefined;
        progress?: undefined;
    }>;
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
