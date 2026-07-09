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
var I18nService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.I18nService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const llm_service_1 = require("../ai/llm.service");
const redis_service_1 = require("../redis/redis.service");
const PACK_TTL_S = 60 * 60 * 24 * 30;
const MAX_KEYS = 400;
const MAX_TOTAL_CHARS = 20_000;
const LOCALE_RE = /^[a-z]{2,3}(-[a-z]{2,4})?$/i;
const LANG_NAMES = {
    de: 'German', it: 'Italian', es: 'Spanish', pt: 'Portuguese', ru: 'Russian',
    zh: 'Simplified Chinese', ja: 'Japanese', ko: 'Korean', tr: 'Turkish',
    nl: 'Dutch', pl: 'Polish', sv: 'Swedish', cs: 'Czech', el: 'Greek',
    hu: 'Hungarian', ro: 'Romanian', uk: 'Ukrainian', hi: 'Hindi',
    id: 'Indonesian', th: 'Thai', he: 'Hebrew', fa: 'Persian', ur: 'Urdu',
    da: 'Danish', no: 'Norwegian', fi: 'Finnish', vi: 'Vietnamese',
};
let I18nService = I18nService_1 = class I18nService {
    constructor(llm, redis) {
        this.llm = llm;
        this.redis = redis;
        this.logger = new common_1.Logger(I18nService_1.name);
    }
    async pack(localeRaw, entries) {
        const locale = String(localeRaw || '').toLowerCase();
        if (!LOCALE_RE.test(locale))
            return { entries: null, mock: true };
        const src = {};
        let total = 0;
        for (const [k, v] of Object.entries(entries || {})) {
            if (typeof k !== 'string' || typeof v !== 'string')
                continue;
            if (!/^[\w.-]{1,64}$/.test(k) || v.length > 300)
                continue;
            total += v.length;
            if (total > MAX_TOTAL_CHARS || Object.keys(src).length >= MAX_KEYS)
                break;
            src[k] = v;
        }
        if (!Object.keys(src).length)
            return { entries: null, mock: true };
        const hash = (0, crypto_1.createHash)('sha1')
            .update(JSON.stringify(Object.entries(src).sort(([a], [b]) => a.localeCompare(b))))
            .digest('hex')
            .slice(0, 16);
        const cacheKey = `i18n:pack:${locale}:${hash}`;
        const cached = await this.redis.getJson(cacheKey).catch(() => null);
        if (cached)
            return { entries: cached, cached: true };
        if (!this.llm.live)
            return { entries: null, mock: true };
        const langName = LANG_NAMES[locale.split('-')[0]] || `the language with ISO 639 code "${locale}"`;
        try {
            const result = await this.llm.complete({
                system: 'You translate UI strings for e-Tunisia, a Tunisian travel app. ' +
                    'Return ONLY a valid JSON object — no code fences, no commentary.',
                messages: [{
                        role: 'user',
                        content: `Translate every VALUE of this JSON object into ${langName}. ` +
                            'Keep the KEYS exactly as they are. Keep translations short and natural for buttons/labels. ' +
                            'Never translate the brand name "e-Tunisia" or city names.\n\n' +
                            JSON.stringify(src),
                    }],
                temperature: 0.2,
                maxTokens: 4000,
            });
            const raw = result.text.trim().replace(/^```(?:json)?\s*|\s*```$/g, '');
            const parsed = JSON.parse(raw);
            const out = {};
            for (const k of Object.keys(src)) {
                const v = parsed?.[k];
                out[k] = typeof v === 'string' && v.trim() ? v.trim() : src[k];
            }
            await this.redis.setJson(cacheKey, out, PACK_TTL_S).catch(() => { });
            return { entries: out };
        }
        catch (err) {
            this.logger.warn(`i18n pack ${locale} failed: ${err.message}`);
            return { entries: null, mock: true };
        }
    }
};
exports.I18nService = I18nService;
exports.I18nService = I18nService = I18nService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [llm_service_1.LlmService,
        redis_service_1.RedisService])
], I18nService);
//# sourceMappingURL=i18n.service.js.map