import { User } from '../users/user.entity';
export declare enum ProductCategory {
    HANDICRAFT = "handicraft",
    FOOD = "food",
    ART = "art",
    CLOTHING = "clothing",
    EXPERIENCE = "experience",
    SOUVENIR = "souvenir",
    BOOK = "book"
}
export declare class Product {
    id: string;
    sellerId: string;
    seller: User;
    name: string;
    description: string;
    price: number;
    currency: string;
    category: ProductCategory;
    images: string[];
    stock: number;
    shippingOptions: Array<{
        name: string;
        price: number;
        estimatedDays: number;
    }>;
    rating: number;
    reviewCount: number;
    attributes: Record<string, string>;
    isActive: boolean;
    isFeatured: boolean;
    createdAt: Date;
    updatedAt: Date;
}
