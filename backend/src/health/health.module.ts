import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { QueuesModule } from '../queues/queues.module';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [TerminusModule, QueuesModule, RedisModule],
  controllers: [HealthController],
})
export class HealthModule {}
