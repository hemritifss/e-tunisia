import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PushService } from './push.service';

class SubscribeDto {
  subscription: {
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
  };
}

class UnsubscribeDto {
  endpoint: string;
}

@ApiTags('push')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('push')
export class PushController {
  constructor(private pushService: PushService) {}

  @Post('subscribe')
  @ApiOperation({ summary: 'Subscribe to push notifications' })
  subscribe(@Request() req, @Body() dto: SubscribeDto) {
    return this.pushService.subscribe(req.user.id, dto.subscription);
  }

  @Post('unsubscribe')
  @ApiOperation({ summary: 'Unsubscribe from push notifications' })
  unsubscribe(@Request() req, @Body() dto: UnsubscribeDto) {
    return this.pushService.unsubscribe(req.user.id, dto.endpoint);
  }
}
