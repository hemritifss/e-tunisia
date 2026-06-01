"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var BookingProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingProcessor = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const booking_entity_1 = require("../../bookings/booking.entity");
const email_service_1 = require("../../email/email.service");
const push_service_1 = require("../../push/push.service");
const users_service_1 = require("../../users/users.service");
let BookingProcessor = BookingProcessor_1 = class BookingProcessor extends bullmq_1.WorkerHost {
    constructor(bookingRepo, emailService, pushService, usersService) {
        super();
        this.bookingRepo = bookingRepo;
        this.emailService = emailService;
        this.pushService = pushService;
        this.usersService = usersService;
        this.logger = new common_1.Logger(BookingProcessor_1.name);
    }
    async process(job) {
        const { name, data, id } = job;
        this.logger.debug(`Processing booking job ${id} (${name})`);
        try {
            switch (name) {
                case 'confirm':
                    return await this.handleConfirm(data);
                case 'reminder':
                    return await this.handleReminder(data);
                case 'cancel':
                    return await this.handleCancel(data);
                default:
                    this.logger.warn(`Unknown booking job type: ${name}`);
                    return { skipped: true };
            }
        }
        catch (error) {
            this.logger.error(`Booking job ${id} failed: ${error.message}`);
            throw error;
        }
    }
    async handleConfirm(data) {
        const booking = await this.bookingRepo.findOne({
            where: { id: data.bookingId },
            relations: ['place', 'user'],
        });
        if (!booking) {
            throw new Error(`Booking ${data.bookingId} not found`);
        }
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
            }
            catch (emailError) {
                this.logger.warn(`Failed to send confirmation email: ${emailError.message}`);
            }
        }
        const userId = data.userId || booking.userId;
        if (userId) {
            try {
                await this.pushService.sendToUser(userId, {
                    title: 'Booking Confirmed ✅',
                    body: `Your reservation at ${booking.place?.name || 'your destination'} is confirmed!`,
                    icon: '/icon-192x192.png',
                    url: `/bookings`,
                });
            }
            catch (pushError) {
                this.logger.warn(`Failed to send push notification: ${pushError.message}`);
            }
        }
        this.logger.log(`Booking ${data.bookingId} confirmation processed`);
        return { confirmed: true, bookingId: booking.id };
    }
    async handleReminder(data) {
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
        }
        catch (pushError) {
            this.logger.warn(`Failed to send reminder push: ${pushError.message}`);
        }
        this.logger.log(`Reminder sent for booking ${data.bookingId}`);
        return { reminded: true, bookingId: booking.id };
    }
    async handleCancel(data) {
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
            }
            catch (emailError) {
                this.logger.warn(`Failed to send cancellation email: ${emailError.message}`);
            }
        }
        this.logger.log(`Booking ${data.bookingId} cancellation processed`);
        return { cancelled: true, bookingId: booking.id };
    }
};
exports.BookingProcessor = BookingProcessor;
exports.BookingProcessor = BookingProcessor = BookingProcessor_1 = __decorate([
    (0, bullmq_1.Processor)('bookings'),
    __param(0, (0, typeorm_1.InjectRepository)(booking_entity_1.Booking)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        email_service_1.EmailService,
        push_service_1.PushService,
        users_service_1.UsersService])
], BookingProcessor);
//# sourceMappingURL=booking.processor.js.map