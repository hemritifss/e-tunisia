import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { RedisService } from '../../redis/redis.service';

interface TrackEventData {
  eventType: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}

interface ComputeTrendingData {
  limit?: number;
}

@Processor('analytics')
export class AnalyticsProcessor extends WorkerHost {
  private readonly logger = new Logger(AnalyticsProcessor.name);

  constructor(private redisService: RedisService) {
    super();
  }

  async process(job: Job<TrackEventData | ComputeTrendingData>): Promise<any> {
    const { name, data, id } = job;
    this.logger.debug(`Processing analytics job ${id} (${name})`);

    try {
      switch (name) {
        case 'track_event': {
          const d = data as TrackEventData;
          return await this.handleTrackEvent(d);
        }
        case 'compute_trending': {
          const d = data as ComputeTrendingData;
          return await this.handleComputeTrending(d);
        }
        default:
          this.logger.warn(`Unknown analytics job type: ${name}`);
          return { skipped: true };
      }
    } catch (error: any) {
      this.logger.error(`Analytics job ${id} failed: ${error.message}`);
      throw error;
    }
  }

  private async handleTrackEvent(data: TrackEventData): Promise<any> {
    const event = {
      type: data.eventType,
      userId: data.userId,
      metadata: data.metadata,
      timestamp: new Date().toISOString(),
    };

    // Store event in Redis with TTL
    await this.redisService.setJson(
      `event:${Date.now()}:${Math.random().toString(36).slice(2)}`,
      event,
      86400, // 24 hours
    );

    // Increment counters
    await this.redisService.increment(`events:${data.eventType}:today`);
    await this.redisService.increment(`events:total:today`);

    // Set expiry on counters (until midnight)
    const tomorrow = new Date();
    tomorrow.setHours(24, 0, 0, 0);
    const ttlSeconds = Math.floor((tomorrow.getTime() - Date.now()) / 1000);
    await this.redisService.expire(`events:${data.eventType}:today`, ttlSeconds);
    await this.redisService.expire(`events:total:today`, ttlSeconds);

    // Also track per-user daily events
    if (data.userId) {
      const userDailyKey = `events:user:${data.userId}:${new Date().toISOString().split('T')[0]}`;
      await this.redisService.increment(userDailyKey);
      await this.redisService.expire(userDailyKey, 86400);
    }

    this.logger.debug(`Event tracked: ${data.eventType}`);
    return { tracked: true };
  }

  private async handleComputeTrending(data: ComputeTrendingData): Promise<any> {
    const limit = data.limit || 20;

    // Get all event keys for today
    // Note: In a real implementation, this would query a time-series DB
    // For now, we compute trending based on Redis counters

    // Get top event types by count
    const pattern = 'events:*:today';
    // ioredis scan for keys matching pattern
    const keys: string[] = [];
    let cursor = '0';
    do {
      const result = await this.redisService.client.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = result[0];
      keys.push(...result[1]);
    } while (cursor !== '0');

    const counts: Record<string, number> = {};
    for (const key of keys) {
      const count = await this.redisService.get(key);
      if (count) {
        counts[key] = parseInt(count, 10);
      }
    }

    // Store aggregated stats
    await this.redisService.setJson('analytics:trending:today', counts, 3600);

    this.logger.log(`Computed trending analytics for ${Object.keys(counts).length} event types`);
    return { eventTypes: Object.keys(counts).length, topEvents: Object.entries(counts).slice(0, limit) };
  }
}
