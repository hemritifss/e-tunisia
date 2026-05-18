import {
    Controller,
    Get,
    Put,
    Body,
    Param,
    Query,
    UseGuards,
    Request,
    Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from './users.service';

@ApiTags('users')
@Controller('users')
export class UsersController {
    constructor(private usersService: UsersService) { }

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Get('me')
    getProfile(@Request() req) {
        return this.usersService.findById(req.user.id);
    }

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Put('me')
    updateProfile(@Request() req, @Body() body: Partial<any>) {
        return this.usersService.update(req.user.id, body);
    }

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Post('favorites/:placeId')
    toggleFavorite(@Request() req, @Param('placeId') placeId: string) {
        return this.usersService.toggleFavorite(req.user.id, placeId);
    }

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Get('favorites')
    getFavorites(@Request() req) {
        return this.usersService.getFavoriteIds(req.user.id);
    }

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Post('visited/:placeId')
    toggleVisited(@Request() req, @Param('placeId') placeId: string) {
        return this.usersService.toggleVisited(req.user.id, placeId);
    }

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Get('visited')
    getVisited(@Request() req) {
        return this.usersService.getVisitedIds(req.user.id);
    }

    // Public profile lookup — safe-stripped view (no password / email / sensitive flags).
    @Get(':id')
    async findPublicById(@Param('id') id: string) {
        if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
            return null;
        }
        const u: any = await this.usersService.findById(id).catch(() => null);
        if (!u) return null;
        return {
            id: u.id,
            fullName: u.fullName,
            avatar: u.avatar || null,
            country: u.country || null,
            bio: u.bio || null,
            website: u.website || null,
            role: u.role,
            points: u.points || 0,
            level: u.level || 1,
            badges: Array.isArray(u.badges) ? u.badges : [],
            createdAt: u.createdAt,
        };
    }

    /** Suggested users to follow (cold-start). Public; auth not required. */
    @Get('suggest/list')
    async suggest(@Query('limit') limit?: string) {
        const lim = Math.max(1, Math.min(20, Number(limit) || 6));
        // Cheap version: pick recent users excluding the platform account.
        const list = await this.usersService.suggestedUsers?.(lim).catch(() => null);
        if (Array.isArray(list)) return list;
        // Fallback: empty
        return [];
    }
}