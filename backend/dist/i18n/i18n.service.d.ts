import { LlmService } from '../ai/llm.service';
import { RedisService } from '../redis/redis.service';
export declare class I18nService {
    private readonly llm;
    private readonly redis;
    private readonly logger;
    constructor(llm: LlmService, redis: RedisService);
    pack(localeRaw: string, entries: Record<string, string>): Promise<{
        entries: Record<string, string> | null;
        mock?: boolean;
        cached?: boolean;
    }>;
}
