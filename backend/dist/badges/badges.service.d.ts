import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { BadgeEvent } from './badge-definitions';
export declare class BadgesService {
    private usersRepo;
    constructor(usersRepo: Repository<User>);
    awardIfEligible(userId: string, event: BadgeEvent, payload?: any): Promise<string[]>;
}
