import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EventsService } from './events.service';

@ApiTags('events')
@Controller('events')
export class EventsController {
    constructor(private eventsService: EventsService) {}

    @Get()
    @ApiOperation({ summary: 'Get all events' })
    findAll(@Query('category') category?: string) {
        return this.eventsService.findAll(category);
    }

    @Get('upcoming')
    @ApiOperation({ summary: 'Get upcoming events' })
    getUpcoming() {
        return this.eventsService.findUpcoming();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get event by ID' })
    findOne(@Param('id') id: string) {
        return this.eventsService.findById(id);
    }

    @Post()
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create a new event' })
    create(@Request() req, @Body() body: any) {
        return this.eventsService.create(req.user.id, body);
    }

    @Post(':id/attend')
    @ApiOperation({ summary: 'Attend an event' })
    attend(@Param('id') id: string) {
        return this.eventsService.attend(id);
    }
}
