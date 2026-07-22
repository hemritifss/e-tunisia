import { Controller, Get, Post, Body, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { GamificationService } from './gamification.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../admin/admin.guard';
import { AddPointsDto } from './dto/add-points.dto';

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

    /**
     * Admin-only. This previously had just JwtAuthGuard while awarding points to
     * `req.user.id`, so any logged-in user could grant themselves unlimited XP
     * (no cap, no validation) — topping the leaderboard and unlocking every
     * badge through checkBadges(). Points are server-authoritative: they should
     * be earned via actions, never requested by the client.
     */
    @Post('add-points')
    @UseGuards(JwtAuthGuard, AdminGuard)
    @ApiBearerAuth()
    addPoints(@Body() body: AddPointsDto) {
        return this.gamificationService.addPoints(body.userId, body.points, body.reason);
    }
}
