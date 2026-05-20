import {
    Controller, Get, Post, Delete, Body, Param, Query, UseGuards, Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import {
    IsArray, IsInt, IsOptional, IsString, IsUUID, MaxLength, MinLength, Max, Min,
} from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ReviewsService } from './reviews.service';

class CreateReviewDto {
    @IsInt() @Min(1) @Max(5) rating: number;
    @IsString() @MinLength(1) @MaxLength(4000) comment: string;
    @IsOptional() @IsArray() @IsString({ each: true }) images?: string[];
    @IsOptional() @IsUUID() inquiryId?: string;
}

class HostReplyDto {
    @IsString() @MinLength(2) @MaxLength(2000) body: string;
}

@ApiTags('reviews')
@Controller('reviews')
export class ReviewsController {
    constructor(private reviewsService: ReviewsService) { }

    @Get('by-handle/:handle')
    @ApiOperation({ summary: 'Public reviews authored by the given user handle' })
    byHandle(@Param('handle') handle: string) {
        return this.reviewsService.listByHandle((handle || '').toLowerCase());
    }

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
    @ApiOperation({ summary: 'Add review to a place. Pass inquiryId for a verified-booking badge.' })
    create(
        @Request() req,
        @Param('placeId') placeId: string,
        @Body() body: CreateReviewDto,
    ) {
        return this.reviewsService.create(req.user.id, placeId, body);
    }

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Post(':id/reply')
    @ApiOperation({ summary: 'Place owner replies to a review' })
    hostReply(@Request() req, @Param('id') id: string, @Body() body: HostReplyDto) {
        return this.reviewsService.hostReply(id, req.user.id, body.body);
    }

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Delete(':id/reply')
    @ApiOperation({ summary: 'Place owner removes their reply' })
    deleteHostReply(@Request() req, @Param('id') id: string) {
        return this.reviewsService.deleteHostReply(id, req.user.id);
    }

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Get('my')
    @ApiOperation({ summary: 'Get current user reviews' })
    getMyReviews(@Request() req) {
        return this.reviewsService.findByUser(req.user.id);
    }
}