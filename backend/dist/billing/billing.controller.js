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
const config_1 = require("@nestjs/config");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const public_decorator_1 = require("../common/decorators/public.decorator");
const billing_service_1 = require("./billing.service");
const payments_service_1 = require("../payments/payments.service");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("../users/user.entity");
let BillingController = class BillingController {
    constructor(billing, payments, config, usersRepo) {
        this.billing = billing;
        this.payments = payments;
        this.config = config;
        this.usersRepo = usersRepo;
    }
    plans() {
        return this.billing.getCatalog();
    }
    async me(req) {
        const plan = await this.billing.effectivePlan(req.user.id);
        const caps = this.billing.caps(plan);
        const u = await this.usersRepo.findOne({
            where: { id: req.user.id },
            select: ['plan', 'subscriptionExpiresAt', 'stripeCustomerId'],
        });
        return {
            plan,
            rawPlan: u?.plan ?? user_entity_1.UserPlan.FREE,
            expiresAt: u?.subscriptionExpiresAt ?? null,
            canManageBilling: this.payments.stripeEnabled && !!u?.stripeCustomerId,
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
    checkout(req, body) {
        return this.billing.createCheckout(req.user.id, body?.plan, normalizeCycle(body?.cycle));
    }
    flouciCheckout(req, body) {
        return this.billing.createFlouciCheckout(req.user.id, body?.plan, normalizeCycle(body?.cycle));
    }
    async flouciReturn(paymentId, res) {
        const url = await this.billing.handleFlouciReturn(paymentId);
        res.redirect(url);
    }
    upgrade(req, body) {
        const method = body?.method === 'cash' ? 'cash' : 'bank';
        return this.billing.manualUpgrade(req.user.id, body?.plan, normalizeCycle(body?.cycle), method);
    }
    portal(req) {
        return this.billing.createPortal(req.user.id);
    }
    cancel(req) {
        return this.billing.cancel(req.user.id);
    }
    async webhook(req, signature) {
        const secret = this.config.get('STRIPE_BILLING_WEBHOOK_SECRET') ||
            this.config.get('STRIPE_WEBHOOK_SECRET');
        let event;
        try {
            event = await this.payments.constructWebhookEvent(req.body, signature, secret);
        }
        catch (err) {
            throw new common_1.BadRequestException(`Webhook signature verification failed: ${err.message}`);
        }
        await this.billing.applyStripeEvent(event);
        return { received: true };
    }
};
exports.BillingController = BillingController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('plans'),
    (0, swagger_1.ApiOperation)({ summary: 'Get the plan catalog (price book)' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], BillingController.prototype, "plans", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Get)('me'),
    (0, swagger_1.ApiOperation)({ summary: 'Get my effective plan + caps' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BillingController.prototype, "me", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Post)('checkout'),
    (0, swagger_1.ApiOperation)({ summary: 'Start a Stripe Checkout session (card)' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], BillingController.prototype, "checkout", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Post)('flouci/checkout'),
    (0, swagger_1.ApiOperation)({ summary: 'Start a Flouci (TND) checkout' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], BillingController.prototype, "flouciCheckout", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('flouci/return'),
    (0, swagger_1.ApiOperation)({ summary: 'Flouci payment return (server-verified redirect)' }),
    __param(0, (0, common_1.Query)('payment_id')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], BillingController.prototype, "flouciReturn", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Post)('upgrade'),
    (0, swagger_1.ApiOperation)({ summary: 'Request a manual (bank/cash) upgrade — admin confirms' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], BillingController.prototype, "upgrade", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Post)('portal'),
    (0, swagger_1.ApiOperation)({ summary: 'Open the Stripe billing portal' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], BillingController.prototype, "portal", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Post)('cancel'),
    (0, swagger_1.ApiOperation)({ summary: 'Cancel subscription (downgrade to Free)' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], BillingController.prototype, "cancel", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('webhook'),
    (0, swagger_1.ApiOperation)({ summary: 'Stripe subscription webhook' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Headers)('stripe-signature')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], BillingController.prototype, "webhook", null);
exports.BillingController = BillingController = __decorate([
    (0, swagger_1.ApiTags)('billing'),
    (0, common_1.Controller)('billing'),
    __param(3, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [billing_service_1.BillingService,
        payments_service_1.PaymentsService,
        config_1.ConfigService,
        typeorm_2.Repository])
], BillingController);
function normalizeCycle(c) {
    return c === 'yearly' ? 'yearly' : 'monthly';
}
//# sourceMappingURL=billing.controller.js.map