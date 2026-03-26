import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PlacesModule } from './places/places.module';
import { CategoriesModule } from './categories/categories.module';
import { ReviewsModule } from './reviews/reviews.module';
import { MediaModule } from './media/media.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { TipsModule } from './tips/tips.module';
import { EventsModule } from './events/events.module';
import { ItinerariesModule } from './itineraries/itineraries.module';
import { CollectionsModule } from './collections/collections.module';
import { AdminModule } from './admin/admin.module';
import { SponsorsModule } from './sponsors/sponsors.module';
import { AdsModule } from './ads/ads.module';
import { GamificationModule } from './gamification/gamification.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ContactModule } from './contact/contact.module';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        TypeOrmModule.forRoot({
            type: 'better-sqlite3',
            database: 'etunisia.db',
            entities: [__dirname + '/**/*.entity{.ts,.js}'],
            synchronize: true, // disable in production
            logging: false,
        }),
        AuthModule,
        UsersModule,
        PlacesModule,
        CategoriesModule,
        ReviewsModule,
        MediaModule,
        SubscriptionsModule,
        TipsModule,
        EventsModule,
        ItinerariesModule,
        CollectionsModule,
        AdminModule,
        SponsorsModule,
        AdsModule,
        GamificationModule,
        NotificationsModule,
        ContactModule,
    ],
})
export class AppModule { }