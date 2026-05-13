import { PaymentsService } from './payments.service';
export declare class PaymentsController {
    private readonly paymentsService;
    constructor(paymentsService: PaymentsService);
    createIntent(amount: number, currency: string, metadata?: Record<string, string>): Promise<import("./payments.service").PaymentIntent>;
    handleWebhook(payload: Buffer, signature: string): Promise<{
        received: boolean;
    }>;
    getBalance(): Promise<{
        available: number;
        pending: number;
    }>;
}
