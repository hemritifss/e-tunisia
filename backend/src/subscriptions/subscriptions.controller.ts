import { Controller, Get, Post, Body, UseGuards, Request, Delete } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SubscriptionsService } from './subscriptions.service';

@ApiTags('subscriptions')
@Controller('subscriptions')
export class SubscriptionsController {
    constructor(private subsService: SubscriptionsService) {}

    @Get('my')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get my active subscription' })
    getMySubscription(@Request() req) {
        return this.subsService.getMySubscription(req.user.id);
    }

    @Post('upgrade')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Upgrade subscription plan' })
    upgrade(@Request() req, @Body() body: { plan: string; paymentMethod: string; reference?: string }) {
        return this.subsService.upgrade(req.user.id, body.plan, body.paymentMethod, body.reference);
    }

    @Delete('cancel')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Cancel subscription' })
    cancel(@Request() req) {
        return this.subsService.cancel(req.user.id);
    }
}
