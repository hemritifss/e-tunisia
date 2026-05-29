import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { EmailService } from '../../email/email.service';
interface PasswordResetData {
    email: string;
    token: string;
    frontendUrl?: string;
}
interface WelcomeData {
    email: string;
    name: string;
}
interface BookingConfirmationData {
    email: string;
    bookingId: string;
    placeName: string;
    checkIn: string;
    checkOut?: string;
    guests: number;
    totalAmount: number;
    currency: string;
}
type EmailJobData = PasswordResetData | WelcomeData | BookingConfirmationData;
export declare class EmailProcessor extends WorkerHost {
    private emailService;
    private readonly logger;
    constructor(emailService: EmailService);
    process(job: Job<EmailJobData>): Promise<any>;
}
export {};
