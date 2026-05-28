import {
    BadRequestException,
    Body,
    Controller,
    Get,
    Headers,
    Post,
    Query,
    Req,
    Request,
    Res,
    UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../common/decorators/public.decorator';
import { BillingService } from './billing.service';
import { PaymentsService } from '../payments/payments.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserPlan } from '../users/user.entity';
import { BillingCycle } from './plan-catalog';

/**
 * Billing controller — the single money surface.
 *   GET  /billing/plans     public catalog (price book) for the pricing page
 *   GET  /billing/me        the user's effective plan + caps
 *   POST /billing/checkout  start Stripe Checkout (card) — or mock flip when no keys
 *   POST /billing/upgrade   manual bank/cash → pending subscription (admin confirms)
 *   POST /billing/portal    open the Stripe billing portal
 *   POST /billing/cancel    downgrade to Free
 *   POST /billing/webhook   Stripe subscription lifecycle (raw body, no auth)
 */
@ApiTags('billing')
@Controller('billing')
export class BillingController {
    constructor(
        private billing: BillingService,
        private payments: PaymentsService,
        private config: ConfigService,
        @InjectRepository(User) private usersRepo: Repository<User>,
    ) {}

    /** Public price book — the FE renders the pricing page from this. */
    @Public()
    @Get('plans')
    @ApiOperation({ summary: 'Get the plan catalog (price book)' })
    plans() {
        return this.billing.getCatalog();
    }

    /** What plan is the user effectively on right now (after expiry)? + caps. */
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Get('me')
    @ApiOperation({ summary: 'Get my effective plan + caps' })
    async me(@Request() req) {
        const plan = await this.billing.effectivePlan(req.user.id);
        const caps = this.billing.caps(plan);
        const u = await this.usersRepo.findOne({
            where: { id: req.user.id },
            select: ['plan', 'subscriptionExpiresAt', 'stripeCustomerId'] as any,
        });
        return {
            plan,
            rawPlan: u?.plan ?? UserPlan.FREE,
            expiresAt: u?.subscriptionExpiresAt ?? null,
            canManageBilling: this.payments.stripeEnabled && !!u?.stripeCustomerId,
            caps: {
                maxTrips: Number.isFinite(caps.maxTrips) ? caps.maxTrips : null,
                maxSaves: Number.isFinite(caps.maxSaves) ? caps.maxSaves : null,
                suggestionWeight: caps.suggestionWeight,
                customThemes: caps.customThemes,
                passportAnalytics: caps.passportAnalytics,
                multiLangListings: caps.multiLangListings,
                canBoost: caps.canBoost,
                ownerDashboard: caps.ownerDashboard,
            },
        };
    }

    /** Start a card checkout — returns a URL to redirect to (Stripe hosted, or mock success). */
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Post('checkout')
    @ApiOperation({ summary: 'Start a Stripe Checkout session (card)' })
    checkout(@Request() req, @Body() body: { plan: string; cycle?: BillingCycle }) {
        return this.billing.createCheckout(req.user.id, body?.plan, normalizeCycle(body?.cycle));
    }

    /** Start a Flouci (local TND) checkout — returns the Flouci payment URL (or mock success). */
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Post('flouci/checkout')
    @ApiOperation({ summary: 'Start a Flouci (TND) checkout' })
    flouciCheckout(@Request() req, @Body() body: { plan: string; cycle?: BillingCycle }) {
        return this.billing.createFlouciCheckout(req.user.id, body?.plan, normalizeCycle(body?.cycle));
    }

    /** Flouci redirects here after payment. Verify server-side, then 302 to the frontend. */
    @Public()
    @Get('flouci/return')
    @ApiOperation({ summary: 'Flouci payment return (server-verified redirect)' })
    async flouciReturn(@Query('payment_id') paymentId: string, @Res() res: Response) {
        const url = await this.billing.handleFlouciReturn(paymentId);
        res.redirect(url);
    }

    /** Manual payment path — bank transfer / cash at office → pending subscription. */
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Post('upgrade')
    @ApiOperation({ summary: 'Request a manual (bank/cash) upgrade — admin confirms' })
    upgrade(@Request() req, @Body() body: { plan: string; cycle?: BillingCycle; method?: 'bank' | 'cash' }) {
        const method = body?.method === 'cash' ? 'cash' : 'bank';
        return this.billing.manualUpgrade(req.user.id, body?.plan, normalizeCycle(body?.cycle), method);
    }

    /** Open the Stripe billing portal. */
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Post('portal')
    @ApiOperation({ summary: 'Open the Stripe billing portal' })
    portal(@Request() req) {
        return this.billing.createPortal(req.user.id);
    }

    /** Cancel — downgrade to Free. */
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Post('cancel')
    @ApiOperation({ summary: 'Cancel subscription (downgrade to Free)' })
    cancel(@Request() req) {
        return this.billing.cancel(req.user.id);
    }

    /** Stripe webhook — subscription lifecycle. Raw body (mounted in main.ts), no auth. */
    @Public()
    @Post('webhook')
    @ApiOperation({ summary: 'Stripe subscription webhook' })
    async webhook(@Req() req: any, @Headers('stripe-signature') signature: string) {
        const secret =
            this.config.get<string>('STRIPE_BILLING_WEBHOOK_SECRET') ||
            this.config.get<string>('STRIPE_WEBHOOK_SECRET');
        let event: any;
        try {
            event = await this.payments.constructWebhookEvent(req.body, signature, secret);
        } catch (err: any) {
            throw new BadRequestException(`Webhook signature verification failed: ${err.message}`);
        }
        await this.billing.applyStripeEvent(event);
        return { received: true };
    }
}

function normalizeCycle(c?: string): BillingCycle {
    return c === 'yearly' ? 'yearly' : 'monthly';
}
