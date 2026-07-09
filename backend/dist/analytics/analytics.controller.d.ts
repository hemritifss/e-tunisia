import { AnalyticsService, IncomingEvent } from './analytics.service';
export declare class AnalyticsController {
    private readonly analyticsService;
    constructor(analyticsService: AnalyticsService);
    getDashboard(): Promise<{
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
    getRevenue(period?: 'day' | 'week' | 'month' | 'year'): Promise<{
        period: string;
        revenue: number;
        bookings: number;
        commission: number;
    }[]>;
    getTopPlaces(limit?: number): Promise<{
        id: string;
        name: string;
        views: number;
        bookings: number;
        rating: number;
    }[]>;
    getRetention(): Promise<{
        d1: number;
        d7: number;
        d30: number;
    }>;
    getRealtime(): Promise<{
        onlineUsers: number;
        activeSessions: number;
        eventsLastMinute: number;
        topPages: Array<{
            page: string;
            views: number;
        }>;
    }>;
    trackEvent(type: string, userId?: string): Promise<{
        tracked: boolean;
    }>;
    ingestEvents(body: {
        events?: IncomingEvent[];
    } | IncomingEvent[], user?: {
        id?: string;
    }): Promise<{
        accepted: number;
    }>;
    eventsSummary(days?: string): Promise<{
        day: any;
        name: any;
        count: number;
        uniques: number;
    }[]>;
    growth(): Promise<any>;
}
