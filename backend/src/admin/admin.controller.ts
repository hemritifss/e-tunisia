import {
    Controller, Get, Patch, Delete, Param,
    Query, UseGuards, UseInterceptors, Body, Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from './admin.guard';
import { SuperAdminGuard } from './super-admin.guard';
import { AdminService } from './admin.service';
import { AuditInterceptor } from './audit.interceptor';
import { UpdateUserDto } from './dto/update-user.dto';
import { isSuperAdmin } from './is-super-admin';

@ApiTags('admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
@UseInterceptors(AuditInterceptor)
@ApiBearerAuth()
export class AdminController {
    constructor(private adminService: AdminService) {}

    // ─── DASHBOARD ──────────────────────────────────
    @Get('stats')
    @ApiOperation({ summary: 'Get dashboard stats' })
    getStats() {
        return this.adminService.getStats();
    }

    /** Who is the viewing admin + are they a super-admin? Drives UI gating. */
    @Get('me')
    @ApiOperation({ summary: 'Viewer admin identity' })
    me(@Request() req) {
        return { id: req.user.id, role: req.user.role, isSuperAdmin: isSuperAdmin(req.user) };
    }

    // ─── AUDIT LOG ──────────────────────────────────
    @Get('audit')
    @ApiOperation({ summary: 'Audit log of admin actions' })
    getAudit(@Query('page') page?: number, @Query('limit') limit?: number) {
        return this.adminService.getAudit(page, limit);
    }

    // ─── USERS ──────────────────────────────────
    @Get('users')
    @ApiOperation({ summary: 'List all users' })
    getUsers(@Query('page') page?: number, @Query('limit') limit?: number) {
        return this.adminService.getUsers(page, limit);
    }

    @Patch('users/:id')
    @ApiOperation({ summary: 'Update user (plan, profile fields — NOT role)' })
    updateUser(@Param('id') id: string, @Body() body: UpdateUserDto) {
        return this.adminService.updateUser(id, body as any);
    }

    @Patch('users/:id/role')
    @UseGuards(SuperAdminGuard)
    @ApiOperation({ summary: 'Grant/revoke a role (super-admin only)' })
    setUserRole(@Param('id') id: string, @Body() body: { role: string }) {
        return this.adminService.setUserRole(id, body?.role);
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

    // ─── REVIEWS ──────────────────────────────────
    @Get('reviews')
    @ApiOperation({ summary: 'List reviews (moderation queue)' })
    getReviews(@Query('page') page?: number, @Query('limit') limit?: number) {
        return this.adminService.getReviews(page, limit);
    }

    @Delete('reviews/:id')
    @ApiOperation({ summary: 'Delete a review' })
    deleteReview(@Param('id') id: string) {
        return this.adminService.deleteReview(id);
    }

    // ─── SUBSCRIPTIONS ──────────────────────────────────
    @Get('subscriptions')
    @ApiOperation({ summary: 'List all subscriptions' })
    getSubscriptions() {
        return this.adminService.getSubscriptions();
    }

    @Patch('subscriptions/:id/confirm')
    @ApiOperation({ summary: 'Confirm a pending (bank/cash) subscription → activate plan' })
    confirmSubscription(@Param('id') id: string) {
        return this.adminService.confirmSubscription(id);
    }

    @Patch('subscriptions/:id/reject')
    @ApiOperation({ summary: 'Reject/cancel a subscription' })
    rejectSubscription(@Param('id') id: string) {
        return this.adminService.rejectSubscription(id);
    }

    // ─── ANALYTICS ──────────────────────────────────
    @Get('analytics')
    @ApiOperation({ summary: 'Revenue + subscription analytics (MRR, by-plan, conversion)' })
    getAnalytics() {
        return this.adminService.getAnalytics();
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
