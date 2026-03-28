import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { Place } from '../places/place.entity';
import { Review } from '../reviews/review.entity';
import { Subscription } from '../subscriptions/subscription.entity';
import { Event } from '../events/event.entity';
import { Tip } from '../tips/tip.entity';
export declare class AdminService {
    private usersRepo;
    private placesRepo;
    private reviewsRepo;
    private subsRepo;
    private eventsRepo;
    private tipsRepo;
    constructor(usersRepo: Repository<User>, placesRepo: Repository<Place>, reviewsRepo: Repository<Review>, subsRepo: Repository<Subscription>, eventsRepo: Repository<Event>, tipsRepo: Repository<Tip>);
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
    getUsers(page?: number, limit?: number): Promise<{
        data: User[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    updateUser(id: string, updates: Partial<User>): Promise<User>;
    banUser(id: string): Promise<{
        message: string;
    }>;
    unbanUser(id: string): Promise<{
        message: string;
    }>;
    getPlaces(page?: number, limit?: number, pendingOnly?: boolean): Promise<{
        data: Place[];
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
    getSubscriptions(): Promise<Subscription[]>;
    getEvents(): Promise<Event[]>;
    toggleEventActive(id: string): Promise<Event>;
    getTips(): Promise<Tip[]>;
    toggleTipApproval(id: string): Promise<Tip>;
}
