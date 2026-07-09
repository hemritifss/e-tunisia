import { WorkerHost } from '@nestjs/bullmq';
import { Repository } from 'typeorm';
import { Job } from 'bullmq';
import { Notification, NotificationType } from '../../notifications/notification.entity';
import { PushService } from '../../push/push.service';
interface NotificationJobData {
    userId: string;
    title: string;
    body: string;
    type: NotificationType;
    data?: any;
    push?: boolean;
}
interface BulkNotificationJobData {
    userIds: string[];
    title: string;
    body: string;
    type: NotificationType;
    data?: any;
}
export declare class NotificationProcessor extends WorkerHost {
    private notifRepo;
    private pushService;
    private readonly logger;
    constructor(notifRepo: Repository<Notification>, pushService: PushService);
    process(job: Job<NotificationJobData | BulkNotificationJobData>): Promise<any>;
    private handleSend;
    private handleBulk;
    private getDeepLink;
}
export {};
