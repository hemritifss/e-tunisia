import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
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

@Processor('payouts')
export class PayoutProcessor extends WorkerHost {
  private readonly logger = new Logger(PayoutProcessor.name);

  constructor(
    @InjectRepository(Booking)
    private bookingRepo: Repository<Booking>,
    private redisService: RedisService,
  ) {
    super();
  }

  async process(job: Job<InitiatePayoutData | RetryFailedData>): Promise<any> {
    const { name, data, id } = job;
    this.logger.debug(`Processing payout job ${id} (${name})`);

    try {
      switch (name) {
        case 'initiate':
          return await this.handleInitiate(data as InitiatePayoutData, id);
        case 'retry_failed':
          return await this.handleRetry(data as RetryFailedData, id);
        default:
          this.logger.warn(`Unknown payout job type: ${name}`);
          return { skipped: true };
      }
    } catch (error: any) {
      this.logger.error(`Payout job ${id} failed: ${error.message}`);
      throw error;
    }
  }

  private async handleInitiate(data: InitiatePayoutData, jobId: string | number): Promise<any> {
    const booking = await this.bookingRepo.findOne({
      where: { id: data.bookingId },
      relations: ['place'],
    });

    if (!booking) {
      throw new Error(`Booking ${data.bookingId} not found`);
    }

    if (booking.status !== 'completed' && booking.status !== 'confirmed') {
      throw new Error(`Booking ${data.bookingId} is not eligible for payout (status: ${booking.status})`);
    }

    // In production, this would call Stripe Connect / PayPal / Bank API
    // For now, we log the payout and mark it as processed
    const payoutRecord = {
      jobId,
      bookingId: data.bookingId,
      hostId: data.hostId,
      amount: data.amount,
      currency: data.currency,
      method: data.method || 'stripe_connect',
      status: 'completed',
      processedAt: new Date().toISOString(),
    };

    // Store payout record in Redis for audit trail
    await this.redisService.setJson(
      `payout:${data.bookingId}:${jobId}`,
      payoutRecord,
      90 * 86400, // 90 days retention
    );

    // Update booking metadata
    booking.metadata = {
      ...booking.metadata,
      payout: {
        status: 'completed',
        amount: data.amount,
        processedAt: payoutRecord.processedAt,
      },
    };
    await this.bookingRepo.save(booking);

    this.logger.log(`Payout of ${data.amount} ${data.currency} processed for booking ${data.bookingId}`);
    return { payout: payoutRecord };
  }

  private async handleRetry(data: RetryFailedData, jobId: string | number): Promise<any> {
    // Fetch the previous failed payout record
    const previousRecord = await this.redisService.getJson<any>(`payout:${data.bookingId}:${data.previousAttemptId}`);

    if (!previousRecord) {
      this.logger.warn(`No previous payout record found for ${data.bookingId}`);
      return { skipped: true, reason: 'no_previous_record' };
    }

    this.logger.log(`Retrying payout for booking ${data.bookingId} (previous failure: ${data.failureReason})`);

    // Re-queue as a new initiate job with retry flag
    const retryRecord = {
      ...previousRecord,
      jobId,
      isRetry: true,
      previousAttemptId: data.previousAttemptId,
      failureReason: data.failureReason,
      retriedAt: new Date().toISOString(),
      status: 'completed',
    };

    await this.redisService.setJson(
      `payout:${data.bookingId}:${jobId}`,
      retryRecord,
      90 * 86400,
    );

    this.logger.log(`Payout retry completed for booking ${data.bookingId}`);
    return { retry: retryRecord };
  }
}
