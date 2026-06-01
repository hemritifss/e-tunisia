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
exports.EndorsementsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const endorsement_entity_1 = require("./endorsement.entity");
const user_entity_1 = require("./user.entity");
const users_service_1 = require("./users.service");
const endorsement_topics_1 = require("./endorsement-topics");
const notifications_service_1 = require("../notifications/notifications.service");
const notification_entity_1 = require("../notifications/notification.entity");
let EndorsementsService = class EndorsementsService {
    constructor(endorsementsRepo, usersRepo, users, notifications) {
        this.endorsementsRepo = endorsementsRepo;
        this.usersRepo = usersRepo;
        this.users = users;
        this.notifications = notifications;
    }
    async endorse(endorserId, endorsedHandle, topic) {
        if (!(0, endorsement_topics_1.isValidTopic)(topic)) {
            throw new common_1.BadRequestException('Unknown endorsement topic');
        }
        const endorsed = await this.users.findByHandle(endorsedHandle);
        if (!endorsed)
            throw new common_1.NotFoundException('User not found');
        if (endorsed.id === endorserId) {
            throw new common_1.BadRequestException("Can't endorse yourself");
        }
        const existing = await this.endorsementsRepo.findOne({
            where: { endorserId, endorsedId: endorsed.id, topic },
        });
        if (!existing) {
            await this.endorsementsRepo.save(this.endorsementsRepo.create({ endorserId, endorsedId: endorsed.id, topic }));
            try {
                const endorser = await this.usersRepo.findOne({
                    where: { id: endorserId },
                    select: ['id', 'fullName', 'handle', 'avatar'],
                });
                if (endorser) {
                    await this.notifications.create(endorsed.id, `${endorser.fullName} endorsed you`, `@${endorser.handle ?? 'someone'} endorsed your ${topic.replace(/-/g, ' ')} expertise.`, notification_entity_1.NotificationType.MENTION, { endorserId: endorser.id, endorserHandle: endorser.handle, endorserAvatar: endorser.avatar, topic });
                }
            }
            catch { }
            await this.users.invalidatePassportCache(endorsed.id);
        }
        const count = await this.endorsementsRepo.count({
            where: { endorsedId: endorsed.id, topic },
        });
        return { endorsed: true, count };
    }
    async unendorse(endorserId, endorsedHandle, topic) {
        if (!(0, endorsement_topics_1.isValidTopic)(topic))
            throw new common_1.BadRequestException('Unknown endorsement topic');
        const endorsed = await this.users.findByHandle(endorsedHandle);
        if (!endorsed)
            throw new common_1.NotFoundException('User not found');
        await this.endorsementsRepo.delete({ endorserId, endorsedId: endorsed.id, topic });
        await this.users.invalidatePassportCache(endorsed.id);
        const count = await this.endorsementsRepo.count({
            where: { endorsedId: endorsed.id, topic },
        });
        return { endorsed: false, count };
    }
    async topForUser(userId, limit = 3) {
        const rows = await this.endorsementsRepo
            .createQueryBuilder('e')
            .select('e.topic', 'topic')
            .addSelect('COUNT(*)', 'count')
            .where('e.endorsedId = :id', { id: userId })
            .groupBy('e.topic')
            .orderBy('count', 'DESC')
            .limit(Math.min(20, Math.max(1, limit)))
            .getRawMany()
            .catch(() => []);
        return rows.map((r) => ({ topic: r.topic, count: Number(r.count) }));
    }
    async listForHandle(handle) {
        const user = await this.users.findByHandle(handle);
        if (!user)
            return [];
        const summary = await this.topForUser(user.id, 20);
        if (!summary.length)
            return [];
        const groups = await Promise.all(summary.map(async (s) => {
            const rows = await this.endorsementsRepo.find({
                where: { endorsedId: user.id, topic: s.topic },
                order: { createdAt: 'DESC' },
                take: 5,
            });
            if (!rows.length)
                return { ...s, recent: [] };
            const endorsers = await this.usersRepo.find({
                where: rows.map((r) => ({ id: r.endorserId })),
                select: ['id', 'handle', 'fullName', 'avatar'],
            });
            const byId = new Map(endorsers.map((u) => [u.id, u]));
            return {
                ...s,
                recent: rows
                    .map((r) => byId.get(r.endorserId))
                    .filter(Boolean)
                    .map((u) => ({
                    id: u.id,
                    handle: u.handle ?? null,
                    fullName: u.fullName,
                    avatar: u.avatar || null,
                })),
            };
        }));
        return groups;
    }
    async myEndorsementsFor(viewerId, handle) {
        if (!viewerId)
            return [];
        const user = await this.users.findByHandle(handle);
        if (!user || user.id === viewerId)
            return [];
        const rows = await this.endorsementsRepo.find({
            where: { endorserId: viewerId, endorsedId: user.id },
            select: ['topic'],
        });
        return rows.map((r) => r.topic);
    }
};
exports.EndorsementsService = EndorsementsService;
exports.EndorsementsService = EndorsementsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(endorsement_entity_1.Endorsement)),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(2, (0, common_1.Inject)((0, common_1.forwardRef)(() => users_service_1.UsersService))),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        users_service_1.UsersService,
        notifications_service_1.NotificationsService])
], EndorsementsService);
//# sourceMappingURL=endorsements.service.js.map