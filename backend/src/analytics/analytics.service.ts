import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { RedisService } from '../redis/redis.service';
import { User } from '../users/user.entity';
import { Place } from '../places/place.entity';
import { Booking } from '../bookings/booking.entity';
import { Review } from '../reviews/review.entity';
import { Post } from '../posts/post.entity';
import { QueuesService } from '../queues/queues.service';
import { AnalyticsEvent } from './analytics-event.entity';

interface TimeRange {
  start: Date;
  end: Date;
}

export interface IncomingEvent {
  name: string;
  props?: Record<string, unknown>;
  anonId?: string;
}

const EVENT_NAME_RE = /^[a-z0-9_.:-]{1,64}$/i;
const MAX_EVENT_BATCH = 20;
const MAX_PROPS_JSON = 2048;

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(Place)
    private placeRepo: Repository<Place>,
    @InjectRepository(Booking)
    private bookingRepo: Repository<Booking>,
    @InjectRepository(Review)
    private reviewRepo: Repository<Review>,
    @InjectRepository(AnalyticsEvent)
    private eventsRepo: Repository<AnalyticsEvent>,
    @InjectRepository(Post)
    private postRepo: Repository<Post>,
    private redisService: RedisService,
    private queuesService: QueuesService,
  ) {}

  /**
   * Durable event ingestion — the existing trackEvent() only feeds 24h Redis
   * counters, which can't answer retention/funnel questions. This writes the
   * permanent log. Malformed entries are silently dropped.
   */
  async ingestEvents(batch: IncomingEvent[], userId: string | null): Promise<number> {
    const rows = (Array.isArray(batch) ? batch : [])
      .slice(0, MAX_EVENT_BATCH)
      .filter((e) => e && typeof e.name === 'string' && EVENT_NAME_RE.test(e.name))
      .map((e) => {
        let props: Record<string, unknown> | null = null;
        if (e.props && typeof e.props === 'object') {
          try {
            if (JSON.stringify(e.props).length <= MAX_PROPS_JSON) props = e.props;
          } catch { /* circular/unserializable — drop props, keep event */ }
        }
        return this.eventsRepo.create({
          name: e.name.toLowerCase(),
          userId,
          anonId: typeof e.anonId === 'string' ? e.anonId.slice(0, 64) : null,
          props,
        });
      });
    if (!rows.length) return 0;
    await this.eventsRepo.insert(rows);
    // Keep the realtime Redis counters in sync too.
    for (const r of rows) void this.trackEvent(r.name, r.userId || undefined);
    return rows.length;
  }

  /** Daily count + unique actors per event name for the last N days. */
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

  async getDashboardStats(): Promise<{
    users: { total: number; newToday: number; activeToday: number };
    places: { total: number; featured: number; newThisWeek: number };
    bookings: { total: number; today: number; revenue: number };
    engagement: { reviews: number; posts: number; avgSession: number };
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const cacheKey = 'dashboard:stats';
    const cached = await this.redisService.getJson<any>(cacheKey);
    if (cached) return cached;

    const [
      totalUsers,
      newUsersToday,
      totalPlaces,
      featuredPlaces,
      newPlacesWeek,
      totalBookings,
      todayBookings,
      totalRevenue,
      totalReviews,
      totalPosts,
      activeToday,
    ] = await Promise.all([
      this.userRepo.count(),
      this.userRepo.count({ where: { createdAt: Between(today, new Date()) } }),
      this.placeRepo.count(),
      this.placeRepo.count({ where: { isFeatured: true } }),
      this.placeRepo.count({ where: { createdAt: Between(weekAgo, new Date()) } }),
      this.bookingRepo.count(),
      this.bookingRepo.count({ where: { createdAt: Between(today, new Date()) } }),
      this.getTotalRevenue(),
      this.reviewRepo.count(),
      this.postRepo.count(),
      // Real active-today = distinct actors in product events over the last 24h.
      this.eventsRepo
        .query(`SELECT count(DISTINCT COALESCE("userId"::text, "anonId"))::int AS n FROM analytics_events WHERE "createdAt" > now() - interval '1 day'`)
        .then((r: any) => r?.[0]?.n || 0),
    ]);

    const stats = {
      users: {
        total: totalUsers,
        newToday: newUsersToday,
        activeToday, // real: distinct actors in the last 24h
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
        posts: totalPosts, // real count
        avgSession: 0, // not tracked yet — never fabricate
      },
    };

    await this.redisService.setJson(cacheKey, stats, 300); // 5 min cache
    return stats;
  }

  async getRevenueByPeriod(period: 'day' | 'week' | 'month' | 'year'): Promise<
    Array<{
      period: string;
      revenue: number;
      bookings: number;
      commission: number;
    }>
  > {
    const now = new Date();
    const data: Array<{ period: string; revenue: number; bookings: number; commission: number }> = [];

    let intervals: number;
    let intervalMs: number;

    switch (period) {
      case 'day':
        intervals = 24;
        intervalMs = 60 * 60 * 1000; // 1 hour
        break;
      case 'week':
        intervals = 7;
        intervalMs = 24 * 60 * 60 * 1000; // 1 day
        break;
      case 'month':
        intervals = 30;
        intervalMs = 24 * 60 * 60 * 1000;
        break;
      case 'year':
        intervals = 12;
        intervalMs = 30 * 24 * 60 * 60 * 1000; // ~1 month
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

  async getTopPlaces(limit: number = 10): Promise<
    Array<{
      id: string;
      name: string;
      views: number;
      bookings: number;
      rating: number;
    }>
  > {
    const places = await this.placeRepo.find({
      order: { viewCount: 'DESC' },
      take: limit,
      select: ['id', 'name', 'viewCount', 'rating'],
    });

    return places.map((p) => ({
      id: p.id,
      name: p.name,
      views: p.viewCount,
      bookings: Math.floor(p.viewCount * 0.1), // Estimated
      rating: p.rating,
    }));
  }

  /**
   * REAL D1/D7/D30 retention (percentages), computed from signup day + product
   * events. For horizon N: of users who signed up ≥N and ≤N+60 days ago (a rolling
   * recent cohort with a fair chance to return), the share that produced any event
   * on the calendar day exactly N days after signup. Users who predate event
   * tracking simply read as not-retained — an honest floor, never a fabricated %.
   */
  async getUserRetention(): Promise<{ d1: number; d7: number; d30: number }> {
    const [d1, d7, d30] = await Promise.all([
      this.retentionForHorizon(1),
      this.retentionForHorizon(7),
      this.retentionForHorizon(30),
    ]);
    return { d1, d7, d30 };
  }

  private async retentionForHorizon(n: number): Promise<number> {
    const rows = await this.eventsRepo.query(
      `WITH cohort AS (
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
       FROM cohort c`,
      [n],
    );
    const r = rows?.[0] || { cohort: 0, retained: 0 };
    return r.cohort > 0 ? Math.round((r.retained / r.cohort) * 100) : 0;
  }

  /**
   * Real growth overview for the admin dashboard — every number derived from the
   * database, nothing estimated. DAU/WAU/MAU from product events, signups from
   * users, a signup→first-post funnel, and real content counts.
   */
  async getGrowthOverview(): Promise<any> {
    const distinctActors = (days: number) =>
      this.eventsRepo
        .query(
          `SELECT count(DISTINCT COALESCE("userId"::text, "anonId"))::int AS n
             FROM analytics_events
            WHERE "createdAt" > now() - make_interval(days => $1)`,
          [days],
        )
        .then((r: any) => r?.[0]?.n || 0);

    const [
      dau, wau, mau,
      totalUsers, newToday, newWeek,
      posts, reviews, places,
      postedRows, signupSeries, retention,
    ] = await Promise.all([
      distinctActors(1),
      distinctActors(7),
      distinctActors(30),
      this.userRepo.count(),
      this.userRepo.query(`SELECT count(*)::int AS n FROM users WHERE "createdAt" > now() - interval '1 day'`).then((r: any) => r?.[0]?.n || 0),
      this.userRepo.query(`SELECT count(*)::int AS n FROM users WHERE "createdAt" > now() - interval '7 days'`).then((r: any) => r?.[0]?.n || 0),
      this.postRepo.count(),
      this.reviewRepo.count(),
      this.placeRepo.count(),
      this.postRepo.query(`SELECT count(DISTINCT "authorId")::int AS n FROM posts`).then((r: any) => r?.[0]?.n || 0),
      this.userRepo.query(
        `SELECT to_char(date_trunc('day', "createdAt"), 'YYYY-MM-DD') AS day, count(*)::int AS count
           FROM users WHERE "createdAt" > now() - interval '14 days'
          GROUP BY 1 ORDER BY 1`,
      ),
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

  async trackEvent(
    eventType: string,
    userId?: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    // Queue the event tracking for background processing
    try {
      await this.queuesService.addAnalyticsJob('track_event', {
        eventType,
        userId,
        metadata,
      });
    } catch (error: any) {
      this.logger.warn(`Failed to queue analytics event: ${error.message}`);
      // Fallback: process synchronously if queue fails
      await this.trackEventSync(eventType, userId, metadata);
    }
  }

  private async trackEventSync(
    eventType: string,
    userId?: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    const event = {
      type: eventType,
      userId,
      metadata,
      timestamp: new Date().toISOString(),
    };

    // Store in Redis for real-time analytics
    await this.redisService.setJson(
      `event:${Date.now()}:${Math.random().toString(36).slice(2)}`,
      event,
      86400, // 24 hours
    );

    // Increment counters
    await this.redisService.increment(`events:${eventType}:today`);
    await this.redisService.increment(`events:total:today`);

    // Set expiry on counters
    const tomorrow = new Date();
    tomorrow.setHours(24, 0, 0, 0);
    const ttlSeconds = Math.floor((tomorrow.getTime() - Date.now()) / 1000);
    await this.redisService.expire(`events:${eventType}:today`, ttlSeconds);
  }

  async getRealtimeStats(): Promise<{
    onlineUsers: number;
    activeSessions: number;
    eventsLastMinute: number;
    topPages: Array<{ page: string; views: number }>;
  }> {
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

  private async getTotalRevenue(): Promise<number> {
    const result = await this.bookingRepo
      .createQueryBuilder('booking')
      .select('SUM(booking.totalAmount)', 'total')
      .where('booking.status IN (:...statuses)', {
        statuses: ['confirmed', 'paid', 'completed'],
      })
      .getRawOne();

    return Number(result.total) || 0;
  }

  private formatPeriodLabel(date: Date, period: string): string {
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
}
