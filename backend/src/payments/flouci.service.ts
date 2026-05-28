import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const FLOUCI_BASE = 'https://developers.flouci.com/api';

/**
 * Flouci — Tunisian local payment rail (TND). Mirrors the mock-tolerant pattern of
 * PaymentsService (Stripe): runs in mock mode without credentials so dev works
 * end-to-end, and goes live the moment FLOUCI_APP_TOKEN / FLOUCI_APP_SECRET are set.
 *
 * API (developers.flouci.com):
 *   POST /generate_payment  → { result: { link, payment_id } }   (amount in millimes)
 *   GET  /verify_payment/:id (apppublic/appsecret headers) → { result: { status } }
 */
@Injectable()
export class FlouciService {
    private readonly logger = new Logger(FlouciService.name);
    private readonly appToken?: string;
    private readonly appSecret?: string;

    constructor(private config: ConfigService) {
        this.appToken = this.config.get<string>('FLOUCI_APP_TOKEN') || undefined;
        this.appSecret = this.config.get<string>('FLOUCI_APP_SECRET') || undefined;
        if (this.enabled) this.logger.log('Flouci initialized');
        else this.logger.warn('Flouci not configured - running in mock mode');
    }

    get enabled(): boolean {
        return !!(this.appToken && this.appSecret);
    }

    /** amountTnd in major TND units → Flouci wants millimes (×1000). */
    async generatePayment(params: {
        amountTnd: number;
        successLink: string;
        failLink: string;
        trackingId: string;
    }): Promise<{ link: string; paymentId: string }> {
        if (!this.enabled) {
            const id = `flouci_mock_${Date.now()}`;
            const sep = params.successLink.includes('?') ? '&' : '?';
            return { link: `${params.successLink}${sep}payment_id=${id}&mock=1`, paymentId: id };
        }
        const res = await fetch(`${FLOUCI_BASE}/generate_payment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                app_token: this.appToken,
                app_secret: this.appSecret,
                amount: String(Math.round(params.amountTnd * 1000)),
                accept_card: 'true',
                session_timeout_secs: 1200,
                success_link: params.successLink,
                fail_link: params.failLink,
                developer_tracking_id: params.trackingId,
            }),
        });
        const json: any = await res.json().catch(() => ({}));
        const link = json?.result?.link;
        const paymentId = json?.result?.payment_id;
        if (!link || !paymentId) {
            this.logger.error(`Flouci generate_payment failed: ${JSON.stringify(json)}`);
            throw new Error('Flouci payment generation failed');
        }
        return { link, paymentId };
    }

    async verifyPayment(paymentId: string): Promise<{ success: boolean; status: string }> {
        if (!this.enabled) return { success: true, status: 'SUCCESS' };
        const res = await fetch(`${FLOUCI_BASE}/verify_payment/${paymentId}`, {
            headers: { apppublic: this.appToken!, appsecret: this.appSecret! },
        });
        const json: any = await res.json().catch(() => ({}));
        const status = json?.result?.status || (json?.success ? 'SUCCESS' : 'FAILURE');
        return { success: status === 'SUCCESS', status };
    }
}
