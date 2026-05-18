import {
    Controller, Get, Post, Body, Param, Query, Delete,
    UseGuards, Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PostsService } from './posts.service';

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

    @IsOptional() @IsArray() @IsString({ each: true })
    tags?: string[];
}

class VotePostDto {
    @IsString()
    direction: 'up' | 'down' | 'clear';
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
    one(@Param('id') id: string) {
        return this.posts.findOne(id);
    }

    @Get(':id/comments')
    @ApiOperation({ summary: 'List comments for a post' })
    listComments(@Param('id') id: string) {
        return this.posts.listComments(id);
    }

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Post(':id/comments')
    @ApiOperation({ summary: 'Add a comment to a post' })
    addComment(@Request() req, @Param('id') id: string, @Body() body: { body: string }) {
        return this.posts.addComment(id, req.user.id, body?.body || '');
    }
}
