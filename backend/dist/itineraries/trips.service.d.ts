import { Repository } from 'typeorm';
import { TripPlan } from './trip-plan.entity';
import { TripMember } from './trip-member.entity';
import { Place } from '../places/place.entity';
import { TourPackage } from '../places/tour-package.entity';
import { InquiriesService } from '../places/inquiries.service';
import { UsersService } from '../users/users.service';
import { BadgesService } from '../badges/badges.service';
import { BillingService } from '../billing/billing.service';
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
        timeSlot?: string | null;
    }>;
    days?: number;
    startDate?: string | null;
    isPublic?: boolean;
}
export declare class TripsService {
    private trips;
    private members;
    private places;
    private packages;
    private inquiries;
    private users;
    private badges;
    private billing;
    private static UUID_RE;
    constructor(trips: Repository<TripPlan>, members: Repository<TripMember>, places: Repository<Place>, packages: Repository<TourPackage>, inquiries: InquiriesService, users: UsersService, badges: BadgesService, billing: BillingService);
    private sanitize;
    listByHandle(handle: string): Promise<Omit<TripPlan, "inviteCode">[]>;
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
    private canEdit;
    update(slug: string, userId: string, input: UpsertInput): Promise<TripPlan>;
    listMine(userId: string): Promise<Omit<TripPlan, "inviteCode">[]>;
    ensureInviteCode(slug: string, userId: string): Promise<{
        code: string;
    }>;
    join(slug: string, userId: string, code: string): Promise<{
        joined: boolean;
        alreadyOwner: boolean;
        title: string;
    } | {
        joined: boolean;
        title: string;
        alreadyOwner?: undefined;
    }>;
    listMembers(slug: string, viewerId?: string): Promise<{
        members: {
            id: any;
            handle: any;
            fullName: any;
            avatar: any;
            isOwner: boolean;
        }[];
        canEdit: boolean;
        isOwner: boolean;
    }>;
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
    findBySlug(slug: string, viewerUserId: string | null): Promise<Omit<TripPlan, "inviteCode">>;
    remove(slug: string, userId: string): Promise<{
        deleted: boolean;
    }>;
}
export {};
