import { Repository } from 'typeorm';
import { RedisService } from '../redis/redis.service';
import { User } from '../users/user.entity';
import { Place } from '../places/place.entity';
import { Booking } from '../bookings/booking.entity';
import { Review } from '../reviews/review.entity';
import { QueuesService } from '../queues/queues.service';
import { AnalyticsEvent } from './analytics-event.entity';
export interface IncomingEvent {
    name: string;
    props?: Record<string, unknown>;
    anonId?: string;
}
export declare class AnalyticsService {
    private userRepo;
    private placeRepo;
    private bookingRepo;
    private reviewRepo;
    private eventsRepo;
    private redisService;
    private queuesService;
    private readonly logger;
    constructor(userRepo: Repository<User>, placeRepo: Repository<Place>, bookingRepo: Repository<Booking>, reviewRepo: Repository<Review>, eventsRepo: Repository<AnalyticsEvent>, redisService: RedisService, queuesService: QueuesService);
    ingestEvents(batch: IncomingEvent[], userId: string | null): Promise<number>;
    eventsSummary(days?: number): Promise<{
        day: any;
        name: any;
        count: number;
        uniques: number;
    }[]>;
    getDashboardStats(): Promise<{
        users: {
            total: number;
            newToday: number;
            activeToday: number;
        };
        places: {
            total: number;
            featured: number;
            newThisWeek: number;
        };
        bookings: {
            total: number;
            today: number;
            revenue: number;
        };
        engagement: {
            reviews: number;
            posts: number;
            avgSession: number;
        };
    }>;
    getRevenueByPeriod(period: 'day' | 'week' | 'month' | 'year'): Promise<Array<{
        period: string;
        revenue: number;
        bookings: number;
        commission: number;
    }>>;
    getTopPlaces(limit?: number): Promise<Array<{
        id: string;
        name: string;
        views: number;
        bookings: number;
        rating: number;
    }>>;
    getUserRetention(): Promise<{
        d1: number;
        d7: number;
        d30: number;
    }>;
    trackEvent(eventType: string, userId?: string, metadata?: Record<string, unknown>): Promise<void>;
    private trackEventSync;
    getRealtimeStats(): Promise<{
        onlineUsers: number;
        activeSessions: number;
        eventsLastMinute: number;
        topPages: Array<{
            page: string;
            views: number;
        }>;
    }>;
    private getTotalRevenue;
    private formatPeriodLabel;
}
