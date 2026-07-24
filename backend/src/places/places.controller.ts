import {
    Controller, Get, Post, Put, Body, Param,
    Query, UseGuards, Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PlacesService } from './places.service';
import { CreatePlaceDto } from './dto/create-place.dto';
import { QueryPlacesDto } from './dto/query-places.dto';
import { IsIn, IsInt } from 'class-validator';
import { BOOST_TIERS } from './places.service';

class BoostListingDto {
    @IsInt()
    @IsIn([1, 7, 30])
    days: 1 | 7 | 30;
}

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

    // Must precede @Get(':id') — otherwise "suggest" is captured as an :id.
    @Get('suggest')
    @ApiOperation({ summary: 'Typeahead place-name suggestions (typo/accent tolerant)' })
    suggest(@Query('q') q: string, @Query('limit') limit?: string) {
        return this.placesService.suggest(q || '', limit ? Number(limit) : 8);
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

    @Get('mine')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: "Places submitted/owned by the current user" })
    listMine(@Request() req) {
        return this.placesService.listMine(req.user.id);
    }

    @Get('boost/tiers')
    @ApiOperation({ summary: 'Boost pricing tiers (credits per duration)' })
    boostTiers() {
        return Object.values(BOOST_TIERS);
    }

    @Post(':id/boost')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Boost a listing — deducts credits, stacks on top of any active boost' })
    boost(@Request() req, @Param('id') id: string, @Body() body: BoostListingDto) {
        return this.placesService.boostListing(id, req.user.id, body.days);
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
    create(@Request() req, @Body() dto: CreatePlaceDto) {
        // Attribute the creator (owner tools / partner flow). Community gems go
        // through POST /gems/submit, which adds dedup + AI enrich + confirmations.
        return this.placesService.create(dto, req.user?.id);
    }

    @Post('by-ids')
    @ApiOperation({ summary: 'Get places by array of IDs (for favorites)' })
    getByIds(@Body() body: { ids: string[] }) {
        return this.placesService.getByIds(body.ids);
    }
}