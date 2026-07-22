declare class ItineraryDayDto {
    day: number;
    title?: string;
    placeIds?: string[];
    notes?: string;
}
export declare class CreateItineraryDto {
    title: string;
    description: string;
    coverImage?: string;
    days?: ItineraryDayDto[];
    placeIds?: string[];
    duration?: number;
    difficulty?: string;
    isPublic?: boolean;
}
export {};
