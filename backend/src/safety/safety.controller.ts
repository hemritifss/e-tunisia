import {
    Controller, Get, Post, Delete, Body, Param, UseGuards, Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SafetyService } from './safety.service';
import { ReportReason, ReportTargetType } from './report.entity';

class ReportDto {
    @IsEnum(ReportTargetType)
    targetType: ReportTargetType;

    @IsString()
    targetId: string;

    @IsEnum(ReportReason)
    reason: ReportReason;

    @IsOptional() @IsString() @MaxLength(600)
    details?: string;

    @IsOptional() @IsString()
    targetOwnerId?: string;
}

@ApiTags('safety')
@Controller('safety')
export class SafetyController {
    constructor(private safety: SafetyService) {}

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Post('block/:userId')
    @ApiOperation({ summary: 'Block a user' })
    block(@Request() req, @Param('userId') userId: string) {
        return this.safety.block(req.user.id, userId);
    }

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Delete('block/:userId')
    @ApiOperation({ summary: 'Unblock a user' })
    unblock(@Request() req, @Param('userId') userId: string) {
        return this.safety.unblock(req.user.id, userId);
    }

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Get('is-blocked/:userId')
    isBlocked(@Request() req, @Param('userId') userId: string) {
        return this.safety.isBlocked(req.user.id, userId);
    }

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Get('blocks')
    @ApiOperation({ summary: 'List users I have blocked' })
    listBlocks(@Request() req) {
        return this.safety.listBlocked(req.user.id);
    }

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Post('report')
    @ApiOperation({ summary: 'Report content or a user' })
    report(@Request() req, @Body() body: ReportDto) {
        return this.safety.report(req.user.id, body);
    }

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Get('reports/mine')
    listMyReports(@Request() req) {
        return this.safety.listMyReports(req.user.id);
    }
}
