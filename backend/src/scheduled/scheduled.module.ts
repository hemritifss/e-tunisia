import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserStreak } from '../challenges/streak.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { RedisModule } from '../redis/redis.module';
import { ScheduledTasksService } from './scheduled-tasks.service';

/**
 * Cron-like retention jobs (streak reminders, weekly digest hook). Self-contained;
 * relies on NotificationsService (which fans out to budgeted web push).
 */
@Module({
  imports: [TypeOrmModule.forFeature([UserStreak]), NotificationsModule, RedisModule],
  providers: [ScheduledTasksService],
  exports: [ScheduledTasksService],
})
export class ScheduledModule {}
