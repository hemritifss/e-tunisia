import { Module } from '@nestjs/common';
import { RedisModule } from '../redis/redis.module';
import { RoutingController } from './routing.controller';
import { RoutingService } from './routing.service';

@Module({
    imports: [RedisModule],
    controllers: [RoutingController],
    providers: [RoutingService],
})
export class RoutingModule {}
