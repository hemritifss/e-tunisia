export declare class PushSubscription {
    id: string;
    userId: string;
    subscription: {
        endpoint: string;
        keys: {
            p256dh: string;
            auth: string;
        };
    };
    isActive: boolean;
    createdAt: Date;
}
