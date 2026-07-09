import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as webpush from 'web-push';
import { PushSubscription } from './push-subscription.entity';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);
  /** True once VAPID keys are configured — otherwise every send is a no-op. */
  private readonly ready: boolean;
  /** Roadmap 1.2: strict cap on non-critical pushes per user per day. */
  private static readonly DAILY_MAX = 2;

  constructor(
    @InjectRepository(PushSubscription) private repo: Repository<PushSubscription>,
    private readonly redis: RedisService,
  ) {
    const vapidPublic = process.env.VAPID_PUBLIC_KEY;
    const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
    const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:support@etunisia.com';
    this.ready = !!(vapidPublic && vapidPrivate);
    if (this.ready) {
      webpush.setVapidDetails(vapidSubject, vapidPublic!, vapidPrivate!);
    }
  }

  /**
   * Send respecting a per-user daily budget (default 2/day). Non-critical
   * notifications (follower, streak, digest) go through here so we never spam.
   * Pass { critical: true } for must-deliver messages (DMs) to bypass the cap.
   */
  async sendToUserBudgeted(
    userId: string,
    payload: { title: string; body: string; icon?: string; url?: string },
    opts: { max?: number; critical?: boolean } = {},
  ) {
    if (!this.ready) return { sent: 0, skipped: 'no-vapid' as const };
    if (!opts.critical) {
      const max = opts.max ?? PushService.DAILY_MAX;
      try {
        const key = `push:budget:${userId}:${new Date().toISOString().slice(0, 10)}`;
        const count = await this.redis.increment(key);
        if (count === 1) await this.redis.expire(key, 90_000); // ~25h, spans the day
        if (count > max) {
          this.logger.debug(`Push budget spent for ${userId} (${count - 1}/${max})`);
          return { sent: 0, budgeted: true as const };
        }
      } catch {
        // Redis unavailable — fail open (better a rare extra push than none).
      }
    }
    return this.sendToUser(userId, payload);
  }

  async subscribe(userId: string, subscription: PushSubscription['subscription']) {
    // Deactivate old subscriptions for this user with same endpoint
    const existing = await this.repo.findOne({ where: { userId } });
    if (existing && existing.subscription?.endpoint === subscription.endpoint) {
      await this.repo.update(existing.id, { isActive: false });
    }

    const sub = this.repo.create({ userId, subscription, isActive: true });
    return this.repo.save(sub);
  }

  async unsubscribe(userId: string, endpoint: string) {
    const existing = await this.repo.findOne({ where: { userId } });
    if (existing && existing.subscription?.endpoint === endpoint) {
      await this.repo.update(existing.id, { isActive: false });
    }
    return { message: 'Unsubscribed' };
  }

  async getActiveSubscriptions(userId?: string) {
    const where: any = { isActive: true };
    if (userId) where.userId = userId;
    return this.repo.find({ where });
  }

  async sendToUser(userId: string, payload: { title: string; body: string; icon?: string; url?: string }) {
    const subs = await this.repo.find({ where: { userId, isActive: true } });
    const results = await Promise.allSettled(
      subs.map((sub) =>
        webpush
          .sendNotification(sub.subscription, JSON.stringify(payload))
          .catch((err) => {
            if (err.statusCode === 410 || err.statusCode === 404) {
              this.repo.update(sub.id, { isActive: false });
            }
            throw err;
          }),
      ),
    );
    return { sent: subs.length, results: results.map((r) => (r.status === 'fulfilled' ? 'ok' : r.reason?.message)) };
  }

  async broadcast(payload: { title: string; body: string; icon?: string; url?: string }) {
    const subs = await this.repo.find({ where: { isActive: true } });
    const results = await Promise.allSettled(
      subs.map((sub) =>
        webpush
          .sendNotification(sub.subscription, JSON.stringify(payload))
          .catch((err) => {
            if (err.statusCode === 410 || err.statusCode === 404) {
              this.repo.update(sub.id, { isActive: false });
            }
            throw err;
          }),
      ),
    );
    return { sent: subs.length, results: results.map((r) => (r.status === 'fulfilled' ? 'ok' : r.reason?.message)) };
  }
}
