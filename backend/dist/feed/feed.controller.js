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
exports.FeedController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_1 = require("@nestjs/jwt");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const feed_service_1 = require("./feed.service");
let FeedController = class FeedController {
    constructor(feed, jwt) {
        this.feed = feed;
        this.jwt = jwt;
    }
    tryGetUserId(req) {
        const h = req?.headers?.authorization;
        if (!h || typeof h !== 'string')
            return undefined;
        const m = h.match(/^Bearer\s+(.+)$/i);
        if (!m)
            return undefined;
        try {
            const decoded = this.jwt.verify(m[1]);
            return decoded?.sub || decoded?.id;
        }
        catch {
            return undefined;
        }
    }
    public(req, page, limit, sort, category, hashtag) {
        return this.feed.unified({
            page: page ? Number(page) : undefined,
            limit: limit ? Number(limit) : undefined,
            sort,
            category,
            hashtag,
            userId: this.tryGetUserId(req),
        });
    }
    followingFeed(req, page, limit, sort) {
        return this.feed.unified({
            page: page ? Number(page) : undefined,
            limit: limit ? Number(limit) : undefined,
            sort,
            following: true,
            userId: req.user.id,
        });
    }
    mine(req, page, limit, sort) {
        return this.feed.unified({
            page: page ? Number(page) : undefined,
            limit: limit ? Number(limit) : undefined,
            sort,
            mine: true,
            userId: req.user.id,
        });
    }
    stories(limit) {
        return this.feed.stories(limit ? Number(limit) : 12);
    }
    trending(limit) {
        return this.feed.trendingHashtags(limit ? Number(limit) : 8);
    }
};
exports.FeedController = FeedController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Unified social feed (posts + reviews + ads)' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'sort', required: false, enum: ['new', 'top', 'hot'] }),
    (0, swagger_1.ApiQuery)({ name: 'category', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'hashtag', required: false }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Query)('sort')),
    __param(4, (0, common_1.Query)('category')),
    __param(5, (0, common_1.Query)('hashtag')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String, String]),
    __metadata("design:returntype", void 0)
], FeedController.prototype, "public", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Get)('following'),
    (0, swagger_1.ApiOperation)({ summary: 'Feed of posts from users the current user follows' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Query)('sort')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", void 0)
], FeedController.prototype, "followingFeed", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Get)('mine'),
    (0, swagger_1.ApiOperation)({ summary: "Feed of the current user's own posts" }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Query)('sort')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", void 0)
], FeedController.prototype, "mine", null);
__decorate([
    (0, common_1.Get)('stories'),
    (0, swagger_1.ApiOperation)({ summary: 'Stories strip (featured places) at top of feed' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false }),
    __param(0, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], FeedController.prototype, "stories", null);
__decorate([
    (0, common_1.Get)('trending-hashtags'),
    (0, swagger_1.ApiOperation)({ summary: 'Top hashtags across recent posts + reviews' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false }),
    __param(0, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], FeedController.prototype, "trending", null);
exports.FeedController = FeedController = __decorate([
    (0, swagger_1.ApiTags)('feed'),
    (0, common_1.Controller)('feed'),
    __metadata("design:paramtypes", [feed_service_1.FeedService, jwt_1.JwtService])
], FeedController);
//# sourceMappingURL=feed.controller.js.map