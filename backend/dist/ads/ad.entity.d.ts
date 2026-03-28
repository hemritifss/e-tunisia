export declare enum AdPlacement {
    HOME = "home",
    DETAIL = "detail",
    FEED = "feed",
    SEARCH = "search"
}
export declare class Ad {
    id: string;
    title: string;
    imageUrl: string;
    targetUrl: string;
    advertiserName: string;
    placement: AdPlacement;
    description: string;
    impressions: number;
    clicks: number;
    costPerClick: number;
    budget: number;
    spent: number;
    isActive: boolean;
    startDate: Date;
    endDate: Date;
    createdAt: Date;
    updatedAt: Date;
}
