import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Itinerary } from './itinerary.entity';
import { ItinerariesService } from './itineraries.service';
import { ItinerariesController } from './itineraries.controller';

@Module({
    imports: [TypeOrmModule.forFeature([Itinerary])],
    controllers: [ItinerariesController],
    providers: [ItinerariesService],
    exports: [ItinerariesService],
})
export class ItinerariesModule {}
