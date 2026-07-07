import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { AdminGuard } from '../admin/admin.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AnalyticsService, IncomingEvent } from './analytics.service';

@ApiTags('analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get admin dashboard stats' })
  async getDashboard() {
    return this.analyticsService.getDashboardStats();
  }

  @Get('revenue')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get revenue by period' })
  async getRevenue(
    @Query('period') period: 'day' | 'week' | 'month' | 'year' = 'week',
  ) {
    return this.analyticsService.getRevenueByPeriod(period);
  }

  @Get('top-places')
  @ApiOperation({ summary: 'Get top performing places' })
  async getTopPlaces(@Query('limit') limit: number = 10) {
    return this.analyticsService.getTopPlaces(limit);
  }

  @Get('retention')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user retention metrics' })
  async getRetention() {
    return this.analyticsService.getUserRetention();
  }

  @Get('realtime')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get real-time stats' })
  async getRealtime() {
    return this.analyticsService.getRealtimeStats();
  }

  @Get('track')
  @ApiOperation({ summary: 'Track an event (public)' })
  async trackEvent(
    @Query('type') type: string,
    @Query('userId') userId?: string,
  ) {
    await this.analyticsService.trackEvent(type, userId);
    return { tracked: true };
  }

  /** Durable batch ingestion from the web client (works logged-out via anonId). */
  @Post('events')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Ingest a batch of product events (public, batched)' })
  async ingestEvents(
    @Body() body: { events?: IncomingEvent[] } | IncomingEvent[],
    @CurrentUser() user?: { id?: string },
  ) {
    const batch = Array.isArray(body) ? body : body?.events || [];
    const accepted = await this.analyticsService.ingestEvents(batch, user?.id || null);
    return { accepted };
  }

  @Get('events/summary')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Daily counts + uniques per event (admin)' })
  async eventsSummary(@Query('days') days?: string) {
    return this.analyticsService.eventsSummary(days ? Number(days) : 30);
  }
}
