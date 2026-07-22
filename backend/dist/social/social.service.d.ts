import { Repository } from 'typeorm';
import { Follow } from './follow.entity';
import { Activity, ActivityType } from './activity.entity';
import { User } from '../users/user.entity';
import { RedisService } from '../redis/redis.service';
import { NotificationsService } from '../notifications/notifications.service';
import { SafetyService } from '../safety/safety.service';
export declare class SocialService {
    private followRepo;
    private activityRepo;
    private userRepo;
    private redisService;
    private notifications;
    private safety;
    constructor(followRepo: Repository<Follow>, activityRepo: Repository<Activity>, userRepo: Repository<User>, redisService: RedisService, notifications: NotificationsService, safety: SafetyService);
    follow(followerId: string, followingId: string): Promise<Follow>;
    unfollow(followerId: string, followingId: string): Promise<void>;
    getFollowers(userId: string): Promise<User[]>;
    getFollowing(userId: string): Promise<User[]>;
    isFollowing(followerId: string, followingId: string): Promise<boolean>;
    getFollowCounts(userId: string): Promise<{
        followers: number;
        following: number;
    }>;
    getProfileOverview(viewerId: string | null, targetId: string): Promise<{
        id: string;
        fullName: string;
        handle: string;
        avatar: string;
        bio: string;
        country: string;
        plan: import("../users/user.entity").UserPlan;
        role: import("../users/user.entity").UserRole;
        points: number;
        badgeCount: number;
        placesVisited: number;
        founderNumber: number;
        createdAt: Date;
        followers: number;
        following: number;
        isSelf: boolean;
        isFollowing: boolean;
        followsYou: boolean;
        mutuals: {
            count: number;
            sample: any[];
        };
        isBlockedByMe: boolean;
        hasBlockedMe: boolean;
    }>;
    private getMutuals;
    createActivity(userId: string, type: ActivityType, data: any): Promise<Activity>;
    getActivityFeed(userId: string, page?: number, limit?: number): Promise<{
        data: Activity[];
        hasMore: boolean;
    }>;
    getUserActivity(userId: string, page?: number, limit?: number): Promise<Activity[]>;
    findTravelBuddies(userId: string, preferences: {
        dates?: string;
        interests?: string[];
        location?: string;
    }): Promise<any[]>;
}
