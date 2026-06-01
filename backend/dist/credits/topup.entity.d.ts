import { User } from '../users/user.entity';
export type TopupStatus = 'pending' | 'completed' | 'failed';
export declare class Topup {
    id: string;
    user: User;
    userId: string;
    amount: number;
    currency: string;
    status: TopupStatus;
    paymentReference: string;
    provider: string;
    completedAt: Date;
    createdAt: Date;
}
