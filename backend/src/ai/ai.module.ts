import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AIService } from './ai.service';
import { LlmService } from './llm.service';
import { ModerationService } from './moderation.service';
import { AIController } from './ai.controller';
import { PlacesModule } from '../places/places.module';
import { SearchModule } from '../search/search.module';
import { BillingModule } from '../billing/billing.module';

@Module({
  imports: [ConfigModule, PlacesModule, SearchModule, BillingModule],
  controllers: [AIController],
  providers: [AIService, LlmService, ModerationService],
  exports: [AIService, LlmService, ModerationService],
})
export class AIModule {}
