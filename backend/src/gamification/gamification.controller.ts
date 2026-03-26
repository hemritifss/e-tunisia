import { Controller, Get, Post, Body, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { GamificationService } from './gamification.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('gamification')
@Controller('gamification')
export class GamificationController {
    constructor(private readonly gamificationService: GamificationService) {}

    @Get('badges')
    getAllBadges() {
        return this.gamificationService.getAllBadges();
    }

    @Get('my-badges')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    getMyBadges(@Request() req: any) {
        return this.gamificationService.getUserBadges(req.user.id);
    }

    @Get('my-points')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    getMyPoints(@Request() req: any) {
        return this.gamificationService.getUserPoints(req.user.id);
    }

    @Get('my-rank')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    getMyRank(@Request() req: any) {
        return this.gamificationService.getUserRank(req.user.id);
    }

    @Get('leaderboard')
    getLeaderboard(@Query('limit') limit?: number) {
        return this.gamificationService.getLeaderboard(limit || 20);
    }

    @Post('add-points')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    addPoints(@Request() req: any, @Body() body: { points: number; reason: string }) {
        return this.gamificationService.addPoints(req.user.id, body.points, body.reason);
    }
}
