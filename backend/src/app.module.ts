import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { CustomThrottlerGuard } from './common/guards/throttler.guard';
import { CacheModule } from '@nestjs/cache-manager';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { BadgesModule } from './badges/badges.module';
import { BillingModule } from './billing/billing.module';
import { OgModule } from './og/og.module';
import { PlacesModule } from './places/places.module';
import { CategoriesModule } from './categories/categories.module';
import { ReviewsModule } from './reviews/reviews.module';
import { MediaModule } from './media/media.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { TipsModule } from './tips/tips.module';
import { PostsModule } from './posts/posts.module';
import { FeedModule } from './feed/feed.module';
import { StoriesModule } from './stories/stories.module';
import { CreditsModule } from './credits/credits.module';
import { SafetyModule } from './safety/safety.module';
import { EventsModule } from './events/events.module';
import { ItinerariesModule } from './itineraries/itineraries.module';
import { CollectionsModule } from './collections/collections.module';
import { AdminModule } from './admin/admin.module';
import { SponsorsModule } from './sponsors/sponsors.module';
import { AdsModule } from './ads/ads.module';
import { GamificationModule } from './gamification/gamification.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ContactModule } from './contact/contact.module';
import { PushModule } from './push/push.module';
import { SearchModule } from './search/search.module';
import { RedisModule } from './redis/redis.module';
import { StorageModule } from './storage/storage.module';
import { HealthModule } from './health/health.module';
import { BookingsModule } from './bookings/bookings.module';
import { InventoryModule } from './inventory/inventory.module';
import { PaymentsModule } from './payments/payments.module';
import { AIModule } from './ai/ai.module';
import { ChallengesModule } from './challenges/challenges.module';
import { WebSocketModule } from './websocket/websocket.module';
import { SocialModule } from './social/social.module';
import { MessagesModule } from './messages/messages.module';
import { MarketplaceModule } from './marketplace/marketplace.module';
import { QueuesModule } from './queues/queues.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { EmailModule } from './email/email.module';
import { I18nModule } from './i18n/i18n.module';
import { RoutingModule } from './routing/routing.module';
import { getDatabaseConfig } from './database/database.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60000,
          limit: 100,
        },
      ],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => getDatabaseConfig(configService),
    }),
    CacheModule.register({ isGlobal: true, ttl: 300_000 }),
    RedisModule,
    StorageModule,
    HealthModule,
    AuthModule,
    UsersModule,
    BadgesModule,
    OgModule,
    BillingModule,
    PlacesModule,
    CategoriesModule,
    ReviewsModule,
    MediaModule,
    SubscriptionsModule,
    TipsModule,
    PostsModule,
    FeedModule,
    StoriesModule,
    CreditsModule,
    SafetyModule,
    EventsModule,
    ItinerariesModule,
    CollectionsModule,
    AdminModule,
    SponsorsModule,
    AdsModule,
    GamificationModule,
    NotificationsModule,
    ContactModule,
    PushModule,
    SearchModule,
    BookingsModule,
    InventoryModule,
    PaymentsModule,
    AIModule,
    ChallengesModule,
    WebSocketModule,
    SocialModule,
    MessagesModule,
    MarketplaceModule,
    QueuesModule,
    AnalyticsModule,
    I18nModule,
    RoutingModule,
    EmailModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard,
    },
  ],
})
export class AppModule {}
