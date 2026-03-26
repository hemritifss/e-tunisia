import { User } from '../users/user.entity';
export declare enum SubStatus {
    ACTIVE = "active",
    EXPIRED = "expired",
    CANCELLED = "cancelled"
}
export declare class Subscription {
    id: string;
    user: User;
    userId: string;
    plan: string;
    amount: number;
    currency: string;
    paymentMethod: string;
    paymentReference: string;
    status: SubStatus;
    startsAt: Date;
    expiresAt: Date;
    createdAt: Date;
}
