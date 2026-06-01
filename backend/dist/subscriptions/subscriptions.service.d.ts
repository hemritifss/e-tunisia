import { Repository } from 'typeorm';
import { Subscription } from './subscription.entity';
import { User } from '../users/user.entity';
export declare class SubscriptionsService {
    private subscriptionRepo;
    private userRepo;
    constructor(subscriptionRepo: Repository<Subscription>, userRepo: Repository<User>);
    getMySubscription(userId: string): Promise<Subscription | null>;
    upgrade(userId: string, plan: string, paymentMethod: string, paymentReference?: string, isAnnual?: boolean): Promise<Subscription>;
    cancel(userId: string): Promise<void>;
    getRevenueStats(): Promise<{
        totalRevenue: number;
        activeSubscriptions: number;
        byPlan: Record<string, number>;
    }>;
}
