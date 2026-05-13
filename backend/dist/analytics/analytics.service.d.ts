import { Repository } from 'typeorm';
import { RedisService } from '../redis/redis.service';
import { User } from '../users/user.entity';
import { Place } from '../places/place.entity';
import { Booking } from '../bookings/booking.entity';
import { Review } from '../reviews/review.entity';
export declare class AnalyticsService {
    private userRepo;
    private placeRepo;
    private bookingRepo;
    private reviewRepo;
    private redisService;
    private readonly logger;
    constructor(userRepo: Repository<User>, placeRepo: Repository<Place>, bookingRepo: Repository<Booking>, reviewRepo: Repository<Review>, redisService: RedisService);
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
