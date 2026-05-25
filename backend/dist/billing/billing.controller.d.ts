import { BillingService } from './billing.service';
import { Repository } from 'typeorm';
import { User, UserPlan } from '../users/user.entity';
export declare class BillingController {
    private billing;
    private usersRepo;
    constructor(billing: BillingService, usersRepo: Repository<User>);
    me(req: any): Promise<{
        plan: UserPlan;
        rawPlan: UserPlan;
        expiresAt: Date;
        caps: {
            maxTrips: number;
            maxSaves: number;
            suggestionWeight: number;
            customThemes: boolean;
            passportAnalytics: boolean;
            multiLangListings: boolean;
            canBoost: boolean;
            ownerDashboard: boolean;
        };
    }>;
    upgrade(req: any, body: {
        plan: 'premium' | 'business';
        cycle?: 'monthly' | 'yearly' | 'lifetime';
    }): Promise<{
        ok: boolean;
        plan: UserPlan;
        expiresAt: Date;
    }>;
    cancel(req: any): Promise<{
        ok: boolean;
        plan: UserPlan;
    }>;
}
