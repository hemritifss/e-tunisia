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
    constructWebhookEvent(payload: string | Buffer, signature: string): Promise<any>;
    getBalance(): Promise<{
        available: number;
        pending: number;
    }>;
}
