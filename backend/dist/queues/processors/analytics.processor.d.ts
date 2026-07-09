import { WorkerHost } from '@nestjs/bullmq';
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
export declare class AnalyticsProcessor extends WorkerHost {
    private redisService;
    private readonly logger;
    constructor(redisService: RedisService);
    process(job: Job<TrackEventData | ComputeTrendingData>): Promise<any>;
    private handleTrackEvent;
    private handleComputeTrending;
}
export {};
