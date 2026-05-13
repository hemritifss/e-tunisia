import { SocialService } from './social.service';
export declare class SocialController {
    private readonly socialService;
    constructor(socialService: SocialService);
    follow(followerId: string, followingId: string): Promise<import("./follow.entity").Follow>;
    unfollow(followerId: string, followingId: string): Promise<void>;
    getFollowers(userId: string): Promise<import("../users/user.entity").User[]>;
    getFollowing(userId: string): Promise<import("../users/user.entity").User[]>;
    getFollowCounts(userId: string): Promise<{
        followers: number;
        following: number;
    }>;
    isFollowing(followerId: string, followingId: string): Promise<boolean>;
    getFeed(userId: string, page?: number, limit?: number): Promise<{
        data: import("./activity.entity").Activity[];
        hasMore: boolean;
    }>;
    getUserActivity(userId: string, page?: number, limit?: number): Promise<import("./activity.entity").Activity[]>;
    findTravelBuddies(userId: string, preferences: any): Promise<any[]>;
}
