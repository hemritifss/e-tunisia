import {
    Controller, Get, Post, Body, Param, Query, UseGuards, Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ReviewsService } from './reviews.service';

@ApiTags('reviews')
@Controller('reviews')
export class ReviewsController {
    constructor(private reviewsService: ReviewsService) { }

    @Get('feed')
    @ApiOperation({ summary: 'Get reviews shaped as posts for the social feed' })
    @ApiQuery({ name: 'page', required: false })
    @ApiQuery({ name: 'limit', required: false })
    @ApiQuery({ name: 'sort', required: false, enum: ['new', 'top', 'hot'] })
    findFeed(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('sort') sort?: 'new' | 'top' | 'hot',
    ) {
        return this.reviewsService.findFeed({
            page: page ? Number(page) : undefined,
            limit: limit ? Number(limit) : undefined,
            sort,
        });
    }

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