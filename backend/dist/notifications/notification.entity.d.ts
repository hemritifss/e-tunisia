import { User } from '../users/user.entity';
export declare enum NotificationType {
    EVENT = "event",
    TIP = "tip",
    BADGE = "badge",
    SPONSOR = "sponsor",
    SYSTEM = "system",
    PROMO = "promo"
}
export declare class Notification {
    id: string;
    user: User;
    userId: string;
    title: string;
    body: string;
    type: NotificationType;
    isRead: boolean;
    data: any;
    createdAt: Date;
}
