import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Review } from './review.entity';
import { ReviewsService } from './reviews.service';
import { ReviewsController } from './reviews.controller';
import { PlacesModule } from '../places/places.module';
import { PlaceInquiry } from '../places/place-inquiry.entity';
import { Place } from '../places/place.entity';
import { UsersModule } from '../users/users.module';
import { BadgesModule } from '../badges/badges.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Review, PlaceInquiry, Place]),
        PlacesModule,
        UsersModule,
        BadgesModule,
    ],
    providers: [ReviewsService],
    controllers: [ReviewsController],
    exports: [ReviewsService],
})
export class ReviewsModule { }