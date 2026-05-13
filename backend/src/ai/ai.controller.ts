import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
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
    return this.aiService.generateItinerary(preferences);
  }

  @Post('chat')
  @ApiOperation({ summary: 'Chat with AI travel planner' })
  async chatPlanner(
    @Body()
    { messages }: { messages: Array<{ role: 'user' | 'assistant'; content: string }> },
  ) {
    return this.aiService.chatTravelPlanner(messages);
  }

  @Get('suggestions')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get personalized place suggestions' })
  async getSuggestions(
    @CurrentUser() user: any,
    @Query('interests') interests?: string,
  ) {
    return this.aiService.suggestPlaces({
      visitedPlaceIds: user.visitedPlaceIds || [],
      favoriteIds: user.favoriteIds || [],
      interests: interests ? interests.split(',') : ['culture', 'food', 'nature'],
    });
  }
}
