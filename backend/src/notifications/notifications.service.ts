import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from './notification.entity';

@Injectable()
export class NotificationsService {
    constructor(
        @InjectRepository(Notification)
        private notifRepo: Repository<Notification>,
    ) {}

    async findByUser(userId: string) {
        return this.notifRepo.find({
            where: { userId },
            order: { createdAt: 'DESC' },
            take: 50,
        });
    }

    async getUnreadCount(userId: string) {
        const count = await this.notifRepo.count({
            where: { userId, isRead: false },
        });
        return { unreadCount: count };
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
        return this.notifRepo.save(this.notifRepo.create({
            userId, title, body, type, data,
        }));
    }

    async createBulk(userIds: string[], title: string, body: string, type: NotificationType, data?: any) {
        const notifications = userIds.map(userId => this.notifRepo.create({
            userId, title, body, type, data,
        }));
        return this.notifRepo.save(notifications);
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
