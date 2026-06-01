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
var LlmService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LlmService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let LlmService = LlmService_1 = class LlmService {
    constructor(config) {
        this.config = config;
        this.logger = new common_1.Logger(LlmService_1.name);
        this.client = null;
        this.defaultModel = this.config.get('ANTHROPIC_MODEL') || 'claude-haiku-4-5-20251001';
        this.proModel = this.config.get('ANTHROPIC_MODEL_PRO') || 'claude-opus-4-8';
        const apiKey = this.config.get('ANTHROPIC_API_KEY');
        if (!apiKey) {
            this.logger.warn('ANTHROPIC_API_KEY not set — AI runs in mock mode');
            return;
        }
        try {
            const mod = require('@anthropic-ai/sdk');
            const Anthropic = mod.default || mod;
            this.client = new Anthropic({ apiKey });
            this.logger.log(`Claude initialised (chat=${this.defaultModel}, pro=${this.proModel})`);
        }
        catch (e) {
            this.logger.warn(`@anthropic-ai/sdk not loadable — AI runs in mock mode (${e?.message || e})`);
        }
    }
    get live() {
        return !!this.client;
    }
    async complete(opts) {
        if (!this.client)
            throw new Error('LLM not configured (mock mode)');
        const model = opts.model || this.defaultModel;
        const maxTokens = opts.maxTokens ?? 1024;
        const temperature = opts.temperature ?? 0.7;
        const maxRounds = opts.maxToolRounds ?? 3;
        const system = opts.system
            ? [{ type: 'text', text: opts.system, cache_control: { type: 'ephemeral' } }]
            : undefined;
        const messages = opts.messages.map((m) => ({ role: m.role, content: m.content }));
        const toolsUsed = new Set();
        for (let round = 0; round <= maxRounds; round++) {
            const canUseTools = !!(opts.tools && opts.toolRunner && round < maxRounds);
            const resp = await this.client.messages.create({
                model,
                max_tokens: maxTokens,
                temperature,
                ...(system ? { system } : {}),
                messages,
                ...(canUseTools ? { tools: opts.tools } : {}),
            });
            const blocks = resp.content || [];
            const toolUses = canUseTools ? blocks.filter((b) => b.type === 'tool_use') : [];
            if (toolUses.length === 0) {
                return {
                    text: blocks.filter((b) => b.type === 'text').map((b) => b.text).join('\n').trim(),
                    stopReason: resp.stop_reason ?? null,
                    toolsUsed: [...toolsUsed],
                };
            }
            messages.push({ role: 'assistant', content: blocks });
            const results = [];
            for (const tu of toolUses) {
                toolsUsed.add(tu.name);
                let out;
                try {
                    out = await opts.toolRunner(tu.name, tu.input);
                }
                catch (e) {
                    out = { error: String(e?.message || e) };
                }
                results.push({
                    type: 'tool_result',
                    tool_use_id: tu.id,
                    content: typeof out === 'string' ? out : JSON.stringify(out),
                });
            }
            messages.push({ role: 'user', content: results });
        }
        return { text: '', stopReason: null, toolsUsed: [...toolsUsed] };
    }
};
exports.LlmService = LlmService;
exports.LlmService = LlmService = LlmService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], LlmService);
//# sourceMappingURL=llm.service.js.map