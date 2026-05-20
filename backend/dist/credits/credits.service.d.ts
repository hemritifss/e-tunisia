import { Repository, DataSource } from 'typeorm';
import { CreditBalance } from './credit-balance.entity';
import { CreditTransaction } from './credit-transaction.entity';
import { Donation, DonationTarget } from './donation.entity';
import { User } from '../users/user.entity';
import { NotificationsService } from '../notifications/notifications.service';
export declare class CreditsService {
    private balances;
    private txs;
    private donations;
    private users;
    private dataSource;
    private notifications;
    constructor(balances: Repository<CreditBalance>, txs: Repository<CreditTransaction>, donations: Repository<Donation>, users: Repository<User>, dataSource: DataSource, notifications: NotificationsService);
    private ensureBalance;
    private ensurePlatformUser;
    getBalance(userId: string): Promise<{
        balance: number;
        lifetimeIn: number;
        lifetimeOut: number;
        recent: CreditTransaction[];
    }>;
    deposit(userId: string, amount: number, note?: string): Promise<CreditTransaction>;
    chargeBoost(payerUserId: string, amount: number, note: string, placeId: string): Promise<{
        balance: number;
        charged: number;
    }>;
    donate(fromUserId: string, opts: {
        target: DonationTarget;
        toUserId?: string;
        amount: number;
        message?: string;
        isAnonymous?: boolean;
    }): Promise<{
        donation: Donation;
        feePercent: number;
        senderBalance: number;
    }>;
    listSent(userId: string, limit?: number): Promise<Donation[]>;
    listReceived(userId: string, limit?: number): Promise<Donation[]>;
    leaderboard(limit?: number): Promise<{
        topPlatformSupporters: any;
        topReceivers: any;
    }>;
}
