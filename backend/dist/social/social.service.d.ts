import { Repository } from 'typeorm';
import { Follow } from './follow.entity';
import { Activity, ActivityType } from './activity.entity';
import { User } from '../users/user.entity';
import { RedisService } from '../redis/redis.service';
export declare class SocialService {
    private followRepo;
    private activityRepo;
    private userRepo;
    private redisService;
    constructor(followRepo: Repository<Follow>, activityRepo: Repository<Activity>, userRepo: Repository<User>, redisService: RedisService);
    follow(followerId: string, followingId: string): Promise<Follow>;
    unfollow(followerId: string, followingId: string): Promise<void>;
    getFollowers(userId: string): Promise<User[]>;
    getFollowing(userId: string): Promise<User[]>;
    isFollowing(followerId: string, followingId: string): Promise<boolean>;
    getFollowCounts(userId: string): Promise<{
        followers: number;
        following: number;
    }>;
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
