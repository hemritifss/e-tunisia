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
var AnalyticsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const redis_service_1 = require("../redis/redis.service");
const user_entity_1 = require("../users/user.entity");
const place_entity_1 = require("../places/place.entity");
const booking_entity_1 = require("../bookings/booking.entity");
const review_entity_1 = require("../reviews/review.entity");
const queues_service_1 = require("../queues/queues.service");
let AnalyticsService = AnalyticsService_1 = class AnalyticsService {
    constructor(userRepo, placeRepo, bookingRepo, reviewRepo, redisService, queuesService) {
        this.userRepo = userRepo;
        this.placeRepo = placeRepo;
        this.bookingRepo = bookingRepo;
        this.reviewRepo = reviewRepo;
        this.redisService = redisService;
        this.queuesService = queuesService;
        this.logger = new common_1.Logger(AnalyticsService_1.name);
    }
    async getDashboardStats() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        const cacheKey = 'dashboard:stats';
        const cached = await this.redisService.getJson(cacheKey);
        if (cached)
            return cached;
        const [totalUsers, newUsersToday, totalPlaces, featuredPlaces, newPlacesWeek, totalBookings, todayBookings, totalRevenue, totalReviews,] = await Promise.all([
            this.userRepo.count(),
            this.userRepo.count({ where: { createdAt: (0, typeorm_2.Between)(today, new Date()) } }),
            this.placeRepo.count(),
            this.placeRepo.count({ where: { isFeatured: true } }),
            this.placeRepo.count({ where: { createdAt: (0, typeorm_2.Between)(weekAgo, new Date()) } }),
            this.bookingRepo.count(),
            this.bookingRepo.count({ where: { createdAt: (0, typeorm_2.Between)(today, new Date()) } }),
            this.getTotalRevenue(),
            this.reviewRepo.count(),
        ]);
        const stats = {
            users: {
                total: totalUsers,
                newToday: newUsersToday,
                activeToday: Math.floor(totalUsers * 0.15),
            },
            places: {
                total: totalPlaces,
                featured: featuredPlaces,
                newThisWeek: newPlacesWeek,
            },
            bookings: {
                total: totalBookings,
                today: todayBookings,
                revenue: totalRevenue,
            },
            engagement: {
                reviews: totalReviews,
                posts: Math.floor(totalUsers * 2.5),
                avgSession: 8.5,
            },
        };
        await this.redisService.setJson(cacheKey, stats, 300);
        return stats;
    }
    async getRevenueByPeriod(period) {
        const now = new Date();
        const data = [];
        let intervals;
        let intervalMs;
        switch (period) {
            case 'day':
                intervals = 24;
                intervalMs = 60 * 60 * 1000;
                break;
            case 'week':
                intervals = 7;
                intervalMs = 24 * 60 * 60 * 1000;
                break;
            case 'month':
                intervals = 30;
                intervalMs = 24 * 60 * 60 * 1000;
                break;
            case 'year':
                intervals = 12;
                intervalMs = 30 * 24 * 60 * 60 * 1000;
                break;
        }
        for (let i = intervals - 1; i >= 0; i--) {
            const end = new Date(now.getTime() - i * intervalMs);
            const start = new Date(end.getTime() - intervalMs);
            const result = await this.bookingRepo
                .createQueryBuilder('booking')
                .select([
                'SUM(booking.totalAmount) as revenue',
                'COUNT(*) as bookings',
                'SUM(booking.platformFee) as commission',
            ])
                .where('booking.createdAt BETWEEN :start AND :end', { start, end })
                .andWhere('booking.status IN (:...statuses)', {
                statuses: ['confirmed', 'paid', 'completed'],
            })
                .getRawOne();
            data.push({
                period: this.formatPeriodLabel(end, period),
                revenue: Number(result.revenue) || 0,
                bookings: Number(result.bookings) || 0,
                commission: Number(result.commission) || 0,
            });
        }
        return data;
    }
    async getTopPlaces(limit = 10) {
        const places = await this.placeRepo.find({
            order: { viewCount: 'DESC' },
            take: limit,
            select: ['id', 'name', 'viewCount', 'rating'],
        });
        return places.map((p) => ({
            id: p.id,
            name: p.name,
            views: p.viewCount,
            bookings: Math.floor(p.viewCount * 0.1),
            rating: p.rating,
        }));
    }
    async getUserRetention() {
        return {
            d1: 65,
            d7: 35,
            d30: 18,
        };
    }
    async trackEvent(eventType, userId, metadata) {
        try {
            await this.queuesService.addAnalyticsJob('track_event', {
                eventType,
                userId,
                metadata,
            });
        }
        catch (error) {
            this.logger.warn(`Failed to queue analytics event: ${error.message}`);
            await this.trackEventSync(eventType, userId, metadata);
        }
    }
    async trackEventSync(eventType, userId, metadata) {
        const event = {
            type: eventType,
            userId,
            metadata,
            timestamp: new Date().toISOString(),
        };
        await this.redisService.setJson(`event:${Date.now()}:${Math.random().toString(36).slice(2)}`, event, 86400);
        await this.redisService.increment(`events:${eventType}:today`);
        await this.redisService.increment(`events:total:today`);
        const tomorrow = new Date();
        tomorrow.setHours(24, 0, 0, 0);
        const ttlSeconds = Math.floor((tomorrow.getTime() - Date.now()) / 1000);
        await this.redisService.expire(`events:${eventType}:today`, ttlSeconds);
    }
    async getRealtimeStats() {
        const [onlineUsers, activeSessions, eventsLastMinute] = await Promise.all([
            this.redisService.get('stats:online_users').then((v) => Number(v) || 0),
            this.redisService.get('stats:active_sessions').then((v) => Number(v) || 0),
            this.redisService.get('events:total:minute').then((v) => Number(v) || 0),
        ]);
        return {
            onlineUsers,
            activeSessions,
            eventsLastMinute,
            topPages: [
                { page: '/explore', views: 1240 },
                { page: '/feed', views: 980 },
                { page: '/places', views: 760 },
                { page: '/bookings', views: 420 },
                { page: '/profile', views: 310 },
            ],
        };
    }
    async getTotalRevenue() {
        const result = await this.bookingRepo
            .createQueryBuilder('booking')
            .select('SUM(booking.totalAmount)', 'total')
            .where('booking.status IN (:...statuses)', {
            statuses: ['confirmed', 'paid', 'completed'],
        })
            .getRawOne();
        return Number(result.total) || 0;
    }
    formatPeriodLabel(date, period) {
        switch (period) {
            case 'day':
                return date.toLocaleTimeString('en-US', { hour: '2-digit', hour12: true });
            case 'week':
            case 'month':
                return date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
            case 'year':
                return date.toLocaleDateString('en-US', { month: 'short' });
            default:
                return date.toISOString();
        }
    }
};
exports.AnalyticsService = AnalyticsService;
exports.AnalyticsService = AnalyticsService = AnalyticsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(place_entity_1.Place)),
    __param(2, (0, typeorm_1.InjectRepository)(booking_entity_1.Booking)),
    __param(3, (0, typeorm_1.InjectRepository)(review_entity_1.Review)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        redis_service_1.RedisService,
        queues_service_1.QueuesService])
], AnalyticsService);
//# sourceMappingURL=analytics.service.js.map