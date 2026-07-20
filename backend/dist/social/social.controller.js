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
exports.SocialController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const optional_jwt_auth_guard_1 = require("../auth/guards/optional-jwt-auth.guard");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const social_service_1 = require("./social.service");
let SocialController = class SocialController {
    constructor(socialService) {
        this.socialService = socialService;
    }
    follow(followerId, followingId) {
        return this.socialService.follow(followerId, followingId);
    }
    unfollow(followerId, followingId) {
        return this.socialService.unfollow(followerId, followingId);
    }
    getFollowers(userId) {
        return this.socialService.getFollowers(userId);
    }
    getFollowing(userId) {
        return this.socialService.getFollowing(userId);
    }
    getFollowCounts(userId) {
        return this.socialService.getFollowCounts(userId);
    }
    publicFollowCounts(userId) {
        return this.socialService.getFollowCounts(userId);
    }
    isFollowing(followerId, followingId) {
        return this.socialService.isFollowing(followerId, followingId);
    }
    overview(viewerId, userId) {
        return this.socialService.getProfileOverview(viewerId, userId);
    }
    getFeed(userId, page = 1, limit = 20) {
        return this.socialService.getActivityFeed(userId, page, limit);
    }
    getUserActivity(userId, page = 1, limit = 20) {
        return this.socialService.getUserActivity(userId, page, limit);
    }
    findTravelBuddies(userId, preferences) {
        return this.socialService.findTravelBuddies(userId, preferences);
    }
};
exports.SocialController = SocialController;
__decorate([
    (0, common_1.Post)('follow/:userId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Follow a user' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], SocialController.prototype, "follow", null);
__decorate([
    (0, common_1.Delete)('follow/:userId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Unfollow a user' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], SocialController.prototype, "unfollow", null);
__decorate([
    (0, common_1.Get)('followers'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Get my followers' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SocialController.prototype, "getFollowers", null);
__decorate([
    (0, common_1.Get)('following'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Get who I am following' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SocialController.prototype, "getFollowing", null);
__decorate([
    (0, common_1.Get)('follow-counts'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Get my follow counts' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SocialController.prototype, "getFollowCounts", null);
__decorate([
    (0, common_1.Get)('follow-counts/:userId'),
    (0, swagger_1.ApiOperation)({ summary: 'Public follow counts for a user' }),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SocialController.prototype, "publicFollowCounts", null);
__decorate([
    (0, common_1.Get)('is-following/:userId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Check if following a user' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], SocialController.prototype, "isFollowing", null);
__decorate([
    (0, common_1.Get)('overview/:userId'),
    (0, common_1.UseGuards)(optional_jwt_auth_guard_1.OptionalJwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Compact profile summary for the hover card' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], SocialController.prototype, "overview", null);
__decorate([
    (0, common_1.Get)('feed'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Get activity feed' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Number]),
    __metadata("design:returntype", void 0)
], SocialController.prototype, "getFeed", null);
__decorate([
    (0, common_1.Get)('activity/:userId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get user activity' }),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Number]),
    __metadata("design:returntype", void 0)
], SocialController.prototype, "getUserActivity", null);
__decorate([
    (0, common_1.Get)('travel-buddies'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Find travel buddies' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], SocialController.prototype, "findTravelBuddies", null);
exports.SocialController = SocialController = __decorate([
    (0, swagger_1.ApiTags)('social'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('social'),
    __metadata("design:paramtypes", [social_service_1.SocialService])
], SocialController);
//# sourceMappingURL=social.controller.js.map