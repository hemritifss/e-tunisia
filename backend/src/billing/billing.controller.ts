import { Body, Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BillingService } from './billing.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserPlan } from '../users/user.entity';

/**
 * Billing controller — exposes the user's effective plan + caps + a mock
 * upgrade endpoint that just flips the DB row. Real Stripe goes here later;
 * for now we let users self-upgrade in dev so we can test the UX end-to-end.
 */
@ApiTags('billing')
@Controller('billing')
export class BillingController {
    constructor(
        private billing: BillingService,
        @InjectRepository(User) private usersRepo: Repository<User>,
    ) {}

    /** What plan is the user effectively on right now (after expiry)? + caps. */
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Get('me')
    async me(@Request() req) {
        const plan = await this.billing.effectivePlan(req.user.id);
        const caps = this.billing.caps(plan);
        const u = await this.usersRepo.findOne({
            where: { id: req.user.id },
            select: ['plan', 'subscriptionExpiresAt'] as any,
        });
        return {
            plan,
            rawPlan: u?.plan ?? UserPlan.FREE,
            expiresAt: u?.subscriptionExpiresAt ?? null,
            // Serialize caps with Infinity → null so JSON is well-formed.
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

    /**
     * Mock upgrade flow — flips the user's plan + sets expiry. NO REAL CHARGE.
     * Replace this with a Stripe Checkout session redirect when we wire payments.
     * Cycle: 'monthly' = 30d expiry, 'yearly' = 365d, 'lifetime' = no expiry.
     */
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Post('upgrade')
    async upgrade(@Request() req, @Body() body: { plan: 'premium' | 'business'; cycle?: 'monthly' | 'yearly' | 'lifetime' }) {
        const cycle = body?.cycle ?? 'monthly';
        const targetPlan = body?.plan === 'business' ? UserPlan.BUSINESS : UserPlan.PREMIUM;

        const expiresAt =
            cycle === 'lifetime' ? null :
            cycle === 'yearly' ? new Date(Date.now() + 365 * 24 * 3600 * 1000) :
            new Date(Date.now() + 30 * 24 * 3600 * 1000);

        await this.usersRepo.update(req.user.id, { plan: targetPlan, subscriptionExpiresAt: expiresAt as any });
        return { ok: true, plan: targetPlan, expiresAt };
    }

    /** Cancel = downgrade at the end of current period (mock: immediate). */
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Post('cancel')
    async cancel(@Request() req) {
        await this.usersRepo.update(req.user.id, { plan: UserPlan.FREE, subscriptionExpiresAt: null as any });
        return { ok: true, plan: UserPlan.FREE };
    }
}
