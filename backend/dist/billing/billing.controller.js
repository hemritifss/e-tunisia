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
exports.BillingController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const billing_service_1 = require("./billing.service");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("../users/user.entity");
let BillingController = class BillingController {
    constructor(billing, usersRepo) {
        this.billing = billing;
        this.usersRepo = usersRepo;
    }
    async me(req) {
        const plan = await this.billing.effectivePlan(req.user.id);
        const caps = this.billing.caps(plan);
        const u = await this.usersRepo.findOne({
            where: { id: req.user.id },
            select: ['plan', 'subscriptionExpiresAt'],
        });
        return {
            plan,
            rawPlan: u?.plan ?? user_entity_1.UserPlan.FREE,
            expiresAt: u?.subscriptionExpiresAt ?? null,
            caps: {
                maxTrips: Number.isFinite(caps.maxTrips) ? caps.maxTrips : null,
                maxSaves: Number.isFinite(caps.maxSaves) ? caps.maxSaves : null,
                suggestionWeight: caps.suggestionWeight,
                customThemes: caps.customThemes,
                passportAnalytics: caps.passportAnalytics,
                multiLangListings: caps.multiLangListings,
                canBoost: caps.canBoost,
                ownerDashboard: caps.ownerDashboard,
            },
        };
    }
    async upgrade(req, body) {
        const cycle = body?.cycle ?? 'monthly';
        const targetPlan = body?.plan === 'business' ? user_entity_1.UserPlan.BUSINESS : user_entity_1.UserPlan.PREMIUM;
        const expiresAt = cycle === 'lifetime' ? null :
            cycle === 'yearly' ? new Date(Date.now() + 365 * 24 * 3600 * 1000) :
                new Date(Date.now() + 30 * 24 * 3600 * 1000);
        await this.usersRepo.update(req.user.id, { plan: targetPlan, subscriptionExpiresAt: expiresAt });
        return { ok: true, plan: targetPlan, expiresAt };
    }
    async cancel(req) {
        await this.usersRepo.update(req.user.id, { plan: user_entity_1.UserPlan.FREE, subscriptionExpiresAt: null });
        return { ok: true, plan: user_entity_1.UserPlan.FREE };
    }
};
exports.BillingController = BillingController;
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Get)('me'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BillingController.prototype, "me", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Post)('upgrade'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], BillingController.prototype, "upgrade", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Post)('cancel'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BillingController.prototype, "cancel", null);
exports.BillingController = BillingController = __decorate([
    (0, swagger_1.ApiTags)('billing'),
    (0, common_1.Controller)('billing'),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [billing_service_1.BillingService,
        typeorm_2.Repository])
], BillingController);
//# sourceMappingURL=billing.controller.js.map