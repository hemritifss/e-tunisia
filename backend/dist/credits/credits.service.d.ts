import { Repository, DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { CreditBalance } from './credit-balance.entity';
import { CreditTransaction } from './credit-transaction.entity';
import { Donation, DonationTarget } from './donation.entity';
import { ReferralReward } from './referral-reward.entity';
import { Topup } from './topup.entity';
import { User } from '../users/user.entity';
import { FlouciService } from '../payments/flouci.service';
import { NotificationsService } from '../notifications/notifications.service';
export declare const GIFT_CATALOG: Array<{
    id: string;
    label: string;
    emoji: string;
    price: number;
}>;
export declare class CreditsService {
    private balances;
    private txs;
    private donations;
    private referrals;
    private topups;
    private users;
    private dataSource;
    private notifications;
    private flouci;
    private config;
    constructor(balances: Repository<CreditBalance>, txs: Repository<CreditTransaction>, donations: Repository<Donation>, referrals: Repository<ReferralReward>, topups: Repository<Topup>, users: Repository<User>, dataSource: DataSource, notifications: NotificationsService, flouci: FlouciService, config: ConfigService);
    private ensureBalance;
    private ensurePlatformUser;
    getBalance(userId: string): Promise<{
        balance: number;
        lifetimeIn: number;
        lifetimeOut: number;
        recent: CreditTransaction[];
    }>;
    private creditInTx;
    createPendingReferral(refereeId: string, referrerId: string): Promise<void>;
    releasePendingReferralForReferee(refereeId: string): Promise<void>;
    referralStats(userId: string): Promise<{
        released: number;
        pending: number;
        rewardTnd: number;
    }>;
    deposit(userId: string, amount: number, note?: string): Promise<CreditTransaction>;
    createFlouciTopup(userId: string, amount: number): Promise<{
        url: string;
        mock: boolean;
    }>;
    handleFlouciTopupReturn(paymentId: string): Promise<string>;
    chargeBoost(payerUserId: string, amount: number, note: string, placeId: string): Promise<{
        balance: number;
        charged: number;
    }>;
    chargeSubscription(payerUserId: string, amount: number, note: string, planId: string): Promise<{
        balance: number;
        charged: number;
        planId: string;
    }>;
    refund(userId: string, amount: number, note: string): Promise<void>;
    donate(fromUserId: string, opts: {
        target: DonationTarget;
        toUserId?: string;
        amount: number;
        message?: string;
        isAnonymous?: boolean;
        giftType?: string;
    }): Promise<{
        donation: Donation;
        feePercent: number;
        senderBalance: number;
    }>;
    listGifts(): {
        id: string;
        label: string;
        emoji: string;
        price: number;
    }[];
    sendGift(fromUserId: string, giftId: string, toUserId: string, isAnonymous?: boolean): Promise<{
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
    private apiBaseUrl;
    private creditsUrl;
}
