import { User } from '../users/user.entity';
export declare enum DonationTarget {
    USER = "user",
    PLATFORM = "platform"
}
export declare class Donation {
    id: string;
    fromUser: User;
    fromUserId: string;
    toUser: User;
    toUserId: string;
    target: DonationTarget;
    grossAmount: number;
    platformFee: number;
    netAmount: number;
    message: string;
    isAnonymous: boolean;
    createdAt: Date;
}
