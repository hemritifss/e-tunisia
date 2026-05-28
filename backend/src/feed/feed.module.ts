import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PostsModule } from '../posts/posts.module';
import { ReviewsModule } from '../reviews/reviews.module';
import { AdsModule } from '../ads/ads.module';
import { PlacesModule } from '../places/places.module';
import { Follow } from '../social/follow.entity';
import { User } from '../users/user.entity';
import { PlaceVisit } from '../users/place-visit.entity';
import { SafetyModule } from '../safety/safety.module';
import { FeedController } from './feed.controller';
import { FeedService } from './feed.service';

@Module({
    imports: [
        PostsModule, ReviewsModule, AdsModule, PlacesModule, SafetyModule,
        TypeOrmModule.forFeature([Follow, User, PlaceVisit]),
        // Soft-auth: decode JWT if present so the public feed can filter blocked content for logged-in viewers.
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (cfg: ConfigService) => ({
                secret: cfg.get<string>('JWT_SECRET'),
            }),
        }),
    ],
    controllers: [FeedController],
    providers: [FeedService],
})
export class FeedModule {}
