import { Repository } from 'typeorm';
import { Product, ProductCategory } from './product.entity';
import { Order, OrderStatus } from './order.entity';
export declare class MarketplaceService {
    private productRepo;
    private orderRepo;
    constructor(productRepo: Repository<Product>, orderRepo: Repository<Order>);
    createProduct(sellerId: string, data: Partial<Product>): Promise<Product>;
    findProducts(filters: {
        category?: ProductCategory;
        sellerId?: string;
        minPrice?: number;
        maxPrice?: number;
        search?: string;
        featured?: boolean;
        page?: number;
        limit?: number;
    }): Promise<{
        data: Product[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findProductById(id: string): Promise<Product>;
    updateProduct(sellerId: string, productId: string, data: Partial<Product>): Promise<Product>;
    deleteProduct(sellerId: string, productId: string): Promise<void>;
    createOrder(buyerId: string, items: Array<{
        productId: string;
        quantity: number;
    }>, shippingAddress: Order['shippingAddress']): Promise<Order>;
    getMyOrders(buyerId: string): Promise<Order[]>;
    getSellerOrders(sellerId: string): Promise<Order[]>;
    getOrder(orderId: string, userId: string): Promise<Order>;
    updateOrderStatus(orderId: string, status: OrderStatus, metadata?: Record<string, unknown>): Promise<Order>;
    getMarketplaceStats(): Promise<{
        totalProducts: number;
        totalOrders: number;
        totalRevenue: number;
        totalPlatformFees: number;
    }>;
}
