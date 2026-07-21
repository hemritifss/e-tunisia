import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';

@ApiTags('events')
@Controller('events')
export class EventsController {
    constructor(private eventsService: EventsService) {}

    @Get()
    @ApiOperation({ summary: 'Get all events' })
    findAll(@Query('category') category?: string, @Query('city') city?: string) {
        return this.eventsService.findAll(category, city);
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
    create(@Request() req, @Body() body: CreateEventDto) {
        // DTO carries ISO strings (IsDateString); the entity wants real Dates.
        // Destructured out of the spread so their string types don't leak through.
        const { startDate, endDate, ...rest } = body;
        return this.eventsService.create(req.user.id, {
            ...rest,
            startDate: new Date(startDate),
            ...(endDate ? { endDate: new Date(endDate) } : {}),
        });
    }

    // Guarded: attendeeCount is a bare counter with no per-user record, so an
    // unauthenticated POST could inflate any event's attendance indefinitely.
    @Post(':id/attend')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Attend an event' })
    attend(@Param('id') id: string) {
        return this.eventsService.attend(id);
    }
}
