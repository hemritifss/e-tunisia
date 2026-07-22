import { Body, Controller, Get, Param, Post, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BeachesService } from './beaches.service';

class BeachReportDto {
    @IsIn(['none', 'few', 'lots']) jellyfish: 'none' | 'few' | 'lots';
    @IsOptional() @IsIn(['clear', 'seaweed', 'murky']) water?: 'clear' | 'seaweed' | 'murky';
    @IsOptional() @IsIn(['empty', 'ok', 'packed']) crowd?: 'empty' | 'ok' | 'packed';
    @IsOptional() @IsString() @MaxLength(160) note?: string;
}

@ApiTags('beaches')
@Controller('beaches')
export class BeachesController {
    constructor(private readonly beaches: BeachesService) {}

    /** Public: every beach + its current condition (freshest report < 24h). */
    @Get()
    @ApiOperation({ summary: 'Beach conditions — famma 9nadel? (jellyfish/water/crowd)' })
    list(@Query('governorate') governorate?: string) {
        return this.beaches.list(governorate);
    }

    @Get(':placeId')
    @ApiOperation({ summary: 'One beach — current status + recent report timeline' })
    beach(@Param('placeId') placeId: string) {
        return this.beaches.beach(placeId);
    }

    @Post(':placeId/report')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Report beach conditions (+5 XP, throttled)' })
    report(@Request() req: any, @Param('placeId') placeId: string, @Body() dto: BeachReportDto) {
        return this.beaches.report(req.user.id, placeId, dto);
    }
}
