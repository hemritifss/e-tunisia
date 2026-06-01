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
var ModerationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModerationService = void 0;
const common_1 = require("@nestjs/common");
const report_entity_1 = require("../safety/report.entity");
const llm_service_1 = require("./llm.service");
const ALLOW = { action: 'allow', reason: null, explanation: '' };
const MODERATION_SYSTEM = `You are the content-safety classifier for e-Tunisia, a Tunisian travel & social platform.

Classify the user content into exactly one action:
- "block": clearly harmful — hate speech, slurs, credible threats/violence, sexual content involving minors, explicit pornographic solicitation, doxxing, or obvious scams (fake money transfers, crypto/“get rich” cons, phishing).
- "flag": suspicious but not clearly harmful — likely spam/advertising, possible misinformation, aggressive harassment that isn't a clear slur/threat. Publish but route to human review.
- "allow": everything else.

IMPORTANT cultural context:
- Content is often in Tunisian derja, Arabic, French, or English, mixed freely. This is normal — never flag for language.
- Casual tone, mild profanity, jokes, and honest negative reviews/complaints about places are NORMAL. Do NOT flag them.
- Be tolerant. When unsure between allow and flag, prefer allow. Only "block" when genuinely harmful.

Reason must be one of: spam, harassment, hate_speech, nudity, violence, misinformation, scam, other, none.

Respond with ONLY a JSON object, no prose:
{"action":"allow|flag|block","reason":"<one of the above>","explanation":"<one short sentence>"}`;
let ModerationService = ModerationService_1 = class ModerationService {
    constructor(llm) {
        this.llm = llm;
        this.logger = new common_1.Logger(ModerationService_1.name);
    }
    async moderateText(text) {
        const clean = (text || '').trim();
        if (!clean)
            return ALLOW;
        if (!this.llm.live)
            return this.heuristic(clean);
        try {
            const result = await this.llm.complete({
                model: this.llm.defaultModel,
                system: MODERATION_SYSTEM,
                messages: [{ role: 'user', content: `Content to classify:\n"""\n${clean.slice(0, 4000)}\n"""` }],
                temperature: 0,
                maxTokens: 200,
            });
            return this.parseVerdict(result.text) ?? this.heuristic(clean);
        }
        catch (e) {
            this.logger.warn(`Moderation call failed, allowing: ${e?.message || e}`);
            return ALLOW;
        }
    }
    parseVerdict(raw) {
        const match = raw.match(/\{[\s\S]*\}/);
        if (!match)
            return null;
        let parsed;
        try {
            parsed = JSON.parse(match[0]);
        }
        catch {
            return null;
        }
        const action = parsed.action === 'block' || parsed.action === 'flag' ? parsed.action : 'allow';
        if (action === 'allow')
            return ALLOW;
        return {
            action,
            reason: this.toReason(parsed.reason),
            explanation: String(parsed.explanation || '').slice(0, 280),
        };
    }
    toReason(value) {
        const v = String(value || '').toLowerCase();
        const known = Object.values(report_entity_1.ReportReason);
        return known.includes(v) ? v : report_entity_1.ReportReason.OTHER;
    }
    heuristic(text) {
        const t = text.toLowerCase();
        const spammy = /\b(free\s+money|click\s+here|whatsapp\s*\+?\d|crypto\s+giveaway|earn\s+\$?\d+\s*\/?\s*day|t\.me\/|bit\.ly\/)\b/i;
        if (spammy.test(t)) {
            return { action: 'flag', reason: report_entity_1.ReportReason.SPAM, explanation: 'Looks like spam or a promotional scam.' };
        }
        const blocked = ['kill yourself', 'kys ', 'child porn', 'cp video'];
        if (blocked.some((w) => t.includes(w))) {
            return { action: 'block', reason: report_entity_1.ReportReason.HATE, explanation: 'Contains content that violates our safety rules.' };
        }
        return ALLOW;
    }
};
exports.ModerationService = ModerationService;
exports.ModerationService = ModerationService = ModerationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [llm_service_1.LlmService])
], ModerationService);
//# sourceMappingURL=moderation.service.js.map