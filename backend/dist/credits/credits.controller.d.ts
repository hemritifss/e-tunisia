import { CreditsService } from './credits.service';
import { DonationTarget } from './donation.entity';
declare class DepositDto {
    amount: number;
    note?: string;
}
declare class DonateDto {
    target: DonationTarget;
    toUserId?: string;
    amount: number;
    message?: string;
    isAnonymous?: boolean;
}
export declare class CreditsController {
    private credits;
    constructor(credits: CreditsService);
    balance(req: any): Promise<{
        balance: number;
        lifetimeIn: number;
        lifetimeOut: number;
        recent: import("./credit-transaction.entity").CreditTransaction[];
    }>;
    deposit(req: any, body: DepositDto): Promise<import("./credit-transaction.entity").CreditTransaction>;
    donate(req: any, body: DonateDto): Promise<{
        donation: import("./donation.entity").Donation;
        feePercent: number;
        senderBalance: number;
    }>;
    sent(req: any, limit?: string): Promise<import("./donation.entity").Donation[]>;
    received(req: any, limit?: string): Promise<import("./donation.entity").Donation[]>;
    leaderboard(limit?: string): Promise<{
        topPlatformSupporters: any;
        topReceivers: any;
    }>;
}
export {};
