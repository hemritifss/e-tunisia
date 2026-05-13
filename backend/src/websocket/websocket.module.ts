import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { EventsGateway } from './websocket.gateway';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [JwtModule, RedisModule],
  providers: [EventsGateway],
  exports: [EventsGateway],
})
export class WebSocketModule {}
