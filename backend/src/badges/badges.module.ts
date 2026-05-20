import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { BadgesService } from './badges.service';

@Module({
    imports: [TypeOrmModule.forFeature([User])],
    providers: [BadgesService],
    exports: [BadgesService],
})
export class BadgesModule {}
