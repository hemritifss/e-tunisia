import {
    Controller, Get, Post, Put, Delete, Param, Body, Query, Request, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import {
    IsArray, IsBoolean, IsEmail, IsInt, IsOptional, IsString, IsUUID,
    IsDateString, MaxLength, Min, Max, MinLength, ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { TripsService } from './trips.service';

class StopDto {
    @IsUUID() placeId: string;
    @IsOptional() @IsUUID() packageId?: string;
    @IsOptional() @IsInt() @Min(0) @Max(29) dayIndex?: number;
    @IsOptional() @IsString() @MaxLength(5) timeSlot?: string; // "HH:MM"
}

class UpsertTripDto {
    @IsOptional() @IsString() @MaxLength(200) title?: string;
    @IsOptional() @IsInt() @Min(1) @Max(50) travelers?: number;
    @IsOptional() @IsString() @MaxLength(8) currency?: string;
    @IsOptional() @IsInt() @Min(1) @Max(30) days?: number;
    @IsOptional() @IsString() @MaxLength(10) startDate?: string; // "YYYY-MM-DD"
    @IsOptional() @IsBoolean() isPublic?: boolean;
    @IsArray() @ValidateNested({ each: true }) @Type(() => StopDto)
    stops: StopDto[];
}

class BatchInquiryDto {
    @IsString() @MinLength(1) @MaxLength(120) name: string;
    @IsEmail() @MaxLength(200) email: string;
    @IsOptional() @IsString() @MaxLength(40) phone?: string;
    @IsOptional() @IsDateString() dateFrom?: string;
    @IsOptional() @IsDateString() dateTo?: string;
    @IsOptional() @IsInt() @Min(0) budget?: number;
    @IsString() @MinLength(5) @MaxLength(2000) message: string;
}

@ApiTags('trips')
@Controller('trips')
export class TripsController {
    constructor(private trips: TripsService) {}

    @Post()
    @UseGuards(OptionalJwtAuthGuard)
    @ApiOperation({ summary: 'Save a trip plan. Anonymous users get an unowned shareable slug.' })
    create(@Request() req, @Body() body: UpsertTripDto) {
        const userId = req?.user?.id || null;
        return this.trips.create(userId, body);
    }

    @Get('mine')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'List my saved trips' })
    listMine(@Request() req) {
        return this.trips.listMine(req.user.id);
    }

    @Get('discover')
    @ApiOperation({ summary: 'Public list of community trip plans (most popular first)' })
    @ApiQuery({ name: 'page', required: false })
    @ApiQuery({ name: 'limit', required: false })
    @ApiQuery({ name: 'city', required: false, description: 'Match any city in the trip' })
    @ApiQuery({ name: 'minDays', required: false })
    @ApiQuery({ name: 'maxDays', required: false })
    @ApiQuery({ name: 'sort', required: false, enum: ['popular', 'new'] })
    discover(
        @Query('page')    page?: string,
        @Query('limit')   limit?: string,
        @Query('city')    city?: string,
        @Query('minDays') minDays?: string,
        @Query('maxDays') maxDays?: string,
        @Query('sort')    sort?: 'popular' | 'new',
    ) {
        return this.trips.discover({
            page:    page    ? Number(page)    : undefined,
            limit:   limit   ? Number(limit)   : undefined,
            city:    city,
            minDays: minDays ? Number(minDays) : undefined,
            maxDays: maxDays ? Number(maxDays) : undefined,
            sort,
        });
    }

    @Get('by-handle/:handle')
    @ApiOperation({ summary: 'Public trips authored by the given user handle' })
    byHandle(@Param('handle') handle: string) {
        return this.trips.listByHandle((handle || '').toLowerCase());
    }

    @Get(':slug')
    @UseGuards(OptionalJwtAuthGuard)
    @ApiOperation({ summary: 'Read a trip by its public slug' })
    one(@Request() req, @Param('slug') slug: string) {
        return this.trips.findBySlug(slug, req?.user?.id || null);
    }

    @Put(':slug')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update a trip (owner or co-planner)' })
    update(@Request() req, @Param('slug') slug: string, @Body() body: UpsertTripDto) {
        return this.trips.update(slug, req.user.id, body);
    }

    // ── Collaborative planning ─────────────────────────────────────────────

    @Post(':slug/invite')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get/mint the invite code for co-planning (owner only)' })
    invite(@Request() req, @Param('slug') slug: string) {
        return this.trips.ensureInviteCode(slug, req.user.id);
    }

    @Post(':slug/join')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Join a trip as co-planner via its invite code' })
    join(@Request() req, @Param('slug') slug: string, @Body('code') code: string) {
        return this.trips.join(slug, req.user.id, code);
    }

    @Get(':slug/members')
    @UseGuards(OptionalJwtAuthGuard)
    @ApiOperation({ summary: 'Who is planning this trip (owner + co-planners)' })
    members(@Request() req, @Param('slug') slug: string) {
        return this.trips.listMembers(slug, req?.user?.id);
    }

    @Post(':slug/inquiry')
    @UseGuards(OptionalJwtAuthGuard)
    @ApiOperation({ summary: 'Fan-out one inquiry per stop in the trip (guests allowed)' })
    batchInquire(@Request() req, @Param('slug') slug: string, @Body() body: BatchInquiryDto) {
        const userId = req?.user?.id || null;
        return this.trips.batchInquire(slug, userId, body);
    }

    @Delete(':slug')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Delete a trip (owner only)' })
    remove(@Request() req, @Param('slug') slug: string) {
        return this.trips.remove(slug, req.user.id);
    }
}
