import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../admin/admin.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';

@ApiTags('bookings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new booking' })
  create(@CurrentUser('id') userId: string, @Body() dto: CreateBookingDto) {
    return this.bookingsService.create(userId, dto);
  }

  @Get('my')
  @ApiOperation({ summary: 'Get my bookings' })
  findMyBookings(@CurrentUser('id') userId: string) {
    return this.bookingsService.findByUser(userId);
  }

  @Get('host')
  @ApiOperation({ summary: 'Get bookings for my places (host view)' })
  findHostBookings(@CurrentUser('id') userId: string) {
    return this.bookingsService.findByHost(userId);
  }

  @Get('place/:placeId')
  @ApiOperation({ summary: 'Get bookings for a place' })
  findByPlace(@Param('placeId') placeId: string) {
    return this.bookingsService.findByPlace(placeId);
  }

  @Get('owner/earnings')
  @ApiOperation({ summary: 'My payout ledger — earnings across my places (owed vs paid out)' })
  ownerEarnings(@CurrentUser('id') userId: string) {
    return this.bookingsService.getOwnerEarnings(userId);
  }

  @Patch(':id/settle-payout')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Record a manual payout to the host for this booking (admin)' })
  settlePayout(@Param('id') id: string) {
    return this.bookingsService.settlePayout(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get booking details' })
  findOne(@Param('id') id: string) {
    return this.bookingsService.findOne(id);
  }

  // IDOR fix: this only had the class-level JwtAuthGuard, so ANY logged-in user
  // could mark ANY pending booking as paid (no ownership check in the service).
  // It is webhook/internal by design — payment confirmation flows from the
  // Stripe webhook — so restrict it to admin, matching settle-payout above.
  @Patch(':id/confirm')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Confirm booking payment (webhook/internal, admin)' })
  confirmPayment(
    @Param('id') id: string,
    @Body('paymentIntentId') paymentIntentId: string,
  ) {
    return this.bookingsService.confirmPayment(id, paymentIntentId);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel a booking' })
  cancel(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body('reason') reason?: string,
  ) {
    return this.bookingsService.cancel(id, userId, reason);
  }

  // IDOR fix: completing a booking gates payout eligibility, but this had no
  // ownership check — any logged-in user could complete anyone's booking.
  @Patch(':id/complete')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Mark booking as completed (admin)' })
  complete(@Param('id') id: string) {
    return this.bookingsService.complete(id);
  }

  @Get('stats/revenue')
  @ApiOperation({ summary: 'Get revenue statistics' })
  getRevenueStats(@Query('placeId') placeId?: string) {
    return this.bookingsService.getRevenueStats(placeId);
  }
}
