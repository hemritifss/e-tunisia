import { NotificationsService } from './notifications.service';
export declare class NotificationsController {
    private readonly notificationsService;
    constructor(notificationsService: NotificationsService);
    findMine(req: any): Promise<import("./notification.entity").Notification[]>;
    getUnreadCount(req: any): Promise<{
        unreadCount: number;
    }>;
    markRead(id: string, req: any): Promise<import("./notification.entity").Notification>;
    markAllRead(req: any): Promise<{
        message: string;
    }>;
    remove(id: string, req: any): Promise<{
        message: string;
    }>;
}
