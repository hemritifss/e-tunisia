import {
    Controller,
    Get,
    Put,
    Body,
    Param,
    UseGuards,
    Request,
    Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from './users.service';

@ApiTags('users')
@Controller('users')
export class UsersController {
    constructor(private usersService: UsersService) { }

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Get('me')
    getProfile(@Request() req) {
        return this.usersService.findById(req.user.id);
    }

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Put('me')
    updateProfile(@Request() req, @Body() body: Partial<any>) {
        return this.usersService.update(req.user.id, body);
    }

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Post('favorites/:placeId')
    toggleFavorite(@Request() req, @Param('placeId') placeId: string) {
        return this.usersService.toggleFavorite(req.user.id, placeId);
    }

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Get('favorites')
    getFavorites(@Request() req) {
        return this.usersService.getFavoriteIds(req.user.id);
    }

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Post('visited/:placeId')
    toggleVisited(@Request() req, @Param('placeId') placeId: string) {
        return this.usersService.toggleVisited(req.user.id, placeId);
    }

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Get('visited')
    getVisited(@Request() req) {
        return this.usersService.getVisitedIds(req.user.id);
    }
}