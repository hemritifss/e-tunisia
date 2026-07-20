import { Injectable, NotFoundException, Inject, forwardRef, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from './notification.entity';
import { EventsGateway } from '../websocket/websocket.gateway';
import { QueuesService } from '../queues/queues.service';
import { PushService } from '../push/push.service';
import { SafetyService } from '../safety/safety.service';

@Injectable()
export class NotificationsService {
    constructor(
        @InjectRepository(Notification)
        private notifRepo: Repository<Notification>,
        private queuesService: QueuesService,
        private safety: SafetyService,
        @Optional() private push?: PushService,
        @Optional()
        @Inject(forwardRef(() => EventsGateway))
        private gateway?: EventsGateway,
    ) {}

    /**
     * The actor who caused a notification, if any. There is no first-class
     * sender column — different writers stash it in `data` under different
     * keys (social.service uses fromUserId, follows.service uses followerId).
     */
    private senderOf(n: Notification): string | null {
        const d: any = n.data || {};
        return d.fromUserId || d.followerId || d.senderId || d.actorId || null;
    }

    /** Where a notification of this type should open in the app. */
    private deepLink(type: NotificationType, data?: any): string {
        switch (type) {
            case NotificationType.FOLLOW: return data?.fromUserId ? `/user/${data.fromUserId}` : '/activity';
            case NotificationType.EVENT: return data?.eventId ? `/events` : '/events';
            case NotificationType.BADGE: return '/profile';
            case NotificationType.COMMENT:
            case NotificationType.MENTION: return data?.postId ? `/post/${data.postId}` : '/feed';
            default: return '/';
        }
    }

    async findByUser(userId: string) {
        const rows = await this.notifRepo.find({
            where: { userId },
            order: { createdAt: 'DESC' },
            take: 50,
        });
        const hidden = await this.safety.getHiddenUserIds(userId);
        if (hidden.size === 0) return rows;
        return rows.filter((n) => {
            const sender = this.senderOf(n);
            return !sender || !hidden.has(sender);
        });
    }

    async getUnreadCount(userId: string) {
        // Fetch-and-filter rather than SQL count: the badge must agree with the
        // filtered list, or it reads "1 unread" over an empty tray.
        const unread = await this.notifRepo.find({
            where: { userId, isRead: false },
            select: ['id', 'data'],
        });
        if (unread.length === 0) return { unreadCount: 0 };
        const hidden = await this.safety.getHiddenUserIds(userId);
        if (hidden.size === 0) return { unreadCount: unread.length };
        const visible = unread.filter((n) => {
            const sender = this.senderOf(n as Notification);
            return !sender || !hidden.has(sender);
        });
        return { unreadCount: visible.length };
    }

    async markRead(id: string, userId: string) {
        const notif = await this.notifRepo.findOne({ where: { id, userId } });
        if (!notif) throw new NotFoundException('Notification not found');
        notif.isRead = true;
        return this.notifRepo.save(notif);
    }

    async markAllRead(userId: string) {
        await this.notifRepo.update({ userId, isRead: false }, { isRead: true });
        return { message: 'All notifications marked as read' };
    }

    async create(userId: string, title: string, body: string, type: NotificationType, data?: any) {
        const saved = await this.notifRepo.save(this.notifRepo.create({
            userId, title, body, type, data,
        }));
        // Push live via WebSocket (best-effort)
        try { this.gateway?.broadcastNotification(userId, saved); } catch {}
        // Web push, respecting the per-user daily budget (best-effort). This is why
        // new-follower etc. now reach the user even when the tab is closed.
        this.push?.sendToUserBudgeted(userId, {
            title, body, url: this.deepLink(type, data),
        }).catch(() => { /* never let push break the write */ });
        return saved;
    }

    async createBulk(userIds: string[], title: string, body: string, type: NotificationType, data?: any) {
        const notifications = userIds.map(userId => this.notifRepo.create({
            userId, title, body, type, data,
        }));
        return this.notifRepo.save(notifications);
    }

    /**
     * Queue a notification to be processed asynchronously.
     * Use for non-urgent notifications where immediate delivery is not critical.
     */
    async queueNotification(userId: string, title: string, body: string, type: NotificationType, data?: any, push = true) {
        return this.queuesService.addNotificationJob('send', {
            userId, title, body, type, data, push,
        });
    }

    /**
     * Queue bulk notifications to be processed asynchronously.
     * Use for promo/system notifications sent to many users.
     */
    async queueBulkNotification(userIds: string[], title: string, body: string, type: NotificationType, data?: any) {
        return this.queuesService.addNotificationJob('send_bulk', {
            userIds, title, body, type, data,
        });
    }

    async remove(id: string, userId: string) {
        await this.notifRepo.delete({ id, userId });
        return { message: 'Notification deleted' };
    }

    async seedForUser(userId: string) {
        const count = await this.notifRepo.count({ where: { userId } });
        if (count > 0) return;

        const notifications = [
            { title: '🎉 Welcome to e-Tunisia!', body: 'Start exploring the beauty of Tunisia. Check out trending places on the home screen!', type: NotificationType.SYSTEM },
            { title: '🏅 Badge Earned: First Steps', body: 'Congratulations! You earned the "First Steps" badge for joining e-Tunisia.', type: NotificationType.BADGE, data: { badge: 'First Steps' } },
            { title: '🎪 New Event: Carthage International Festival', body: 'The biggest cultural festival in Tunisia is happening this July! Secure your tickets now.', type: NotificationType.EVENT },
            { title: '💡 New Tip: Best Season to Visit', body: 'A community member shared a travel tip — Spring (Mar-May) is the best time to visit Tunisia!', type: NotificationType.TIP },
            { title: '💎 Go Premium for 10 TND/month', body: 'Unlock exclusive itineraries, ad-free browsing, and premium content. Start your free trial!', type: NotificationType.PROMO },
            { title: '🤝 New Sponsor: Tunisair', body: 'Tunisia\'s national airline is now a Gold sponsor. Check out special flight deals!', type: NotificationType.SPONSOR },
        ];

        for (const n of notifications) {
            await this.notifRepo.save(this.notifRepo.create({ ...n, userId }));
        }
    }
}
