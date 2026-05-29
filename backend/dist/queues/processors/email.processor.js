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
var EmailProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailProcessor = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const common_1 = require("@nestjs/common");
const email_service_1 = require("../../email/email.service");
let EmailProcessor = EmailProcessor_1 = class EmailProcessor extends bullmq_1.WorkerHost {
    constructor(emailService) {
        super();
        this.emailService = emailService;
        this.logger = new common_1.Logger(EmailProcessor_1.name);
    }
    async process(job) {
        const { name, data, id } = job;
        this.logger.debug(`Processing email job ${id} (${name})`);
        try {
            switch (name) {
                case 'password_reset': {
                    const d = data;
                    await this.emailService.sendPasswordReset(d.email, d.token, d.frontendUrl);
                    this.logger.log(`Password reset email sent to ${d.email}`);
                    return { sent: true, type: 'password_reset' };
                }
                case 'welcome': {
                    const d = data;
                    await this.emailService.sendWelcome(d.email, d.name);
                    this.logger.log(`Welcome email sent to ${d.email}`);
                    return { sent: true, type: 'welcome' };
                }
                case 'booking_confirmation': {
                    const d = data;
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
        }
        catch (error) {
            this.logger.error(`Email job ${id} failed: ${error.message}`);
            throw error;
        }
    }
};
exports.EmailProcessor = EmailProcessor;
exports.EmailProcessor = EmailProcessor = EmailProcessor_1 = __decorate([
    (0, bullmq_1.Processor)('emails'),
    __metadata("design:paramtypes", [email_service_1.EmailService])
], EmailProcessor);
//# sourceMappingURL=email.processor.js.map