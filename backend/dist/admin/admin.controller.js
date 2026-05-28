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
exports.AdminController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const admin_guard_1 = require("./admin.guard");
const super_admin_guard_1 = require("./super-admin.guard");
const admin_service_1 = require("./admin.service");
const audit_interceptor_1 = require("./audit.interceptor");
const is_super_admin_1 = require("./is-super-admin");
let AdminController = class AdminController {
    constructor(adminService) {
        this.adminService = adminService;
    }
    getStats() {
        return this.adminService.getStats();
    }
    me(req) {
        return { id: req.user.id, role: req.user.role, isSuperAdmin: (0, is_super_admin_1.isSuperAdmin)(req.user) };
    }
    getAudit(page, limit) {
        return this.adminService.getAudit(page, limit);
    }
    getUsers(page, limit) {
        return this.adminService.getUsers(page, limit);
    }
    updateUser(id, body) {
        return this.adminService.updateUser(id, body);
    }
    setUserRole(id, body) {
        return this.adminService.setUserRole(id, body?.role);
    }
    banUser(id) {
        return this.adminService.banUser(id);
    }
    unbanUser(id) {
        return this.adminService.unbanUser(id);
    }
    getPlaces(page, limit, pendingOnly) {
        return this.adminService.getPlaces(page, limit, pendingOnly === 'true');
    }
    approvePlace(id) {
        return this.adminService.approvePlace(id);
    }
    toggleFeature(id) {
        return this.adminService.toggleFeature(id);
    }
    deletePlace(id) {
        return this.adminService.deletePlace(id);
    }
    getReviews(page, limit) {
        return this.adminService.getReviews(page, limit);
    }
    deleteReview(id) {
        return this.adminService.deleteReview(id);
    }
    getSubscriptions() {
        return this.adminService.getSubscriptions();
    }
    confirmSubscription(id) {
        return this.adminService.confirmSubscription(id);
    }
    rejectSubscription(id) {
        return this.adminService.rejectSubscription(id);
    }
    getAnalytics() {
        return this.adminService.getAnalytics();
    }
    getEvents() {
        return this.adminService.getEvents();
    }
    toggleEvent(id) {
        return this.adminService.toggleEventActive(id);
    }
    getTips() {
        return this.adminService.getTips();
    }
    toggleTip(id) {
        return this.adminService.toggleTipApproval(id);
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, common_1.Get)('stats'),
    (0, swagger_1.ApiOperation)({ summary: 'Get dashboard stats' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('me'),
    (0, swagger_1.ApiOperation)({ summary: 'Viewer admin identity' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "me", null);
__decorate([
    (0, common_1.Get)('audit'),
    (0, swagger_1.ApiOperation)({ summary: 'Audit log of admin actions' }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getAudit", null);
__decorate([
    (0, common_1.Get)('users'),
    (0, swagger_1.ApiOperation)({ summary: 'List all users' }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getUsers", null);
__decorate([
    (0, common_1.Patch)('users/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update user (plan, profile fields — NOT role)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "updateUser", null);
__decorate([
    (0, common_1.Patch)('users/:id/role'),
    (0, common_1.UseGuards)(super_admin_guard_1.SuperAdminGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Grant/revoke a role (super-admin only)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "setUserRole", null);
__decorate([
    (0, common_1.Patch)('users/:id/ban'),
    (0, swagger_1.ApiOperation)({ summary: 'Ban a user' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "banUser", null);
__decorate([
    (0, common_1.Patch)('users/:id/unban'),
    (0, swagger_1.ApiOperation)({ summary: 'Unban a user' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "unbanUser", null);
__decorate([
    (0, common_1.Get)('places'),
    (0, swagger_1.ApiOperation)({ summary: 'List all places (with optional pending filter)' }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('pendingOnly')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getPlaces", null);
__decorate([
    (0, common_1.Patch)('places/:id/approve'),
    (0, swagger_1.ApiOperation)({ summary: 'Approve a place' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "approvePlace", null);
__decorate([
    (0, common_1.Patch)('places/:id/feature'),
    (0, swagger_1.ApiOperation)({ summary: 'Toggle featured status' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "toggleFeature", null);
__decorate([
    (0, common_1.Delete)('places/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a place' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "deletePlace", null);
__decorate([
    (0, common_1.Get)('reviews'),
    (0, swagger_1.ApiOperation)({ summary: 'List reviews (moderation queue)' }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getReviews", null);
__decorate([
    (0, common_1.Delete)('reviews/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a review' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "deleteReview", null);
__decorate([
    (0, common_1.Get)('subscriptions'),
    (0, swagger_1.ApiOperation)({ summary: 'List all subscriptions' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getSubscriptions", null);
__decorate([
    (0, common_1.Patch)('subscriptions/:id/confirm'),
    (0, swagger_1.ApiOperation)({ summary: 'Confirm a pending (bank/cash) subscription → activate plan' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "confirmSubscription", null);
__decorate([
    (0, common_1.Patch)('subscriptions/:id/reject'),
    (0, swagger_1.ApiOperation)({ summary: 'Reject/cancel a subscription' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "rejectSubscription", null);
__decorate([
    (0, common_1.Get)('analytics'),
    (0, swagger_1.ApiOperation)({ summary: 'Revenue + subscription analytics (MRR, by-plan, conversion)' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getAnalytics", null);
__decorate([
    (0, common_1.Get)('events'),
    (0, swagger_1.ApiOperation)({ summary: 'List all events' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getEvents", null);
__decorate([
    (0, common_1.Patch)('events/:id/toggle'),
    (0, swagger_1.ApiOperation)({ summary: 'Toggle event active status' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "toggleEvent", null);
__decorate([
    (0, common_1.Get)('tips'),
    (0, swagger_1.ApiOperation)({ summary: 'List all tips' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getTips", null);
__decorate([
    (0, common_1.Patch)('tips/:id/toggle'),
    (0, swagger_1.ApiOperation)({ summary: 'Toggle tip approval' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "toggleTip", null);
exports.AdminController = AdminController = __decorate([
    (0, swagger_1.ApiTags)('admin'),
    (0, common_1.Controller)('admin'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, admin_guard_1.AdminGuard),
    (0, common_1.UseInterceptors)(audit_interceptor_1.AuditInterceptor),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [admin_service_1.AdminService])
], AdminController);
//# sourceMappingURL=admin.controller.js.map