import {
    Controller, Get, Post, Body, Param, UseGuards, Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ReviewsService } from './reviews.service';

@ApiTags('reviews')
@Controller('reviews')
export class ReviewsController {
    constructor(private reviewsService: ReviewsService) { }

    @Get('place/:placeId')
    @ApiOperation({ summary: 'Get reviews for a place' })
    findByPlace(@Param('placeId') placeId: string) {
        return this.reviewsService.findByPlace(placeId);
    }

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Post('place/:placeId')
    @ApiOperation({ summary: 'Add review to a place' })
    create(
        @Request() req,
        @Param('placeId') placeId: string,
        @Body() body: { rating: number; comment: string; images?: string[] },
    ) {
        return this.reviewsService.create(req.user.id, placeId, body);
    }

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Get('my')
    @ApiOperation({ summary: 'Get current user reviews' })
    getMyReviews(@Request() req) {
        return this.reviewsService.findByUser(req.user.id);
    }
}