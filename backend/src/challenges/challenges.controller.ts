import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ChallengesService } from './challenges.service';

@ApiTags('challenges')
@ApiBearerAuth()
@Controller('challenges')
export class ChallengesController {
  constructor(private readonly challengesService: ChallengesService) {}

  @Get('daily')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get today\'s daily challenges with user progress' })
  async getDailyChallenges(@CurrentUser('id') userId: string) {
    const challenges = await this.challengesService.generateDailyChallenges();
    const userChallenges = await this.challengesService.getOrCreateUserChallenges(userId);

    return challenges.map((challenge) => {
      const userChallenge = userChallenges.find(
        (uc) => uc.challengeId === challenge.id,
      );
      return {
        ...challenge,
        userProgress: userChallenge
          ? {
              status: userChallenge.status,
              progress: userChallenge.progress,
              target: userChallenge.target,
              completedAt: userChallenge.completedAt,
            }
          : null,
      };
    });
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get my active challenges' })
  async getMyChallenges(@CurrentUser('id') userId: string) {
    return this.challengesService.getOrCreateUserChallenges(userId);
  }

  @Post(':id/claim')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Claim challenge reward' })
  async claimReward(
    @CurrentUser('id') userId: string,
    @Param('id') userChallengeId: string,
  ) {
    return this.challengesService.claimChallengeReward(userId, userChallengeId);
  }

  @Get('streak')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get my streak' })
  async getStreak(@CurrentUser('id') userId: string) {
    return this.challengesService.getOrCreateStreak(userId);
  }

  @Post('activity')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Record activity (for streaks)' })
  async recordActivity(
    @CurrentUser('id') userId: string,
    @Body('action') action: string,
  ) {
    return this.challengesService.recordActivity(userId, action);
  }

  @Post('check-in')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Daily check-in — advances streak + awards Travel Dust (idempotent per day)' })
  async checkIn(@CurrentUser('id') userId: string) {
    return this.challengesService.checkIn(userId);
  }

  @Get('leaderboard')
  @ApiOperation({ summary: 'Get challenge leaderboard' })
  async getLeaderboard(
    @Query('period') period: 'daily' | 'weekly' | 'all-time' = 'weekly',
    @Query('limit') limit: number = 50,
  ) {
    return this.challengesService.getLeaderboard(period, limit);
  }
}
