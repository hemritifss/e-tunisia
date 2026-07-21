import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TipsService } from './tips.service';

@ApiTags('tips')
@Controller('tips')
export class TipsController {
    constructor(private tipsService: TipsService) {}

    @Get()
    @ApiOperation({ summary: 'Get all approved tips' })
    findAll(@Query('category') category?: string) {
        return this.tipsService.findAll(category);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get tip by ID' })
    findOne(@Param('id') id: string) {
        return this.tipsService.findById(id);
    }

    @Post()
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create a new tip' })
    create(@Request() req, @Body() body: { title: string; content: string; category?: string; coverImage?: string }) {
        return this.tipsService.create(req.user.id, body);
    }

    // Guarded: this increments a public counter with no per-user record, so
    // leaving it anonymous let anyone inflate any tip's like count with curl.
    // (A true idempotent toggle still needs a per-user likes table.)
    @Post(':id/like')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Like a tip' })
    like(@Param('id') id: string) {
        return this.tipsService.like(id);
    }
}
