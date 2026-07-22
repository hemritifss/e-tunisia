import { Body, Controller, ForbiddenException, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { IsBooleanString, IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';
import { MappingService } from './mapping.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';

class CreateEventDto {
    @IsString() @MaxLength(80) slug: string;
    @IsString() @MaxLength(120) title: string;
    @IsOptional() @IsString() @MaxLength(240) subtitle?: string;
    @IsDateString() startsAt: string;
    @IsDateString() endsAt: string;
    @IsOptional() @IsString() @MaxLength(2000) prizes?: string;
    @IsOptional() featured?: boolean;
}

@Controller('mapping-weekend')
export class MappingController {
    constructor(private readonly mapping: MappingService) {}

    /** Live standings for the featured event. Auth is optional — a signed-in
     *  viewer also gets their personal rank (`me`). */
    @Get()
    @UseGuards(OptionalJwtAuthGuard)
    standings(@Request() req) {
        return this.mapping.standings(undefined, req.user?.id);
    }

    @Get(':slug')
    @UseGuards(OptionalJwtAuthGuard)
    bySlug(@Param('slug') slug: string, @Request() req) {
        return this.mapping.standings(slug, req.user?.id);
    }

    /** Admin: schedule the featured event. */
    @Post()
    @UseGuards(JwtAuthGuard)
    create(@Request() req, @Body() dto: CreateEventDto) {
        if (req.user?.role !== 'admin') throw new ForbiddenException('Admins only');
        return this.mapping.create(dto);
    }
}
