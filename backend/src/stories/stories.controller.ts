import {
    Controller, Get, Post, Delete, Body, Param, UseGuards, Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StoriesService } from './stories.service';

class CreateStoryDto {
    @IsString() @MaxLength(12_000_000) // base64 data URLs can be ~10MB
    imageUrl: string;

    @IsOptional() @IsString() @MaxLength(280)
    caption?: string;
}

@ApiTags('stories')
@Controller('stories')
export class StoriesController {
    constructor(private stories: StoriesService) {}

    @Get()
    @ApiOperation({ summary: 'Active stories grouped by author' })
    list() {
        return this.stories.listActiveGrouped();
    }

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Post()
    @ApiOperation({ summary: 'Create a 24h story' })
    create(@Request() req, @Body() body: CreateStoryDto) {
        return this.stories.create(req.user.id, body);
    }

    @Post(':id/view')
    @ApiOperation({ summary: 'Record a view on a story' })
    view(@Param('id') id: string) {
        return this.stories.recordView(id);
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
