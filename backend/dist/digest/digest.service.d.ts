import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { UserStreak } from '../challenges/streak.entity';
import { Place } from '../places/place.entity';
import { EmailService } from '../email/email.service';
import { PushService } from '../push/push.service';
import { WeeklyDigestRunner } from '../scheduled/weekly-digest-runner';
export declare class DigestService implements WeeklyDigestRunner {
    private readonly users;
    private readonly streaks;
    private readonly places;
    private readonly email;
    private readonly push;
    private readonly logger;
    constructor(users: Repository<User>, streaks: Repository<UserStreak>, places: Repository<Place>, email: EmailService, push: PushService);
    private appUrl;
    private buildData;
    private weeklyGem;
    private renderEmail;
    sendDigestTo(user: User, gem: Place | null): Promise<void>;
    sendTestDigest(userId: string): Promise<{
        sent: boolean;
    }>;
    runWeeklyDigest(): Promise<void>;
}
