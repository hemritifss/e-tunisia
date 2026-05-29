import { WorkerHost } from '@nestjs/bullmq';
import { Repository } from 'typeorm';
import { Job } from 'bullmq';
import { Booking } from '../../bookings/booking.entity';
import { EmailService } from '../../email/email.service';
import { PushService } from '../../push/push.service';
import { UsersService } from '../../users/users.service';
interface ConfirmBookingData {
    bookingId: string;
    paymentIntentId: string;
    userEmail?: string;
    userId?: string;
}
interface ReminderData {
    bookingId: string;
    hoursBefore: number;
}
interface CancelBookingData {
    bookingId: string;
    reason?: string;
    userEmail?: string;
    userId?: string;
    refundAmount?: number;
}
export declare class BookingProcessor extends WorkerHost {
    private bookingRepo;
    private emailService;
    private pushService;
    private usersService;
    private readonly logger;
    constructor(bookingRepo: Repository<Booking>, emailService: EmailService, pushService: PushService, usersService: UsersService);
    process(job: Job<ConfirmBookingData | ReminderData | CancelBookingData>): Promise<any>;
    private handleConfirm;
    private handleReminder;
    private handleCancel;
}
export {};
