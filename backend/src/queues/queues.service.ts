import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class QueuesService {
  private readonly logger = new Logger(QueuesService.name);

  constructor(
    @InjectQueue('emails') private emailQueue: Queue,
    @InjectQueue('images') private imageQueue: Queue,
    @InjectQueue('analytics') private analyticsQueue: Queue,
    @InjectQueue('notifications') private notificationQueue: Queue,
    @InjectQueue('bookings') private bookingQueue: Queue,
    @InjectQueue('payouts') private payoutQueue: Queue,
  ) {}

  async addEmailJob(type: string, data: any, delay?: number) {
    return this.emailQueue.add(type, data, {
      delay,
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
    });
  }

  async addImageJob(type: string, data: any) {
    return this.imageQueue.add(type, data, {
      attempts: 3,
      backoff: { type: 'fixed', delay: 10000 },
    });
  }

  async addAnalyticsJob(type: string, data: any) {
    return this.analyticsQueue.add(type, data, {
      attempts: 2,
      backoff: { type: 'fixed', delay: 5000 },
    });
  }

  async addNotificationJob(type: string, data: any, delay?: number) {
    return this.notificationQueue.add(type, data, {
      delay,
      attempts: 3,
      backoff: { type: 'exponential', delay: 3000 },
    });
  }

  async addBookingJob(type: string, data: any, delay?: number) {
    return this.bookingQueue.add(type, data, {
      delay,
      attempts: 3,
      backoff: { type: 'exponential', delay: 10000 },
    });
  }

  async addPayoutJob(type: string, data: any, delay?: number) {
    return this.payoutQueue.add(type, data, {
      delay,
      attempts: 5,
      backoff: { type: 'exponential', delay: 60000 },
    });
  }

  async getQueueStats(): Promise<Record<string, { waiting: number; active: number; completed: number; failed: number }>> {
    const queues = [
      { name: 'emails', queue: this.emailQueue },
      { name: 'images', queue: this.imageQueue },
      { name: 'analytics', queue: this.analyticsQueue },
      { name: 'notifications', queue: this.notificationQueue },
      { name: 'bookings', queue: this.bookingQueue },
      { name: 'payouts', queue: this.payoutQueue },
    ];

    const stats: Record<string, any> = {};

    for (const { name, queue } of queues) {
      const [waiting, active, completed, failed] = await Promise.all([
        queue.getWaitingCount(),
        queue.getActiveCount(),
        queue.getCompletedCount(),
        queue.getFailedCount(),
      ]);

      stats[name] = { waiting, active, completed, failed };
    }

    return stats;
  }
}
