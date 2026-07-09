import { Repository } from 'typeorm';
import { PushSubscription } from './push-subscription.entity';
import { RedisService } from '../redis/redis.service';
export declare class PushService {
    private repo;
    private readonly redis;
    private readonly logger;
    private readonly ready;
    private static readonly DAILY_MAX;
    constructor(repo: Repository<PushSubscription>, redis: RedisService);
    sendToUserBudgeted(userId: string, payload: {
        title: string;
        body: string;
        icon?: string;
        url?: string;
    }, opts?: {
        max?: number;
        critical?: boolean;
    }): Promise<{
        sent: number;
        results: any[];
    } | {
        sent: number;
        skipped: "no-vapid";
        budgeted?: undefined;
    } | {
        sent: number;
        budgeted: true;
        skipped?: undefined;
    }>;
    subscribe(userId: string, subscription: PushSubscription['subscription']): Promise<PushSubscription>;
    unsubscribe(userId: string, endpoint: string): Promise<{
        message: string;
    }>;
    getActiveSubscriptions(userId?: string): Promise<PushSubscription[]>;
    sendToUser(userId: string, payload: {
        title: string;
        body: string;
        icon?: string;
        url?: string;
    }): Promise<{
        sent: number;
        results: any[];
    }>;
    broadcast(payload: {
        title: string;
        body: string;
        icon?: string;
        url?: string;
    }): Promise<{
        sent: number;
        results: any[];
    }>;
}
