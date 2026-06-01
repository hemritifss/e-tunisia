import { WorkerHost } from '@nestjs/bullmq';
import { Repository } from 'typeorm';
import { Job } from 'bullmq';
import { Booking } from '../../bookings/booking.entity';
import { RedisService } from '../../redis/redis.service';
interface InitiatePayoutData {
    bookingId: string;
    hostId: string;
    amount: number;
    currency: string;
    method?: 'bank_transfer' | 'paypal' | 'stripe_connect';
}
interface RetryFailedData {
    bookingId: string;
    previousAttemptId: string;
    failureReason: string;
}
export declare class PayoutProcessor extends WorkerHost {
    private bookingRepo;
    private redisService;
    private readonly logger;
    constructor(bookingRepo: Repository<Booking>, redisService: RedisService);
    process(job: Job<InitiatePayoutData | RetryFailedData>): Promise<any>;
    private handleInitiate;
    private handleRetry;
}
export {};
