import {
    Controller, Get, Patch, Delete, Param,
    Query, UseGuards, Body,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from './admin.guard';
import { AdminService } from './admin.service';

@ApiTags('admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth()
export class AdminController {
    constructor(private adminService: AdminService) {}

    // ─── DASHBOARD ──────────────────────────────────
    @Get('stats')
    @ApiOperation({ summary: 'Get dashboard stats' })
    getStats() {
        return this.adminService.getStats();
    }

    // ─── USERS ──────────────────────────────────
    @Get('users')
    @ApiOperation({ summary: 'List all users' })
    getUsers(@Query('page') page?: number, @Query('limit') limit?: number) {
        return this.adminService.getUsers(page, limit);
    }

    @Patch('users/:id')
    @ApiOperation({ summary: 'Update user (role, plan, etc.)' })
    updateUser(@Param('id') id: string, @Body() body: any) {
        return this.adminService.updateUser(id, body);
    }

    @Patch('users/:id/ban')
    @ApiOperation({ summary: 'Ban a user' })
    banUser(@Param('id') id: string) {
        return this.adminService.banUser(id);
    }

    @Patch('users/:id/unban')
    @ApiOperation({ summary: 'Unban a user' })
    unbanUser(@Param('id') id: string) {
        return this.adminService.unbanUser(id);
    }

    // ─── PLACES ──────────────────────────────────
    @Get('places')
    @ApiOperation({ summary: 'List all places (with optional pending filter)' })
    getPlaces(
        @Query('page') page?: number,
        @Query('limit') limit?: number,
        @Query('pendingOnly') pendingOnly?: string,
    ) {
        return this.adminService.getPlaces(page, limit, pendingOnly === 'true');
    }

    @Patch('places/:id/approve')
    @ApiOperation({ summary: 'Approve a place' })
    approvePlace(@Param('id') id: string) {
        return this.adminService.approvePlace(id);
    }

    @Patch('places/:id/feature')
    @ApiOperation({ summary: 'Toggle featured status' })
    toggleFeature(@Param('id') id: string) {
        return this.adminService.toggleFeature(id);
    }

    @Delete('places/:id')
    @ApiOperation({ summary: 'Delete a place' })
    deletePlace(@Param('id') id: string) {
        return this.adminService.deletePlace(id);
    }

    // ─── SUBSCRIPTIONS ──────────────────────────────────
    @Get('subscriptions')
    @ApiOperation({ summary: 'List all subscriptions' })
    getSubscriptions() {
        return this.adminService.getSubscriptions();
    }

    // ─── EVENTS ──────────────────────────────────
    @Get('events')
    @ApiOperation({ summary: 'List all events' })
    getEvents() {
        return this.adminService.getEvents();
    }

    @Patch('events/:id/toggle')
    @ApiOperation({ summary: 'Toggle event active status' })
    toggleEvent(@Param('id') id: string) {
        return this.adminService.toggleEventActive(id);
    }

    // ─── TIPS ──────────────────────────────────
    @Get('tips')
    @ApiOperation({ summary: 'List all tips' })
    getTips() {
        return this.adminService.getTips();
    }

    @Patch('tips/:id/toggle')
    @ApiOperation({ summary: 'Toggle tip approval' })
    toggleTip(@Param('id') id: string) {
        return this.adminService.toggleTipApproval(id);
    }
}
