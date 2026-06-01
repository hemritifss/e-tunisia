import { Repository } from 'typeorm';
import { PushSubscription } from './push-subscription.entity';
export declare class PushService {
    private repo;
    constructor(repo: Repository<PushSubscription>);
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
