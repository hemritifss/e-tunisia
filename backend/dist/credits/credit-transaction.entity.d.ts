import { User } from '../users/user.entity';
export declare enum CreditTxKind {
    DEPOSIT = "deposit",
    WITHDRAWAL = "withdrawal",
    DONATION_OUT = "donation_out",
    DONATION_IN = "donation_in",
    PLATFORM_FEE = "platform_fee",
    REFUND = "refund",
    BOOST = "boost"
}
export declare class CreditTransaction {
    id: string;
    user: User;
    userId: string;
    kind: CreditTxKind;
    amount: number;
    counterpartyId: string;
    note: string;
    balanceAfter: number;
    donationId: string;
    createdAt: Date;
}
