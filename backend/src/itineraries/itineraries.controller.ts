import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ItinerariesService } from './itineraries.service';

@ApiTags('itineraries')
@Controller('itineraries')
export class ItinerariesController {
    constructor(private itinerariesService: ItinerariesService) {}

    @Get()
    @ApiOperation({ summary: 'Get all public itineraries' })
    findAll() {
        return this.itinerariesService.findAll();
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
    create(@Request() req, @Body() body: any) {
        return this.itinerariesService.create(req.user.id, body);
    }

    @Post(':id/like')
    @ApiOperation({ summary: 'Like an itinerary' })
    like(@Param('id') id: string) {
        return this.itinerariesService.like(id);
    }
}
