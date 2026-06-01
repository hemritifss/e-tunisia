import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
export declare class RedisService implements OnModuleInit, OnModuleDestroy {
    private configService;
    private readonly logger;
    client: Redis;
    constructor(configService: ConfigService);
    onModuleInit(): void;
    onModuleDestroy(): void;
    get(key: string): Promise<string | null>;
    set(key: string, value: string, ttlSeconds?: number): Promise<void>;
    del(key: string): Promise<void>;
    exists(key: string): Promise<boolean>;
    getJson<T>(key: string): Promise<T | null>;
    setJson<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
    increment(key: string): Promise<number>;
    expire(key: string, seconds: number): Promise<void>;
}
