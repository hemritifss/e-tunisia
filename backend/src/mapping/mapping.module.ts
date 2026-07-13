import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MappingService } from './mapping.service';
import { MappingController } from './mapping.controller';
import { MappingEvent } from './mapping-event.entity';
import { Place } from '../places/place.entity';
import { User } from '../users/user.entity';
import { PlaceConfirmation } from '../gems/place-confirmation.entity';
import { PlaceVisit } from '../users/place-visit.entity';
import { Review } from '../reviews/review.entity';
import { BeachReport } from '../beaches/beach-report.entity';

@Module({
    imports: [TypeOrmModule.forFeature([MappingEvent, Place, User, PlaceConfirmation, PlaceVisit, Review, BeachReport])],
    controllers: [MappingController],
    providers: [MappingService],
    exports: [MappingService],
})
export class MappingModule {}
