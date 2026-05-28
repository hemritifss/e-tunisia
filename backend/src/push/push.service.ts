import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as webpush from 'web-push';
import { PushSubscription } from './push-subscription.entity';

@Injectable()
export class PushService {
  constructor(
    @InjectRepository(PushSubscription) private repo: Repository<PushSubscription>,
  ) {
    const vapidPublic = process.env.VAPID_PUBLIC_KEY;
    const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
    const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:support@etunisia.com';
    if (vapidPublic && vapidPrivate) {
      webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);
    }
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
