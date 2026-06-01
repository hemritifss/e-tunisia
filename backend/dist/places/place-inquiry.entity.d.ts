export declare enum InquiryStatus {
    NEW = "new",
    CONTACTED = "contacted",
    QUOTED = "quoted",
    BOOKED = "booked",
    CLOSED = "closed"
}
export declare class PlaceInquiry {
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
}
