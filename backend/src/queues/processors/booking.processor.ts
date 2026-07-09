import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from 'bullmq';
import { Booking } from '../../bookings/booking.entity';
import { EmailService } from '../../email/email.service';
import { PushService } from '../../push/push.service';
import { UsersService } from '../../users/users.service';

interface ConfirmBookingData {
  bookingId: string;
  paymentIntentId: string;
  userEmail?: string;
  userId?: string;
}

interface ReminderData {
  bookingId: string;
  hoursBefore: number;
}

interface CancelBookingData {
  bookingId: string;
  reason?: string;
  userEmail?: string;
  userId?: string;
  refundAmount?: number;
}

@Processor('bookings')
export class BookingProcessor extends WorkerHost {
  private readonly logger = new Logger(BookingProcessor.name);

  constructor(
    @InjectRepository(Booking)
    private bookingRepo: Repository<Booking>,
    private emailService: EmailService,
    private pushService: PushService,
    private usersService: UsersService,
  ) {
    super();
  }

  async process(job: Job<ConfirmBookingData | ReminderData | CancelBookingData>): Promise<any> {
    const { name, data, id } = job;
    this.logger.debug(`Processing booking job ${id} (${name})`);

    try {
      switch (name) {
        case 'confirm':
          return await this.handleConfirm(data as ConfirmBookingData);
        case 'reminder':
          return await this.handleReminder(data as ReminderData);
        case 'cancel':
          return await this.handleCancel(data as CancelBookingData);
        default:
          this.logger.warn(`Unknown booking job type: ${name}`);
          return { skipped: true };
      }
    } catch (error: any) {
      this.logger.error(`Booking job ${id} failed: ${error.message}`);
      throw error;
    }
  }

  private async handleConfirm(data: ConfirmBookingData): Promise<any> {
    const booking = await this.bookingRepo.findOne({
      where: { id: data.bookingId },
      relations: ['place', 'user'],
    });

    if (!booking) {
      throw new Error(`Booking ${data.bookingId} not found`);
    }

    // Send confirmation email
    const email = data.userEmail || booking.user?.email;
    if (email) {
      try {
        await this.emailService.sendBookingConfirmation(email, {
          bookingId: booking.id,
          placeName: booking.place?.name || 'Your booking',
          checkIn: new Date(booking.checkIn).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
          checkOut: booking.checkOut
            ? new Date(booking.checkOut).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
            : undefined,
          guests: booking.guests,
          totalAmount: booking.totalAmount,
          currency: booking.currency,
        });
      } catch (emailError: any) {
        this.logger.warn(`Failed to send confirmation email: ${emailError.message}`);
      }
    }

    // Send push notification
    const userId = data.userId || booking.userId;
    if (userId) {
      try {
        await this.pushService.sendToUser(userId, {
          title: 'Booking Confirmed ✅',
          body: `Your reservation at ${booking.place?.name || 'your destination'} is confirmed!`,
          icon: '/icon-192x192.png',
          url: `/bookings`,
        });
      } catch (pushError: any) {
        this.logger.warn(`Failed to send push notification: ${pushError.message}`);
      }
    }

    this.logger.log(`Booking ${data.bookingId} confirmation processed`);
    return { confirmed: true, bookingId: booking.id };
  }

  private async handleReminder(data: ReminderData): Promise<any> {
    const booking = await this.bookingRepo.findOne({
      where: { id: data.bookingId },
      relations: ['place'],
    });

    if (!booking) {
      throw new Error(`Booking ${data.bookingId} not found`);
    }

    if (booking.status !== 'confirmed' && booking.status !== 'paid') {
      this.logger.debug(`Skipping reminder for booking ${data.bookingId} (status: ${booking.status})`);
      return { skipped: true, reason: 'not_confirmed' };
    }

    try {
      await this.pushService.sendToUser(booking.userId, {
        title: `⏰ Upcoming Trip — ${data.hoursBefore}h reminder`,
        body: `Your stay at ${booking.place?.name || 'your destination'} starts soon!`,
        icon: '/icon-192x192.png',
        url: `/bookings`,
      });
    } catch (pushError: any) {
      this.logger.warn(`Failed to send reminder push: ${pushError.message}`);
    }

    this.logger.log(`Reminder sent for booking ${data.bookingId}`);
    return { reminded: true, bookingId: booking.id };
  }

  private async handleCancel(data: CancelBookingData): Promise<any> {
    const booking = await this.bookingRepo.findOne({
      where: { id: data.bookingId },
      relations: ['place'],
    });

    if (!booking) {
      throw new Error(`Booking ${data.bookingId} not found`);
    }

    const email = data.userEmail || booking.user?.email;
    if (email) {
      try {
        const refundText = data.refundAmount && data.refundAmount > 0
          ? `A refund of ${data.refundAmount.toFixed(2)} ${booking.currency} will be processed within 5-10 business days.`
          : 'No refund is applicable based on the cancellation policy.';

        await this.emailService.send({
          to: email,
          subject: `Your booking has been cancelled`,
          html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Booking Cancelled</title></head>
<body style="font-family:system-ui,sans-serif;background:#f4f4f4;padding:40px 20px;">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:12px;padding:32px;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
    <h2 style="color:#1a1a1a;margin-top:0;">Booking Cancelled</h2>
    <p style="color:#555;line-height:1.6;">Your reservation at <strong>${booking.place?.name || 'your destination'}</strong> has been cancelled.</p>
    ${data.reason ? `<p style="color:#555;"><strong>Reason:</strong> ${data.reason}</p>` : ''}
    <p style="color:#555;line-height:1.6;">${refundText}</p>
    <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
    <p style="color:#aaa;font-size:12px;">e-Tunisia — Discover Tunisia</p>
  </div>
</body>
</html>`,
        });
      } catch (emailError: any) {
        this.logger.warn(`Failed to send cancellation email: ${emailError.message}`);
      }
    }

    this.logger.log(`Booking ${data.bookingId} cancellation processed`);
    return { cancelled: true, bookingId: booking.id };
  }
}
