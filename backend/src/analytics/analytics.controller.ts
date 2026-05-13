import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AnalyticsService } from './analytics.service';

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
}
