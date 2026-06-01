import { Queue } from 'bullmq';
export declare class QueuesService {
    private emailQueue;
    private imageQueue;
    private analyticsQueue;
    private notificationQueue;
    private bookingQueue;
    private payoutQueue;
    private readonly logger;
    constructor(emailQueue: Queue, imageQueue: Queue, analyticsQueue: Queue, notificationQueue: Queue, bookingQueue: Queue, payoutQueue: Queue);
    addEmailJob(type: string, data: any, delay?: number): Promise<import("bullmq").Job<any, any, string>>;
    addImageJob(type: string, data: any): Promise<import("bullmq").Job<any, any, string>>;
    addAnalyticsJob(type: string, data: any): Promise<import("bullmq").Job<any, any, string>>;
    addNotificationJob(type: string, data: any, delay?: number): Promise<import("bullmq").Job<any, any, string>>;
    addBookingJob(type: string, data: any, delay?: number): Promise<import("bullmq").Job<any, any, string>>;
    addPayoutJob(type: string, data: any, delay?: number): Promise<import("bullmq").Job<any, any, string>>;
    getQueueStats(): Promise<Record<string, {
        waiting: number;
        active: number;
        completed: number;
        failed: number;
    }>>;
}
