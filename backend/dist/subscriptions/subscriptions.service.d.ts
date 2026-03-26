import { Repository } from 'typeorm';
import { Subscription } from './subscription.entity';
import { User } from '../users/user.entity';
export declare class SubscriptionsService {
    private subsRepo;
    private usersRepo;
    constructor(subsRepo: Repository<Subscription>, usersRepo: Repository<User>);
    getMySubscription(userId: string): Promise<Subscription>;
    upgrade(userId: string, plan: string, paymentMethod: string, reference?: string): Promise<Subscription>;
    cancel(userId: string): Promise<{
        message: string;
    }>;
    getAll(): Promise<Subscription[]>;
    getRevenueStats(): Promise<any>;
}
