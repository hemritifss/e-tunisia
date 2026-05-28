import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QueuesService } from './queues.service';
import { NotificationProcessor } from './processors/notification.processor';
import { EmailProcessor } from './processors/email.processor';
import { AnalyticsProcessor } from './processors/analytics.processor';
import { ImageProcessor } from './processors/image.processor';
import { BookingProcessor } from './processors/booking.processor';
import { PayoutProcessor } from './processors/payout.processor';
import { Notification } from '../notifications/notification.entity';
import { Booking } from '../bookings/booking.entity';
import { PushModule } from '../push/push.module';
import { EmailModule } from '../email/email.module';
import { RedisModule } from '../redis/redis.module';
import { StorageModule } from '../storage/storage.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get('REDIS_HOST') || 'localhost',
          port: configService.get('REDIS_PORT') || 6379,
          password: configService.get('REDIS_PASSWORD') || undefined,
        },
      }),
    }),
    BullModule.registerQueue(
      { name: 'emails' },
      { name: 'images' },
      { name: 'analytics' },
      { name: 'notifications' },
      { name: 'bookings' },
      { name: 'payouts' },
    ),
    TypeOrmModule.forFeature([Notification, Booking]),
    PushModule,
    EmailModule,
    RedisModule,
    StorageModule,
    UsersModule,
  ],
  providers: [
    QueuesService,
    NotificationProcessor,
    EmailProcessor,
    AnalyticsProcessor,
    ImageProcessor,
    BookingProcessor,
    PayoutProcessor,
  ],
  exports: [QueuesService, BullModule],
})
export class QueuesModule {}
