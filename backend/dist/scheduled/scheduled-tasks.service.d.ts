import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Repository } from 'typeorm';
import { UserStreak } from '../challenges/streak.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { RedisService } from '../redis/redis.service';
export declare class ScheduledTasksService implements OnModuleInit, OnModuleDestroy {
    private readonly streaks;
    private readonly notifications;
    private readonly redis;
    private readonly weekly?;
    private readonly logger;
    private timer?;
    constructor(streaks: Repository<UserStreak>, notifications: NotificationsService, redis: RedisService, weekly?: WeeklyDigestRunner);
    onModuleInit(): void;
    onModuleDestroy(): void;
    private dayKey;
    private weekKey;
    private tick;
    private runOnce;
    runStreakReminders(): Promise<void>;
}
export declare abstract class WeeklyDigestRunner {
    abstract runWeeklyDigest(): Promise<void>;
}
