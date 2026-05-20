import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { Follow } from './follow.entity';
import { Review } from '../reviews/review.entity';
import { Place } from '../places/place.entity';
import { TripPlan } from '../itineraries/trip-plan.entity';
import { SavedPost } from '../posts/saved-post.entity';
import { UsersService } from './users.service';
import { FollowsService } from './follows.service';
import { UsersController } from './users.controller';
import { BadgesModule } from '../badges/badges.module';
import { OgModule } from '../og/og.module';

@Module({
  imports: [TypeOrmModule.forFeature([User, Follow, Review, Place, TripPlan, SavedPost]), BadgesModule, OgModule],
  providers: [UsersService, FollowsService],
  controllers: [UsersController],
  exports: [UsersService, FollowsService],
})
export class UsersModule {}