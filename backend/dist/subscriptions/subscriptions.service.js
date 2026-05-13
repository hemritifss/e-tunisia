"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const subscription_entity_1 = require("./subscription.entity");
const user_entity_1 = require("../users/user.entity");
const PLAN_PRICES = {
    premium: { monthly: 9.99, annual: 99.99 },
    business: { monthly: 49.99 },
    nomad: { monthly: 29.99, annual: 299.99 },
};
let SubscriptionsService = class SubscriptionsService {
    constructor(subscriptionRepo, userRepo) {
        this.subscriptionRepo = subscriptionRepo;
        this.userRepo = userRepo;
    }
    async getMySubscription(userId) {
        return this.subscriptionRepo.findOne({
            where: { userId, status: subscription_entity_1.SubStatus.ACTIVE },
            order: { expiresAt: 'DESC' },
        });
    }
    async upgrade(userId, plan, paymentMethod, paymentReference, isAnnual = false) {
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
        const existing = await this.subscriptionRepo.findOne({
            where: { userId, status: subscription_entity_1.SubStatus.ACTIVE },
        });
        if (existing) {
            existing.status = subscription_entity_1.SubStatus.CANCELLED;
            await this.subscriptionRepo.save(existing);
        }
        const subscription = this.subscriptionRepo.create({
            userId,
            plan: plan.toLowerCase(),
            amount,
            currency: 'TND',
            paymentMethod,
            paymentReference: paymentReference || `MANUAL_${Date.now()}`,
            status: subscription_entity_1.SubStatus.ACTIVE,
            startsAt: now,
            expiresAt,
        });
        const saved = await this.subscriptionRepo.save(subscription);
        const userPlan = plan.toLowerCase() === 'premium'
            ? user_entity_1.UserPlan.PREMIUM
            : plan.toLowerCase() === 'business'
                ? user_entity_1.UserPlan.BUSINESS
                : user_entity_1.UserPlan.FREE;
        await this.userRepo.update(userId, {
            plan: userPlan,
            subscriptionExpiresAt: expiresAt,
        });
        return saved;
    }
    async cancel(userId) {
        const subscription = await this.subscriptionRepo.findOne({
            where: { userId, status: subscription_entity_1.SubStatus.ACTIVE },
        });
        if (subscription) {
            subscription.status = subscription_entity_1.SubStatus.CANCELLED;
            await this.subscriptionRepo.save(subscription);
        }
        await this.userRepo.update(userId, {
            plan: user_entity_1.UserPlan.FREE,
            subscriptionExpiresAt: null,
        });
    }
    async getRevenueStats() {
        const active = await this.subscriptionRepo.find({
            where: { status: subscription_entity_1.SubStatus.ACTIVE },
        });
        const totalRevenue = active.reduce((sum, s) => sum + Number(s.amount), 0);
        const byPlan = {};
        for (const sub of active) {
            byPlan[sub.plan] = (byPlan[sub.plan] || 0) + Number(sub.amount);
        }
        return {
            totalRevenue,
            activeSubscriptions: active.length,
            byPlan,
        };
    }
};
exports.SubscriptionsService = SubscriptionsService;
exports.SubscriptionsService = SubscriptionsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(subscription_entity_1.Subscription)),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], SubscriptionsService);
//# sourceMappingURL=subscriptions.service.js.map