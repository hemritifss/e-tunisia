export declare enum SponsorTier {
    GOLD = "gold",
    SILVER = "silver",
    BRONZE = "bronze"
}
export declare class Sponsor {
    id: string;
    name: string;
    logo: string;
    description: string;
    website: string;
    tier: SponsorTier;
    contactEmail: string;
    amountPaid: number;
    isActive: boolean;
    startDate: Date;
    endDate: Date;
    clickCount: number;
    impressionCount: number;
    createdAt: Date;
    updatedAt: Date;
}
