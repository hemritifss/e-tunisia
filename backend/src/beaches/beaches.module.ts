import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Place } from '../places/place.entity';
import { User } from '../users/user.entity';
import { BeachReport } from './beach-report.entity';
import { BeachesService } from './beaches.service';
import { BeachesController } from './beaches.controller';
import { GamificationModule } from '../gamification/gamification.module';

/** "Famma 9nadel?" — community beach/jellyfish report (GROWTH §7). */
@Module({
    imports: [TypeOrmModule.forFeature([Place, User, BeachReport]), GamificationModule],
    controllers: [BeachesController],
    providers: [BeachesService],
    exports: [BeachesService],
})
export class BeachesModule {}
