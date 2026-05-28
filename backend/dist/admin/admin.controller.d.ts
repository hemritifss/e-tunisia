import { AdminService } from './admin.service';
export declare class AdminController {
    private adminService;
    constructor(adminService: AdminService);
    getStats(): Promise<{
        totalUsers: number;
        totalPlaces: number;
        totalReviews: number;
        totalEvents: number;
        totalTips: number;
        pendingPlaces: number;
        premiumUsers: number;
        totalRevenue: number;
        activeSubscriptions: number;
    }>;
    me(req: any): {
        id: any;
        role: any;
        isSuperAdmin: boolean;
    };
    getAudit(page?: number, limit?: number): Promise<{
        data: import("./audit-log.entity").AuditLog[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    getUsers(page?: number, limit?: number): Promise<{
        data: import("../users/user.entity").User[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    updateUser(id: string, body: any): Promise<import("../users/user.entity").User>;
    setUserRole(id: string, body: {
        role: string;
    }): Promise<import("../users/user.entity").User>;
    banUser(id: string): Promise<{
        message: string;
    }>;
    unbanUser(id: string): Promise<{
        message: string;
    }>;
    getPlaces(page?: number, limit?: number, pendingOnly?: string): Promise<{
        data: import("../places/place.entity").Place[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    approvePlace(id: string): Promise<{
        message: string;
    }>;
    toggleFeature(id: string): Promise<{
        message: string;
    }>;
    deletePlace(id: string): Promise<{
        message: string;
    }>;
    getReviews(page?: number, limit?: number): Promise<{
        data: import("../reviews/review.entity").Review[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    deleteReview(id: string): Promise<{
        message: string;
    }>;
    getSubscriptions(): Promise<import("../subscriptions/subscription.entity").Subscription[]>;
    confirmSubscription(id: string): Promise<{
        message: string;
        plan: string;
    }>;
    rejectSubscription(id: string): Promise<{
        message: string;
    }>;
    getAnalytics(): Promise<{
        mrr: number;
        arr: number;
        activeSubscriptions: number;
        pendingSubscriptions: number;
        byPlan: Record<string, {
            count: number;
            revenue: number;
        }>;
        totalUsers: number;
        paidUsers: number;
        conversionRate: number;
    }>;
    getEvents(): Promise<import("../events/event.entity").Event[]>;
    toggleEvent(id: string): Promise<import("../events/event.entity").Event>;
    getTips(): Promise<import("../tips/tip.entity").Tip[]>;
    toggleTip(id: string): Promise<import("../tips/tip.entity").Tip>;
}
