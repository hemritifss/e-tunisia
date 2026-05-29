import type { Cache } from 'cache-manager';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { Review } from '../reviews/review.entity';
import { Place } from '../places/place.entity';
import { TripPlan } from '../itineraries/trip-plan.entity';
import { SavedPost } from '../posts/saved-post.entity';
import { PassportView } from './passport-view.entity';
import { PlaceVisit } from './place-visit.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { PassportDto } from './dto/passport.dto';
import { BadgesService } from '../badges/badges.service';
import { EndorsementsService } from './endorsements.service';
export declare class UsersService {
    private usersRepository;
    private reviewsRepo;
    private placesRepo;
    private tripsRepo;
    private savesRepo;
    private passportViewsRepo;
    private placeVisitsRepo;
    private cache;
    private badges;
    private notifications;
    private endorsements;
    constructor(usersRepository: Repository<User>, reviewsRepo: Repository<Review>, placesRepo: Repository<Place>, tripsRepo: Repository<TripPlan>, savesRepo: Repository<SavedPost>, passportViewsRepo: Repository<PassportView>, placeVisitsRepo: Repository<PlaceVisit>, cache: Cache, badges: BadgesService, notifications: NotificationsService, endorsements: EndorsementsService);
    findByEmail(email: string): Promise<User | null>;
    findByHandle(handle: string): Promise<User | null>;
    findByResetToken(token: string): Promise<User | null>;
    generateAvailableHandle(fullName: string): Promise<string>;
    isHandleAvailable(handle: string): Promise<boolean>;
    findById(id: string): Promise<User>;
    create(data: Partial<User>): Promise<User>;
    update(id: string, data: Partial<User>): Promise<User>;
    recordPassportView(ownerHandle: string, viewerId: string): Promise<void>;
    private maybeNotifyPassportViews;
    getPassportAnalytics(ownerId: string): Promise<{
        totalViews: number;
        viewsThisWeek: number;
        uniqueViewers: number;
        recentViewers: {
            handle: string;
            fullName: string;
            avatar: string;
            plan: "free" | "premium" | "business";
            role: import("./user.entity").UserRole;
            viewedAt: Date;
        }[];
        topCountries: {
            country: any;
            count: number;
        }[];
    }>;
    toggleFavorite(userId: string, placeId: string): Promise<string[]>;
    getFavoriteIds(userId: string): Promise<string[]>;
    toggleVisited(userId: string, placeId: string): Promise<string[]>;
    activeTravelers(limit?: number): Promise<{
        userId: any;
        fullName: any;
        handle: any;
        avatar: any;
        placeId: any;
        placeName: any;
        city: any;
        lat: number;
        lng: number;
    }[]>;
    cityVisitorCounts(cities: string[]): Promise<Record<string, number>>;
    getVisitedIds(userId: string): Promise<string[]>;
    suggestedUsers(limit?: number): Promise<{
        id: any;
        handle: any;
        fullName: any;
        avatar: any;
        country: any;
        bio: any;
        level: any;
        points: any;
        role: any;
        plan: "free" | "premium" | "business";
    }[]>;
    assemblePassport(handle: string): Promise<PassportDto>;
    searchUsers(query: string, limit?: number): Promise<{
        id: any;
        handle: any;
        fullName: any;
        avatar: any;
        country: any;
        bio: any;
        points: any;
        role: any;
        plan: "free" | "premium" | "business";
        followersCount: any;
    }[]>;
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
            plan: "free" | "premium" | "business";
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
        role: import("./user.entity").UserRole.USER | import("./user.entity").UserRole.SUPERADMIN;
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
    private resolveEffectivePlan;
    invalidatePassportCache(userId: string): Promise<void>;
}
