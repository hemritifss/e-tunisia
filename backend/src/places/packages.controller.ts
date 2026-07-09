import {
    Controller, Get, Post, Put, Delete, Param, Body, Request, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import {
    IsArray, IsInt, IsOptional, IsString, MaxLength, MinLength, Min, Max,
    IsBoolean,
} from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PackagesService } from './packages.service';

class CreatePackageDto {
    @IsString() @MinLength(1) @MaxLength(200) title: string;
    @IsString() @MinLength(1) @MaxLength(4000) description: string;
    @IsInt() @Min(0) pricePerPerson: number;
    @IsOptional() @IsString() @MaxLength(8) currency?: string;
    @IsOptional() @IsInt() @Min(1) @Max(60)  durationDays?: number;
    @IsOptional() @IsInt() @Min(1) @Max(50)  minPartySize?: number;
    @IsOptional() @IsInt() @Min(1) @Max(100) maxPartySize?: number;
    @IsOptional() @IsArray() @IsString({ each: true }) includes?: string[];
    @IsOptional() @IsArray() @IsString({ each: true }) images?: string[];
    @IsOptional() @IsString() @MaxLength(60) badge?: string;
}

class UpdatePackageDto {
    @IsOptional() @IsString() @MinLength(1) @MaxLength(200) title?: string;
    @IsOptional() @IsString() @MinLength(1) @MaxLength(4000) description?: string;
    @IsOptional() @IsInt() @Min(0) pricePerPerson?: number;
    @IsOptional() @IsString() @MaxLength(8) currency?: string;
    @IsOptional() @IsInt() @Min(1) @Max(60)  durationDays?: number;
    @IsOptional() @IsInt() @Min(1) @Max(50)  minPartySize?: number;
    @IsOptional() @IsInt() @Min(1) @Max(100) maxPartySize?: number;
    @IsOptional() @IsArray() @IsString({ each: true }) includes?: string[];
    @IsOptional() @IsArray() @IsString({ each: true }) images?: string[];
    @IsOptional() @IsString() @MaxLength(60) badge?: string;
    @IsOptional() @IsBoolean() isActive?: boolean;
}

@ApiTags('packages')
@Controller()
export class PackagesController {
    constructor(private packages: PackagesService) {}

    @Get('places/:id/packages')
    @ApiOperation({ summary: 'List active tour packages for a place' })
    listForPlace(@Param('id') id: string) {
        return this.packages.listForPlace(id);
    }

    @Get('packages/:id')
    @ApiOperation({ summary: 'Get a tour package by ID' })
    findOne(@Param('id') id: string) {
        return this.packages.findOne(id);
    }

    @Post('places/:id/packages')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create a tour package (place owner only)' })
    create(@Request() req, @Param('id') id: string, @Body() body: CreatePackageDto) {
        return this.packages.create(id, req.user.id, body);
    }

    @Put('packages/:id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update a tour package (place owner only)' })
    update(@Request() req, @Param('id') id: string, @Body() body: UpdatePackageDto) {
        return this.packages.update(id, req.user.id, body);
    }

    @Delete('packages/:id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Soft-delete a tour package (place owner only)' })
    remove(@Request() req, @Param('id') id: string) {
        return this.packages.remove(id, req.user.id);
    }
}
