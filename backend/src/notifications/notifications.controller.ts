import { Controller, Get, Patch, Delete, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) {}

    @Get()
    findMine(@Request() req: any) {
        return this.notificationsService.findByUser(req.user.id);
    }

    @Get('unread-count')
    getUnreadCount(@Request() req: any) {
        return this.notificationsService.getUnreadCount(req.user.id);
    }

    @Patch(':id/read')
    markRead(@Param('id') id: string, @Request() req: any) {
        return this.notificationsService.markRead(id, req.user.id);
    }

    @Patch('read-all')
    markAllRead(@Request() req: any) {
        return this.notificationsService.markAllRead(req.user.id);
    }

    @Delete(':id')
    remove(@Param('id') id: string, @Request() req: any) {
        return this.notificationsService.remove(id, req.user.id);
    }
}
