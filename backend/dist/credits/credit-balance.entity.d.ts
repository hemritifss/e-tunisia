import { User } from '../users/user.entity';
export declare class CreditBalance {
    id: string;
    user: User;
    userId: string;
    balance: number;
    lifetimeIn: number;
    lifetimeOut: number;
    createdAt: Date;
    updatedAt: Date;
}
