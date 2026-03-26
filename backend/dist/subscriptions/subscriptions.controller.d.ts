import { SubscriptionsService } from './subscriptions.service';
export declare class SubscriptionsController {
    private subsService;
    constructor(subsService: SubscriptionsService);
    getMySubscription(req: any): Promise<import("./subscription.entity").Subscription>;
    upgrade(req: any, body: {
        plan: string;
        paymentMethod: string;
        reference?: string;
    }): Promise<import("./subscription.entity").Subscription>;
    cancel(req: any): Promise<{
        message: string;
    }>;
}
