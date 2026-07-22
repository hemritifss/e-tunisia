import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ItinerariesService } from './itineraries.service';
import { CircuitsService } from './circuits.service';
import { CreateItineraryDto } from './dto/create-itinerary.dto';

@ApiTags('itineraries')
@Controller('itineraries')
export class ItinerariesController {
    constructor(
        private itinerariesService: ItinerariesService,
        private circuitsService: CircuitsService,
    ) {}

    @Get()
    @ApiOperation({ summary: 'Get all public itineraries' })
    findAll() {
        return this.itinerariesService.findAll();
    }

    // Declared before `:id` — otherwise the uuid route swallows "circuits".
    @Get('circuits')
    @ApiOperation({ summary: 'Curated circuits, hydrated from the live place catalog' })
    listCircuits() {
        return this.circuitsService.list();
    }

    @Get('circuits/:slug')
    @ApiOperation({ summary: 'One circuit with its day-by-day stops' })
    getCircuit(@Param('slug') slug: string) {
        return this.circuitsService.findOne(slug);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get itinerary by ID' })
    findOne(@Param('id') id: string) {
        return this.itinerariesService.findById(id);
    }

    @Post()
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create a new itinerary' })
    create(@Request() req, @Body() body: CreateItineraryDto) {
        // The entity's simple-json `days` requires every field; the DTO lets
        // clients omit the optional ones, so fill them in here. `days` is
        // destructured out of the spread so its loose type doesn't leak through.
        const { days, ...rest } = body;
        return this.itinerariesService.create(req.user.id, {
            ...rest,
            ...(days
                ? {
                    days: days.map((d) => ({
                        day: d.day,
                        title: d.title ?? '',
                        placeIds: d.placeIds ?? [],
                        notes: d.notes ?? '',
                    })),
                }
                : {}),
        });
    }

    // Guarded: bare counter increment with no per-user record (see tips/events).
    @Post(':id/like')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Like an itinerary' })
    like(@Param('id') id: string) {
        return this.itinerariesService.like(id);
    }
}
