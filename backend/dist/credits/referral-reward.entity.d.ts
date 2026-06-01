export declare class ReferralReward {
    id: string;
    refereeId: string;
    referrerId: string;
    status: 'pending' | 'released';
    amount: number;
    createdAt: Date;
    releasedAt: Date;
}
