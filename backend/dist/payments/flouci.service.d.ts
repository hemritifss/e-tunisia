import { ConfigService } from '@nestjs/config';
export declare class FlouciService {
    private config;
    private readonly logger;
    private readonly appToken?;
    private readonly appSecret?;
    constructor(config: ConfigService);
    get enabled(): boolean;
    generatePayment(params: {
        amountTnd: number;
        successLink: string;
        failLink: string;
        trackingId: string;
    }): Promise<{
        link: string;
        paymentId: string;
    }>;
    verifyPayment(paymentId: string): Promise<{
        success: boolean;
        status: string;
    }>;
}
