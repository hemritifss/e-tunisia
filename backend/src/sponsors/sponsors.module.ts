import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Sponsor } from './sponsor.entity';
import { SponsorsService } from './sponsors.service';
import { SponsorsController } from './sponsors.controller';

@Module({
    imports: [TypeOrmModule.forFeature([Sponsor])],
    controllers: [SponsorsController],
    providers: [SponsorsService],
    exports: [SponsorsService],
})
export class SponsorsModule {}
