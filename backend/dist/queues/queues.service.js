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
var QueuesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueuesService = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("@nestjs/bullmq");
const bullmq_2 = require("bullmq");
let QueuesService = QueuesService_1 = class QueuesService {
    constructor(emailQueue, imageQueue, analyticsQueue, notificationQueue, bookingQueue, payoutQueue) {
        this.emailQueue = emailQueue;
        this.imageQueue = imageQueue;
        this.analyticsQueue = analyticsQueue;
        this.notificationQueue = notificationQueue;
        this.bookingQueue = bookingQueue;
        this.payoutQueue = payoutQueue;
        this.logger = new common_1.Logger(QueuesService_1.name);
    }
    async addEmailJob(type, data, delay) {
        return this.emailQueue.add(type, data, {
            delay,
            attempts: 3,
            backoff: { type: 'exponential', delay: 5000 },
        });
    }
    async addImageJob(type, data) {
        return this.imageQueue.add(type, data, {
            attempts: 3,
            backoff: { type: 'fixed', delay: 10000 },
        });
    }
    async addAnalyticsJob(type, data) {
        return this.analyticsQueue.add(type, data, {
            attempts: 2,
            backoff: { type: 'fixed', delay: 5000 },
        });
    }
    async addNotificationJob(type, data, delay) {
        return this.notificationQueue.add(type, data, {
            delay,
            attempts: 3,
            backoff: { type: 'exponential', delay: 3000 },
        });
    }
    async addBookingJob(type, data, delay) {
        return this.bookingQueue.add(type, data, {
            delay,
            attempts: 3,
            backoff: { type: 'exponential', delay: 10000 },
        });
    }
    async addPayoutJob(type, data, delay) {
        return this.payoutQueue.add(type, data, {
            delay,
            attempts: 5,
            backoff: { type: 'exponential', delay: 60000 },
        });
    }
    async getQueueStats() {
        const queues = [
            { name: 'emails', queue: this.emailQueue },
            { name: 'images', queue: this.imageQueue },
            { name: 'analytics', queue: this.analyticsQueue },
            { name: 'notifications', queue: this.notificationQueue },
            { name: 'bookings', queue: this.bookingQueue },
            { name: 'payouts', queue: this.payoutQueue },
        ];
        const stats = {};
        for (const { name, queue } of queues) {
            const [waiting, active, completed, failed] = await Promise.all([
                queue.getWaitingCount(),
                queue.getActiveCount(),
                queue.getCompletedCount(),
                queue.getFailedCount(),
            ]);
            stats[name] = { waiting, active, completed, failed };
        }
        return stats;
    }
};
exports.QueuesService = QueuesService;
exports.QueuesService = QueuesService = QueuesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, bullmq_1.InjectQueue)('emails')),
    __param(1, (0, bullmq_1.InjectQueue)('images')),
    __param(2, (0, bullmq_1.InjectQueue)('analytics')),
    __param(3, (0, bullmq_1.InjectQueue)('notifications')),
    __param(4, (0, bullmq_1.InjectQueue)('bookings')),
    __param(5, (0, bullmq_1.InjectQueue)('payouts')),
    __metadata("design:paramtypes", [bullmq_2.Queue,
        bullmq_2.Queue,
        bullmq_2.Queue,
        bullmq_2.Queue,
        bullmq_2.Queue,
        bullmq_2.Queue])
], QueuesService);
//# sourceMappingURL=queues.service.js.map