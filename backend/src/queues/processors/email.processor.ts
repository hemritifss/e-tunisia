import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { EmailService } from '../../email/email.service';

interface PasswordResetData {
  email: string;
  token: string;
  frontendUrl?: string;
}

interface WelcomeData {
  email: string;
  name: string;
}

interface BookingConfirmationData {
  email: string;
  bookingId: string;
  placeName: string;
  checkIn: string;
  checkOut?: string;
  guests: number;
  totalAmount: number;
  currency: string;
}

type EmailJobData = PasswordResetData | WelcomeData | BookingConfirmationData;

@Processor('emails')
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(private emailService: EmailService) {
    super();
  }

  async process(job: Job<EmailJobData>): Promise<any> {
    const { name, data, id } = job;
    this.logger.debug(`Processing email job ${id} (${name})`);

    try {
      switch (name) {
        case 'password_reset': {
          const d = data as PasswordResetData;
          await this.emailService.sendPasswordReset(d.email, d.token, d.frontendUrl);
          this.logger.log(`Password reset email sent to ${d.email}`);
          return { sent: true, type: 'password_reset' };
        }
        case 'welcome': {
          const d = data as WelcomeData;
          await this.emailService.sendWelcome(d.email, d.name);
          this.logger.log(`Welcome email sent to ${d.email}`);
          return { sent: true, type: 'welcome' };
        }
        case 'booking_confirmation': {
          const d = data as BookingConfirmationData;
          await this.emailService.sendBookingConfirmation(d.email, {
            bookingId: d.bookingId,
            placeName: d.placeName,
            checkIn: d.checkIn,
            checkOut: d.checkOut,
            guests: d.guests,
            totalAmount: d.totalAmount,
            currency: d.currency,
          });
          this.logger.log(`Booking confirmation sent to ${d.email}`);
          return { sent: true, type: 'booking_confirmation' };
        }
        default:
          this.logger.warn(`Unknown email job type: ${name}`);
          return { skipped: true };
      }
    } catch (error: any) {
      this.logger.error(`Email job ${id} failed: ${error.message}`);
      throw error;
    }
  }
}
