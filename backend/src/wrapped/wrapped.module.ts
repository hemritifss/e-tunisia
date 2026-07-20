import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WrappedService } from './wrapped.service';
import { WrappedController } from './wrapped.controller';
import { User } from '../users/user.entity';
import { Place } from '../places/place.entity';
import { Review } from '../reviews/review.entity';
import { PlaceVisit } from '../users/place-visit.entity';
import { BeachReport } from '../beaches/beach-report.entity';

@Module({
    imports: [TypeOrmModule.forFeature([User, Place, Review, PlaceVisit, BeachReport])],
    controllers: [WrappedController],
    providers: [WrappedService],
    exports: [WrappedService],
})
export class WrappedModule {}
