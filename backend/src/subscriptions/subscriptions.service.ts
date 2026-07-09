import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription, SubStatus } from './subscription.entity';
import { User, UserPlan } from '../users/user.entity';
import { PLAN_CATALOG } from '../billing/plan-catalog';

// Prices derive from the single source of truth (plan-catalog). Don't add literals here.
const PLAN_PRICES: Record<string, { monthly: number; annual?: number }> = Object.fromEntries(
  PLAN_CATALOG
    .filter((p) => p.id !== 'free')
    .map((p) => [p.id, { monthly: p.monthly, annual: p.yearly }]),
);

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(Subscription)
    private subscriptionRepo: Repository<Subscription>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  async getMySubscription(userId: string): Promise<Subscription | null> {
    return this.subscriptionRepo.findOne({
      where: { userId, status: SubStatus.ACTIVE },
      order: { expiresAt: 'DESC' },
    });
  }

  async upgrade(
    userId: string,
    plan: string,
    paymentMethod: string,
    paymentReference?: string,
    isAnnual = false,
  ): Promise<Subscription> {
    const priceConfig = PLAN_PRICES[plan.toLowerCase()];
    if (!priceConfig) {
      throw new Error('Invalid plan');
    }

    const amount = isAnnual && priceConfig.annual
      ? priceConfig.annual
      : priceConfig.monthly;

    const now = new Date();
    const expiresAt = isAnnual && priceConfig.annual
      ? new Date(now.getFullYear() + 1, now.getMonth(), now.getDate())
      : new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

    // Cancel existing subscription
    const existing = await this.subscriptionRepo.findOne({
      where: { userId, status: SubStatus.ACTIVE },
    });
    if (existing) {
      existing.status = SubStatus.CANCELLED;
      await this.subscriptionRepo.save(existing);
    }

    const subscription = this.subscriptionRepo.create({
      userId,
      plan: plan.toLowerCase(),
      amount,
      currency: 'TND',
      paymentMethod,
      paymentReference: paymentReference || `MANUAL_${Date.now()}`,
      status: SubStatus.ACTIVE,
      startsAt: now,
      expiresAt,
    });

    const saved = await this.subscriptionRepo.save(subscription);

    // Update user plan
    const userPlan =
      plan.toLowerCase() === 'premium'
        ? UserPlan.PREMIUM
        : plan.toLowerCase() === 'business'
          ? UserPlan.BUSINESS
          : UserPlan.FREE;

    await this.userRepo.update(userId, {
      plan: userPlan,
      subscriptionExpiresAt: expiresAt,
    });

    return saved;
  }

  async cancel(userId: string): Promise<void> {
    const subscription = await this.subscriptionRepo.findOne({
      where: { userId, status: SubStatus.ACTIVE },
    });

    if (subscription) {
      subscription.status = SubStatus.CANCELLED;
      await this.subscriptionRepo.save(subscription);
    }

    await this.userRepo.update(userId, {
      plan: UserPlan.FREE,
      subscriptionExpiresAt: null,
    });
  }

  async getRevenueStats(): Promise<{
    totalRevenue: number;
    activeSubscriptions: number;
    byPlan: Record<string, number>;
  }> {
    const active = await this.subscriptionRepo.find({
      where: { status: SubStatus.ACTIVE },
    });

    const totalRevenue = active.reduce((sum, s) => sum + Number(s.amount), 0);
    const byPlan: Record<string, number> = {};

    for (const sub of active) {
      byPlan[sub.plan] = (byPlan[sub.plan] || 0) + Number(sub.amount);
    }

    return {
      totalRevenue,
      activeSubscriptions: active.length,
      byPlan,
    };
  }
}
