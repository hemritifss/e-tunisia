import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { Post } from '../posts/post.entity';
import { BadgeEvent } from './badge-definitions';
export declare class BadgesService {
    private usersRepo;
    private postsRepo;
    private readonly logger;
    constructor(usersRepo: Repository<User>, postsRepo: Repository<Post>);
    awardIfEligible(userId: string, event: BadgeEvent, payload?: any): Promise<string[]>;
    private publishAchievementPost;
}
