import { ConfigService } from '@nestjs/config';
import { RedisService } from '../redis/redis.service';
export interface RouteLeg {
    distanceM: number;
    durationS: number;
}
export interface RouteResult {
    distanceM: number;
    durationS: number;
    legs: RouteLeg[];
    geometry: [number, number][];
}
export interface OptimizeResult extends RouteResult {
    order: number[];
}
export declare class RoutingService {
    private readonly config;
    private readonly redis;
    private readonly logger;
    constructor(config: ConfigService, redis: RedisService);
    private get osrmBase();
    private get mapboxToken();
    private get useMapbox();
    parseCoords(raw: string): [number, number][];
    private fetchJson;
    private cacheKey;
    route(coords: [number, number][]): Promise<RouteResult>;
    optimize(coords: [number, number][]): Promise<OptimizeResult>;
}
