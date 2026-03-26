import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription, SubStatus } from './subscription.entity';
import { User, UserPlan } from '../users/user.entity';

@Injectable()
export class SubscriptionsService {
    constructor(
        @InjectRepository(Subscription)
        private subsRepo: Repository<Subscription>,
        @InjectRepository(User)
        private usersRepo: Repository<User>,
    ) {}

    async getMySubscription(userId: string) {
        return this.subsRepo.findOne({
            where: { userId, status: SubStatus.ACTIVE },
            order: { createdAt: 'DESC' },
        });
    }

    async upgrade(userId: string, plan: string, paymentMethod: string, reference?: string) {
        const user = await this.usersRepo.findOne({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');

        const prices = { premium: 29, business: 99 };
        const amount = prices[plan] || 0;

        const now = new Date();
        const expiresAt = new Date(now);
        expiresAt.setMonth(expiresAt.getMonth() + 1);

        const sub = this.subsRepo.create({
            userId,
            plan,
            amount,
            paymentMethod,
            paymentReference: reference,
            status: SubStatus.ACTIVE,
            startsAt: now,
            expiresAt,
        });

        await this.subsRepo.save(sub);

        // Update user plan
        user.plan = plan as UserPlan;
        user.subscriptionExpiresAt = expiresAt;
        await this.usersRepo.save(user);

        return sub;
    }

    async cancel(userId: string) {
        const sub = await this.subsRepo.findOne({
            where: { userId, status: SubStatus.ACTIVE },
        });
        if (!sub) throw new NotFoundException('No active subscription');

        sub.status = SubStatus.CANCELLED;
        await this.subsRepo.save(sub);

        const user = await this.usersRepo.findOne({ where: { id: userId } });
        user.plan = UserPlan.FREE;
        user.subscriptionExpiresAt = null;
        await this.usersRepo.save(user);

        return { message: 'Subscription cancelled' };
    }

    async getAll() {
        return this.subsRepo.find({ order: { createdAt: 'DESC' }, relations: ['user'] });
    }

    async getRevenueStats() {
        const result = await this.subsRepo
            .createQueryBuilder('sub')
            .select('SUM(sub.amount)', 'totalRevenue')
            .addSelect('COUNT(sub.id)', 'totalSubscriptions')
            .where('sub.status = :status', { status: SubStatus.ACTIVE })
            .getRawOne();
        return result;
    }
}
