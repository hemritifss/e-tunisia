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
exports.SocialService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const follow_entity_1 = require("./follow.entity");
const activity_entity_1 = require("./activity.entity");
const user_entity_1 = require("../users/user.entity");
const redis_service_1 = require("../redis/redis.service");
let SocialService = class SocialService {
    constructor(followRepo, activityRepo, userRepo, redisService) {
        this.followRepo = followRepo;
        this.activityRepo = activityRepo;
        this.userRepo = userRepo;
        this.redisService = redisService;
    }
    async follow(followerId, followingId) {
        if (followerId === followingId) {
            throw new common_1.ConflictException('Cannot follow yourself');
        }
        const exists = await this.followRepo.findOne({
            where: { followerId, followingId },
        });
        if (exists) {
            throw new common_1.ConflictException('Already following this user');
        }
        const follow = this.followRepo.create({ followerId, followingId });
        const saved = await this.followRepo.save(follow);
        await this.createActivity(followerId, activity_entity_1.ActivityType.FOLLOWED_USER, {
            targetUserId: followingId,
        });
        await this.redisService.increment(`user:${followingId}:followers`);
        await this.redisService.increment(`user:${followerId}:following`);
        return saved;
    }
    async unfollow(followerId, followingId) {
        const follow = await this.followRepo.findOne({
            where: { followerId, followingId },
        });
        if (!follow)
            throw new common_1.NotFoundException('Not following this user');
        await this.followRepo.remove(follow);
        await this.redisService.del(`user:${followingId}:followers`);
        await this.redisService.del(`user:${followerId}:following`);
    }
    async getFollowers(userId) {
        const follows = await this.followRepo.find({
            where: { followingId: userId },
        });
        const followerIds = follows.map((f) => f.followerId);
        if (followerIds.length === 0)
            return [];
        return this.userRepo.find({
            where: { id: (0, typeorm_2.In)(followerIds) },
            select: ['id', 'fullName', 'avatar', 'points'],
        });
    }
    async getFollowing(userId) {
        const follows = await this.followRepo.find({
            where: { followerId: userId },
        });
        const followingIds = follows.map((f) => f.followingId);
        if (followingIds.length === 0)
            return [];
        return this.userRepo.find({
            where: { id: (0, typeorm_2.In)(followingIds) },
            select: ['id', 'fullName', 'avatar', 'points'],
        });
    }
    async isFollowing(followerId, followingId) {
        const follow = await this.followRepo.findOne({
            where: { followerId, followingId },
        });
        return !!follow;
    }
    async getFollowCounts(userId) {
        const [followers, following] = await Promise.all([
            this.followRepo.count({ where: { followingId: userId } }),
            this.followRepo.count({ where: { followerId: userId } }),
        ]);
        return { followers, following };
    }
    async createActivity(userId, type, data) {
        const activity = this.activityRepo.create({
            userId,
            type,
            data,
            isPublic: true,
        });
        const saved = await this.activityRepo.save(activity);
        await this.redisService.setJson(`activity:${saved.id}`, saved, 86400);
        return saved;
    }
    async getActivityFeed(userId, page = 1, limit = 20) {
        const follows = await this.followRepo.find({
            where: { followerId: userId },
        });
        const followingIds = follows.map((f) => f.followingId);
        followingIds.push(userId);
        const [activities, total] = await this.activityRepo.findAndCount({
            where: {
                userId: (0, typeorm_2.In)(followingIds),
                isPublic: true,
            },
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });
        return {
            data: activities,
            hasMore: page * limit < total,
        };
    }
    async getUserActivity(userId, page = 1, limit = 20) {
        return this.activityRepo.find({
            where: { userId, isPublic: true },
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });
    }
    async findTravelBuddies(userId, preferences) {
        const currentUser = await this.userRepo.findOne({ where: { id: userId } });
        if (!currentUser)
            return [];
        const potentialBuddies = await this.userRepo.find({
            where: { isActive: true },
            select: ['id', 'fullName', 'avatar', 'country', 'points'],
            take: 20,
        });
        return potentialBuddies
            .filter((u) => u.id !== userId)
            .map((u) => ({
            ...u,
            matchScore: Math.floor(Math.random() * 40) + 60,
            commonInterests: ['culture', 'food', 'photography'].slice(0, Math.floor(Math.random() * 3) + 1),
        }))
            .sort((a, b) => b.matchScore - a.matchScore)
            .slice(0, 10);
    }
};
exports.SocialService = SocialService;
exports.SocialService = SocialService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(follow_entity_1.Follow)),
    __param(1, (0, typeorm_1.InjectRepository)(activity_entity_1.Activity)),
    __param(2, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        redis_service_1.RedisService])
], SocialService);
//# sourceMappingURL=social.service.js.map