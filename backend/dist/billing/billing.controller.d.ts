import type { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { BillingService } from './billing.service';
import { PaymentsService } from '../payments/payments.service';
import { Repository } from 'typeorm';
import { User, UserPlan } from '../users/user.entity';
import { BillingCycle } from './plan-catalog';
export declare class BillingController {
    private billing;
    private payments;
    private config;
    private usersRepo;
    constructor(billing: BillingService, payments: PaymentsService, config: ConfigService, usersRepo: Repository<User>);
    plans(): {
        currency: string;
        plans: {
            id: import("./plan-catalog").PlanId;
            name: string;
            tagline: string;
            tint: string;
            monthly: number;
            yearly: number;
            features: string[];
            featureGroups: import("./plan-catalog").FeatureGroup[];
            featureCount: number;
            advancedControls: import("./plan-catalog").AdvancedControl[];
            ctaLabel: string;
            featured: boolean;
            caps: {
                maxTrips: number;
                maxSaves: number;
                maxCollections: number;
                aiMessagesPerDay: number;
                customThemes: boolean;
                passportAnalytics: boolean;
                multiLangListings: boolean;
                canBoost: boolean;
                ownerDashboard: boolean;
            };
        }[];
    };
    me(req: any): Promise<{
        plan: UserPlan;
        rawPlan: UserPlan;
        expiresAt: Date;
        canManageBilling: boolean;
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
    checkout(req: any, body: {
        plan: string;
        cycle?: BillingCycle;
    }): Promise<{
        url: string;
        mock: boolean;
    }>;
    flouciCheckout(req: any, body: {
        plan: string;
        cycle?: BillingCycle;
    }): Promise<{
        url: string;
        mock: boolean;
    }>;
    flouciReturn(paymentId: string, res: Response): Promise<void>;
    upgrade(req: any, body: {
        plan: string;
        cycle?: BillingCycle;
        method?: 'bank' | 'cash';
    }): Promise<{
        status: "pending";
        plan: string;
    }>;
    payWithCredits(req: any, body: {
        plan: string;
        cycle?: BillingCycle;
    }): Promise<{
        ok: true;
        plan: import("./plan-catalog").PlanId;
        balance: number;
    }>;
    portal(req: any): Promise<{
        url: string;
    }>;
    cancel(req: any): Promise<{
        plan: UserPlan;
    }>;
    webhook(req: any, signature: string): Promise<{
        received: boolean;
    }>;
}
