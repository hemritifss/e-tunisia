import {
    Controller, Get, Post, Body, Param, Query, Delete,
    UseGuards, Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { IsArray, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PostsService } from './posts.service';
import { ReactionType } from './post-reaction.entity';

class CreatePostDto {
    @IsString() @MinLength(1) @MaxLength(240)
    title: string;

    @IsString() @MinLength(1)
    body: string;

    @IsOptional() @IsString()
    category?: string;

    @IsOptional() @IsString()
    location?: string;

    @IsOptional() @IsString()
    placeId?: string;

    @IsOptional() @IsArray() @IsString({ each: true })
    images?: string[];

    @IsOptional() @IsString() @MaxLength(2048)
    videoUrl?: string;

    @IsOptional() @IsArray() @IsString({ each: true })
    tags?: string[];
}

class VotePostDto {
    @IsString()
    direction: 'up' | 'down' | 'clear';
}

class ReactPostDto {
    /** Pass null/empty string to clear your reaction. */
    @IsOptional()
    @IsEnum(ReactionType)
    type?: ReactionType | null;
}

@ApiTags('posts')
@Controller('posts')
export class PostsController {
    constructor(private posts: PostsService) {}

    @Get()
    @ApiQuery({ name: 'page', required: false })
    @ApiQuery({ name: 'limit', required: false })
    @ApiQuery({ name: 'sort', required: false, enum: ['new', 'top', 'hot'] })
    @ApiQuery({ name: 'authorId', required: false })
    @ApiQuery({ name: 'category', required: false })
    list(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('sort') sort?: 'new' | 'top' | 'hot',
        @Query('authorId') authorId?: string,
        @Query('category') category?: string,
    ) {
        return this.posts.list({
            page: page ? Number(page) : undefined,
            limit: limit ? Number(limit) : undefined,
            sort,
            authorId,
            category,
        });
    }

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Get('mine')
    @ApiOperation({ summary: "List the current user's posts" })
    mine(@Request() req, @Query('page') page?: string, @Query('limit') limit?: string) {
        return this.posts.list({
            authorId: req.user.id,
            page: page ? Number(page) : undefined,
            limit: limit ? Number(limit) : undefined,
            sort: 'new',
        });
    }

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Get('saved')
    @ApiOperation({ summary: "List the current user's saved posts" })
    saved(@Request() req, @Query('page') page?: string, @Query('limit') limit?: string) {
        return this.posts.listSaved(req.user.id, {
            page: page ? Number(page) : undefined,
            limit: limit ? Number(limit) : undefined,
        });
    }

    @Get('saved-by-handle/:handle')
    @ApiOperation({ summary: 'Public list of saved posts for a given handle (passport tab)' })
    savedByHandle(
        @Param('handle') handle: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        return this.posts.listSavedByHandle((handle || '').toLowerCase(), {
            page: page ? Number(page) : undefined,
            limit: limit ? Number(limit) : undefined,
        });
    }

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Post(':id/save')
    @ApiOperation({ summary: 'Bookmark a post' })
    save(@Request() req, @Param('id') id: string) {
        return this.posts.savePost(id, req.user.id);
    }

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Delete(':id/save')
    @ApiOperation({ summary: 'Remove a post bookmark' })
    unsave(@Request() req, @Param('id') id: string) {
        return this.posts.unsavePost(id, req.user.id);
    }

    @Get('by-user/:userId')
    @ApiOperation({ summary: "Public list of a user's posts" })
    byUser(
        @Param('userId') userId: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        return this.posts.list({
            authorId: userId,
            page: page ? Number(page) : undefined,
            limit: limit ? Number(limit) : 12,
            sort: 'new',
        });
    }

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Post()
    @ApiOperation({ summary: 'Create a new post' })
    create(@Request() req, @Body() body: CreatePostDto) {
        return this.posts.create(req.user.id, body as any);
    }

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Post(':id/vote')
    @ApiOperation({ summary: 'Vote on a post (up | down | clear)' })
    vote(@Param('id') id: string, @Body() body: VotePostDto) {
        return this.posts.vote(id, body.direction);
    }

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Delete(':id')
    remove(@Request() req, @Param('id') id: string) {
        return this.posts.remove(id, req.user.id);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a single post by ID' })
    async one(@Param('id') id: string) {
        const post = await this.posts.findOne(id);
        // Best-effort view counter
        this.posts.trackView(id).catch(() => {});
        return post;
    }

    @Get(':id/comments')
    @ApiOperation({ summary: 'List comments for a post (threaded)' })
    listComments(@Request() req, @Param('id') id: string) {
        return this.posts.listComments(id, req?.user?.id);
    }

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Post('comments/:id/like')
    @ApiOperation({ summary: 'Toggle like on a comment' })
    likeComment(@Request() req, @Param('id') id: string) {
        return this.posts.toggleCommentLike(id, req.user.id);
    }

    @Get(':id/reactions')
    @ApiOperation({ summary: 'Reaction breakdown for a post' })
    reactions(@Request() req, @Param('id') id: string) {
        return this.posts.aggregate(id, req?.user?.id);
    }

    @Get(':id/reactors')
    @ApiOperation({ summary: 'List users who reacted to a post (paginated)' })
    @ApiQuery({ name: 'type', required: false, description: 'Filter by reaction type (e.g. love, laugh)' })
    @ApiQuery({ name: 'page', required: false })
    @ApiQuery({ name: 'limit', required: false })
    reactors(
        @Param('id') id: string,
        @Query('type') type?: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        return this.posts.listReactors(id, {
            type: type || null,
            page: page ? Number(page) : undefined,
            limit: limit ? Number(limit) : undefined,
        });
    }

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Post(':id/react')
    @ApiOperation({ summary: 'Set or clear your reaction on a post' })
    react(@Request() req, @Param('id') id: string, @Body() body: ReactPostDto) {
        return this.posts.react(id, req.user.id, body?.type ?? null);
    }

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Post(':id/comments')
    @ApiOperation({ summary: 'Add a comment or reply (when parentId is given)' })
    addComment(@Request() req, @Param('id') id: string, @Body() body: { body: string; parentId?: string }) {
        return this.posts.addComment(id, req.user.id, body?.body || '', body?.parentId || null);
    }

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Post(':id/repost')
    @ApiOperation({ summary: 'Repost a post with optional comment' })
    repost(@Request() req, @Param('id') id: string, @Body() body: { comment?: string }) {
        return this.posts.repost(id, req.user.id, body?.comment);
    }

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Delete(':id/repost')
    @ApiOperation({ summary: 'Undo repost' })
    undoRepost(@Request() req, @Param('id') id: string) {
        return this.posts.undoRepost(id, req.user.id);
    }

    @Get(':id/reposts')
    @ApiOperation({ summary: 'List reposts of a post' })
    listReposts(@Param('id') id: string) {
        return this.posts.listReposts(id);
    }
}
