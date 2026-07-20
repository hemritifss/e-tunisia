export interface TripStop {
    placeId: string;
    placeName?: string;
    placeCity?: string;
    placeCover?: string;
    latitude?: number | null;
    longitude?: number | null;
    packageId?: string | null;
    packageTitle?: string | null;
    pricePerPerson?: number | null;
    currency?: string | null;
    dayIndex: number;
    timeSlot?: string | null;
    addedAt: string;
}
export declare class TripPlan {
    id: string;
    slug: string;
    userId: string | null;
    title: string;
    travelers: number;
    currency: string;
    stops: TripStop[];
    days: number;
    startDate: string | null;
    inviteCode: string | null;
    isPublic: boolean;
    viewCount: number;
    cloneCount: number;
    likeCount: number;
    cloneOf: string | null;
    createdAt: Date;
    updatedAt: Date;
}
