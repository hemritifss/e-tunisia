import { PushService } from './push.service';
declare class SubscribeDto {
    subscription: {
        endpoint: string;
        keys: {
            p256dh: string;
            auth: string;
        };
    };
}
declare class UnsubscribeDto {
    endpoint: string;
}
export declare class PushController {
    private pushService;
    constructor(pushService: PushService);
    subscribe(req: any, dto: SubscribeDto): Promise<import("./push-subscription.entity").PushSubscription>;
    unsubscribe(req: any, dto: UnsubscribeDto): Promise<{
        message: string;
    }>;
}
export {};
