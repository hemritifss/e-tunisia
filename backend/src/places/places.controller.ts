import {
    Controller, Get, Post, Put, Body, Param,
    Query, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PlacesService } from './places.service';
import { CreatePlaceDto } from './dto/create-place.dto';
import { QueryPlacesDto } from './dto/query-places.dto';

@ApiTags('places')
@Controller('places')
export class PlacesController {
    constructor(private placesService: PlacesService) { }

    @Get()
    @ApiOperation({ summary: 'Get all places with filters and pagination' })
    findAll(@Query() query: QueryPlacesDto) {
        return this.placesService.findAll(query);
    }

    @Get('featured')
    @ApiOperation({ summary: 'Get featured places' })
    getFeatured() {
        return this.placesService.getFeatured();
    }

    @Get('popular')
    @ApiOperation({ summary: 'Get most popular places' })
    getPopular() {
        return this.placesService.getPopular();
    }

    @Get('nearby')
    @ApiOperation({ summary: 'Get nearby places' })
    getNearby(
        @Query('lat') lat: number,
        @Query('lng') lng: number,
        @Query('radius') radius?: number,
    ) {
        return this.placesService.getNearby(lat, lng, radius);
    }

    @Get('slug/:slug')
    @ApiOperation({ summary: 'Get place by slug' })
    findBySlug(@Param('slug') slug: string) {
        return this.placesService.findBySlug(slug);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get place by ID' })
    findOne(@Param('id') id: string) {
        return this.placesService.findById(id);
    }

    @Post()
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create a new place' })
    create(@Body() dto: CreatePlaceDto) {
        return this.placesService.create(dto);
    }

    @Post('by-ids')
    @ApiOperation({ summary: 'Get places by array of IDs (for favorites)' })
    getByIds(@Body() body: { ids: string[] }) {
        return this.placesService.getByIds(body.ids);
    }
}