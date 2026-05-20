import {
    Controller, Post, Get, Patch, Param, Body, Query,
    Request, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import {
    IsEmail, IsInt, IsOptional, IsString, MaxLength, MinLength, Min, Max, IsDateString, IsEnum, IsUUID,
} from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { InquiriesService } from './inquiries.service';
import { InquiryStatus } from './place-inquiry.entity';

class CreateInquiryDto {
    @IsString() @MinLength(1) @MaxLength(120) name: string;
    @IsEmail() @MaxLength(200) email: string;
    @IsOptional() @IsString() @MaxLength(40) phone?: string;
    @IsOptional() @IsInt() @Min(1) @Max(50) partySize?: number;
    @IsOptional() @IsDateString() dateFrom?: string;
    @IsOptional() @IsDateString() dateTo?: string;
    @IsOptional() @IsInt() @Min(0) budget?: number;
    @IsOptional() @IsString() @MaxLength(8) currency?: string;
    @IsString() @MinLength(5) @MaxLength(2000) message: string;
    @IsOptional() @IsString() @MaxLength(80) source?: string;
    @IsOptional() @IsUUID() packageId?: string;
}

class UpdateInquiryStatusDto {
    @IsEnum(InquiryStatus) status: InquiryStatus;
}

@ApiTags('inquiries')
@Controller()
export class InquiriesController {
    constructor(private inquiries: InquiriesService) {}

    @Post('places/:id/inquiries')
    @UseGuards(OptionalJwtAuthGuard)
    @ApiOperation({ summary: 'Submit a quote/booking inquiry for a place. Guests allowed.' })
    submit(@Request() req, @Param('id') id: string, @Body() body: CreateInquiryDto) {
        const userId = req?.user?.id || null;
        return this.inquiries.submit(id, userId, body);
    }

    @Get('inquiries/mine')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'List inquiries I submitted' })
    @ApiQuery({ name: 'page', required: false })
    @ApiQuery({ name: 'limit', required: false })
    listMine(@Request() req, @Query('page') page?: string, @Query('limit') limit?: string) {
        return this.inquiries.listMine(req.user.id, {
            page: page ? Number(page) : undefined,
            limit: limit ? Number(limit) : undefined,
        });
    }

    @Get('inquiries/received')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'List inquiries received on places I own' })
    listReceived(@Request() req, @Query('page') page?: string, @Query('limit') limit?: string) {
        return this.inquiries.listReceived(req.user.id, {
            page: page ? Number(page) : undefined,
            limit: limit ? Number(limit) : undefined,
        });
    }

    @Get('inquiries/stats')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Inquiry pipeline stats for places I own (owner dashboard)' })
    stats(@Request() req) {
        return this.inquiries.statsForOwner(req.user.id);
    }

    @Get('inquiries/breakdown')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Inquiry breakdown by source + package (owner analytics)' })
    breakdown(@Request() req) {
        return this.inquiries.breakdownForOwner(req.user.id);
    }

    @Patch('inquiries/:id/status')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update inquiry status (place owner only)' })
    updateStatus(@Request() req, @Param('id') id: string, @Body() body: UpdateInquiryStatusDto) {
        return this.inquiries.updateStatus(id, req.user.id, body.status);
    }
}
