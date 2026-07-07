import { Module } from '@nestjs/common';
import { AIModule } from '../ai/ai.module';
import { RedisModule } from '../redis/redis.module';
import { I18nController } from './i18n.controller';
import { I18nService } from './i18n.service';

@Module({
    imports: [AIModule, RedisModule],
    controllers: [I18nController],
    providers: [I18nService],
})
export class I18nModule {}
