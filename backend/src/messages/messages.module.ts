import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';
import { Message } from './message.entity';
import { ChatRoom } from './chat-room.entity';
import { WebSocketModule } from '../websocket/websocket.module';
import { SafetyModule } from '../safety/safety.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Message, ChatRoom]),
    forwardRef(() => WebSocketModule),
    // Blocks must be enforced at the DM boundary, not just hidden in the UI.
    SafetyModule,
  ],
  controllers: [MessagesController],
  providers: [MessagesService],
  exports: [MessagesService],
})
export class MessagesModule {}
