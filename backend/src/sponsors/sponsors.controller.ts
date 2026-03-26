import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { SponsorsService } from './sponsors.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../admin/admin.guard';

@ApiTags('sponsors')
@Controller('sponsors')
export class SponsorsController {
    constructor(private readonly sponsorsService: SponsorsService) {}

    @Get()
    findActive() {
        return this.sponsorsService.findActive();
    }

    @Get('all')
    @UseGuards(JwtAuthGuard, AdminGuard)
    @ApiBearerAuth()
    findAll() {
        return this.sponsorsService.findAll();
    }

    @Get('stats')
    @UseGuards(JwtAuthGuard, AdminGuard)
    @ApiBearerAuth()
    getStats() {
        return this.sponsorsService.getStats();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.sponsorsService.findOne(id);
    }

    @Post()
    @UseGuards(JwtAuthGuard, AdminGuard)
    @ApiBearerAuth()
    create(@Body() body: Partial<any>) {
        return this.sponsorsService.create(body);
    }

    @Post(':id/click')
    trackClick(@Param('id') id: string) {
        return this.sponsorsService.trackClick(id);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, AdminGuard)
    @ApiBearerAuth()
    update(@Param('id') id: string, @Body() body: Partial<any>) {
        return this.sponsorsService.update(id, body);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, AdminGuard)
    @ApiBearerAuth()
    remove(@Param('id') id: string) {
        return this.sponsorsService.remove(id);
    }
}
