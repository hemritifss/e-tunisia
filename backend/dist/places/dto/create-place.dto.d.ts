export declare class CreatePlaceDto {
    name: string;
    nameAr?: string;
    nameFr?: string;
    description: string;
    descriptionAr?: string;
    descriptionFr?: string;
    address: string;
    city: string;
    governorate: string;
    latitude: number;
    longitude: number;
    images?: string[];
    coverImage?: string;
    videoUrl?: string;
    website?: string;
    phone?: string;
    openingHours?: string;
    priceRange?: string;
    tags?: string[];
    isFeatured?: boolean;
    categoryId: string;
}
