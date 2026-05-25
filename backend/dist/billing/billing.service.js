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
exports.BUSINESS_CAPS = exports.PRO_CAPS = exports.FREE_CAPS = exports.BillingService = void 0;
exports.effectivePlanFor = effectivePlanFor;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("../users/user.entity");
let BillingService = class BillingService {
    constructor(usersRepo) {
        this.usersRepo = usersRepo;
    }
    async effectivePlan(userId) {
        if (!userId)
            return user_entity_1.UserPlan.FREE;
        const u = await this.usersRepo.findOne({
            where: { id: userId },
            select: ['id', 'plan', 'subscriptionExpiresAt'],
        });
        if (!u)
            return user_entity_1.UserPlan.FREE;
        return effectivePlanFor(u);
    }
    caps(plan) {
        if (plan === user_entity_1.UserPlan.BUSINESS)
            return exports.BUSINESS_CAPS;
        if (plan === user_entity_1.UserPlan.PREMIUM)
            return exports.PRO_CAPS;
        return exports.FREE_CAPS;
    }
    async assertFeature(userId, feature) {
        const plan = await this.effectivePlan(userId);
        if (feature === 'pro') {
            if (plan === user_entity_1.UserPlan.FREE)
                throw upgradeError('pro_required');
            return;
        }
        if (feature === 'business') {
            if (plan !== user_entity_1.UserPlan.BUSINESS)
                throw upgradeError('business_required');
            return;
        }
        const caps = this.caps(plan);
        const val = caps[feature];
        if (val === true)
            return;
        if (val === Infinity)
            return;
        if (typeof val === 'number')
            return;
        throw upgradeError('pro_required');
    }
    async checkCap(userId, feature, currentCount) {
        const plan = await this.effectivePlan(userId);
        const cap = this.caps(plan)[feature];
        return { ok: currentCount < cap, cap, plan };
    }
};
exports.BillingService = BillingService;
exports.BillingService = BillingService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], BillingService);
exports.FREE_CAPS = {
    maxTrips: 3,
    maxSaves: 20,
    suggestionWeight: 1,
    customThemes: false,
    passportAnalytics: false,
    multiLangListings: false,
    canBoost: false,
    ownerDashboard: false,
};
exports.PRO_CAPS = {
    maxTrips: Number.POSITIVE_INFINITY,
    maxSaves: Number.POSITIVE_INFINITY,
    suggestionWeight: 2,
    customThemes: true,
    passportAnalytics: true,
    multiLangListings: false,
    canBoost: false,
    ownerDashboard: false,
};
exports.BUSINESS_CAPS = {
    maxTrips: Number.POSITIVE_INFINITY,
    maxSaves: Number.POSITIVE_INFINITY,
    suggestionWeight: 2,
    customThemes: true,
    passportAnalytics: true,
    multiLangListings: true,
    canBoost: true,
    ownerDashboard: true,
};
function effectivePlanFor(u) {
    const plan = u?.plan ?? user_entity_1.UserPlan.FREE;
    if (plan === user_entity_1.UserPlan.FREE)
        return user_entity_1.UserPlan.FREE;
    const exp = u?.subscriptionExpiresAt;
    if (!exp)
        return plan;
    return new Date(exp).getTime() > Date.now() ? plan : user_entity_1.UserPlan.FREE;
}
function upgradeError(code) {
    const err = new common_1.ForbiddenException({
        message: code === 'pro_required'
            ? 'This feature requires Pro Traveler.'
            : 'This feature requires a Verified Business plan.',
        code,
    });
    return err;
}
//# sourceMappingURL=billing.service.js.map