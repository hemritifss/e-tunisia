export declare class TourPackage {
    id: string;
    placeId: string;
    title: string;
    description: string;
    durationDays: number;
    pricePerPerson: number;
    currency: string;
    minPartySize: number;
    maxPartySize: number;
    includes: string[];
    images: string[];
    badge: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
