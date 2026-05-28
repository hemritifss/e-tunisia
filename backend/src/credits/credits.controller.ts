import {
    Controller, Get, Post, Body, Query, UseGuards, Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, MaxLength, Max, Min } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreditsService } from './credits.service';
import { DonationTarget } from './donation.entity';

class DepositDto {
    @IsNumber()
    @Min(1)
    @Max(5000)
    amount: number;

    @IsOptional() @IsString() @MaxLength(200)
    note?: string;
}

class DonateDto {
    @IsEnum(DonationTarget)
    target: DonationTarget;

    @IsOptional() @IsString()
    toUserId?: string;

    @IsNumber()
    @Min(1)
    @Max(5000)
    amount: number;

    @IsOptional() @IsString() @MaxLength(280)
    message?: string;

    @IsOptional()
    isAnonymous?: boolean;
}

class GiftDto {
    @IsString() @MaxLength(40)
    giftId: string;

    @IsString()
    toUserId: string;

    @IsOptional()
    isAnonymous?: boolean;
}

@ApiTags('credits')
@Controller('credits')
export class CreditsController {
    constructor(private credits: CreditsService) {}

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Get('me')
    @ApiOperation({ summary: 'Get my credit balance + recent transactions' })
    balance(@Request() req) {
        return this.credits.getBalance(req.user.id);
    }

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Post('deposit')
    @ApiOperation({ summary: 'Top up credits (mock — no real payment yet)' })
    deposit(@Request() req, @Body() body: DepositDto) {
        return this.credits.deposit(req.user.id, body.amount, body.note);
    }

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Post('donate')
    @ApiOperation({ summary: 'Donate credits to a user or to the platform' })
    donate(@Request() req, @Body() body: DonateDto) {
        return this.credits.donate(req.user.id, {
            target: body.target,
            toUserId: body.toUserId,
            amount: Number(body.amount),
            message: body.message,
            isAnonymous: body.isAnonymous,
        });
    }

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Get('donations/sent')
    sent(@Request() req, @Query('limit') limit?: string) {
        return this.credits.listSent(req.user.id, limit ? Number(limit) : 25);
    }

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Get('donations/received')
    received(@Request() req, @Query('limit') limit?: string) {
        return this.credits.listReceived(req.user.id, limit ? Number(limit) : 25);
    }

    @Get('leaderboard')
    @ApiOperation({ summary: 'Top platform supporters + top tipped community members' })
    leaderboard(@Query('limit') limit?: string) {
        return this.credits.leaderboard(limit ? Number(limit) : 10);
    }

    @Get('gifts')
    @ApiOperation({ summary: 'Virtual gift catalog' })
    gifts() {
        return this.credits.listGifts();
    }

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Post('gift')
    @ApiOperation({ summary: 'Send a virtual gift to a user (a catalog-priced donation)' })
    sendGift(@Request() req, @Body() body: GiftDto) {
        return this.credits.sendGift(req.user.id, body.giftId, body.toUserId, !!body.isAnonymous);
    }

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Get('referral-stats')
    @ApiOperation({ summary: 'My referral counts (released + pending)' })
    referralStats(@Request() req) {
        return this.credits.referralStats(req.user.id);
    }
}
