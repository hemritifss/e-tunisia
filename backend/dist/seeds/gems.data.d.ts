export interface GemSeed {
    name: string;
    description: string;
    address: string;
    city: string;
    governorate: string;
    latitude: number;
    longitude: number;
    coverImage: string;
    images: string[];
    tags: string[];
    categoryName: string;
    isFeatured: boolean;
    sourcePage: string;
}
export declare const gemsData: GemSeed[];
