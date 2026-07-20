import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './notification.entity';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { WebSocketModule } from '../websocket/websocket.module';
import { QueuesModule } from '../queues/queues.module';
import { PushModule } from '../push/push.module';
import { SafetyModule } from '../safety/safety.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Notification]),
        forwardRef(() => WebSocketModule),
        QueuesModule,
        PushModule,
        // Notifications from blocked users are filtered out on read.
        SafetyModule,
    ],
    controllers: [NotificationsController],
    providers: [NotificationsService],
    exports: [NotificationsService],
})
export class NotificationsModule {}
