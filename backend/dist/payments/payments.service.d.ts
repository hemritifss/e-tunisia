import { ConfigService } from '@nestjs/config';
export interface PaymentIntent {
    id: string;
    clientSecret: string;
    amount: number;
    currency: string;
    status: string;
}
export interface PayoutRequest {
    bookingId: string;
    hostId: string;
    amount: number;
    currency: string;
}
export declare class PaymentsService {
    private configService;
    private readonly logger;
    private stripe;
    constructor(configService: ConfigService);
    get stripeEnabled(): boolean;
    getOrCreateCustomer(params: {
        email: string;
        name?: string;
        userId: string;
    }): Promise<string>;
    createSubscriptionCheckout(params: {
        customerId: string;
        priceId: string;
        successUrl: string;
        cancelUrl: string;
        metadata: Record<string, string>;
    }): Promise<{
        id: string;
        url: string;
    }>;
    createBillingPortalSession(customerId: string, returnUrl: string): Promise<{
        url: string;
    }>;
    createPaymentIntent(amount: number, currency?: string, metadata?: Record<string, string>): Promise<PaymentIntent>;
    confirmPaymentIntent(paymentIntentId: string): Promise<boolean>;
    refundPayment(paymentIntentId: string, amount?: number): Promise<{
        success: boolean;
        refundId?: string;
    }>;
    createPayout(payout: PayoutRequest): Promise<{
        success: boolean;
        payoutId?: string;
    }>;
    constructWebhookEvent(payload: string | Buffer, signature: string, secret?: string): Promise<any>;
    getBalance(): Promise<{
        available: number;
        pending: number;
    }>;
}
