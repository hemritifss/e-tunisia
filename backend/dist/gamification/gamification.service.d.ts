import { Repository } from 'typeorm';
import { Badge } from './badge.entity';
import { UserBadge } from './user-badge.entity';
import { User } from '../users/user.entity';
import { NotificationsService } from '../notifications/notifications.service';
export declare class GamificationService {
    private badgesRepo;
    private userBadgesRepo;
    private usersRepo;
    private notifications;
    constructor(badgesRepo: Repository<Badge>, userBadgesRepo: Repository<UserBadge>, usersRepo: Repository<User>, notifications: NotificationsService);
    getAllBadges(): Promise<Badge[]>;
    getUserBadges(userId: string): Promise<UserBadge[]>;
    getUserPoints(userId: string): Promise<{
        points: number;
        level: number;
        nextLevelPoints: number;
    }>;
    addPoints(userId: string, points: number, reason: string): Promise<{
        points: number;
        added: number;
        reason: string;
    }>;
    getLeaderboard(limit?: number): Promise<User[]>;
    getUserRank(userId: string): Promise<{
        rank: number;
    }>;
    private calculateLevel;
    private nextLevelThreshold;
    private checkBadges;
    seed(): Promise<void>;
}
