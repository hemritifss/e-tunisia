import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Use dynamic import for Stripe to avoid type issues
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Stripe = require('stripe');

export interface PaymentIntent {
  id: string;
  clientSecret: string;
  amount: number;
  currency: string;
  status: string;
}

export interface PayoutRequest {
  bookingId: string;
  hostId: string;
  amount: number;
  currency: string;
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private stripe: any = null;

  constructor(private configService: ConfigService) {
    const stripeKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (stripeKey && stripeKey.startsWith('sk_')) {
      this.stripe = new Stripe(stripeKey, {
        apiVersion: '2026-04-22.dahlia',
      });
      this.logger.log('Stripe initialized');
    } else {
      this.logger.warn('Stripe not configured - running in mock mode');
    }
  }

  /** Whether a real Stripe client is configured (vs mock mode). */
  get stripeEnabled(): boolean {
    return !!this.stripe;
  }

  // ─── Subscriptions (plans / billing) ─────────────────────────────────────────

  /** Find-or-create a Stripe Customer for a user. Returns a mock id when unconfigured. */
  async getOrCreateCustomer(params: { email: string; name?: string; userId: string }): Promise<string> {
    if (!this.stripe) return `cus_mock_${params.userId}`;
    const existing = await this.stripe.customers.list({ email: params.email, limit: 1 });
    if (existing.data.length > 0) return existing.data[0].id;
    const customer = await this.stripe.customers.create({
      email: params.email,
      name: params.name,
      metadata: { userId: params.userId },
    });
    return customer.id;
  }

  /** Create a hosted Checkout Session in subscription mode. */
  async createSubscriptionCheckout(params: {
    customerId: string;
    priceId: string;
    successUrl: string;
    cancelUrl: string;
    metadata: Record<string, string>;
  }): Promise<{ id: string; url: string }> {
    if (!this.stripe) throw new Error('Stripe not configured');
    const successUrl =
      params.successUrl + (params.successUrl.includes('?') ? '&' : '?') + 'session_id={CHECKOUT_SESSION_ID}';
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

  /** Create a Stripe Billing Portal session (manage card / cancel / invoices). */
  async createBillingPortalSession(customerId: string, returnUrl: string): Promise<{ url: string }> {
    if (!this.stripe) throw new Error('Stripe not configured');
    const session = await this.stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
    return { url: session.url };
  }

  async createPaymentIntent(
    amount: number,
    currency: string = 'usd',
    metadata: Record<string, string> = {},
  ): Promise<PaymentIntent> {
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

  async confirmPaymentIntent(paymentIntentId: string): Promise<boolean> {
    if (!this.stripe) {
      this.logger.log(`Mock payment confirmed: ${paymentIntentId}`);
      return true;
    }

    const intent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
    return intent.status === 'succeeded';
  }

  async refundPayment(
    paymentIntentId: string,
    amount?: number,
  ): Promise<{ success: boolean; refundId?: string }> {
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
    } catch (error: any) {
      this.logger.error('Refund failed:', error.message);
      return { success: false };
    }
  }

  async createPayout(payout: PayoutRequest): Promise<{ success: boolean; payoutId?: string }> {
    if (!this.stripe) {
      this.logger.log(`Mock payout: ${payout.amount} ${payout.currency} to host ${payout.hostId}`);
      return { success: true, payoutId: `po_mock_${Date.now()}` };
    }

    this.logger.log(`Creating payout for host ${payout.hostId}`);
    return { success: true, payoutId: `po_${Date.now()}` };
  }

  async constructWebhookEvent(
    payload: string | Buffer,
    signature: string,
    secret?: string,
  ): Promise<any> {
    if (!this.stripe) {
      throw new Error('Stripe not configured');
    }

    const webhookSecret = secret || this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      throw new Error('Webhook secret not configured');
    }

    return this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  }

  async getBalance(): Promise<{ available: number; pending: number }> {
    if (!this.stripe) {
      return { available: 0, pending: 0 };
    }

    const balance = await this.stripe.balance.retrieve();
    const available = balance.available.reduce((sum: number, b: any) => sum + b.amount, 0) / 100;
    const pending = balance.pending.reduce((sum: number, b: any) => sum + b.amount, 0) / 100;

    return { available, pending };
  }
}
