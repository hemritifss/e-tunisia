import { Repository } from 'typeorm';
import { Endorsement } from './endorsement.entity';
import { User } from './user.entity';
import { UsersService } from './users.service';
import { NotificationsService } from '../notifications/notifications.service';
export interface EndorsementSummaryRow {
    topic: string;
    count: number;
}
export interface EndorsementGroup extends EndorsementSummaryRow {
    recent: Array<{
        id: string;
        handle: string | null;
        fullName: string;
        avatar: string | null;
    }>;
}
export declare class EndorsementsService {
    private endorsementsRepo;
    private usersRepo;
    private users;
    private notifications;
    constructor(endorsementsRepo: Repository<Endorsement>, usersRepo: Repository<User>, users: UsersService, notifications: NotificationsService);
    endorse(endorserId: string, endorsedHandle: string, topic: string): Promise<{
        endorsed: boolean;
        count: number;
    }>;
    unendorse(endorserId: string, endorsedHandle: string, topic: string): Promise<{
        endorsed: boolean;
        count: number;
    }>;
    topForUser(userId: string, limit?: number): Promise<EndorsementSummaryRow[]>;
    listForHandle(handle: string): Promise<EndorsementGroup[]>;
    myEndorsementsFor(viewerId: string | null, handle: string): Promise<string[]>;
}
