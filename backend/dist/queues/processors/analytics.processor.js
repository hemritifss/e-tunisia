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
var AnalyticsProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsProcessor = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const common_1 = require("@nestjs/common");
const redis_service_1 = require("../../redis/redis.service");
let AnalyticsProcessor = AnalyticsProcessor_1 = class AnalyticsProcessor extends bullmq_1.WorkerHost {
    constructor(redisService) {
        super();
        this.redisService = redisService;
        this.logger = new common_1.Logger(AnalyticsProcessor_1.name);
    }
    async process(job) {
        const { name, data, id } = job;
        this.logger.debug(`Processing analytics job ${id} (${name})`);
        try {
            switch (name) {
                case 'track_event': {
                    const d = data;
                    return await this.handleTrackEvent(d);
                }
                case 'compute_trending': {
                    const d = data;
                    return await this.handleComputeTrending(d);
                }
                default:
                    this.logger.warn(`Unknown analytics job type: ${name}`);
                    return { skipped: true };
            }
        }
        catch (error) {
            this.logger.error(`Analytics job ${id} failed: ${error.message}`);
            throw error;
        }
    }
    async handleTrackEvent(data) {
        const event = {
            type: data.eventType,
            userId: data.userId,
            metadata: data.metadata,
            timestamp: new Date().toISOString(),
        };
        await this.redisService.setJson(`event:${Date.now()}:${Math.random().toString(36).slice(2)}`, event, 86400);
        await this.redisService.increment(`events:${data.eventType}:today`);
        await this.redisService.increment(`events:total:today`);
        const tomorrow = new Date();
        tomorrow.setHours(24, 0, 0, 0);
        const ttlSeconds = Math.floor((tomorrow.getTime() - Date.now()) / 1000);
        await this.redisService.expire(`events:${data.eventType}:today`, ttlSeconds);
        await this.redisService.expire(`events:total:today`, ttlSeconds);
        if (data.userId) {
            const userDailyKey = `events:user:${data.userId}:${new Date().toISOString().split('T')[0]}`;
            await this.redisService.increment(userDailyKey);
            await this.redisService.expire(userDailyKey, 86400);
        }
        this.logger.debug(`Event tracked: ${data.eventType}`);
        return { tracked: true };
    }
    async handleComputeTrending(data) {
        const limit = data.limit || 20;
        const pattern = 'events:*:today';
        const keys = [];
        let cursor = '0';
        do {
            const result = await this.redisService.client.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
            cursor = result[0];
            keys.push(...result[1]);
        } while (cursor !== '0');
        const counts = {};
        for (const key of keys) {
            const count = await this.redisService.get(key);
            if (count) {
                counts[key] = parseInt(count, 10);
            }
        }
        await this.redisService.setJson('analytics:trending:today', counts, 3600);
        this.logger.log(`Computed trending analytics for ${Object.keys(counts).length} event types`);
        return { eventTypes: Object.keys(counts).length, topEvents: Object.entries(counts).slice(0, limit) };
    }
};
exports.AnalyticsProcessor = AnalyticsProcessor;
exports.AnalyticsProcessor = AnalyticsProcessor = AnalyticsProcessor_1 = __decorate([
    (0, bullmq_1.Processor)('analytics'),
    __metadata("design:paramtypes", [redis_service_1.RedisService])
], AnalyticsProcessor);
//# sourceMappingURL=analytics.processor.js.map