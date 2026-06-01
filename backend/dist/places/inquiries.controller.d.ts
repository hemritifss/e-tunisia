import { InquiriesService } from './inquiries.service';
import { InquiryStatus } from './place-inquiry.entity';
declare class CreateInquiryDto {
    name: string;
    email: string;
    phone?: string;
    partySize?: number;
    dateFrom?: string;
    dateTo?: string;
    budget?: number;
    currency?: string;
    message: string;
    source?: string;
    packageId?: string;
}
declare class UpdateInquiryStatusDto {
    status: InquiryStatus;
}
export declare class InquiriesController {
    private inquiries;
    constructor(inquiries: InquiriesService);
    submit(req: any, id: string, body: CreateInquiryDto): Promise<{
        id: string;
        placeId: string;
        placeName: string;
        status: InquiryStatus;
        createdAt: Date;
    }>;
    listMine(req: any, page?: string, limit?: string): Promise<{
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
    listReceived(req: any, page?: string, limit?: string): Promise<{
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
    stats(req: any): Promise<{
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
    breakdown(req: any): Promise<{
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
    updateStatus(req: any, id: string, body: UpdateInquiryStatusDto): Promise<import("./place-inquiry.entity").PlaceInquiry>;
}
export {};
