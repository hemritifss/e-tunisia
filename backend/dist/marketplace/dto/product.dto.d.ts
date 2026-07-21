import { ProductCategory } from '../product.entity';
declare class ShippingOptionDto {
    name: string;
    price: number;
    estimatedDays: number;
}
export declare class CreateProductDto {
    name: string;
    description: string;
    price: number;
    currency?: string;
    category: ProductCategory;
    images?: string[];
    stock?: number;
    shippingOptions?: ShippingOptionDto[];
    attributes?: Record<string, string>;
    isActive?: boolean;
}
export declare class UpdateProductDto {
    name?: string;
    description?: string;
    price?: number;
    currency?: string;
    category?: ProductCategory;
    images?: string[];
    stock?: number;
    shippingOptions?: ShippingOptionDto[];
    attributes?: Record<string, string>;
    isActive?: boolean;
}
export {};
