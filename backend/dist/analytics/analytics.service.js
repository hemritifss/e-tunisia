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
const post_entity_1 = require("../posts/post.entity");
const queues_service_1 = require("../queues/queues.service");
const analytics_event_entity_1 = require("./analytics-event.entity");
const EVENT_NAME_RE = /^[a-z0-9_.:-]{1,64}$/i;
const MAX_EVENT_BATCH = 20;
const MAX_PROPS_JSON = 2048;
let AnalyticsService = AnalyticsService_1 = class AnalyticsService {
    constructor(userRepo, placeRepo, bookingRepo, reviewRepo, eventsRepo, postRepo, redisService, queuesService) {
        this.userRepo = userRepo;
        this.placeRepo = placeRepo;
        this.bookingRepo = bookingRepo;
        this.reviewRepo = reviewRepo;
        this.eventsRepo = eventsRepo;
        this.postRepo = postRepo;
        this.redisService = redisService;
        this.queuesService = queuesService;
        this.logger = new common_1.Logger(AnalyticsService_1.name);
    }
    async ingestEvents(batch, userId) {
        const rows = (Array.isArray(batch) ? batch : [])
            .slice(0, MAX_EVENT_BATCH)
            .filter((e) => e && typeof e.name === 'string' && EVENT_NAME_RE.test(e.name))
            .map((e) => {
            let props = null;
            if (e.props && typeof e.props === 'object') {
                try {
                    if (JSON.stringify(e.props).length <= MAX_PROPS_JSON)
                        props = e.props;
                }
                catch { }
            }
            return this.eventsRepo.create({
                name: e.name.toLowerCase(),
                userId,
                anonId: typeof e.anonId === 'string' ? e.anonId.slice(0, 64) : null,
                props,
            });
        });
        if (!rows.length)
            return 0;
        await this.eventsRepo.insert(rows);
        for (const r of rows)
            void this.trackEvent(r.name, r.userId || undefined);
        return rows.length;
    }
    async eventsSummary(days = 30) {
        const rows = await this.eventsRepo
            .createQueryBuilder('e')
            .select("date_trunc('day', e.createdAt)", 'day')
            .addSelect('e.name', 'name')
            .addSelect('COUNT(*)', 'count')
            .addSelect('COUNT(DISTINCT COALESCE(e.userId, e.anonId))', 'uniques')
            .where("e.createdAt > now() - make_interval(days => :days)", { days: Math.min(365, Math.max(1, days)) })
            .groupBy('day')
            .addGroupBy('e.name')
            .orderBy('day', 'DESC')
            .getRawMany();
        return rows.map((r) => ({
            day: r.day,
            name: r.name,
            count: Number(r.count),
            uniques: Number(r.uniques),
        }));
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
        const [totalUsers, newUsersToday, totalPlaces, featuredPlaces, newPlacesWeek, totalBookings, todayBookings, totalRevenue, totalReviews, totalPosts, activeToday,] = await Promise.all([
            this.userRepo.count(),
            this.userRepo.count({ where: { createdAt: (0, typeorm_2.Between)(today, new Date()) } }),
            this.placeRepo.count(),
            this.placeRepo.count({ where: { isFeatured: true } }),
            this.placeRepo.count({ where: { createdAt: (0, typeorm_2.Between)(weekAgo, new Date()) } }),
            this.bookingRepo.count(),
            this.bookingRepo.count({ where: { createdAt: (0, typeorm_2.Between)(today, new Date()) } }),
            this.getTotalRevenue(),
            this.reviewRepo.count(),
            this.postRepo.count(),
            this.eventsRepo
                .query(`SELECT count(DISTINCT COALESCE("userId"::text, "anonId"))::int AS n FROM analytics_events WHERE "createdAt" > now() - interval '1 day'`)
                .then((r) => r?.[0]?.n || 0),
        ]);
        const stats = {
            users: {
                total: totalUsers,
                newToday: newUsersToday,
                activeToday,
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
                posts: totalPosts,
                avgSession: 0,
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
        const [d1, d7, d30] = await Promise.all([
            this.retentionForHorizon(1),
            this.retentionForHorizon(7),
            this.retentionForHorizon(30),
        ]);
        return { d1, d7, d30 };
    }
    async retentionForHorizon(n) {
        const rows = await this.eventsRepo.query(`WITH cohort AS (
         SELECT id, date_trunc('day', "createdAt") AS signup_day
         FROM users
         WHERE "createdAt" <= now() - make_interval(days => $1)
           AND "createdAt" >= now() - make_interval(days => $1 + 60)
       )
       SELECT
         count(*)::int AS cohort,
         count(*) FILTER (WHERE EXISTS (
           SELECT 1 FROM analytics_events e
           WHERE e."userId" = c.id
             AND date_trunc('day', e."createdAt") = c.signup_day + make_interval(days => $1)
         ))::int AS retained
       FROM cohort c`, [n]);
        const r = rows?.[0] || { cohort: 0, retained: 0 };
        return r.cohort > 0 ? Math.round((r.retained / r.cohort) * 100) : 0;
    }
    async getGrowthOverview() {
        const distinctActors = (days) => this.eventsRepo
            .query(`SELECT count(DISTINCT COALESCE("userId"::text, "anonId"))::int AS n
             FROM analytics_events
            WHERE "createdAt" > now() - make_interval(days => $1)`, [days])
            .then((r) => r?.[0]?.n || 0);
        const [dau, wau, mau, totalUsers, newToday, newWeek, posts, reviews, places, postedRows, signupSeries, retention,] = await Promise.all([
            distinctActors(1),
            distinctActors(7),
            distinctActors(30),
            this.userRepo.count(),
            this.userRepo.query(`SELECT count(*)::int AS n FROM users WHERE "createdAt" > now() - interval '1 day'`).then((r) => r?.[0]?.n || 0),
            this.userRepo.query(`SELECT count(*)::int AS n FROM users WHERE "createdAt" > now() - interval '7 days'`).then((r) => r?.[0]?.n || 0),
            this.postRepo.count(),
            this.reviewRepo.count(),
            this.placeRepo.count(),
            this.postRepo.query(`SELECT count(DISTINCT "authorId")::int AS n FROM posts`).then((r) => r?.[0]?.n || 0),
            this.userRepo.query(`SELECT to_char(date_trunc('day', "createdAt"), 'YYYY-MM-DD') AS day, count(*)::int AS count
           FROM users WHERE "createdAt" > now() - interval '14 days'
          GROUP BY 1 ORDER BY 1`),
            this.getUserRetention(),
        ]);
        const posted = postedRows || 0;
        return {
            activeUsers: { dau, wau, mau },
            signups: { total: totalUsers, today: newToday, thisWeek: newWeek, series: signupSeries },
            content: { posts, reviews, places },
            funnel: {
                signups: totalUsers,
                posted,
                conversionPct: totalUsers > 0 ? Math.round((posted / totalUsers) * 1000) / 10 : 0,
            },
            retention,
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
    __param(4, (0, typeorm_1.InjectRepository)(analytics_event_entity_1.AnalyticsEvent)),
    __param(5, (0, typeorm_1.InjectRepository)(post_entity_1.Post)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        redis_service_1.RedisService,
        queues_service_1.QueuesService])
], AnalyticsService);
//# sourceMappingURL=analytics.service.js.map