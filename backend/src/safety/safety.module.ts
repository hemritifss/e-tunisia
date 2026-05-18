import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Block } from './block.entity';
import { Report } from './report.entity';
import { User } from '../users/user.entity';
import { SafetyController } from './safety.controller';
import { SafetyService } from './safety.service';

@Module({
    imports: [TypeOrmModule.forFeature([Block, Report, User])],
    controllers: [SafetyController],
    providers: [SafetyService],
    exports: [SafetyService],
})
export class SafetyModule {}
