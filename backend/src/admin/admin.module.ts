import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { Place } from '../places/place.entity';
import { Review } from '../reviews/review.entity';
import { Subscription } from '../subscriptions/subscription.entity';
import { Event } from '../events/event.entity';
import { Tip } from '../tips/tip.entity';
import { AuditLog } from './audit-log.entity';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { AuditInterceptor } from './audit.interceptor';
import { SuperAdminGuard } from './super-admin.guard';

@Module({
    imports: [
        TypeOrmModule.forFeature([User, Place, Review, Subscription, Event, Tip, AuditLog]),
    ],
    controllers: [AdminController],
    providers: [AdminService, AuditInterceptor, SuperAdminGuard],
})
export class AdminModule {}
