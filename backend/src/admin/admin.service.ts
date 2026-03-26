import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { Place } from '../places/place.entity';
import { Review } from '../reviews/review.entity';
import { Subscription, SubStatus } from '../subscriptions/subscription.entity';
import { Event } from '../events/event.entity';
import { Tip } from '../tips/tip.entity';

@Injectable()
export class AdminService {
    constructor(
        @InjectRepository(User) private usersRepo: Repository<User>,
        @InjectRepository(Place) private placesRepo: Repository<Place>,
        @InjectRepository(Review) private reviewsRepo: Repository<Review>,
        @InjectRepository(Subscription) private subsRepo: Repository<Subscription>,
        @InjectRepository(Event) private eventsRepo: Repository<Event>,
        @InjectRepository(Tip) private tipsRepo: Repository<Tip>,
    ) {}

    // ─── DASHBOARD STATS ──────────────────────────────────
    async getStats() {
        const [totalUsers, totalPlaces, totalReviews, totalEvents, totalTips] = await Promise.all([
            this.usersRepo.count(),
            this.placesRepo.count(),
            this.reviewsRepo.count(),
            this.eventsRepo.count(),
            this.tipsRepo.count(),
        ]);

        const revenueResult = await this.subsRepo
            .createQueryBuilder('sub')
            .select('COALESCE(SUM(sub.amount), 0)', 'totalRevenue')
            .addSelect('COUNT(sub.id)', 'activeSubscriptions')
            .where('sub.status = :status', { status: SubStatus.ACTIVE })
            .getRawOne();

        const pendingPlaces = await this.placesRepo.count({ where: { isApproved: false } });
        const premiumUsers = await this.usersRepo.count({ where: [
            { plan: 'premium' as any },
            { plan: 'business' as any },
        ] });

        return {
            totalUsers,
            totalPlaces,
            totalReviews,
            totalEvents,
            totalTips,
            pendingPlaces,
            premiumUsers,
            totalRevenue: parseFloat(revenueResult.totalRevenue) || 0,
            activeSubscriptions: parseInt(revenueResult.activeSubscriptions) || 0,
        };
    }

    // ─── USER MANAGEMENT ──────────────────────────────────
    async getUsers(page = 1, limit = 20) {
        const [data, total] = await this.usersRepo.findAndCount({
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });
        return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
    }

    async updateUser(id: string, updates: Partial<User>) {
        await this.usersRepo.update(id, updates);
        return this.usersRepo.findOne({ where: { id } });
    }

    async banUser(id: string) {
        await this.usersRepo.update(id, { isActive: false });
        return { message: 'User banned' };
    }

    async unbanUser(id: string) {
        await this.usersRepo.update(id, { isActive: true });
        return { message: 'User unbanned' };
    }

    // ─── PLACE MANAGEMENT ──────────────────────────────────
    async getPlaces(page = 1, limit = 20, pendingOnly = false) {
        const where: any = {};
        if (pendingOnly) where.isApproved = false;

        const [data, total] = await this.placesRepo.findAndCount({
            where,
            order: { createdAt: 'DESC' },
            relations: ['category'],
            skip: (page - 1) * limit,
            take: limit,
        });
        return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
    }

    async approvePlace(id: string) {
        await this.placesRepo.update(id, { isApproved: true });
        return { message: 'Place approved' };
    }

    async toggleFeature(id: string) {
        const place = await this.placesRepo.findOne({ where: { id } });
        await this.placesRepo.update(id, { isFeatured: !place.isFeatured });
        return { message: `Place ${place.isFeatured ? 'unfeatured' : 'featured'}` };
    }

    async deletePlace(id: string) {
        await this.placesRepo.delete(id);
        return { message: 'Place deleted' };
    }

    // ─── SUBSCRIPTIONS ──────────────────────────────────
    async getSubscriptions() {
        return this.subsRepo.find({ order: { createdAt: 'DESC' }, relations: ['user'] });
    }

    // ─── EVENTS ──────────────────────────────────
    async getEvents() {
        return this.eventsRepo.find({ order: { createdAt: 'DESC' }, relations: ['place', 'organizer'] });
    }

    async toggleEventActive(id: string) {
        const event = await this.eventsRepo.findOne({ where: { id } });
        event.isActive = !event.isActive;
        return this.eventsRepo.save(event);
    }

    // ─── TIPS ──────────────────────────────────
    async getTips() {
        return this.tipsRepo.find({ order: { createdAt: 'DESC' }, relations: ['author'] });
    }

    async toggleTipApproval(id: string) {
        const tip = await this.tipsRepo.findOne({ where: { id } });
        tip.isApproved = !tip.isApproved;
        return this.tipsRepo.save(tip);
    }
}
