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
    Header,
    Res,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from './users.service';
import { OgService } from '../og/og.service';

@ApiTags('users')
@Controller('users')
export class UsersController {
    constructor(
        private usersService: UsersService,
        private ogService: OgService,
    ) { }

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Get('me')
    getProfile(@Request() req) {
        return this.usersService.findById(req.user.id);
    }

    /** Public: live availability check used by the signup form. */
    @Get('handle-available')
    async handleAvailable(@Query('h') h: string): Promise<{ available: boolean; reason?: string }> {
        const { isHandleFormatValid, isHandleReserved } = await import('./reserved-handles');
        const handle = (h || '').toLowerCase().trim();
        if (!handle) return { available: false, reason: 'empty' };
        if (!isHandleFormatValid(handle)) return { available: false, reason: 'format' };
        if (isHandleReserved(handle)) return { available: false, reason: 'reserved' };
        const ok = await this.usersService.isHandleAvailable(handle);
        return { available: ok, reason: ok ? undefined : 'taken' };
    }

    @Get('by-handle/:handle')
    async byHandle(@Param('handle') rawHandle: string) {
        const handle = (rawHandle || '').toLowerCase();
        const passport = await this.usersService.assemblePassport(handle).catch(() => null);
        if (!passport) {
            return { error: 'passport_not_found', handle };
        }
        return passport;
    }

    /** Shareable 1200×630 PNG postcard for social previews. 24h HTTP cache + SWR. */
    @Get('by-handle/:handle/og.png')
    @Header('Content-Type', 'image/png')
    @Header('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800')
    async ogImage(@Param('handle') rawHandle: string, @Res() res: Response) {
        const handle = (rawHandle || '').toLowerCase();
        try {
            const passport = await this.usersService.assemblePassport(handle);
            const png = await this.ogService.renderPassportCard(passport);
            res.send(png);
        } catch {
            // 1×1 transparent PNG fallback — never block the page on this.
            const transparent = Buffer.from(
                '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c63000000000200015c34a40d0000000049454e44ae426082',
                'hex',
            );
            res.send(transparent);
        }
    }

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Post('me/seed')
    seedDraft(@Request() req, @Body() body: { visitedCities?: string[]; interests?: string[] }) {
        return this.usersService.seedFromDraft(req.user.id, body || {});
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