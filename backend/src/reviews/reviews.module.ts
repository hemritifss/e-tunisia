import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Review } from './review.entity';
import { ReviewsService } from './reviews.service';
import { ReviewsController } from './reviews.controller';
import { PlacesModule } from '../places/places.module';

@Module({
    imports: [TypeOrmModule.forFeature([Review]), PlacesModule],
    providers: [ReviewsService],
    controllers: [ReviewsController],
})
export class ReviewsModule { }