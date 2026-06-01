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
        this.anthropic = null;
        this.oai = null;
        const baseURL = this.config.get('LLM_BASE_URL');
        const compatKey = this.config.get('LLM_API_KEY');
        const anthropicKey = this.config.get('ANTHROPIC_API_KEY');
        if (baseURL && compatKey) {
            try {
                const OpenAI = require('openai');
                const Ctor = OpenAI.default || OpenAI;
                this.oai = new Ctor({ apiKey: compatKey, baseURL });
            }
            catch (e) {
                this.logger.warn(`openai SDK not loadable — ${e?.message || e}`);
            }
        }
        if (anthropicKey) {
            try {
                const mod = require('@anthropic-ai/sdk');
                const Anthropic = mod.default || mod;
                this.anthropic = new Anthropic({ apiKey: anthropicKey });
            }
            catch (e) {
                this.logger.warn(`@anthropic-ai/sdk not loadable — ${e?.message || e}`);
            }
        }
        const freeModel = this.config.get('LLM_MODEL') || 'llama-3.3-70b-versatile';
        const freeModelPro = this.config.get('LLM_MODEL_PRO') || freeModel;
        const claudeModel = this.config.get('ANTHROPIC_MODEL') || 'claude-haiku-4-5-20251001';
        const claudePro = this.config.get('ANTHROPIC_MODEL_PRO') || 'claude-opus-4-8';
        this.defaultProvider = this.oai ? 'openai' : this.anthropic ? 'anthropic' : null;
        this.proProvider = this.anthropic ? 'anthropic' : this.oai ? 'openai' : null;
        this.defaultModel = this.oai ? freeModel : this.anthropic ? claudeModel : '';
        this.proModel = this.anthropic ? claudePro : this.oai ? freeModelPro : '';
        if (this.live) {
            this.logger.log(`LLM ready — default=${this.defaultProvider}:${this.defaultModel}, pro=${this.proProvider}:${this.proModel}`);
        }
        else {
            this.logger.warn('No LLM provider configured — AI runs in mock mode');
        }
    }
    get live() {
        return !!(this.oai || this.anthropic);
    }
    async complete(opts) {
        const isPro = !!(opts.model && opts.model === this.proModel && this.proProvider);
        const provider = isPro ? this.proProvider : this.defaultProvider;
        const model = opts.model || (isPro ? this.proModel : this.defaultModel);
        if (provider === 'anthropic')
            return this.completeAnthropic(opts, model);
        if (provider === 'openai')
            return this.completeOpenAICompat(opts, model);
        throw new Error('LLM not configured (mock mode)');
    }
    async completeAnthropic(opts, model) {
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
            const resp = await this.anthropic.messages.create({
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
    async completeOpenAICompat(opts, model) {
        const maxTokens = opts.maxTokens ?? 1024;
        const temperature = opts.temperature ?? 0.7;
        const maxRounds = opts.maxToolRounds ?? 3;
        const messages = [];
        if (opts.system)
            messages.push({ role: 'system', content: opts.system });
        for (const m of opts.messages) {
            messages.push({ role: m.role, content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content) });
        }
        const tools = opts.tools?.map((t) => ({
            type: 'function',
            function: { name: t.name, description: t.description, parameters: t.input_schema },
        }));
        const toolsUsed = new Set();
        for (let round = 0; round <= maxRounds; round++) {
            const canUseTools = !!(tools && opts.toolRunner && round < maxRounds);
            const resp = await this.oai.chat.completions.create({
                model,
                max_tokens: maxTokens,
                temperature,
                messages,
                ...(canUseTools ? { tools, tool_choice: 'auto' } : {}),
            });
            const choice = resp.choices?.[0];
            const msg = choice?.message;
            const toolCalls = canUseTools ? msg?.tool_calls || [] : [];
            if (!toolCalls.length) {
                return {
                    text: (msg?.content || '').trim(),
                    stopReason: choice?.finish_reason ?? null,
                    toolsUsed: [...toolsUsed],
                };
            }
            messages.push({ role: 'assistant', content: msg.content || '', tool_calls: toolCalls });
            for (const tc of toolCalls) {
                toolsUsed.add(tc.function?.name);
                let args = {};
                try {
                    args = JSON.parse(tc.function?.arguments || '{}');
                }
                catch {
                }
                let out;
                try {
                    out = await opts.toolRunner(tc.function.name, args);
                }
                catch (e) {
                    out = { error: String(e?.message || e) };
                }
                messages.push({
                    role: 'tool',
                    tool_call_id: tc.id,
                    content: typeof out === 'string' ? out : JSON.stringify(out),
                });
            }
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