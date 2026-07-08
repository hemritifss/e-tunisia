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
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const notification_entity_1 = require("./notification.entity");
const websocket_gateway_1 = require("../websocket/websocket.gateway");
const queues_service_1 = require("../queues/queues.service");
const push_service_1 = require("../push/push.service");
let NotificationsService = class NotificationsService {
    constructor(notifRepo, queuesService, push, gateway) {
        this.notifRepo = notifRepo;
        this.queuesService = queuesService;
        this.push = push;
        this.gateway = gateway;
    }
    deepLink(type, data) {
        switch (type) {
            case notification_entity_1.NotificationType.FOLLOW: return data?.fromUserId ? `/user/${data.fromUserId}` : '/activity';
            case notification_entity_1.NotificationType.EVENT: return data?.eventId ? `/events` : '/events';
            case notification_entity_1.NotificationType.BADGE: return '/profile';
            case notification_entity_1.NotificationType.COMMENT:
            case notification_entity_1.NotificationType.MENTION: return data?.postId ? `/post/${data.postId}` : '/feed';
            default: return '/';
        }
    }
    async findByUser(userId) {
        return this.notifRepo.find({
            where: { userId },
            order: { createdAt: 'DESC' },
            take: 50,
        });
    }
    async getUnreadCount(userId) {
        const count = await this.notifRepo.count({
            where: { userId, isRead: false },
        });
        return { unreadCount: count };
    }
    async markRead(id, userId) {
        const notif = await this.notifRepo.findOne({ where: { id, userId } });
        if (!notif)
            throw new common_1.NotFoundException('Notification not found');
        notif.isRead = true;
        return this.notifRepo.save(notif);
    }
    async markAllRead(userId) {
        await this.notifRepo.update({ userId, isRead: false }, { isRead: true });
        return { message: 'All notifications marked as read' };
    }
    async create(userId, title, body, type, data) {
        const saved = await this.notifRepo.save(this.notifRepo.create({
            userId, title, body, type, data,
        }));
        try {
            this.gateway?.broadcastNotification(userId, saved);
        }
        catch { }
        this.push?.sendToUserBudgeted(userId, {
            title, body, url: this.deepLink(type, data),
        }).catch(() => { });
        return saved;
    }
    async createBulk(userIds, title, body, type, data) {
        const notifications = userIds.map(userId => this.notifRepo.create({
            userId, title, body, type, data,
        }));
        return this.notifRepo.save(notifications);
    }
    async queueNotification(userId, title, body, type, data, push = true) {
        return this.queuesService.addNotificationJob('send', {
            userId, title, body, type, data, push,
        });
    }
    async queueBulkNotification(userIds, title, body, type, data) {
        return this.queuesService.addNotificationJob('send_bulk', {
            userIds, title, body, type, data,
        });
    }
    async remove(id, userId) {
        await this.notifRepo.delete({ id, userId });
        return { message: 'Notification deleted' };
    }
    async seedForUser(userId) {
        const count = await this.notifRepo.count({ where: { userId } });
        if (count > 0)
            return;
        const notifications = [
            { title: '🎉 Welcome to e-Tunisia!', body: 'Start exploring the beauty of Tunisia. Check out trending places on the home screen!', type: notification_entity_1.NotificationType.SYSTEM },
            { title: '🏅 Badge Earned: First Steps', body: 'Congratulations! You earned the "First Steps" badge for joining e-Tunisia.', type: notification_entity_1.NotificationType.BADGE, data: { badge: 'First Steps' } },
            { title: '🎪 New Event: Carthage International Festival', body: 'The biggest cultural festival in Tunisia is happening this July! Secure your tickets now.', type: notification_entity_1.NotificationType.EVENT },
            { title: '💡 New Tip: Best Season to Visit', body: 'A community member shared a travel tip — Spring (Mar-May) is the best time to visit Tunisia!', type: notification_entity_1.NotificationType.TIP },
            { title: '💎 Go Premium for 10 TND/month', body: 'Unlock exclusive itineraries, ad-free browsing, and premium content. Start your free trial!', type: notification_entity_1.NotificationType.PROMO },
            { title: '🤝 New Sponsor: Tunisair', body: 'Tunisia\'s national airline is now a Gold sponsor. Check out special flight deals!', type: notification_entity_1.NotificationType.SPONSOR },
        ];
        for (const n of notifications) {
            await this.notifRepo.save(this.notifRepo.create({ ...n, userId }));
        }
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(notification_entity_1.Notification)),
    __param(2, (0, common_1.Optional)()),
    __param(3, (0, common_1.Optional)()),
    __param(3, (0, common_1.Inject)((0, common_1.forwardRef)(() => websocket_gateway_1.EventsGateway))),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        queues_service_1.QueuesService,
        push_service_1.PushService,
        websocket_gateway_1.EventsGateway])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map