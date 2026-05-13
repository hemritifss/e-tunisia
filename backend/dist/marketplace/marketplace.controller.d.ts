import { MarketplaceService } from './marketplace.service';
import { ProductCategory } from './product.entity';
export declare class MarketplaceController {
    private readonly marketplaceService;
    constructor(marketplaceService: MarketplaceService);
    findProducts(category?: ProductCategory, search?: string, minPrice?: number, maxPrice?: number, page?: number, limit?: number): Promise<{
        data: import("./product.entity").Product[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    getFeatured(): Promise<{
        data: import("./product.entity").Product[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findProduct(id: string): Promise<import("./product.entity").Product>;
    createProduct(sellerId: string, data: any): Promise<import("./product.entity").Product>;
    updateProduct(sellerId: string, id: string, data: any): Promise<import("./product.entity").Product>;
    deleteProduct(sellerId: string, id: string): Promise<void>;
    createOrder(buyerId: string, body: {
        items: Array<{
            productId: string;
            quantity: number;
        }>;
        shippingAddress: any;
    }): Promise<import("./order.entity").Order>;
    getMyOrders(buyerId: string): Promise<import("./order.entity").Order[]>;
    getSellerOrders(sellerId: string): Promise<import("./order.entity").Order[]>;
    getOrder(userId: string, id: string): Promise<import("./order.entity").Order>;
    updateOrderStatus(id: string, status: string, metadata?: Record<string, unknown>): Promise<import("./order.entity").Order>;
    getStats(): Promise<{
        totalProducts: number;
        totalOrders: number;
        totalRevenue: number;
        totalPlatformFees: number;
    }>;
}
