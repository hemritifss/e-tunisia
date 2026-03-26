import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tip } from './tip.entity';
import { TipsService } from './tips.service';
import { TipsController } from './tips.controller';

@Module({
    imports: [TypeOrmModule.forFeature([Tip])],
    controllers: [TipsController],
    providers: [TipsService],
    exports: [TipsService],
})
export class TipsModule {}
