export declare enum OrderStatus {
    PENDING = "pending",
    PAID = "paid",
    PROCESSING = "processing",
    SHIPPED = "shipped",
    DELIVERED = "delivered",
    CANCELLED = "cancelled",
    REFUNDED = "refunded"
}
export declare class Order {
    id: string;
    buyerId: string;
    items: Array<{
        productId: string;
        productName: string;
        quantity: number;
        unitPrice: number;
        total: number;
        image?: string;
    }>;
    subtotal: number;
    shippingCost: number;
    platformFee: number;
    sellerPayout: number;
    total: number;
    currency: string;
    status: OrderStatus;
    shippingAddress: {
        fullName: string;
        street: string;
        city: string;
        governorate: string;
        postalCode?: string;
        phone: string;
    };
    paymentIntentId: string;
    trackingNumber: string;
    metadata: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
}
