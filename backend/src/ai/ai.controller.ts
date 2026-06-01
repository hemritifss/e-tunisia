import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Query,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AIService } from './ai.service';

@ApiTags('ai')
@ApiBearerAuth()
@Controller('ai')
export class AIController {
  constructor(private readonly aiService: AIService) {}

  @Post('itinerary')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Generate AI-powered itinerary' })
  async generateItinerary(
    @CurrentUser('id') userId: string,
    @Req() req: any,
    @Body()
    preferences: {
      duration: number;
      budget: number;
      travelers: number;
      interests: string[];
      startLocation?: string;
      travelStyle?: string;
    },
  ) {
    const { premium } = await this.aiService.assertQuotaAndCount({ userId, ip: req.ip });
    return this.aiService.generateItinerary(preferences, premium);
  }

  @Post('chat')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Chat with the grounded AI travel concierge' })
  async chatPlanner(
    @CurrentUser('id') userId: string | null,
    @Req() req: any,
    @Body()
    { messages }: { messages: Array<{ role: 'user' | 'assistant'; content: string }> },
  ) {
    const { premium } = await this.aiService.assertQuotaAndCount({ userId, ip: req.ip });
    return this.aiService.chatTravelPlanner(messages, premium);
  }

  @Post('assist')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'AI compose assist — improve / translate / shorten / expand text' })
  async assist(
    @CurrentUser('id') userId: string | null,
    @Req() req: any,
    @Body() body: { text: string; action: string; targetLang?: string; tone?: string },
  ) {
    const { premium } = await this.aiService.assertQuotaAndCount({ userId, ip: req.ip });
    return this.aiService.assist(body, premium);
  }

  @Post('search')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Natural-language search — parses the query into place filters' })
  async smartSearch(
    @CurrentUser('id') userId: string | null,
    @Req() req: any,
    @Body() body: { query: string },
  ) {
    const { premium } = await this.aiService.assertQuotaAndCount({ userId, ip: req.ip });
    return this.aiService.smartSearch(body?.query || '', premium);
  }

  @Post('autotag')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Suggest a category, tags and location for a post' })
  async autoTag(
    @CurrentUser('id') userId: string | null,
    @Req() req: any,
    @Body() body: { title?: string; body?: string },
  ) {
    await this.aiService.assertQuotaAndCount({ userId, ip: req.ip });
    return this.aiService.autoTag(body || {});
  }

  @Post('caption')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Generate a reel caption + hashtags' })
  async caption(
    @CurrentUser('id') userId: string | null,
    @Req() req: any,
    @Body() body: { topic?: string; location?: string },
  ) {
    const { premium } = await this.aiService.assertQuotaAndCount({ userId, ip: req.ip });
    return this.aiService.generateCaption(body || {}, premium);
  }

  @Get('suggestions')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get personalized place suggestions' })
  async getSuggestions(
    @CurrentUser() user: any,
    @Req() req: any,
    @Query('interests') interests?: string,
  ) {
    const { premium } = await this.aiService.assertQuotaAndCount({ userId: user.id, ip: req.ip });
    return this.aiService.suggestPlaces({
      visitedPlaceIds: user.visitedPlaceIds || [],
      favoriteIds: user.favoriteIds || [],
      interests: interests ? interests.split(',') : ['culture', 'food', 'nature'],
    }, premium);
  }
}
