import { Repository } from 'typeorm';
import { Notification, NotificationType } from './notification.entity';
export declare class NotificationsService {
    private notifRepo;
    constructor(notifRepo: Repository<Notification>);
    findByUser(userId: string): Promise<Notification[]>;
    getUnreadCount(userId: string): Promise<{
        unreadCount: number;
    }>;
    markRead(id: string, userId: string): Promise<Notification>;
    markAllRead(userId: string): Promise<{
        message: string;
    }>;
    create(userId: string, title: string, body: string, type: NotificationType, data?: any): Promise<Notification>;
    createBulk(userIds: string[], title: string, body: string, type: NotificationType, data?: any): Promise<Notification[]>;
    remove(id: string, userId: string): Promise<{
        message: string;
    }>;
    seedForUser(userId: string): Promise<void>;
}
