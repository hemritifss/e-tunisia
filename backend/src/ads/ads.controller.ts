import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AdsService } from './ads.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../admin/admin.guard';

@ApiTags('ads')
@Controller('ads')
export class AdsController {
    constructor(private readonly adsService: AdsService) {}

    @Get()
    findActive(@Query('placement') placement?: string) {
        return this.adsService.findActive(placement);
    }

    @Get('all')
    @UseGuards(JwtAuthGuard, AdminGuard)
    @ApiBearerAuth()
    findAll() {
        return this.adsService.findAll();
    }

    @Get('stats')
    @UseGuards(JwtAuthGuard, AdminGuard)
    @ApiBearerAuth()
    getStats() {
        return this.adsService.getStats();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.adsService.findOne(id);
    }

    @Post()
    @UseGuards(JwtAuthGuard, AdminGuard)
    @ApiBearerAuth()
    create(@Body() body: Partial<any>) {
        return this.adsService.create(body);
    }

    @Post(':id/impression')
    trackImpression(@Param('id') id: string) {
        return this.adsService.trackImpression(id);
    }

    @Post(':id/click')
    trackClick(@Param('id') id: string) {
        return this.adsService.trackClick(id);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, AdminGuard)
    @ApiBearerAuth()
    update(@Param('id') id: string, @Body() body: Partial<any>) {
        return this.adsService.update(id, body);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, AdminGuard)
    @ApiBearerAuth()
    remove(@Param('id') id: string) {
        return this.adsService.remove(id);
    }
}
