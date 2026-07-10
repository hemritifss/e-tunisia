import { Body, Controller, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, IsUUID, MaxLength, MinLength, IsArray } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { GemsService } from './gems.service';

class SubmitGemDto {
    @IsString() @MinLength(2) @MaxLength(120) name: string;
    /** The one-liner ("go at sunset, park at the mosque"). */
    @IsString() @MinLength(5) @MaxLength(300) description: string;
    @IsNumber() latitude: number;
    @IsNumber() longitude: number;
    @IsOptional() @IsArray() images?: string[];
    @IsOptional() @IsString() @MaxLength(100) city?: string;
    @IsOptional() @IsString() @MaxLength(100) governorate?: string;
    @IsOptional() @IsUUID() categoryId?: string;
}

@ApiTags('gems')
@Controller('gems')
export class GemsController {
    constructor(private readonly gems: GemsService) {}

    /** Photo → pin → one line. AI enriches; goes live after 2 community confirmations. */
    @Post('submit')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Submit a hidden gem (community place, pending until confirmed)' })
    submit(@Request() req: any, @Body() dto: SubmitGemDto) {
        return this.gems.submit(req.user.id, dto);
    }

    @Post(':placeId/confirm')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Confirm a gem — still exists, still worth it (+10 XP)' })
    confirm(@Request() req: any, @Param('placeId') placeId: string) {
        return this.gems.confirm(placeId, req.user.id);
    }

    @Get('completeness')
    @ApiOperation({ summary: 'The completeness game — % mapped per governorate' })
    completeness() {
        return this.gems.completeness();
    }

    @Get(':placeId/status')
    @UseGuards(OptionalJwtAuthGuard)
    @ApiOperation({ summary: 'Confirmation status for a place' })
    status(@Request() req: any, @Param('placeId') placeId: string) {
        return this.gems.status(placeId, req.user?.id);
    }
}
