import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiQuery, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FeedService } from './feed.service';

@ApiTags('feed')
@Controller('feed')
export class FeedController {
    constructor(private feed: FeedService, private jwt: JwtService) {}

    /** Best-effort decode of the Authorization header (no exception if missing/invalid). */
    private tryGetUserId(req: any): string | undefined {
        const h = req?.headers?.authorization;
        if (!h || typeof h !== 'string') return undefined;
        const m = h.match(/^Bearer\s+(.+)$/i);
        if (!m) return undefined;
        try {
            const decoded: any = this.jwt.verify(m[1]);
            return decoded?.sub || decoded?.id;
        } catch {
            return undefined;
        }
    }

    @Get()
    @ApiOperation({ summary: 'Unified social feed (posts + reviews + ads)' })
    @ApiQuery({ name: 'page', required: false })
    @ApiQuery({ name: 'limit', required: false })
    @ApiQuery({ name: 'sort', required: false, enum: ['new', 'top', 'hot'] })
    @ApiQuery({ name: 'category', required: false })
    @ApiQuery({ name: 'hashtag', required: false })
    public(
        @Request() req,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('sort') sort?: 'new' | 'top' | 'hot',
        @Query('category') category?: string,
        @Query('hashtag') hashtag?: string,
    ) {
        return this.feed.unified({
            page: page ? Number(page) : undefined,
            limit: limit ? Number(limit) : undefined,
            sort,
            category,
            hashtag,
            userId: this.tryGetUserId(req),
        });
    }

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Get('following')
    @ApiOperation({ summary: 'Feed of posts from users the current user follows' })
    followingFeed(
        @Request() req,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('sort') sort?: 'new' | 'top' | 'hot',
    ) {
        return this.feed.unified({
            page: page ? Number(page) : undefined,
            limit: limit ? Number(limit) : undefined,
            sort,
            following: true,
            userId: req.user.id,
        });
    }

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Get('mine')
    @ApiOperation({ summary: "Feed of the current user's own posts" })
    mine(
        @Request() req,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('sort') sort?: 'new' | 'top' | 'hot',
    ) {
        return this.feed.unified({
            page: page ? Number(page) : undefined,
            limit: limit ? Number(limit) : undefined,
            sort,
            mine: true,
            userId: req.user.id,
        });
    }

    @Get('stories')
    @ApiOperation({ summary: 'Stories strip (featured places) at top of feed' })
    @ApiQuery({ name: 'limit', required: false })
    stories(@Query('limit') limit?: string) {
        return this.feed.stories(limit ? Number(limit) : 12);
    }
}
