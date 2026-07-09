import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface EmailPayload {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly apiKey: string | undefined;
  private readonly fromEmail: string;

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('RESEND_API_KEY');
    this.fromEmail = this.configService.get<string>('FROM_EMAIL') || 'noreply@etunisia.com';
  }

  async send(payload: EmailPayload): Promise<{ id?: string; success: boolean }> {
    if (!this.apiKey) {
      this.logger.warn(`[DEV FALLBACK] Email to ${payload.to}: ${payload.subject}`);
      this.logger.debug(payload.html.slice(0, 200));
      return { success: true };
    }

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: payload.from || this.fromEmail,
          to: payload.to,
          subject: payload.subject,
          html: payload.html,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Resend API error ${response.status}: ${error}`);
      }

      const data = await response.json();
      this.logger.log(`Email sent to ${payload.to} (${payload.subject}) — id: ${data.id}`);
      return { id: data.id, success: true };
    } catch (error: any) {
      this.logger.error(`Failed to send email: ${error.message}`);
      throw error;
    }
  }

  async sendPasswordReset(email: string, token: string, frontendUrl?: string): Promise<void> {
    const baseUrl = frontendUrl || process.env.FRONTEND_URL || 'https://etunisia.com';
    const resetUrl = `${baseUrl}/#/reset-password?token=${token}`;

    await this.send({
      to: email,
      subject: 'Reset your e-Tunisia password',
      html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Password Reset</title></head>
<body style="font-family:system-ui,sans-serif;background:#f4f4f4;padding:40px 20px;">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:12px;padding:32px;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
    <h2 style="color:#1a1a1a;margin-top:0;">Password Reset Request</h2>
    <p style="color:#555;line-height:1.6;">We received a request to reset your e-Tunisia password. Click the button below to set a new password. This link expires in 1 hour.</p>
    <a href="${resetUrl}" style="display:inline-block;background:#e11d48;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;margin:16px 0;">Reset Password</a>
    <p style="color:#888;font-size:13px;">If you didn't request this, you can safely ignore this email.</p>
    <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
    <p style="color:#aaa;font-size:12px;">e-Tunisia — Discover Tunisia</p>
  </div>
</body>
</html>`,
    });
  }

  async sendWelcome(email: string, name: string): Promise<void> {
    await this.send({
      to: email,
      subject: 'Welcome to e-Tunisia! 🎉',
      html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Welcome</title></head>
<body style="font-family:system-ui,sans-serif;background:#f4f4f4;padding:40px 20px;">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:12px;padding:32px;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
    <h2 style="color:#1a1a1a;margin-top:0;">Welcome, ${name}!</h2>
    <p style="color:#555;line-height:1.6;">Thanks for joining e-Tunisia. Start exploring the beauty of Tunisia — from the ancient ruins of Carthage to the blue streets of Sidi Bou Said.</p>
    <ul style="color:#555;line-height:1.8;padding-left:20px;">
      <li>Discover trending places & hidden gems</li>
      <li>Book unique experiences</li>
      <li>Connect with fellow travelers</li>
    </ul>
    <a href="https://etunisia.com/#/explore" style="display:inline-block;background:#e11d48;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;margin:16px 0;">Start Exploring</a>
    <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
    <p style="color:#aaa;font-size:12px;">e-Tunisia — Discover Tunisia</p>
  </div>
</body>
</html>`,
    });
  }

  async sendBookingConfirmation(email: string, data: {
    bookingId: string;
    placeName: string;
    checkIn: string;
    checkOut?: string;
    guests: number;
    totalAmount: number;
    currency: string;
  }): Promise<void> {
    await this.send({
      to: email,
      subject: `Your booking for ${data.placeName} is confirmed`,
      html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Booking Confirmed</title></head>
<body style="font-family:system-ui,sans-serif;background:#f4f4f4;padding:40px 20px;">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:12px;padding:32px;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
    <h2 style="color:#1a1a1a;margin-top:0;">Booking Confirmed ✅</h2>
    <p style="color:#555;line-height:1.6;">Your reservation at <strong>${data.placeName}</strong> has been confirmed.</p>
    <div style="background:#f9fafb;border-radius:8px;padding:16px;margin:16px 0;">
      <p style="margin:4px 0;color:#333;"><strong>Check-in:</strong> ${data.checkIn}</p>
      ${data.checkOut ? `<p style="margin:4px 0;color:#333;"><strong>Check-out:</strong> ${data.checkOut}</p>` : ''}
      <p style="margin:4px 0;color:#333;"><strong>Guests:</strong> ${data.guests}</p>
      <p style="margin:4px 0;color:#333;"><strong>Total:</strong> ${data.totalAmount.toFixed(2)} ${data.currency}</p>
      <p style="margin:4px 0;color:#333;"><strong>Booking ID:</strong> ${data.bookingId}</p>
    </div>
    <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
    <p style="color:#aaa;font-size:12px;">e-Tunisia — Discover Tunisia</p>
  </div>
</body>
</html>`,
    });
  }
}
