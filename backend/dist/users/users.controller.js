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
const optional_jwt_auth_guard_1 = require("../auth/guards/optional-jwt-auth.guard");
const users_service_1 = require("./users.service");
const follows_service_1 = require("./follows.service");
const endorsements_service_1 = require("./endorsements.service");
const activity_service_1 = require("./activity.service");
const endorsement_topics_1 = require("./endorsement-topics");
const og_service_1 = require("../og/og.service");
let UsersController = class UsersController {
    constructor(usersService, followsService, endorsementsService, activityService, ogService) {
        this.usersService = usersService;
        this.followsService = followsService;
        this.endorsementsService = endorsementsService;
        this.activityService = activityService;
        this.ogService = ogService;
    }
    getProfile(req) {
        return this.usersService.findById(req.user.id);
    }
    searchUsers(q, limit) {
        return this.usersService.searchUsers(q || '', limit ? Number(limit) : 12);
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
    async byHandle(req, rawHandle) {
        const handle = (rawHandle || '').toLowerCase();
        const passport = await this.usersService.assemblePassport(handle).catch(() => null);
        if (!passport) {
            return { error: 'passport_not_found', handle };
        }
        const viewerId = req?.user?.id || null;
        if (viewerId) {
            const me = await this.usersService.findById(viewerId).catch(() => null);
            const isOwner = !!me?.handle && me.handle === passport.handle;
            const [viewerIsFollowing, viewerEndorsedTopics] = await Promise.all([
                isOwner ? Promise.resolve(false) : this.followsService.isFollowing(viewerId, handle),
                isOwner ? Promise.resolve([]) : this.endorsementsService.myEndorsementsFor(viewerId, handle),
            ]);
            return { ...passport, isOwner, viewerIsFollowing, viewerEndorsedTopics };
        }
        return passport;
    }
    endorsementTopics() {
        return endorsement_topics_1.ENDORSEMENT_TOPICS;
    }
    leaderboardCities(limit) {
        return this.usersService.listCitiesWithReviews(limit ? Number(limit) : 30);
    }
    leaderboardByCity(city, limit) {
        return this.usersService.getCityReviewerLeaderboard(decodeURIComponent(city), limit ? Number(limit) : 20);
    }
    endorse(req, handle, body) {
        return this.endorsementsService.endorse(req.user.id, (handle || '').toLowerCase(), body?.topic);
    }
    unendorse(req, handle, body) {
        return this.endorsementsService.unendorse(req.user.id, (handle || '').toLowerCase(), body?.topic);
    }
    listEndorsements(handle) {
        return this.endorsementsService.listForHandle((handle || '').toLowerCase());
    }
    follow(req, handle) {
        return this.followsService.follow(req.user.id, (handle || '').toLowerCase());
    }
    unfollow(req, handle) {
        return this.followsService.unfollow(req.user.id, (handle || '').toLowerCase());
    }
    listFollowers(handle, limit) {
        return this.followsService.listFollowers((handle || '').toLowerCase(), limit ? Number(limit) : 50);
    }
    listFollowing(handle, limit) {
        return this.followsService.listFollowing((handle || '').toLowerCase(), limit ? Number(limit) : 50);
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
    applyLocalGuide(req) {
        return this.usersService.applyLocalGuide(req.user.id);
    }
    activityFeed(req, limit) {
        return this.activityService.followingFeed(req.user.id, limit ? Number(limit) : 20);
    }
    globalActivityFeed(limit) {
        return this.activityService.globalFeed(limit ? Number(limit) : 20);
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
    (0, common_1.Get)('search'),
    __param(0, (0, common_1.Query)('q')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "searchUsers", null);
__decorate([
    (0, common_1.Get)('handle-available'),
    __param(0, (0, common_1.Query)('h')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "handleAvailable", null);
__decorate([
    (0, common_1.Get)('by-handle/:handle'),
    (0, common_1.UseGuards)(optional_jwt_auth_guard_1.OptionalJwtAuthGuard),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('handle')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "byHandle", null);
__decorate([
    (0, common_1.Get)('endorsement-topics'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "endorsementTopics", null);
__decorate([
    (0, common_1.Get)('leaderboards/cities'),
    __param(0, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "leaderboardCities", null);
__decorate([
    (0, common_1.Get)('leaderboards/city/:city'),
    __param(0, (0, common_1.Param)('city')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "leaderboardByCity", null);
__decorate([
    (0, common_1.Post)('by-handle/:handle/endorse'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('handle')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "endorse", null);
__decorate([
    (0, common_1.Post)('by-handle/:handle/unendorse'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('handle')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "unendorse", null);
__decorate([
    (0, common_1.Get)('by-handle/:handle/endorsements'),
    __param(0, (0, common_1.Param)('handle')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "listEndorsements", null);
__decorate([
    (0, common_1.Post)('by-handle/:handle/follow'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('handle')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "follow", null);
__decorate([
    (0, common_1.Post)('by-handle/:handle/unfollow'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('handle')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "unfollow", null);
__decorate([
    (0, common_1.Get)('by-handle/:handle/followers'),
    __param(0, (0, common_1.Param)('handle')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "listFollowers", null);
__decorate([
    (0, common_1.Get)('by-handle/:handle/following'),
    __param(0, (0, common_1.Param)('handle')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "listFollowing", null);
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
    (0, common_1.Post)('me/apply-local-guide'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "applyLocalGuide", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Get)('me/activity-feed'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "activityFeed", null);
__decorate([
    (0, common_1.Get)('activity-feed/global'),
    __param(0, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "globalActivityFeed", null);
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
        follows_service_1.FollowsService,
        endorsements_service_1.EndorsementsService,
        activity_service_1.ActivityService,
        og_service_1.OgService])
], UsersController);
//# sourceMappingURL=users.controller.js.map