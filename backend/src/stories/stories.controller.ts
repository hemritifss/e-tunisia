import {
    Controller, Get, Post, Delete, Body, Param, UseGuards, Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { StoriesService } from './stories.service';

class CreateStoryDto {
    @IsString() @MaxLength(12_000_000) // base64 data URLs can be ~10MB
    imageUrl: string;

    @IsOptional() @IsString() @MaxLength(280)
    caption?: string;
}

class ReactStoryDto {
    @IsString() @MaxLength(16)
    emoji: string;
}

class ReplyStoryDto {
    @IsString() @MinLength(1) @MaxLength(1000)
    text: string;
}

@ApiTags('stories')
@Controller('stories')
export class StoriesController {
    constructor(private stories: StoriesService) {}

    @Get()
    @UseGuards(OptionalJwtAuthGuard)
    @ApiOperation({ summary: 'Active stories grouped by author' })
    list(@Request() req) {
        return this.stories.listActiveGrouped(req?.user?.id || null);
    }

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Post()
    @ApiOperation({ summary: 'Create a 24h story' })
    create(@Request() req, @Body() body: CreateStoryDto) {
        return this.stories.create(req.user.id, body);
    }

    @Post(':id/view')
    @UseGuards(OptionalJwtAuthGuard)
    @ApiOperation({ summary: 'Record a view on a story (idempotent, per viewer)' })
    view(@Request() req, @Param('id') id: string) {
        return this.stories.recordView(id, req?.user?.id || null);
    }

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Post(':id/react')
    @ApiOperation({ summary: 'Set or replace your reaction on a story' })
    react(@Request() req, @Param('id') id: string, @Body() body: ReactStoryDto) {
        return this.stories.react(id, req.user.id, body.emoji);
    }

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Delete(':id/react')
    @ApiOperation({ summary: 'Remove your reaction from a story' })
    unreact(@Request() req, @Param('id') id: string) {
        return this.stories.unreact(id, req.user.id);
    }

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Post(':id/reply')
    @ApiOperation({ summary: 'Reply to a story — delivered as a DM to the author' })
    reply(@Request() req, @Param('id') id: string, @Body() body: ReplyStoryDto) {
        return this.stories.reply(id, req.user.id, body.text);
    }

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Get(':id/viewers')
    @ApiOperation({ summary: 'Author-only: who watched this story' })
    viewers(@Request() req, @Param('id') id: string) {
        return this.stories.listViewers(id, req.user.id);
    }

    @Get('highlights/:handle')
    @ApiOperation({ summary: 'A user\'s highlighted stories (persist past 24h)' })
    highlights(@Param('handle') handle: string) {
        return this.stories.listHighlights(handle);
    }

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Post(':id/highlight')
    @ApiOperation({ summary: 'Toggle pinning a story to your profile highlights' })
    highlight(@Request() req, @Param('id') id: string) {
        return this.stories.toggleHighlight(id, req.user.id);
    }

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Delete(':id')
    remove(@Request() req, @Param('id') id: string) {
        return this.stories.remove(id, req.user.id);
    }
}
