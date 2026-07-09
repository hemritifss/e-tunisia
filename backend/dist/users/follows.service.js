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
exports.FollowsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("./user.entity");
const follow_entity_1 = require("./follow.entity");
const users_service_1 = require("./users.service");
const notifications_service_1 = require("../notifications/notifications.service");
const notification_entity_1 = require("../notifications/notification.entity");
let FollowsService = class FollowsService {
    constructor(followsRepo, usersRepo, users, notifications, dataSource) {
        this.followsRepo = followsRepo;
        this.usersRepo = usersRepo;
        this.users = users;
        this.notifications = notifications;
        this.dataSource = dataSource;
    }
    async follow(followerId, followedHandle) {
        const followed = await this.users.findByHandle(followedHandle);
        if (!followed)
            throw new common_1.NotFoundException('User not found');
        if (followed.id === followerId) {
            throw new common_1.BadRequestException("Can't follow yourself");
        }
        const existing = await this.followsRepo.findOne({
            where: { followerId, followedId: followed.id },
        });
        if (existing) {
            return { following: true, followersCount: followed.followersCount };
        }
        await this.dataSource.transaction(async (tx) => {
            await tx.getRepository(follow_entity_1.Follow).save(tx.getRepository(follow_entity_1.Follow).create({ followerId, followedId: followed.id }));
            await tx.getRepository(user_entity_1.User).increment({ id: followed.id }, 'followersCount', 1);
            await tx.getRepository(user_entity_1.User).increment({ id: followerId }, 'followingCount', 1);
        });
        await this.users.invalidatePassportCache(followed.id);
        await this.users.invalidatePassportCache(followerId);
        try {
            const follower = await this.usersRepo.findOne({
                where: { id: followerId },
                select: ['id', 'fullName', 'handle', 'avatar'],
            });
            if (follower) {
                await this.notifications.create(followed.id, `${follower.fullName} started following you`, `@${follower.handle ?? 'someone'} is now on your follower list.`, notification_entity_1.NotificationType.FOLLOW, { followerId: follower.id, followerHandle: follower.handle, followerAvatar: follower.avatar });
            }
        }
        catch { }
        const fresh = await this.usersRepo.findOne({ where: { id: followed.id }, select: ['followersCount'] });
        return { following: true, followersCount: fresh?.followersCount ?? followed.followersCount + 1 };
    }
    async unfollow(followerId, followedHandle) {
        const followed = await this.users.findByHandle(followedHandle);
        if (!followed)
            throw new common_1.NotFoundException('User not found');
        const existing = await this.followsRepo.findOne({
            where: { followerId, followedId: followed.id },
        });
        if (!existing) {
            return { following: false, followersCount: followed.followersCount };
        }
        await this.dataSource.transaction(async (tx) => {
            await tx.getRepository(follow_entity_1.Follow).delete({ followerId, followedId: followed.id });
            await tx.getRepository(user_entity_1.User)
                .createQueryBuilder()
                .update(user_entity_1.User)
                .set({ followersCount: () => 'GREATEST("followersCount" - 1, 0)' })
                .where('id = :id', { id: followed.id })
                .execute()
                .catch(async () => {
                await tx.getRepository(user_entity_1.User).decrement({ id: followed.id }, 'followersCount', 1);
            });
            await tx.getRepository(user_entity_1.User)
                .createQueryBuilder()
                .update(user_entity_1.User)
                .set({ followingCount: () => 'GREATEST("followingCount" - 1, 0)' })
                .where('id = :id', { id: followerId })
                .execute()
                .catch(async () => {
                await tx.getRepository(user_entity_1.User).decrement({ id: followerId }, 'followingCount', 1);
            });
        });
        await this.users.invalidatePassportCache(followed.id);
        await this.users.invalidatePassportCache(followerId);
        const fresh = await this.usersRepo.findOne({ where: { id: followed.id }, select: ['followersCount'] });
        return { following: false, followersCount: fresh?.followersCount ?? Math.max(0, followed.followersCount - 1) };
    }
    async isFollowing(viewerId, handle) {
        if (!viewerId)
            return false;
        const followed = await this.users.findByHandle(handle);
        if (!followed || followed.id === viewerId)
            return false;
        const row = await this.followsRepo.findOne({
            where: { followerId: viewerId, followedId: followed.id },
            select: ['id'],
        });
        return !!row;
    }
    async listFollowers(handle, limit = 50) {
        const followed = await this.users.findByHandle(handle);
        if (!followed)
            return [];
        const rows = await this.followsRepo.find({
            where: { followedId: followed.id },
            order: { createdAt: 'DESC' },
            take: Math.min(100, Math.max(1, limit)),
        });
        if (!rows.length)
            return [];
        const followerIds = rows.map((r) => r.followerId);
        const users = await this.usersRepo.find({
            where: followerIds.map((id) => ({ id })),
            select: ['id', 'handle', 'fullName', 'avatar', 'country'],
        });
        const byId = new Map(users.map((u) => [u.id, u]));
        return rows
            .map((r) => byId.get(r.followerId))
            .filter(Boolean)
            .map((u) => ({
            id: u.id,
            handle: u.handle,
            fullName: u.fullName,
            avatar: u.avatar || null,
            country: u.country || null,
        }));
    }
    async listFollowing(handle, limit = 50) {
        const follower = await this.users.findByHandle(handle);
        if (!follower)
            return [];
        const rows = await this.followsRepo.find({
            where: { followerId: follower.id },
            order: { createdAt: 'DESC' },
            take: Math.min(100, Math.max(1, limit)),
        });
        if (!rows.length)
            return [];
        const ids = rows.map((r) => r.followedId);
        const users = await this.usersRepo.find({
            where: ids.map((id) => ({ id })),
            select: ['id', 'handle', 'fullName', 'avatar', 'country'],
        });
        const byId = new Map(users.map((u) => [u.id, u]));
        return rows
            .map((r) => byId.get(r.followedId))
            .filter(Boolean)
            .map((u) => ({
            id: u.id,
            handle: u.handle,
            fullName: u.fullName,
            avatar: u.avatar || null,
            country: u.country || null,
        }));
    }
};
exports.FollowsService = FollowsService;
exports.FollowsService = FollowsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(follow_entity_1.Follow)),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(2, (0, common_1.Inject)((0, common_1.forwardRef)(() => users_service_1.UsersService))),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        users_service_1.UsersService,
        notifications_service_1.NotificationsService,
        typeorm_2.DataSource])
], FollowsService);
//# sourceMappingURL=follows.service.js.map