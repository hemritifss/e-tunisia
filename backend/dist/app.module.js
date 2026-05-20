"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const config_1 = require("@nestjs/config");
const throttler_1 = require("@nestjs/throttler");
const cache_manager_1 = require("@nestjs/cache-manager");
const auth_module_1 = require("./auth/auth.module");
const users_module_1 = require("./users/users.module");
const badges_module_1 = require("./badges/badges.module");
const og_module_1 = require("./og/og.module");
const places_module_1 = require("./places/places.module");
const categories_module_1 = require("./categories/categories.module");
const reviews_module_1 = require("./reviews/reviews.module");
const media_module_1 = require("./media/media.module");
const subscriptions_module_1 = require("./subscriptions/subscriptions.module");
const tips_module_1 = require("./tips/tips.module");
const posts_module_1 = require("./posts/posts.module");
const feed_module_1 = require("./feed/feed.module");
const stories_module_1 = require("./stories/stories.module");
const credits_module_1 = require("./credits/credits.module");
const safety_module_1 = require("./safety/safety.module");
const events_module_1 = require("./events/events.module");
const itineraries_module_1 = require("./itineraries/itineraries.module");
const collections_module_1 = require("./collections/collections.module");
const admin_module_1 = require("./admin/admin.module");
const sponsors_module_1 = require("./sponsors/sponsors.module");
const ads_module_1 = require("./ads/ads.module");
const gamification_module_1 = require("./gamification/gamification.module");
const notifications_module_1 = require("./notifications/notifications.module");
const contact_module_1 = require("./contact/contact.module");
const redis_module_1 = require("./redis/redis.module");
const storage_module_1 = require("./storage/storage.module");
const health_module_1 = require("./health/health.module");
const bookings_module_1 = require("./bookings/bookings.module");
const inventory_module_1 = require("./inventory/inventory.module");
const payments_module_1 = require("./payments/payments.module");
const ai_module_1 = require("./ai/ai.module");
const challenges_module_1 = require("./challenges/challenges.module");
const websocket_module_1 = require("./websocket/websocket.module");
const social_module_1 = require("./social/social.module");
const messages_module_1 = require("./messages/messages.module");
const marketplace_module_1 = require("./marketplace/marketplace.module");
const queues_module_1 = require("./queues/queues.module");
const analytics_module_1 = require("./analytics/analytics.module");
const database_config_1 = require("./database/database.config");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: ['.env', '.env.local'],
            }),
            throttler_1.ThrottlerModule.forRoot({
                throttlers: [
                    {
                        ttl: 60000,
                        limit: 100,
                    },
                ],
            }),
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (configService) => (0, database_config_1.getDatabaseConfig)(configService),
            }),
            cache_manager_1.CacheModule.register({ isGlobal: true, ttl: 300_000 }),
            redis_module_1.RedisModule,
            storage_module_1.StorageModule,
            health_module_1.HealthModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            badges_module_1.BadgesModule,
            og_module_1.OgModule,
            places_module_1.PlacesModule,
            categories_module_1.CategoriesModule,
            reviews_module_1.ReviewsModule,
            media_module_1.MediaModule,
            subscriptions_module_1.SubscriptionsModule,
            tips_module_1.TipsModule,
            posts_module_1.PostsModule,
            feed_module_1.FeedModule,
            stories_module_1.StoriesModule,
            credits_module_1.CreditsModule,
            safety_module_1.SafetyModule,
            events_module_1.EventsModule,
            itineraries_module_1.ItinerariesModule,
            collections_module_1.CollectionsModule,
            admin_module_1.AdminModule,
            sponsors_module_1.SponsorsModule,
            ads_module_1.AdsModule,
            gamification_module_1.GamificationModule,
            notifications_module_1.NotificationsModule,
            contact_module_1.ContactModule,
            bookings_module_1.BookingsModule,
            inventory_module_1.InventoryModule,
            payments_module_1.PaymentsModule,
            ai_module_1.AIModule,
            challenges_module_1.ChallengesModule,
            websocket_module_1.WebSocketModule,
            social_module_1.SocialModule,
            messages_module_1.MessagesModule,
            marketplace_module_1.MarketplaceModule,
            queues_module_1.QueuesModule,
            analytics_module_1.AnalyticsModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map