import {
  Controller,
  Post,
  Get,
  Body,
  Headers,
  RawBody,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaymentsService } from './payments.service';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('intent')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a payment intent' })
  async createIntent(
    @Body('amount') amount: number,
    @Body('currency') currency: string,
    @Body('metadata') metadata?: Record<string, string>,
  ) {
    return this.paymentsService.createPaymentIntent(amount, currency, metadata);
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Stripe webhook handler' })
  async handleWebhook(
    @RawBody() payload: Buffer,
    @Headers('stripe-signature') signature: string,
  ) {
    const event = await this.paymentsService.constructWebhookEvent(payload, signature);

    switch (event.type) {
      case 'payment_intent.succeeded':
        // Update booking status
        break;
      case 'payment_intent.payment_failed':
        // Handle failed payment
        break;
      case 'charge.refunded':
        // Handle refund
        break;
    }

    return { received: true };
  }

  @Get('balance')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get platform balance' })
  async getBalance() {
    return this.paymentsService.getBalance();
  }
}
