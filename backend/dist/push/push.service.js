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
var PushService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PushService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const webpush = require("web-push");
const push_subscription_entity_1 = require("./push-subscription.entity");
const redis_service_1 = require("../redis/redis.service");
let PushService = PushService_1 = class PushService {
    constructor(repo, redis) {
        this.repo = repo;
        this.redis = redis;
        this.logger = new common_1.Logger(PushService_1.name);
        const vapidPublic = process.env.VAPID_PUBLIC_KEY;
        const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
        const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:support@etunisia.com';
        this.ready = !!(vapidPublic && vapidPrivate);
        if (this.ready) {
            webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);
        }
    }
    async sendToUserBudgeted(userId, payload, opts = {}) {
        if (!this.ready)
            return { sent: 0, skipped: 'no-vapid' };
        if (!opts.critical) {
            const max = opts.max ?? PushService_1.DAILY_MAX;
            try {
                const key = `push:budget:${userId}:${new Date().toISOString().slice(0, 10)}`;
                const count = await this.redis.increment(key);
                if (count === 1)
                    await this.redis.expire(key, 90_000);
                if (count > max) {
                    this.logger.debug(`Push budget spent for ${userId} (${count - 1}/${max})`);
                    return { sent: 0, budgeted: true };
                }
            }
            catch {
            }
        }
        return this.sendToUser(userId, payload);
    }
    async subscribe(userId, subscription) {
        const existing = await this.repo.findOne({ where: { userId } });
        if (existing && existing.subscription?.endpoint === subscription.endpoint) {
            await this.repo.update(existing.id, { isActive: false });
        }
        const sub = this.repo.create({ userId, subscription, isActive: true });
        return this.repo.save(sub);
    }
    async unsubscribe(userId, endpoint) {
        const existing = await this.repo.findOne({ where: { userId } });
        if (existing && existing.subscription?.endpoint === endpoint) {
            await this.repo.update(existing.id, { isActive: false });
        }
        return { message: 'Unsubscribed' };
    }
    async getActiveSubscriptions(userId) {
        const where = { isActive: true };
        if (userId)
            where.userId = userId;
        return this.repo.find({ where });
    }
    async sendToUser(userId, payload) {
        const subs = await this.repo.find({ where: { userId, isActive: true } });
        const results = await Promise.allSettled(subs.map((sub) => webpush
            .sendNotification(sub.subscription, JSON.stringify(payload))
            .catch((err) => {
            if (err.statusCode === 410 || err.statusCode === 404) {
                this.repo.update(sub.id, { isActive: false });
            }
            throw err;
        })));
        return { sent: subs.length, results: results.map((r) => (r.status === 'fulfilled' ? 'ok' : r.reason?.message)) };
    }
    async broadcast(payload) {
        const subs = await this.repo.find({ where: { isActive: true } });
        const results = await Promise.allSettled(subs.map((sub) => webpush
            .sendNotification(sub.subscription, JSON.stringify(payload))
            .catch((err) => {
            if (err.statusCode === 410 || err.statusCode === 404) {
                this.repo.update(sub.id, { isActive: false });
            }
            throw err;
        })));
        return { sent: subs.length, results: results.map((r) => (r.status === 'fulfilled' ? 'ok' : r.reason?.message)) };
    }
};
exports.PushService = PushService;
PushService.DAILY_MAX = 2;
exports.PushService = PushService = PushService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(push_subscription_entity_1.PushSubscription)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        redis_service_1.RedisService])
], PushService);
//# sourceMappingURL=push.service.js.map