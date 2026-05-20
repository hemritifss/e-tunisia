import { Repository } from 'typeorm';
import { TripPlan } from './trip-plan.entity';
import { Place } from '../places/place.entity';
import { TourPackage } from '../places/tour-package.entity';
import { InquiriesService } from '../places/inquiries.service';
import { UsersService } from '../users/users.service';
import { BadgesService } from '../badges/badges.service';
interface BatchInquiryInput {
    name: string;
    email: string;
    phone?: string;
    dateFrom?: string;
    dateTo?: string;
    budget?: number;
    message: string;
}
interface UpsertInput {
    title?: string;
    travelers?: number;
    currency?: string;
    stops: Array<{
        placeId: string;
        packageId?: string | null;
        dayIndex?: number;
    }>;
    days?: number;
    isPublic?: boolean;
}
export declare class TripsService {
    private trips;
    private places;
    private packages;
    private inquiries;
    private users;
    private badges;
    private static UUID_RE;
    constructor(trips: Repository<TripPlan>, places: Repository<Place>, packages: Repository<TourPackage>, inquiries: InquiriesService, users: UsersService, badges: BadgesService);
    listByHandle(handle: string): Promise<TripPlan[]>;
    batchInquire(slug: string, viewerUserId: string | null, input: BatchInquiryInput): Promise<{
        slug: string;
        sent: number;
        failures: {
            placeId: string;
            reason: string;
        }[];
        inquiries: {
            placeId: string;
            inquiryId: string;
            placeName: string;
        }[];
    }>;
    private generateSlug;
    private hydrateStops;
    create(userId: string | null, input: UpsertInput): Promise<TripPlan>;
    update(slug: string, userId: string, input: UpsertInput): Promise<TripPlan>;
    listMine(userId: string): Promise<TripPlan[]>;
    discover(opts?: {
        page?: number;
        limit?: number;
        city?: string;
        minDays?: number;
        maxDays?: number;
        sort?: 'popular' | 'new';
    }): Promise<{
        data: {
            slug: string;
            title: string;
            travelers: number;
            days: number;
            currency: string;
            viewCount: number;
            stopCount: number;
            previewCities: string[];
            previewCovers: string[];
            updatedAt: Date;
        }[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    findBySlug(slug: string, viewerUserId: string | null): Promise<TripPlan>;
    remove(slug: string, userId: string): Promise<{
        deleted: boolean;
    }>;
}
export {};
