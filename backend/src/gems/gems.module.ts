import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Place } from '../places/place.entity';
import { Category } from '../categories/category.entity';
import { User } from '../users/user.entity';
import { PlaceConfirmation } from './place-confirmation.entity';
import { GemsService } from './gems.service';
import { GemsController } from './gems.controller';
import { AIModule } from '../ai/ai.module';
import { GamificationModule } from '../gamification/gamification.module';
import { BadgesModule } from '../badges/badges.module';

/**
 * Community gem submission + confirmation + the city completeness game.
 * Lives OUTSIDE PlacesModule on purpose: it needs LlmService, and AIModule
 * already imports PlacesModule — importing AIModule from PlacesModule would
 * create a module cycle. This module sits above both (a clean DAG).
 */
@Module({
    imports: [
        TypeOrmModule.forFeature([Place, Category, User, PlaceConfirmation]),
        AIModule,
        GamificationModule,
        BadgesModule,
    ],
    controllers: [GemsController],
    providers: [GemsService],
    exports: [GemsService],
})
export class GemsModule {}
