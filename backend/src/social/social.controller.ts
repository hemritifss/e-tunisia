import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  Query,
  UseGuards,
  Body,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SocialService } from './social.service';

@ApiTags('social')
@ApiBearerAuth()
@Controller('social')
export class SocialController {
  constructor(private readonly socialService: SocialService) {}

  @Post('follow/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Follow a user' })
  follow(@CurrentUser('id') followerId: string, @Param('userId') followingId: string) {
    return this.socialService.follow(followerId, followingId);
  }

  @Delete('follow/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Unfollow a user' })
  unfollow(@CurrentUser('id') followerId: string, @Param('userId') followingId: string) {
    return this.socialService.unfollow(followerId, followingId);
  }

  @Get('followers')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get my followers' })
  getFollowers(@CurrentUser('id') userId: string) {
    return this.socialService.getFollowers(userId);
  }

  @Get('following')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get who I am following' })
  getFollowing(@CurrentUser('id') userId: string) {
    return this.socialService.getFollowing(userId);
  }

  @Get('follow-counts')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get follow counts' })
  getFollowCounts(@CurrentUser('id') userId: string) {
    return this.socialService.getFollowCounts(userId);
  }

  @Get('is-following/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Check if following a user' })
  isFollowing(@CurrentUser('id') followerId: string, @Param('userId') followingId: string) {
    return this.socialService.isFollowing(followerId, followingId);
  }

  @Get('feed')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get activity feed' })
  getFeed(
    @CurrentUser('id') userId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.socialService.getActivityFeed(userId, page, limit);
  }

  @Get('activity/:userId')
  @ApiOperation({ summary: 'Get user activity' })
  getUserActivity(
    @Param('userId') userId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.socialService.getUserActivity(userId, page, limit);
  }

  @Get('travel-buddies')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Find travel buddies' })
  findTravelBuddies(
    @CurrentUser('id') userId: string,
    @Query() preferences: any,
  ) {
    return this.socialService.findTravelBuddies(userId, preferences);
  }
}
