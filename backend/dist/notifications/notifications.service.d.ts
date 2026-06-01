import { Repository } from 'typeorm';
import { Notification, NotificationType } from './notification.entity';
import { EventsGateway } from '../websocket/websocket.gateway';
import { QueuesService } from '../queues/queues.service';
export declare class NotificationsService {
    private notifRepo;
    private queuesService;
    private gateway?;
    constructor(notifRepo: Repository<Notification>, queuesService: QueuesService, gateway?: EventsGateway);
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
    queueNotification(userId: string, title: string, body: string, type: NotificationType, data?: any, push?: boolean): Promise<import("bullmq").Job<any, any, string>>;
    queueBulkNotification(userIds: string[], title: string, body: string, type: NotificationType, data?: any): Promise<import("bullmq").Job<any, any, string>>;
    remove(id: string, userId: string): Promise<{
        message: string;
    }>;
    seedForUser(userId: string): Promise<void>;
}
