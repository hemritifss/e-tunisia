import { ConfigService } from '@nestjs/config';
interface EmailPayload {
    to: string | string[];
    subject: string;
    html: string;
    from?: string;
}
export declare class EmailService {
    private configService;
    private readonly logger;
    private readonly apiKey;
    private readonly fromEmail;
    constructor(configService: ConfigService);
    send(payload: EmailPayload): Promise<{
        id?: string;
        success: boolean;
    }>;
    sendPasswordReset(email: string, token: string, frontendUrl?: string): Promise<void>;
    sendWelcome(email: string, name: string): Promise<void>;
    sendBookingConfirmation(email: string, data: {
        bookingId: string;
        placeName: string;
        checkIn: string;
        checkOut?: string;
        guests: number;
        totalAmount: number;
        currency: string;
    }): Promise<void>;
}
export {};
