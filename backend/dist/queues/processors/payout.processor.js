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
var PayoutProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PayoutProcessor = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const booking_entity_1 = require("../../bookings/booking.entity");
const redis_service_1 = require("../../redis/redis.service");
let PayoutProcessor = PayoutProcessor_1 = class PayoutProcessor extends bullmq_1.WorkerHost {
    constructor(bookingRepo, redisService) {
        super();
        this.bookingRepo = bookingRepo;
        this.redisService = redisService;
        this.logger = new common_1.Logger(PayoutProcessor_1.name);
    }
    async process(job) {
        const { name, data, id } = job;
        this.logger.debug(`Processing payout job ${id} (${name})`);
        try {
            switch (name) {
                case 'initiate':
                    return await this.handleInitiate(data, id);
                case 'retry_failed':
                    return await this.handleRetry(data, id);
                default:
                    this.logger.warn(`Unknown payout job type: ${name}`);
                    return { skipped: true };
            }
        }
        catch (error) {
            this.logger.error(`Payout job ${id} failed: ${error.message}`);
            throw error;
        }
    }
    async handleInitiate(data, jobId) {
        const booking = await this.bookingRepo.findOne({
            where: { id: data.bookingId },
            relations: ['place'],
        });
        if (!booking) {
            throw new Error(`Booking ${data.bookingId} not found`);
        }
        if (booking.status !== 'completed' && booking.status !== 'confirmed') {
            throw new Error(`Booking ${data.bookingId} is not eligible for payout (status: ${booking.status})`);
        }
        const payoutRecord = {
            jobId,
            bookingId: data.bookingId,
            hostId: data.hostId,
            amount: data.amount,
            currency: data.currency,
            method: data.method || 'stripe_connect',
            status: 'completed',
            processedAt: new Date().toISOString(),
        };
        await this.redisService.setJson(`payout:${data.bookingId}:${jobId}`, payoutRecord, 90 * 86400);
        booking.metadata = {
            ...booking.metadata,
            payout: {
                status: 'completed',
                amount: data.amount,
                processedAt: payoutRecord.processedAt,
            },
        };
        await this.bookingRepo.save(booking);
        this.logger.log(`Payout of ${data.amount} ${data.currency} processed for booking ${data.bookingId}`);
        return { payout: payoutRecord };
    }
    async handleRetry(data, jobId) {
        const previousRecord = await this.redisService.getJson(`payout:${data.bookingId}:${data.previousAttemptId}`);
        if (!previousRecord) {
            this.logger.warn(`No previous payout record found for ${data.bookingId}`);
            return { skipped: true, reason: 'no_previous_record' };
        }
        this.logger.log(`Retrying payout for booking ${data.bookingId} (previous failure: ${data.failureReason})`);
        const retryRecord = {
            ...previousRecord,
            jobId,
            isRetry: true,
            previousAttemptId: data.previousAttemptId,
            failureReason: data.failureReason,
            retriedAt: new Date().toISOString(),
            status: 'completed',
        };
        await this.redisService.setJson(`payout:${data.bookingId}:${jobId}`, retryRecord, 90 * 86400);
        this.logger.log(`Payout retry completed for booking ${data.bookingId}`);
        return { retry: retryRecord };
    }
};
exports.PayoutProcessor = PayoutProcessor;
exports.PayoutProcessor = PayoutProcessor = PayoutProcessor_1 = __decorate([
    (0, bullmq_1.Processor)('payouts'),
    __param(0, (0, typeorm_1.InjectRepository)(booking_entity_1.Booking)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        redis_service_1.RedisService])
], PayoutProcessor);
//# sourceMappingURL=payout.processor.js.map