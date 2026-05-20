import { Repository } from 'typeorm';
import { Place } from './place.entity';
import { PlaceInquiry, InquiryStatus } from './place-inquiry.entity';
import { TourPackage } from './tour-package.entity';
import { NotificationsService } from '../notifications/notifications.service';
interface CreateInquiryInput {
    name: string;
    email: string;
    phone?: string | null;
    partySize?: number;
    dateFrom?: string | null;
    dateTo?: string | null;
    budget?: number | null;
    currency?: string;
    message: string;
    source?: string | null;
    packageId?: string | null;
}
export declare class InquiriesService {
    private inquiries;
    private places;
    private packages;
    private notifications;
    constructor(inquiries: Repository<PlaceInquiry>, places: Repository<Place>, packages: Repository<TourPackage>, notifications: NotificationsService);
    private static UUID_RE;
    submit(placeId: string, viewerUserId: string | null, input: CreateInquiryInput): Promise<{
        id: string;
        placeId: string;
        placeName: string;
        status: InquiryStatus;
        createdAt: Date;
    }>;
    listMine(userId: string, opts?: {
        page?: number;
        limit?: number;
    }): Promise<{
        data: {
            place: {
                id: any;
                name: any;
                slug: any;
                city: any;
                coverImage: any;
            };
            id: string;
            placeId: string;
            userId: string | null;
            name: string;
            email: string;
            phone: string | null;
            partySize: number;
            dateFrom: string | null;
            dateTo: string | null;
            budget: number | null;
            currency: string;
            message: string;
            status: InquiryStatus;
            source: string | null;
            packageId: string | null;
            createdAt: Date;
            updatedAt: Date;
        }[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    listReceived(userId: string, opts?: {
        page?: number;
        limit?: number;
    }): Promise<{
        data: {
            place: {
                id: any;
                name: any;
                city: any;
                coverImage: any;
            };
            id: string;
            placeId: string;
            userId: string | null;
            name: string;
            email: string;
            phone: string | null;
            partySize: number;
            dateFrom: string | null;
            dateTo: string | null;
            budget: number | null;
            currency: string;
            message: string;
            status: InquiryStatus;
            source: string | null;
            packageId: string | null;
            createdAt: Date;
            updatedAt: Date;
        }[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    statsForOwner(userId: string): Promise<{
        placeCount: number;
        total: number;
        new: number;
        contacted: number;
        quoted: number;
        booked: number;
        closed: number;
        last7Days: number;
        conversionRate: number;
    }>;
    breakdownForOwner(userId: string): Promise<{
        sources: {
            total: number;
            booked: number;
            source: string;
        }[];
        packages: {
            total: number;
            booked: number;
            id: string;
            title: string;
            pricePerPerson: number;
            currency: string;
        }[];
    }>;
    updateStatus(inquiryId: string, viewerUserId: string, status: InquiryStatus): Promise<PlaceInquiry>;
    private statusNotifyCopy;
}
export {};
