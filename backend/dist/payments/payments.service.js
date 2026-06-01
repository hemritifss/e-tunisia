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
var PaymentsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const Stripe = require('stripe');
let PaymentsService = PaymentsService_1 = class PaymentsService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(PaymentsService_1.name);
        this.stripe = null;
        const stripeKey = this.configService.get('STRIPE_SECRET_KEY');
        if (stripeKey && stripeKey.startsWith('sk_')) {
            this.stripe = new Stripe(stripeKey, {
                apiVersion: '2026-04-22.dahlia',
            });
            this.logger.log('Stripe initialized');
        }
        else {
            this.logger.warn('Stripe not configured - running in mock mode');
        }
    }
    get stripeEnabled() {
        return !!this.stripe;
    }
    async getOrCreateCustomer(params) {
        if (!this.stripe)
            return `cus_mock_${params.userId}`;
        const existing = await this.stripe.customers.list({ email: params.email, limit: 1 });
        if (existing.data.length > 0)
            return existing.data[0].id;
        const customer = await this.stripe.customers.create({
            email: params.email,
            name: params.name,
            metadata: { userId: params.userId },
        });
        return customer.id;
    }
    async createSubscriptionCheckout(params) {
        if (!this.stripe)
            throw new Error('Stripe not configured');
        const successUrl = params.successUrl + (params.successUrl.includes('?') ? '&' : '?') + 'session_id={CHECKOUT_SESSION_ID}';
        const session = await this.stripe.checkout.sessions.create({
            mode: 'subscription',
            customer: params.customerId,
            line_items: [{ price: params.priceId, quantity: 1 }],
            success_url: successUrl,
            cancel_url: params.cancelUrl,
            client_reference_id: params.metadata.userId,
            metadata: params.metadata,
            subscription_data: { metadata: params.metadata },
            allow_promotion_codes: true,
        });
        return { id: session.id, url: session.url };
    }
    async createBillingPortalSession(customerId, returnUrl) {
        if (!this.stripe)
            throw new Error('Stripe not configured');
        const session = await this.stripe.billingPortal.sessions.create({
            customer: customerId,
            return_url: returnUrl,
        });
        return { url: session.url };
    }
    async createPaymentIntent(amount, currency = 'usd', metadata = {}) {
        if (!this.stripe) {
            this.logger.log(`Mock payment intent created: ${amount} ${currency}`);
            return {
                id: `pi_mock_${Date.now()}`,
                clientSecret: `pi_mock_${Date.now()}_secret`,
                amount,
                currency,
                status: 'requires_confirmation',
            };
        }
        const intent = await this.stripe.paymentIntents.create({
            amount: Math.round(amount * 100),
            currency: currency.toLowerCase(),
            metadata,
            automatic_payment_methods: { enabled: true },
        });
        return {
            id: intent.id,
            clientSecret: intent.client_secret,
            amount,
            currency,
            status: intent.status,
        };
    }
    async confirmPaymentIntent(paymentIntentId) {
        if (!this.stripe) {
            this.logger.log(`Mock payment confirmed: ${paymentIntentId}`);
            return true;
        }
        const intent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
        return intent.status === 'succeeded';
    }
    async refundPayment(paymentIntentId, amount) {
        if (!this.stripe) {
            this.logger.log(`Mock refund: ${paymentIntentId} for ${amount || 'full'}`);
            return { success: true, refundId: `re_mock_${Date.now()}` };
        }
        try {
            const refund = await this.stripe.refunds.create({
                payment_intent: paymentIntentId,
                amount: amount ? Math.round(amount * 100) : undefined,
            });
            return { success: true, refundId: refund.id };
        }
        catch (error) {
            this.logger.error('Refund failed:', error.message);
            return { success: false };
        }
    }
    async createPayout(payout) {
        if (!this.stripe) {
            this.logger.log(`Mock payout: ${payout.amount} ${payout.currency} to host ${payout.hostId}`);
            return { success: true, payoutId: `po_mock_${Date.now()}` };
        }
        this.logger.log(`Creating payout for host ${payout.hostId}`);
        return { success: true, payoutId: `po_${Date.now()}` };
    }
    async constructWebhookEvent(payload, signature, secret) {
        if (!this.stripe) {
            throw new Error('Stripe not configured');
        }
        const webhookSecret = secret || this.configService.get('STRIPE_WEBHOOK_SECRET');
        if (!webhookSecret) {
            throw new Error('Webhook secret not configured');
        }
        return this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    }
    async getBalance() {
        if (!this.stripe) {
            return { available: 0, pending: 0 };
        }
        const balance = await this.stripe.balance.retrieve();
        const available = balance.available.reduce((sum, b) => sum + b.amount, 0) / 100;
        const pending = balance.pending.reduce((sum, b) => sum + b.amount, 0) / 100;
        return { available, pending };
    }
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = PaymentsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], PaymentsService);
//# sourceMappingURL=payments.service.js.map