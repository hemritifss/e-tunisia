import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from 'bullmq';
import { Notification, NotificationType } from '../../notifications/notification.entity';
import { PushService } from '../../push/push.service';

interface NotificationJobData {
  userId: string;
  title: string;
  body: string;
  type: NotificationType;
  data?: any;
  push?: boolean;
}

interface BulkNotificationJobData {
  userIds: string[];
  title: string;
  body: string;
  type: NotificationType;
  data?: any;
}

@Processor('notifications')
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(
    @InjectRepository(Notification)
    private notifRepo: Repository<Notification>,
    private pushService: PushService,
  ) {
    super();
  }

  async process(job: Job<NotificationJobData | BulkNotificationJobData>): Promise<any> {
    const { name, data, id } = job;
    this.logger.debug(`Processing notification job ${id} (${name})`);

    try {
      switch (name) {
        case 'send': {
          const sendData = data as NotificationJobData;
          return await this.handleSend(sendData, id);
        }
        case 'send_bulk': {
          const bulkData = data as BulkNotificationJobData;
          return await this.handleBulk(bulkData, id);
        }
        default:
          this.logger.warn(`Unknown notification job type: ${name}`);
          return { skipped: true };
      }
    } catch (error: any) {
      this.logger.error(`Notification job ${id} failed: ${error.message}`);
      throw error;
    }
  }

  private async handleSend(data: NotificationJobData, jobId: string | number): Promise<any> {
    // Deduplication: check if a notification with this jobId already exists
    const dedupKey = `notif:dedup:${jobId}`;
    const existing = await this.notifRepo.findOne({
      where: { userId: data.userId, title: data.title, type: data.type },
      order: { createdAt: 'DESC' },
    });
    // Only skip if created within last 60 seconds (true duplicate from retry)
    if (existing && (Date.now() - new Date(existing.createdAt).getTime()) < 60_000) {
      this.logger.debug(`Skipping duplicate notification for user ${data.userId}`);
      return { skipped: true, notificationId: existing.id };
    }

    const saved = await this.notifRepo.save(
      this.notifRepo.create({
        userId: data.userId,
        title: data.title,
        body: data.body,
        type: data.type,
        data: data.data,
      }),
    );

    // Send push notification if requested (respecting the per-user daily budget).
    if (data.push !== false) {
      try {
        await this.pushService.sendToUserBudgeted(data.userId, {
          title: data.title,
          body: data.body,
          icon: '/icon-192x192.png',
          url: this.getDeepLink(data.type, data.data),
        });
      } catch (pushError: any) {
        this.logger.warn(`Push failed for user ${data.userId}: ${pushError.message}`);
        // Don't fail the job if push fails
      }
    }

    this.logger.log(`Notification created for user ${data.userId} (${data.type})`);
    return { notificationId: saved.id };
  }

  private async handleBulk(data: BulkNotificationJobData, jobId: string | number): Promise<any> {
    // Batch insert for efficiency
    const batchSize = 100;
    const total = data.userIds.length;
    let created = 0;

    for (let i = 0; i < total; i += batchSize) {
      const batch = data.userIds.slice(i, i + batchSize);
      const notifications = batch.map((userId) =>
        this.notifRepo.create({
          userId,
          title: data.title,
          body: data.body,
          type: data.type,
          data: { ...data.data, _bulkJobId: jobId },
        }),
      );
      const saved = await this.notifRepo.save(notifications);
      created += saved.length;
    }

    this.logger.log(`Bulk notification sent to ${created}/${total} users (${data.type})`);
    return { created, total };
  }

  private getDeepLink(type: NotificationType, data?: any): string {
    switch (type) {
      case NotificationType.EVENT:
        return data?.eventId ? `/events/${data.eventId}` : '/events';
      case NotificationType.BADGE:
        return '/profile';
      case NotificationType.FOLLOW:
        return data?.userId ? `/u/${data.userId}` : '/activity';
      case NotificationType.COMMENT:
        return data?.postId ? `/post/${data.postId}` : '/feed';
      case NotificationType.MENTION:
        return data?.postId ? `/post/${data.postId}` : '/feed';
      default:
        return '/';
    }
  }
}
