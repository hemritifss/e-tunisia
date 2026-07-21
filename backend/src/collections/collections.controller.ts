import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CollectionsService } from './collections.service';
import { CreateCollectionDto } from './dto/create-collection.dto';

@ApiTags('collections')
@Controller('collections')
export class CollectionsController {
    constructor(private collectionsService: CollectionsService) {}

    @Get()
    @ApiOperation({ summary: 'Get all public collections' })
    findAll() {
        return this.collectionsService.findAll();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get collection by ID' })
    findOne(@Param('id') id: string) {
        return this.collectionsService.findById(id);
    }

    @Post()
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create a new collection' })
    create(@Request() req, @Body() body: CreateCollectionDto) {
        return this.collectionsService.create(req.user.id, body);
    }

    @Post(':id/places/:placeId')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Add a place to collection' })
    addPlace(@Request() req, @Param('id') id: string, @Param('placeId') placeId: string) {
        return this.collectionsService.addPlace(id, placeId, req.user.id);
    }

    @Delete(':id/places/:placeId')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Remove a place from collection' })
    removePlace(@Request() req, @Param('id') id: string, @Param('placeId') placeId: string) {
        return this.collectionsService.removePlace(id, placeId, req.user.id);
    }

    // Guarded: bare counter increment with no per-user record (see tips/events).
    @Post(':id/like')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Like a collection' })
    like(@Param('id') id: string) {
        return this.collectionsService.like(id);
    }
}
