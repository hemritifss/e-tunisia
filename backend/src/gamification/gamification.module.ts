import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Badge } from './badge.entity';
import { UserBadge } from './user-badge.entity';
import { User } from '../users/user.entity';
import { GamificationService } from './gamification.service';
import { GamificationController } from './gamification.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
    imports: [TypeOrmModule.forFeature([Badge, UserBadge, User]), NotificationsModule],
    controllers: [GamificationController],
    providers: [GamificationService],
    exports: [GamificationService],
})
export class GamificationModule {}
