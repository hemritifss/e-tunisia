import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OgService } from './og.service';
import { OgController } from './og.controller';
import { User } from '../users/user.entity';
import { Place } from '../places/place.entity';
import { Post } from '../posts/post.entity';
import { TripPlan } from '../itineraries/trip-plan.entity';

@Module({
    imports: [TypeOrmModule.forFeature([User, Place, Post, TripPlan])],
    controllers: [OgController],
    providers: [OgService],
    exports: [OgService],
})
export class OgModule {}
