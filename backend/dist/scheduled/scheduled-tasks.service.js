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
var ScheduledTasksService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WeeklyDigestRunner = exports.ScheduledTasksService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const streak_entity_1 = require("../challenges/streak.entity");
const notifications_service_1 = require("../notifications/notifications.service");
const notification_entity_1 = require("../notifications/notification.entity");
const redis_service_1 = require("../redis/redis.service");
let ScheduledTasksService = ScheduledTasksService_1 = class ScheduledTasksService {
    constructor(streaks, notifications, redis, weekly) {
        this.streaks = streaks;
        this.notifications = notifications;
        this.redis = redis;
        this.weekly = weekly;
        this.logger = new common_1.Logger(ScheduledTasksService_1.name);
    }
    onModuleInit() {
        this.timer = setInterval(() => this.tick().catch((e) => this.logger.warn(e?.message)), 60 * 60 * 1000);
        setTimeout(() => this.tick().catch(() => { }), 30_000);
    }
    onModuleDestroy() {
        if (this.timer)
            clearInterval(this.timer);
    }
    dayKey(d) { return d.toISOString().slice(0, 10); }
    weekKey(d) {
        const onejan = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        const week = Math.ceil((((d.getTime() - onejan.getTime()) / 86400000) + onejan.getUTCDay() + 1) / 7);
        return `${d.getUTCFullYear()}-W${week}`;
    }
    async tick() {
        const now = new Date();
        const hour = now.getUTCHours();
        const dow = now.getUTCDay();
        if (hour >= 18 && hour <= 20) {
            await this.runOnce(`cron:streak:${this.dayKey(now)}`, () => this.runStreakReminders());
        }
        if (dow === 4 && hour >= 9 && hour <= 11 && this.weekly) {
            await this.runOnce(`cron:digest:${this.weekKey(now)}`, () => this.weekly.runWeeklyDigest());
        }
    }
    async runOnce(key, fn) {
        try {
            if (await this.redis.get(key))
                return;
            await this.redis.setJson(key, 1, 26 * 3600);
        }
        catch { }
        await fn();
    }
    async runStreakReminders() {
        const yesterday = this.dayKey(new Date(Date.now() - 86_400_000));
        const rows = await this.streaks
            .createQueryBuilder('s')
            .where('s.currentStreak >= 1')
            .andWhere('s.lastActiveDate = :d', { d: yesterday })
            .getMany()
            .catch(() => []);
        let sent = 0;
        for (const s of rows) {
            await this.notifications.create(s.userId, '🔥 Keep your streak alive', `Your ${s.currentStreak}-day streak ends at midnight — a quick check-in keeps it going.`, notification_entity_1.NotificationType.SYSTEM, { url: '/', kind: 'streak-reminder' }).then(() => { sent++; }).catch(() => { });
        }
        this.logger.log(`Streak reminders sent: ${sent}/${rows.length}`);
    }
};
exports.ScheduledTasksService = ScheduledTasksService;
exports.ScheduledTasksService = ScheduledTasksService = ScheduledTasksService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(streak_entity_1.UserStreak)),
    __param(3, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        notifications_service_1.NotificationsService,
        redis_service_1.RedisService,
        WeeklyDigestRunner])
], ScheduledTasksService);
class WeeklyDigestRunner {
}
exports.WeeklyDigestRunner = WeeklyDigestRunner;
//# sourceMappingURL=scheduled-tasks.service.js.map