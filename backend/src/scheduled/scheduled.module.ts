import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserStreak } from '../challenges/streak.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { RedisModule } from '../redis/redis.module';
import { DigestModule } from '../digest/digest.module';
import { ScheduledTasksService } from './scheduled-tasks.service';

/**
 * Cron-like retention jobs (streak reminders, weekly digest hook). Self-contained;
 * relies on NotificationsService (budgeted web push) and DigestModule (which
 * provides the WeeklyDigestRunner the scheduler fires on Thursdays).
 */
@Module({
  imports: [TypeOrmModule.forFeature([UserStreak]), NotificationsModule, RedisModule, DigestModule],
  providers: [ScheduledTasksService],
  exports: [ScheduledTasksService],
})
export class ScheduledModule {}
