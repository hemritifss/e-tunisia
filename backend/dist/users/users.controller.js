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
exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const users_service_1 = require("./users.service");
const og_service_1 = require("../og/og.service");
let UsersController = class UsersController {
    constructor(usersService, ogService) {
        this.usersService = usersService;
        this.ogService = ogService;
    }
    getProfile(req) {
        return this.usersService.findById(req.user.id);
    }
    async handleAvailable(h) {
        const { isHandleFormatValid, isHandleReserved } = await Promise.resolve().then(() => require('./reserved-handles'));
        const handle = (h || '').toLowerCase().trim();
        if (!handle)
            return { available: false, reason: 'empty' };
        if (!isHandleFormatValid(handle))
            return { available: false, reason: 'format' };
        if (isHandleReserved(handle))
            return { available: false, reason: 'reserved' };
        const ok = await this.usersService.isHandleAvailable(handle);
        return { available: ok, reason: ok ? undefined : 'taken' };
    }
    async byHandle(rawHandle) {
        const handle = (rawHandle || '').toLowerCase();
        const passport = await this.usersService.assemblePassport(handle).catch(() => null);
        if (!passport) {
            return { error: 'passport_not_found', handle };
        }
        return passport;
    }
    async ogImage(rawHandle, res) {
        const handle = (rawHandle || '').toLowerCase();
        try {
            const passport = await this.usersService.assemblePassport(handle);
            const png = await this.ogService.renderPassportCard(passport);
            res.send(png);
        }
        catch {
            const transparent = Buffer.from('89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c63000000000200015c34a40d0000000049454e44ae426082', 'hex');
            res.send(transparent);
        }
    }
    seedDraft(req, body) {
        return this.usersService.seedFromDraft(req.user.id, body || {});
    }
    updateProfile(req, body) {
        return this.usersService.update(req.user.id, body);
    }
    toggleFavorite(req, placeId) {
        return this.usersService.toggleFavorite(req.user.id, placeId);
    }
    getFavorites(req) {
        return this.usersService.getFavoriteIds(req.user.id);
    }
    toggleVisited(req, placeId) {
        return this.usersService.toggleVisited(req.user.id, placeId);
    }
    getVisited(req) {
        return this.usersService.getVisitedIds(req.user.id);
    }
    async findPublicById(id) {
        if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
            return null;
        }
        const u = await this.usersService.findById(id).catch(() => null);
        if (!u)
            return null;
        return {
            id: u.id,
            fullName: u.fullName,
            avatar: u.avatar || null,
            country: u.country || null,
            bio: u.bio || null,
            website: u.website || null,
            role: u.role,
            points: u.points || 0,
            level: u.level || 1,
            badges: Array.isArray(u.badges) ? u.badges : [],
            createdAt: u.createdAt,
        };
    }
    async suggest(limit) {
        const lim = Math.max(1, Math.min(20, Number(limit) || 6));
        const list = await this.usersService.suggestedUsers?.(lim).catch(() => null);
        if (Array.isArray(list))
            return list;
        return [];
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Get)('me'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "getProfile", null);
__decorate([
    (0, common_1.Get)('handle-available'),
    __param(0, (0, common_1.Query)('h')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "handleAvailable", null);
__decorate([
    (0, common_1.Get)('by-handle/:handle'),
    __param(0, (0, common_1.Param)('handle')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "byHandle", null);
__decorate([
    (0, common_1.Get)('by-handle/:handle/og.png'),
    (0, common_1.Header)('Content-Type', 'image/png'),
    (0, common_1.Header)('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800'),
    __param(0, (0, common_1.Param)('handle')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "ogImage", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Post)('me/seed'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "seedDraft", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Put)('me'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "updateProfile", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Post)('favorites/:placeId'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('placeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "toggleFavorite", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Get)('favorites'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "getFavorites", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Post)('visited/:placeId'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('placeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "toggleVisited", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Get)('visited'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "getVisited", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "findPublicById", null);
__decorate([
    (0, common_1.Get)('suggest/list'),
    __param(0, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "suggest", null);
exports.UsersController = UsersController = __decorate([
    (0, swagger_1.ApiTags)('users'),
    (0, common_1.Controller)('users'),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        og_service_1.OgService])
], UsersController);
//# sourceMappingURL=users.controller.js.map