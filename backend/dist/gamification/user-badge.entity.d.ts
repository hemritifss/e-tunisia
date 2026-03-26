import { User } from '../users/user.entity';
import { Badge } from './badge.entity';
export declare class UserBadge {
    id: string;
    user: User;
    userId: string;
    badge: Badge;
    badgeId: string;
    earnedAt: Date;
}
