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
    ForbiddenException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { UsersService } from './users.service';
import { FollowsService } from './follows.service';
import { EndorsementsService } from './endorsements.service';
import { ActivityService } from './activity.service';
import { ENDORSEMENT_TOPICS } from './endorsement-topics';
import { OgService } from '../og/og.service';
import { capsFor } from '../billing/plan-catalog';
import { effectivePlan } from './effective-plan';

@ApiTags('users')
@Controller('users')
export class UsersController {
    constructor(
        private usersService: UsersService,
        private followsService: FollowsService,
        private endorsementsService: EndorsementsService,
        private activityService: ActivityService,
        private ogService: OgService,
    ) { }

    /**
     * The User entity marks password / passwordResetToken / passwordResetExpires
     * / tokenVersion with `@Exclude()`, but those are INERT: no
     * ClassSerializerInterceptor is registered (main.ts only wires
     * TransformInterceptor + LoggingInterceptor), so `findById` returns the raw
     * row. Any endpoint handing that straight back leaks the bcrypt hash and a
     * live password-reset token. Strip them at the boundary.
     *
     * Not stripped inside `findById` itself on purpose — jwt.strategy.ts reads
     * `user.tokenVersion` from it to validate every request.
     */
    private stripSecrets<T extends Record<string, any>>(user: T): T {
        if (!user) return user;
        const safe: any = { ...user };
        delete safe.password;
        delete safe.passwordResetToken;
        delete safe.passwordResetExpires;
        delete safe.tokenVersion;
        return safe;
    }

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Get('me')
    async getProfile(@Request() req) {
        return this.stripSecrets(await this.usersService.findById(req.user.id));
    }

    /** Pro: who viewed your passport (gated by the passportAnalytics cap). */
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Get('me/passport-analytics')
    async passportAnalytics(@Request() req) {
        const me = await this.usersService.findById(req.user.id);
        if (!capsFor(effectivePlan(me) as any).passportAnalytics) {
            throw new ForbiddenException({ message: 'Passport analytics requires Pro Traveler.', code: 'pro_required' });
        }
        return this.usersService.getPassportAnalytics(req.user.id);
    }

    /** Public: search users by handle prefix or fullName substring. */
    @Get('search')
    searchUsers(@Query('q') q: string, @Query('limit') limit?: string) {
        return this.usersService.searchUsers(q || '', limit ? Number(limit) : 12);
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
    @UseGuards(OptionalJwtAuthGuard)
    async byHandle(@Request() req, @Param('handle') rawHandle: string) {
        const handle = (rawHandle || '').toLowerCase();
        const passport = await this.usersService.assemblePassport(handle).catch(() => null);
        if (!passport) {
            return { error: 'passport_not_found', handle };
        }
        const viewerId = req?.user?.id || null;
        if (viewerId) {
            const me = await this.usersService.findById(viewerId).catch(() => null);
            const isOwner = !!me?.handle && me.handle === passport.handle;
            const [viewerIsFollowing, viewerEndorsedTopics] = await Promise.all([
                isOwner ? Promise.resolve(false) : this.followsService.isFollowing(viewerId, handle),
                isOwner ? Promise.resolve([] as string[]) : this.endorsementsService.myEndorsementsFor(viewerId, handle),
            ]);
            if (!isOwner) void this.usersService.recordPassportView(handle, viewerId);
            return { ...passport, isOwner, viewerIsFollowing, viewerEndorsedTopics };
        }
        return passport;
    }

    /** Static list of valid endorsement topics. */
    @Get('endorsement-topics')
    endorsementTopics() {
        return ENDORSEMENT_TOPICS;
    }

    /** Cities that have reviews. For the city-leaderboard dropdown. */
    @Get('leaderboards/cities')
    leaderboardCities(@Query('limit') limit?: string) {
        return this.usersService.listCitiesWithReviews(limit ? Number(limit) : 30);
    }

    /** Top reviewers in a given city. */
    @Get('leaderboards/city/:city')
    leaderboardByCity(@Param('city') city: string, @Query('limit') limit?: string) {
        return this.usersService.getCityReviewerLeaderboard(decodeURIComponent(city), limit ? Number(limit) : 20);
    }

    @Post('by-handle/:handle/endorse')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    endorse(@Request() req, @Param('handle') handle: string, @Body() body: { topic: string }) {
        return this.endorsementsService.endorse(req.user.id, (handle || '').toLowerCase(), body?.topic);
    }

    @Post('by-handle/:handle/unendorse')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    unendorse(@Request() req, @Param('handle') handle: string, @Body() body: { topic: string }) {
        return this.endorsementsService.unendorse(req.user.id, (handle || '').toLowerCase(), body?.topic);
    }

    @Get('by-handle/:handle/endorsements')
    listEndorsements(@Param('handle') handle: string) {
        return this.endorsementsService.listForHandle((handle || '').toLowerCase());
    }

    @Post('by-handle/:handle/follow')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    follow(@Request() req, @Param('handle') handle: string) {
        return this.followsService.follow(req.user.id, (handle || '').toLowerCase());
    }

    @Post('by-handle/:handle/unfollow')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    unfollow(@Request() req, @Param('handle') handle: string) {
        return this.followsService.unfollow(req.user.id, (handle || '').toLowerCase());
    }

    @Get('by-handle/:handle/followers')
    listFollowers(@Param('handle') handle: string, @Query('limit') limit?: string) {
        return this.followsService.listFollowers((handle || '').toLowerCase(), limit ? Number(limit) : 50);
    }

    @Get('by-handle/:handle/following')
    listFollowing(@Param('handle') handle: string, @Query('limit') limit?: string) {
        return this.followsService.listFollowing((handle || '').toLowerCase(), limit ? Number(limit) : 50);
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

    /** Self-attest Local Guide application. Returns { ok, role } or a gate-not-met progress payload. */
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Post('me/apply-local-guide')
    applyLocalGuide(@Request() req) {
        return this.usersService.applyLocalGuide(req.user.id);
    }

    /** Recent activity from users you follow (reviews, trips, endorsements, follows). */
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Get('me/activity-feed')
    activityFeed(@Request() req, @Query('limit') limit?: string) {
        return this.activityService.followingFeed(req.user.id, limit ? Number(limit) : 20);
    }

    /** Recent activity across the platform — discovery surface (public). */
    @Get('activity-feed/global')
    globalActivityFeed(@Query('limit') limit?: string) {
        return this.activityService.globalFeed(limit ? Number(limit) : 20);
    }

    /** Active travelers on the map — recent place visits with coordinates. */
    @Get('active-travelers')
    activeTravelers(@Query('limit') limit?: string) {
        return this.usersService.activeTravelers(limit ? Number(limit) : 50);
    }

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Put('me')
    async updateProfile(@Request() req, @Body() body: Partial<any>) {
        // Whitelist self-editable fields. Without this, a user could PUT
        // { plan: 'business', role: 'admin' } and escalate — these are NOT settable here.
        const ALLOWED = [
            'fullName', 'handle', 'avatar', 'phone', 'country', 'bio', 'website',
            'interests', 'onboardingComplete', 'favoriteIds', 'visitedPlaceIds', 'passportTheme',
        ];
        const safe: Record<string, any> = {};
        for (const k of ALLOWED) if (k in body) safe[k] = body[k];

        // Custom passport theme is a Pro/Business perk — drop it for Free users.
        if ('passportTheme' in safe) {
            const me = await this.usersService.findById(req.user.id);
            if (!capsFor(effectivePlan(me) as any).customThemes) delete safe.passportTheme;
        }

        return this.stripSecrets(await this.usersService.update(req.user.id, safe));
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