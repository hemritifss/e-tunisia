import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { GemsService } from '../gems/gems.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserPlan, UserRole } from '../users/user.entity';
import { Place } from '../places/place.entity';
import { Review } from '../reviews/review.entity';
import { Subscription, SubStatus } from '../subscriptions/subscription.entity';
import { Event } from '../events/event.entity';
import { Tip } from '../tips/tip.entity';
import { AuditLog } from './audit-log.entity';
import { getPlan } from '../billing/plan-catalog';

@Injectable()
export class AdminService {
    constructor(
        private readonly gems: GemsService,
        @InjectRepository(User) private usersRepo: Repository<User>,
        @InjectRepository(Place) private placesRepo: Repository<Place>,
        @InjectRepository(Review) private reviewsRepo: Repository<Review>,
        @InjectRepository(Subscription) private subsRepo: Repository<Subscription>,
        @InjectRepository(Event) private eventsRepo: Repository<Event>,
        @InjectRepository(Tip) private tipsRepo: Repository<Tip>,
        @InjectRepository(AuditLog) private auditRepo: Repository<AuditLog>,
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
        page = Math.max(1, Number(page) || 1);
        limit = Math.min(100, Math.max(1, Number(limit) || 20));
        const [data, total] = await this.usersRepo.findAndCount({
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });
        return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
    }

    async updateUser(id: string, updates: Partial<User>) {
        // Role + password are NOT settable here — role changes go through the
        // super-admin-guarded setUserRole(), and passwords are never admin-editable.
        const { role, password, tokenVersion, stripeCustomerId, passwordResetToken, passwordResetExpires, ...safe } = updates as any;

        // Whitelist only admin-editable fields to prevent mass assignment
        const allowedFields = ['fullName', 'handle', 'email', 'avatar', 'phone', 'country', 'bio', 'website', 'interests', 'plan', 'isActive', 'onboardingComplete', 'passportTheme', 'subscriptionExpiresAt'];
        const filtered: any = {};
        for (const key of allowedFields) {
            if (key in safe) filtered[key] = safe[key];
        }

        await this.usersRepo.update(id, filtered);
        return this.usersRepo.findOne({ where: { id } });
    }

    /** Grant/revoke roles. Super-admin only (guarded at the controller). */
    async setUserRole(id: string, role: string) {
        const allowed = Object.values(UserRole) as string[];
        if (!allowed.includes(role)) throw new BadRequestException('Invalid role');
        await this.usersRepo.update(id, { role: role as UserRole });
        return this.usersRepo.findOne({ where: { id } });
    }

    // ─── AUDIT LOG ──────────────────────────────────
    async getAudit(page = 1, limit = 30) {
        page = Math.max(1, Number(page) || 1);
        limit = Math.min(100, Math.max(1, Number(limit) || 30));
        const [data, total] = await this.auditRepo.findAndCount({
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });
        return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
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
        page = Math.max(1, Number(page) || 1);
        limit = Math.min(100, Math.max(1, Number(limit) || 20));
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
        // Delegates so community-gem submitters get their +200 XP / badge payout
        // regardless of whether approval came from confirmations or an admin.
        return this.gems.adminApprove(id);
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

    // ─── REVIEWS ──────────────────────────────────
    async getReviews(page = 1, limit = 20) {
        page = Math.max(1, Number(page) || 1);
        limit = Math.min(100, Math.max(1, Number(limit) || 20));
        const [data, total] = await this.reviewsRepo.findAndCount({
            order: { createdAt: 'DESC' },
            relations: ['place'],
            skip: (page - 1) * limit,
            take: limit,
        });
        return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
    }

    async deleteReview(id: string) {
        await this.reviewsRepo.delete(id);
        return { message: 'Review deleted' };
    }

    // ─── SUBSCRIPTIONS ──────────────────────────────────
    async getSubscriptions() {
        return this.subsRepo.find({ order: { createdAt: 'DESC' }, relations: ['user'] });
    }

    /** Confirm a manual (bank/cash) PENDING subscription → activate the plan for the user. */
    async confirmSubscription(id: string) {
        const sub = await this.subsRepo.findOne({ where: { id } });
        if (!sub) throw new NotFoundException('Subscription not found');

        const entry = getPlan(sub.plan);
        const isYearly = entry ? Math.abs(Number(sub.amount) - entry.yearly) < 0.01 : false;
        const now = new Date();
        const expiresAt = isYearly
            ? new Date(now.getFullYear() + 1, now.getMonth(), now.getDate())
            : new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

        // Retire any other active sub for this user, then activate this one.
        await this.subsRepo.update(
            { userId: sub.userId, status: SubStatus.ACTIVE },
            { status: SubStatus.CANCELLED },
        );
        sub.status = SubStatus.ACTIVE;
        sub.startsAt = now;
        sub.expiresAt = expiresAt;
        await this.subsRepo.save(sub);

        await this.usersRepo.update(sub.userId, {
            plan: entry?.userPlan ?? UserPlan.FREE,
            subscriptionExpiresAt: expiresAt,
        });
        return { message: 'Subscription confirmed', plan: sub.plan };
    }

    /** Reject/cancel a subscription (does not touch the user's current plan beyond cancelling). */
    async rejectSubscription(id: string) {
        await this.subsRepo.update(id, { status: SubStatus.CANCELLED });
        return { message: 'Subscription rejected' };
    }

    // ─── REVENUE / ANALYTICS ──────────────────────────────────
    async getAnalytics() {
        const active = await this.subsRepo.find({ where: { status: SubStatus.ACTIVE } });
        const pendingSubscriptions = await this.subsRepo.count({ where: { status: SubStatus.PENDING } });

        let mrr = 0;
        const byPlan: Record<string, { count: number; revenue: number }> = {};
        for (const s of active) {
            const entry = getPlan(s.plan);
            const amt = Number(s.amount) || 0;
            const isYearly = entry ? Math.abs(amt - entry.yearly) < 0.01 : false;
            mrr += isYearly ? amt / 12 : amt;
            byPlan[s.plan] = byPlan[s.plan] || { count: 0, revenue: 0 };
            byPlan[s.plan].count += 1;
            byPlan[s.plan].revenue += amt;
        }

        const totalUsers = await this.usersRepo.count();
        const paidUsers = await this.usersRepo.count({
            where: [{ plan: 'premium' as any }, { plan: 'business' as any }],
        });

        return {
            mrr: Math.round(mrr * 100) / 100,
            arr: Math.round(mrr * 12 * 100) / 100,
            activeSubscriptions: active.length,
            pendingSubscriptions,
            byPlan,
            totalUsers,
            paidUsers,
            conversionRate: totalUsers ? Math.round((paidUsers / totalUsers) * 1000) / 10 : 0,
        };
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
