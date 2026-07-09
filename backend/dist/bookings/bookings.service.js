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
exports.BookingsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const booking_entity_1 = require("./booking.entity");
const inventory_entity_1 = require("../inventory/inventory.entity");
const config_1 = require("@nestjs/config");
const redis_service_1 = require("../redis/redis.service");
const queues_service_1 = require("../queues/queues.service");
let BookingsService = class BookingsService {
    constructor(bookingRepo, inventoryRepo, configService, redisService, queuesService) {
        this.bookingRepo = bookingRepo;
        this.inventoryRepo = inventoryRepo;
        this.configService = configService;
        this.redisService = redisService;
        this.queuesService = queuesService;
    }
    async create(userId, dto) {
        const item = await this.inventoryRepo.findOne({
            where: { id: dto.itemId, isActive: true },
        });
        if (!item) {
            throw new common_1.NotFoundException('Inventory item not found');
        }
        const isAvailable = await this.checkAvailability(dto.itemId, dto.checkIn, dto.checkOut, dto.guests);
        if (!isAvailable) {
            throw new common_1.ConflictException('This item is not available for the selected dates');
        }
        const checkInDate = new Date(dto.checkIn);
        const now = new Date();
        const hoursUntilCheckIn = (checkInDate.getTime() - now.getTime()) / (1000 * 60 * 60);
        if (hoursUntilCheckIn < item.minAdvanceBookingHours) {
            throw new common_1.BadRequestException(`Must book at least ${item.minAdvanceBookingHours} hours in advance`);
        }
        const daysUntilCheckIn = hoursUntilCheckIn / 24;
        if (daysUntilCheckIn > item.maxAdvanceBookingDays) {
            throw new common_1.BadRequestException(`Can only book up to ${item.maxAdvanceBookingDays} days in advance`);
        }
        const nights = dto.checkOut
            ? Math.ceil((new Date(dto.checkOut).getTime() - checkInDate.getTime()) /
                (1000 * 60 * 60 * 24))
            : 1;
        const subtotal = item.price * dto.guests * nights;
        const platformFeePercent = this.getPlatformFeePercent(subtotal);
        const platformFee = Math.round(subtotal * platformFeePercent * 100) / 100;
        const taxRate = 0.07;
        const taxAmount = Math.round(subtotal * taxRate * 100) / 100;
        const totalAmount = subtotal + platformFee + taxAmount;
        const hostPayout = subtotal - platformFee;
        const booking = this.bookingRepo.create({
            userId,
            placeId: dto.placeId,
            itemId: dto.itemId,
            type: dto.type,
            checkIn: checkInDate,
            checkOut: dto.checkOut ? new Date(dto.checkOut) : null,
            startTime: dto.startTime || null,
            guests: dto.guests,
            guestDetails: dto.guestDetails || [],
            addons: dto.addons || [],
            subtotal,
            platformFee,
            hostPayout,
            taxAmount,
            totalAmount,
            currency: item.currency,
            status: 'pending',
            cancellationPolicy: 'moderate',
            specialRequests: dto.specialRequests || null,
            expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        });
        const saved = await this.bookingRepo.save(booking);
        await this.redisService.set(`booking:hold:${dto.itemId}:${dto.checkIn}`, saved.id, 15 * 60);
        return saved;
    }
    async findByUser(userId) {
        return this.bookingRepo.find({
            where: { userId },
            relations: ['place', 'item'],
            order: { createdAt: 'DESC' },
        });
    }
    async findByPlace(placeId) {
        return this.bookingRepo.find({
            where: { placeId },
            relations: ['user', 'item'],
            order: { createdAt: 'DESC' },
        });
    }
    async findByHost(hostId) {
        return this.bookingRepo
            .createQueryBuilder('booking')
            .leftJoinAndSelect('booking.place', 'place')
            .leftJoinAndSelect('booking.user', 'user')
            .leftJoinAndSelect('booking.item', 'item')
            .where('place.submittedBy = :hostId', { hostId })
            .orderBy('booking.createdAt', 'DESC')
            .getMany();
    }
    async findOne(id) {
        const booking = await this.bookingRepo.findOne({
            where: { id },
            relations: ['place', 'user', 'item'],
        });
        if (!booking) {
            throw new common_1.NotFoundException('Booking not found');
        }
        return booking;
    }
    async confirmPayment(id, paymentIntentId) {
        const booking = await this.findOne(id);
        if (booking.status !== 'pending') {
            throw new common_1.BadRequestException('Booking is not in pending status');
        }
        if (new Date() > booking.expiresAt) {
            throw new common_1.BadRequestException('Booking hold has expired');
        }
        booking.status = 'confirmed';
        booking.paymentIntentId = paymentIntentId;
        booking.qrCode = this.generateQRCode(booking.id);
        const saved = await this.bookingRepo.save(booking);
        try {
            await this.queuesService.addBookingJob('confirm', {
                bookingId: saved.id,
                paymentIntentId,
                userEmail: saved.user?.email,
                userId: saved.userId,
            });
        }
        catch { }
        return saved;
    }
    async cancel(id, userId, reason) {
        const booking = await this.findOne(id);
        if (booking.userId !== userId) {
            throw new common_1.BadRequestException('Not authorized to cancel this booking');
        }
        if (['cancelled', 'refunded', 'completed'].includes(booking.status)) {
            throw new common_1.BadRequestException('Booking cannot be cancelled');
        }
        const refundAmount = this.calculateRefund(booking);
        booking.status = refundAmount > 0 ? 'refunded' : 'cancelled';
        booking.metadata = {
            ...booking.metadata,
            cancellationReason: reason,
            refundAmount,
            cancelledAt: new Date().toISOString(),
        };
        await this.redisService.del(`booking:hold:${booking.itemId}:${booking.checkIn.toISOString().split('T')[0]}`);
        return this.bookingRepo.save(booking);
    }
    async complete(id) {
        const booking = await this.findOne(id);
        booking.status = 'completed';
        return this.bookingRepo.save(booking);
    }
    async getRevenueStats(placeId) {
        const qb = this.bookingRepo
            .createQueryBuilder('booking')
            .select([
            'SUM(booking.totalAmount) as totalRevenue',
            'COUNT(*) as totalBookings',
            'SUM(booking.platformFee) as totalPlatformFees',
            'SUM(booking.hostPayout) as totalHostPayouts',
        ])
            .where('booking.status IN (:...statuses)', {
            statuses: ['confirmed', 'paid', 'completed'],
        });
        if (placeId) {
            qb.andWhere('booking.placeId = :placeId', { placeId });
        }
        const result = await qb.getRawOne();
        return {
            totalRevenue: Number(result.totalRevenue) || 0,
            totalBookings: Number(result.totalBookings) || 0,
            totalPlatformFees: Number(result.totalPlatformFees) || 0,
            totalHostPayouts: Number(result.totalHostPayouts) || 0,
        };
    }
    async getOwnerEarnings(ownerId) {
        const rows = await this.bookingRepo
            .createQueryBuilder('booking')
            .innerJoin('booking.place', 'place')
            .where('place.submittedBy = :ownerId', { ownerId })
            .andWhere('booking.status IN (:...statuses)', { statuses: ['paid', 'completed'] })
            .orderBy('booking.createdAt', 'DESC')
            .select([
            'booking.id AS id',
            'booking.placeId AS "placeId"',
            'place.name AS "placeName"',
            'booking.currency AS currency',
            'booking.subtotal AS subtotal',
            'booking.platformFee AS "platformFee"',
            'booking.hostPayout AS "hostPayout"',
            'booking.status AS status',
            'booking.checkIn AS "checkIn"',
            'booking.payoutSettledAt AS "payoutSettledAt"',
            'booking.createdAt AS "createdAt"',
        ])
            .getRawMany();
        let grossTnd = 0, commissionTnd = 0, netTnd = 0, owedTnd = 0, paidOutTnd = 0;
        const entries = rows.map((r) => {
            const gross = Number(r.subtotal) || 0;
            const commission = Number(r.platformFee) || 0;
            const net = Number(r.hostPayout) || 0;
            const settled = !!r.payoutSettledAt;
            grossTnd += gross;
            commissionTnd += commission;
            netTnd += net;
            if (settled)
                paidOutTnd += net;
            else
                owedTnd += net;
            return {
                id: r.id, placeId: r.placeId, placeName: r.placeName, currency: r.currency,
                grossTnd: gross, commissionTnd: commission, netTnd: net,
                status: r.status, checkIn: r.checkIn, settled, payoutSettledAt: r.payoutSettledAt,
                createdAt: r.createdAt,
            };
        });
        return {
            summary: {
                bookings: entries.length,
                grossTnd: Math.round(grossTnd * 100) / 100,
                commissionTnd: Math.round(commissionTnd * 100) / 100,
                netTnd: Math.round(netTnd * 100) / 100,
                owedTnd: Math.round(owedTnd * 100) / 100,
                paidOutTnd: Math.round(paidOutTnd * 100) / 100,
            },
            entries,
        };
    }
    async settlePayout(bookingId) {
        const booking = await this.bookingRepo.findOne({ where: { id: bookingId } });
        if (!booking)
            throw new common_1.NotFoundException('Booking not found');
        booking.payoutSettledAt = new Date();
        await this.bookingRepo.save(booking);
        return { id: booking.id, payoutSettledAt: booking.payoutSettledAt };
    }
    async checkAvailability(itemId, checkIn, checkOut, guests) {
        const item = await this.inventoryRepo.findOne({ where: { id: itemId } });
        if (!item)
            return false;
        if (guests > item.capacity)
            return false;
        const qb = this.bookingRepo
            .createQueryBuilder('booking')
            .where('booking.itemId = :itemId', { itemId })
            .andWhere('booking.status IN (:...statuses)', {
            statuses: ['pending', 'confirmed', 'paid'],
        });
        if (checkOut) {
            qb.andWhere('((booking.checkIn <= :checkOut AND booking.checkOut >= :checkIn) OR (booking.checkIn <= :checkIn AND booking.checkOut >= :checkIn))', { checkIn, checkOut });
        }
        else {
            qb.andWhere('booking.checkIn = :checkIn', { checkIn });
        }
        const conflicting = await qb.getCount();
        return conflicting === 0;
    }
    getPlatformFeePercent(subtotal) {
        if (subtotal >= 1000)
            return 0.1;
        if (subtotal >= 500)
            return 0.12;
        return 0.15;
    }
    calculateRefund(booking) {
        const now = new Date();
        const checkIn = new Date(booking.checkIn);
        const hoursUntil = (checkIn.getTime() - now.getTime()) / (1000 * 60 * 60);
        switch (booking.cancellationPolicy) {
            case 'flexible':
                return hoursUntil >= 24 ? booking.totalAmount : booking.totalAmount * 0.5;
            case 'moderate':
                return hoursUntil >= 72 ? booking.totalAmount : hoursUntil >= 24 ? booking.subtotal * 0.5 : 0;
            case 'strict':
                return hoursUntil >= 168 ? booking.totalAmount * 0.8 : hoursUntil >= 72 ? booking.totalAmount * 0.5 : 0;
            default:
                return 0;
        }
    }
    generateQRCode(bookingId) {
        return `ETUNISIA:${bookingId}:${Date.now()}`;
    }
    async cleanupExpiredBookings() {
        const expired = await this.bookingRepo.find({
            where: {
                status: 'pending',
                expiresAt: (0, typeorm_2.LessThan)(new Date()),
            },
        });
        for (const booking of expired) {
            booking.status = 'cancelled';
            booking.metadata = {
                ...booking.metadata,
                cancellationReason: 'Expired - payment not completed within 15 minutes',
            };
        }
        if (expired.length > 0) {
            await this.bookingRepo.save(expired);
        }
        return expired.length;
    }
};
exports.BookingsService = BookingsService;
exports.BookingsService = BookingsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(booking_entity_1.Booking)),
    __param(1, (0, typeorm_1.InjectRepository)(inventory_entity_1.InventoryItem)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        config_1.ConfigService,
        redis_service_1.RedisService,
        queues_service_1.QueuesService])
], BookingsService);
//# sourceMappingURL=bookings.service.js.map