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
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("../users/user.entity");
const place_entity_1 = require("../places/place.entity");
const review_entity_1 = require("../reviews/review.entity");
const subscription_entity_1 = require("../subscriptions/subscription.entity");
const event_entity_1 = require("../events/event.entity");
const tip_entity_1 = require("../tips/tip.entity");
let AdminService = class AdminService {
    constructor(usersRepo, placesRepo, reviewsRepo, subsRepo, eventsRepo, tipsRepo) {
        this.usersRepo = usersRepo;
        this.placesRepo = placesRepo;
        this.reviewsRepo = reviewsRepo;
        this.subsRepo = subsRepo;
        this.eventsRepo = eventsRepo;
        this.tipsRepo = tipsRepo;
    }
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
            .where('sub.status = :status', { status: subscription_entity_1.SubStatus.ACTIVE })
            .getRawOne();
        const pendingPlaces = await this.placesRepo.count({ where: { isApproved: false } });
        const premiumUsers = await this.usersRepo.count({ where: [
                { plan: 'premium' },
                { plan: 'business' },
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
    async getUsers(page = 1, limit = 20) {
        const [data, total] = await this.usersRepo.findAndCount({
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });
        return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
    }
    async updateUser(id, updates) {
        await this.usersRepo.update(id, updates);
        return this.usersRepo.findOne({ where: { id } });
    }
    async banUser(id) {
        await this.usersRepo.update(id, { isActive: false });
        return { message: 'User banned' };
    }
    async unbanUser(id) {
        await this.usersRepo.update(id, { isActive: true });
        return { message: 'User unbanned' };
    }
    async getPlaces(page = 1, limit = 20, pendingOnly = false) {
        const where = {};
        if (pendingOnly)
            where.isApproved = false;
        const [data, total] = await this.placesRepo.findAndCount({
            where,
            order: { createdAt: 'DESC' },
            relations: ['category'],
            skip: (page - 1) * limit,
            take: limit,
        });
        return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
    }
    async approvePlace(id) {
        await this.placesRepo.update(id, { isApproved: true });
        return { message: 'Place approved' };
    }
    async toggleFeature(id) {
        const place = await this.placesRepo.findOne({ where: { id } });
        await this.placesRepo.update(id, { isFeatured: !place.isFeatured });
        return { message: `Place ${place.isFeatured ? 'unfeatured' : 'featured'}` };
    }
    async deletePlace(id) {
        await this.placesRepo.delete(id);
        return { message: 'Place deleted' };
    }
    async getSubscriptions() {
        return this.subsRepo.find({ order: { createdAt: 'DESC' }, relations: ['user'] });
    }
    async getEvents() {
        return this.eventsRepo.find({ order: { createdAt: 'DESC' }, relations: ['place', 'organizer'] });
    }
    async toggleEventActive(id) {
        const event = await this.eventsRepo.findOne({ where: { id } });
        event.isActive = !event.isActive;
        return this.eventsRepo.save(event);
    }
    async getTips() {
        return this.tipsRepo.find({ order: { createdAt: 'DESC' }, relations: ['author'] });
    }
    async toggleTipApproval(id) {
        const tip = await this.tipsRepo.findOne({ where: { id } });
        tip.isApproved = !tip.isApproved;
        return this.tipsRepo.save(tip);
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(place_entity_1.Place)),
    __param(2, (0, typeorm_1.InjectRepository)(review_entity_1.Review)),
    __param(3, (0, typeorm_1.InjectRepository)(subscription_entity_1.Subscription)),
    __param(4, (0, typeorm_1.InjectRepository)(event_entity_1.Event)),
    __param(5, (0, typeorm_1.InjectRepository)(tip_entity_1.Tip)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], AdminService);
//# sourceMappingURL=admin.service.js.map