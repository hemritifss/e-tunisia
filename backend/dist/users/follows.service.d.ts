import { DataSource, Repository } from 'typeorm';
import { User } from './user.entity';
import { Follow } from './follow.entity';
import { UsersService } from './users.service';
import { NotificationsService } from '../notifications/notifications.service';
export declare class FollowsService {
    private followsRepo;
    private usersRepo;
    private users;
    private notifications;
    private dataSource;
    constructor(followsRepo: Repository<Follow>, usersRepo: Repository<User>, users: UsersService, notifications: NotificationsService, dataSource: DataSource);
    follow(followerId: string, followedHandle: string): Promise<{
        following: boolean;
        followersCount: number;
    }>;
    unfollow(followerId: string, followedHandle: string): Promise<{
        following: boolean;
        followersCount: number;
    }>;
    isFollowing(viewerId: string | null, handle: string): Promise<boolean>;
    listFollowers(handle: string, limit?: number): Promise<{
        id: any;
        handle: any;
        fullName: any;
        avatar: any;
        country: any;
    }[]>;
    listFollowing(handle: string, limit?: number): Promise<{
        id: any;
        handle: any;
        fullName: any;
        avatar: any;
        country: any;
    }[]>;
}
