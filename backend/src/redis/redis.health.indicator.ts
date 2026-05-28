import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';
import { RedisService } from './redis.service';

@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  constructor(private redisService: RedisService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      await this.redisService.client.ping();
      return this.getStatus(key, true);
    } catch (error: any) {
      return this.getStatus(key, false, { message: error.message });
    }
  }
}
