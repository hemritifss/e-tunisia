import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ad } from './ad.entity';
import { AdsService } from './ads.service';
import { AdsController } from './ads.controller';

@Module({
    imports: [TypeOrmModule.forFeature([Ad])],
    controllers: [AdsController],
    providers: [AdsService],
    exports: [AdsService],
})
export class AdsModule {}
