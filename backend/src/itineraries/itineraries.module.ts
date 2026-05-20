import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Itinerary } from './itinerary.entity';
import { TripPlan } from './trip-plan.entity';
import { ItinerariesService } from './itineraries.service';
import { ItinerariesController } from './itineraries.controller';
import { TripsService } from './trips.service';
import { TripsController } from './trips.controller';
import { Place } from '../places/place.entity';
import { TourPackage } from '../places/tour-package.entity';
import { PlacesModule } from '../places/places.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Itinerary, TripPlan, Place, TourPackage]),
        // Pulls in InquiriesService so a trip can fan-out one inquiry per stop.
        PlacesModule,
    ],
    controllers: [ItinerariesController, TripsController],
    providers: [ItinerariesService, TripsService],
    exports: [ItinerariesService, TripsService],
})
export class ItinerariesModule {}
