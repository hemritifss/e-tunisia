import { Controller, Get, Post, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ContactService } from './contact.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../admin/admin.guard';
import { ContactStatus } from './contact.entity';

@ApiTags('contact')
@Controller('contact')
export class ContactController {
    constructor(private readonly contactService: ContactService) {}

    @Post()
    create(@Body() body: Partial<any>) {
        return this.contactService.create(body);
    }

    @Get()
    @UseGuards(JwtAuthGuard, AdminGuard)
    @ApiBearerAuth()
    findAll() {
        return this.contactService.findAll();
    }

    @Get('pending')
    @UseGuards(JwtAuthGuard, AdminGuard)
    @ApiBearerAuth()
    findPending() {
        return this.contactService.findPending();
    }

    @Get('stats')
    @UseGuards(JwtAuthGuard, AdminGuard)
    @ApiBearerAuth()
    getStats() {
        return this.contactService.getStats();
    }

    @Patch(':id/status')
    @UseGuards(JwtAuthGuard, AdminGuard)
    @ApiBearerAuth()
    updateStatus(@Param('id') id: string, @Body() body: { status: ContactStatus; adminNotes?: string }) {
        return this.contactService.updateStatus(id, body.status, body.adminNotes);
    }
}
