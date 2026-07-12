import { TripsService } from './trips.service';
declare class StopDto {
    placeId: string;
    packageId?: string;
    dayIndex?: number;
    timeSlot?: string;
}
declare class UpsertTripDto {
    title?: string;
    travelers?: number;
    currency?: string;
    days?: number;
    startDate?: string;
    isPublic?: boolean;
    stops: StopDto[];
}
declare class BatchInquiryDto {
    name: string;
    email: string;
    phone?: string;
    dateFrom?: string;
    dateTo?: string;
    budget?: number;
    message: string;
}
export declare class TripsController {
    private trips;
    constructor(trips: TripsService);
    create(req: any, body: UpsertTripDto): Promise<import("./trip-plan.entity").TripPlan>;
    listMine(req: any): Promise<import("./trip-plan.entity").TripPlan[]>;
    discover(page?: string, limit?: string, city?: string, minDays?: string, maxDays?: string, sort?: 'popular' | 'new'): Promise<{
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
    byHandle(handle: string): Promise<import("./trip-plan.entity").TripPlan[]>;
    one(req: any, slug: string): Promise<import("./trip-plan.entity").TripPlan>;
    update(req: any, slug: string, body: UpsertTripDto): Promise<import("./trip-plan.entity").TripPlan>;
    batchInquire(req: any, slug: string, body: BatchInquiryDto): Promise<{
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
    remove(req: any, slug: string): Promise<{
        deleted: boolean;
    }>;
}
export {};
