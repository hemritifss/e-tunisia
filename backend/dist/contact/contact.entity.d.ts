export declare enum ContactType {
    SPONSOR = "sponsor",
    PARTNER = "partner",
    ADVERTISER = "advertiser",
    GENERAL = "general"
}
export declare enum ContactStatus {
    PENDING = "pending",
    CONTACTED = "contacted",
    CLOSED = "closed"
}
export declare class Contact {
    id: string;
    name: string;
    email: string;
    phone: string;
    businessName: string;
    type: ContactType;
    message: string;
    status: ContactStatus;
    adminNotes: string;
    createdAt: Date;
    updatedAt: Date;
}
