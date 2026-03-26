import { Controller, Get, Post, Body, Param, OnModuleInit } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';

@ApiTags('categories')
@Controller('categories')
export class CategoriesController implements OnModuleInit {
    constructor(private categoriesService: CategoriesService) { }

    async onModuleInit() {
        await this.categoriesService.seed();
    }

    @Get()
    @ApiOperation({ summary: 'Get all categories' })
    findAll() {
        return this.categoriesService.findAll();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get category by ID with places' })
    findOne(@Param('id') id: string) {
        return this.categoriesService.findById(id);
    }
}