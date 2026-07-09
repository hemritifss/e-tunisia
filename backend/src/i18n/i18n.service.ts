import { Injectable, Logger } from '@nestjs/common';
import { createHash } from 'crypto';
import { LlmService } from '../ai/llm.service';
import { RedisService } from '../redis/redis.service';

/**
 * AI-generated UI locale packs — "translated to any language in the world".
 *
 * The frontend ships hand-written en/fr/ar dictionaries; every other language
 * is produced on demand: the client posts the English dictionary + a target
 * locale, we translate it once with the LLM, and Redis caches the pack keyed
 * by dictionary hash — so the whole app pays ONE model call per (locale,
 * dictionary version), ever. No LLM configured → { mock: true } and the
 * client quietly stays in English.
 */

const PACK_TTL_S = 60 * 60 * 24 * 30; // 30 days
const MAX_KEYS = 400;
const MAX_TOTAL_CHARS = 20_000;
const LOCALE_RE = /^[a-z]{2,3}(-[a-z]{2,4})?$/i;

/** Friendly names help the model; unknown codes fall back to the ISO code. */
const LANG_NAMES: Record<string, string> = {
    de: 'German', it: 'Italian', es: 'Spanish', pt: 'Portuguese', ru: 'Russian',
    zh: 'Simplified Chinese', ja: 'Japanese', ko: 'Korean', tr: 'Turkish',
    nl: 'Dutch', pl: 'Polish', sv: 'Swedish', cs: 'Czech', el: 'Greek',
    hu: 'Hungarian', ro: 'Romanian', uk: 'Ukrainian', hi: 'Hindi',
    id: 'Indonesian', th: 'Thai', he: 'Hebrew', fa: 'Persian', ur: 'Urdu',
    da: 'Danish', no: 'Norwegian', fi: 'Finnish', vi: 'Vietnamese',
};

@Injectable()
export class I18nService {
    private readonly logger = new Logger(I18nService.name);

    constructor(
        private readonly llm: LlmService,
        private readonly redis: RedisService,
    ) {}

    async pack(
        localeRaw: string,
        entries: Record<string, string>,
    ): Promise<{ entries: Record<string, string> | null; mock?: boolean; cached?: boolean }> {
        const locale = String(localeRaw || '').toLowerCase();
        if (!LOCALE_RE.test(locale)) return { entries: null, mock: true };

        // Sanitize + cap the source dictionary.
        const src: Record<string, string> = {};
        let total = 0;
        for (const [k, v] of Object.entries(entries || {})) {
            if (typeof k !== 'string' || typeof v !== 'string') continue;
            if (!/^[\w.-]{1,64}$/.test(k) || v.length > 300) continue;
            total += v.length;
            if (total > MAX_TOTAL_CHARS || Object.keys(src).length >= MAX_KEYS) break;
            src[k] = v;
        }
        if (!Object.keys(src).length) return { entries: null, mock: true };

        const hash = createHash('sha1')
            .update(JSON.stringify(Object.entries(src).sort(([a], [b]) => a.localeCompare(b))))
            .digest('hex')
            .slice(0, 16);
        const cacheKey = `i18n:pack:${locale}:${hash}`;

        const cached = await this.redis.getJson<Record<string, string>>(cacheKey).catch(() => null);
        if (cached) return { entries: cached, cached: true };

        if (!this.llm.live) return { entries: null, mock: true };

        const langName = LANG_NAMES[locale.split('-')[0]] || `the language with ISO 639 code "${locale}"`;
        try {
            const result = await this.llm.complete({
                system:
                    'You translate UI strings for e-Tunisia, a Tunisian travel app. ' +
                    'Return ONLY a valid JSON object — no code fences, no commentary.',
                messages: [{
                    role: 'user',
                    content:
                        `Translate every VALUE of this JSON object into ${langName}. ` +
                        'Keep the KEYS exactly as they are. Keep translations short and natural for buttons/labels. ' +
                        'Never translate the brand name "e-Tunisia" or city names.\n\n' +
                        JSON.stringify(src),
                }],
                temperature: 0.2,
                maxTokens: 4000,
            });

            const raw = result.text.trim().replace(/^```(?:json)?\s*|\s*```$/g, '');
            const parsed = JSON.parse(raw);
            const out: Record<string, string> = {};
            for (const k of Object.keys(src)) {
                const v = parsed?.[k];
                out[k] = typeof v === 'string' && v.trim() ? v.trim() : src[k];
            }
            await this.redis.setJson(cacheKey, out, PACK_TTL_S).catch(() => {});
            return { entries: out };
        } catch (err: any) {
            this.logger.warn(`i18n pack ${locale} failed: ${err.message}`);
            return { entries: null, mock: true };
        }
    }
}
