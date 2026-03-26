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
let NotificationsService = class NotificationsService {
    constructor(notifRepo) {
        this.notifRepo = notifRepo;
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
        return this.notifRepo.save(this.notifRepo.create({
            userId, title, body, type, data,
        }));
    }
    async createBulk(userIds, title, body, type, data) {
        const notifications = userIds.map(userId => this.notifRepo.create({
            userId, title, body, type, data,
        }));
        return this.notifRepo.save(notifications);
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
    __metadata("design:paramtypes", [typeorm_2.Repository])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map