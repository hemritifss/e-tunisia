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
var FlouciService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FlouciService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const FLOUCI_BASE = 'https://developers.flouci.com/api';
let FlouciService = FlouciService_1 = class FlouciService {
    constructor(config) {
        this.config = config;
        this.logger = new common_1.Logger(FlouciService_1.name);
        this.appToken = this.config.get('FLOUCI_APP_TOKEN') || undefined;
        this.appSecret = this.config.get('FLOUCI_APP_SECRET') || undefined;
        if (this.enabled)
            this.logger.log('Flouci initialized');
        else
            this.logger.warn('Flouci not configured - running in mock mode');
    }
    get enabled() {
        return !!(this.appToken && this.appSecret);
    }
    async generatePayment(params) {
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
        const json = await res.json().catch(() => ({}));
        const link = json?.result?.link;
        const paymentId = json?.result?.payment_id;
        if (!link || !paymentId) {
            this.logger.error(`Flouci generate_payment failed: ${JSON.stringify(json)}`);
            throw new Error('Flouci payment generation failed');
        }
        return { link, paymentId };
    }
    async verifyPayment(paymentId) {
        if (!this.enabled)
            return { success: true, status: 'SUCCESS' };
        const res = await fetch(`${FLOUCI_BASE}/verify_payment/${paymentId}`, {
            headers: { apppublic: this.appToken, appsecret: this.appSecret },
        });
        const json = await res.json().catch(() => ({}));
        const status = json?.result?.status || (json?.success ? 'SUCCESS' : 'FAILURE');
        return { success: status === 'SUCCESS', status };
    }
};
exports.FlouciService = FlouciService;
exports.FlouciService = FlouciService = FlouciService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], FlouciService);
//# sourceMappingURL=flouci.service.js.map