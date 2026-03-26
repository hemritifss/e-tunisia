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
let SubscriptionsService = class SubscriptionsService {
    constructor(subsRepo, usersRepo) {
        this.subsRepo = subsRepo;
        this.usersRepo = usersRepo;
    }
    async getMySubscription(userId) {
        return this.subsRepo.findOne({
            where: { userId, status: subscription_entity_1.SubStatus.ACTIVE },
            order: { createdAt: 'DESC' },
        });
    }
    async upgrade(userId, plan, paymentMethod, reference) {
        const user = await this.usersRepo.findOne({ where: { id: userId } });
        if (!user)
            throw new common_1.NotFoundException('User not found');
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
            status: subscription_entity_1.SubStatus.ACTIVE,
            startsAt: now,
            expiresAt,
        });
        await this.subsRepo.save(sub);
        user.plan = plan;
        user.subscriptionExpiresAt = expiresAt;
        await this.usersRepo.save(user);
        return sub;
    }
    async cancel(userId) {
        const sub = await this.subsRepo.findOne({
            where: { userId, status: subscription_entity_1.SubStatus.ACTIVE },
        });
        if (!sub)
            throw new common_1.NotFoundException('No active subscription');
        sub.status = subscription_entity_1.SubStatus.CANCELLED;
        await this.subsRepo.save(sub);
        const user = await this.usersRepo.findOne({ where: { id: userId } });
        user.plan = user_entity_1.UserPlan.FREE;
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
            .where('sub.status = :status', { status: subscription_entity_1.SubStatus.ACTIVE })
            .getRawOne();
        return result;
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