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
var NotificationProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationProcessor = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const notification_entity_1 = require("../../notifications/notification.entity");
const push_service_1 = require("../../push/push.service");
let NotificationProcessor = NotificationProcessor_1 = class NotificationProcessor extends bullmq_1.WorkerHost {
    constructor(notifRepo, pushService) {
        super();
        this.notifRepo = notifRepo;
        this.pushService = pushService;
        this.logger = new common_1.Logger(NotificationProcessor_1.name);
    }
    async process(job) {
        const { name, data, id } = job;
        this.logger.debug(`Processing notification job ${id} (${name})`);
        try {
            switch (name) {
                case 'send': {
                    const sendData = data;
                    return await this.handleSend(sendData, id);
                }
                case 'send_bulk': {
                    const bulkData = data;
                    return await this.handleBulk(bulkData, id);
                }
                default:
                    this.logger.warn(`Unknown notification job type: ${name}`);
                    return { skipped: true };
            }
        }
        catch (error) {
            this.logger.error(`Notification job ${id} failed: ${error.message}`);
            throw error;
        }
    }
    async handleSend(data, jobId) {
        const dedupKey = `notif:dedup:${jobId}`;
        const existing = await this.notifRepo.findOne({
            where: { userId: data.userId, title: data.title, type: data.type },
            order: { createdAt: 'DESC' },
        });
        if (existing && (Date.now() - new Date(existing.createdAt).getTime()) < 60_000) {
            this.logger.debug(`Skipping duplicate notification for user ${data.userId}`);
            return { skipped: true, notificationId: existing.id };
        }
        const saved = await this.notifRepo.save(this.notifRepo.create({
            userId: data.userId,
            title: data.title,
            body: data.body,
            type: data.type,
            data: data.data,
        }));
        if (data.push !== false) {
            try {
                await this.pushService.sendToUserBudgeted(data.userId, {
                    title: data.title,
                    body: data.body,
                    icon: '/icon-192x192.png',
                    url: this.getDeepLink(data.type, data.data),
                });
            }
            catch (pushError) {
                this.logger.warn(`Push failed for user ${data.userId}: ${pushError.message}`);
            }
        }
        this.logger.log(`Notification created for user ${data.userId} (${data.type})`);
        return { notificationId: saved.id };
    }
    async handleBulk(data, jobId) {
        const batchSize = 100;
        const total = data.userIds.length;
        let created = 0;
        for (let i = 0; i < total; i += batchSize) {
            const batch = data.userIds.slice(i, i + batchSize);
            const notifications = batch.map((userId) => this.notifRepo.create({
                userId,
                title: data.title,
                body: data.body,
                type: data.type,
                data: { ...data.data, _bulkJobId: jobId },
            }));
            const saved = await this.notifRepo.save(notifications);
            created += saved.length;
        }
        this.logger.log(`Bulk notification sent to ${created}/${total} users (${data.type})`);
        return { created, total };
    }
    getDeepLink(type, data) {
        switch (type) {
            case notification_entity_1.NotificationType.EVENT:
                return data?.eventId ? `/events/${data.eventId}` : '/events';
            case notification_entity_1.NotificationType.BADGE:
                return '/profile';
            case notification_entity_1.NotificationType.FOLLOW:
                return data?.userId ? `/u/${data.userId}` : '/activity';
            case notification_entity_1.NotificationType.COMMENT:
                return data?.postId ? `/post/${data.postId}` : '/feed';
            case notification_entity_1.NotificationType.MENTION:
                return data?.postId ? `/post/${data.postId}` : '/feed';
            default:
                return '/';
        }
    }
};
exports.NotificationProcessor = NotificationProcessor;
exports.NotificationProcessor = NotificationProcessor = NotificationProcessor_1 = __decorate([
    (0, bullmq_1.Processor)('notifications'),
    __param(0, (0, typeorm_1.InjectRepository)(notification_entity_1.Notification)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        push_service_1.PushService])
], NotificationProcessor);
//# sourceMappingURL=notification.processor.js.map