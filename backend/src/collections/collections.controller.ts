import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CollectionsService } from './collections.service';

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
    create(@Request() req, @Body() body: any) {
        return this.collectionsService.create(req.user.id, body);
    }

    @Post(':id/places/:placeId')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Add a place to collection' })
    addPlace(@Param('id') id: string, @Param('placeId') placeId: string) {
        return this.collectionsService.addPlace(id, placeId);
    }

    @Delete(':id/places/:placeId')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Remove a place from collection' })
    removePlace(@Param('id') id: string, @Param('placeId') placeId: string) {
        return this.collectionsService.removePlace(id, placeId);
    }

    @Post(':id/like')
    @ApiOperation({ summary: 'Like a collection' })
    like(@Param('id') id: string) {
        return this.collectionsService.like(id);
    }
}
