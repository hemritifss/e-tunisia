import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Central LLM wrapper — the ONE place the platform talks to a model.
 *
 * HYBRID by design. Two backends can be wired at once and the service routes per call:
 *   - DEFAULT tier (chat, assist, search, auto-tag, moderation, captions, re-rank):
 *       prefers a FREE OpenAI-compatible endpoint (Groq, Gemini, OpenRouter, Ollama…).
 *   - PRO tier (the heavy itinerary generation):
 *       prefers Claude (Anthropic) when ANTHROPIC_API_KEY is set, else the free model.
 *
 * Env:
 *   Free provider → LLM_BASE_URL + LLM_API_KEY + LLM_MODEL [+ LLM_MODEL_PRO]
 *   Claude        → ANTHROPIC_API_KEY [+ ANTHROPIC_MODEL / ANTHROPIC_MODEL_PRO]
 * Neither set → mock mode (callers fall back to canned data; nothing crashes).
 *
 * Callers pass `model: llm.defaultModel` or `llm.proModel`; routing follows that.
 */

export interface LlmMessage {
  role: 'user' | 'assistant';
  content: any;
}

export interface LlmTool {
  name: string;
  description: string;
  input_schema: Record<string, any>;
}

export interface CompleteOpts {
  system?: string;
  messages: LlmMessage[];
  model?: string;
  maxTokens?: number;
  temperature?: number;
  tools?: LlmTool[];
  toolRunner?: (name: string, input: any) => Promise<any>;
  maxToolRounds?: number;
}

export interface LlmResult {
  text: string;
  stopReason: string | null;
  toolsUsed: string[];
}

type Provider = 'anthropic' | 'openai' | null;

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);
  private anthropic: any = null;
  private oai: any = null;

  /** Which provider serves each tier (resolved once at boot). */
  private readonly defaultProvider: Provider;
  private readonly proProvider: Provider;

  readonly defaultModel: string;
  readonly proModel: string;

  constructor(private readonly config: ConfigService) {
    const baseURL = this.config.get<string>('LLM_BASE_URL');
    const compatKey = this.config.get<string>('LLM_API_KEY');
    const anthropicKey = this.config.get<string>('ANTHROPIC_API_KEY');

    // Wire the free OpenAI-compatible provider if configured.
    if (baseURL && compatKey) {
      try {
        const OpenAI = require('openai');
        const Ctor = OpenAI.default || OpenAI;
        this.oai = new Ctor({ apiKey: compatKey, baseURL });
      } catch (e: any) {
        this.logger.warn(`openai SDK not loadable — ${e?.message || e}`);
      }
    }

    // Wire Claude if configured.
    if (anthropicKey) {
      try {
        const mod = require('@anthropic-ai/sdk');
        const Anthropic = mod.default || mod;
        this.anthropic = new Anthropic({ apiKey: anthropicKey });
      } catch (e: any) {
        this.logger.warn(`@anthropic-ai/sdk not loadable — ${e?.message || e}`);
      }
    }

    const freeModel = this.config.get<string>('LLM_MODEL') || 'llama-3.3-70b-versatile';
    const freeModelPro = this.config.get<string>('LLM_MODEL_PRO') || freeModel;
    const claudeModel = this.config.get<string>('ANTHROPIC_MODEL') || 'claude-haiku-4-5-20251001';
    const claudePro = this.config.get<string>('ANTHROPIC_MODEL_PRO') || 'claude-opus-4-8';

    // DEFAULT tier prefers the free provider; PRO tier prefers Claude.
    this.defaultProvider = this.oai ? 'openai' : this.anthropic ? 'anthropic' : null;
    this.proProvider = this.anthropic ? 'anthropic' : this.oai ? 'openai' : null;

    this.defaultModel = this.oai ? freeModel : this.anthropic ? claudeModel : '';
    this.proModel = this.anthropic ? claudePro : this.oai ? freeModelPro : '';

    if (this.live) {
      this.logger.log(
        `LLM ready — default=${this.defaultProvider}:${this.defaultModel}, pro=${this.proProvider}:${this.proModel}`,
      );
    } else {
      this.logger.warn('No LLM provider configured — AI runs in mock mode');
    }
  }

  /** True when at least one real provider is wired. */
  get live(): boolean {
    return !!(this.oai || this.anthropic);
  }

  async complete(opts: CompleteOpts): Promise<LlmResult> {
    // Route by the model the caller asked for: proModel → pro tier, else default.
    const isPro = !!(opts.model && opts.model === this.proModel && this.proProvider);
    const provider = isPro ? this.proProvider : this.defaultProvider;
    const model = opts.model || (isPro ? this.proModel : this.defaultModel);

    if (provider === 'anthropic') return this.completeAnthropic(opts, model);
    if (provider === 'openai') return this.completeOpenAICompat(opts, model);
    throw new Error('LLM not configured (mock mode)');
  }

  // ─── Anthropic (Claude) ────────────────────────────────────────────────────────

  private async completeAnthropic(opts: CompleteOpts, model: string): Promise<LlmResult> {
    const maxTokens = opts.maxTokens ?? 1024;
    const temperature = opts.temperature ?? 0.7;
    const maxRounds = opts.maxToolRounds ?? 3;

    // Cache the (static, reused) system prompt to cut cost on repeat calls.
    const system = opts.system
      ? [{ type: 'text', text: opts.system, cache_control: { type: 'ephemeral' } }]
      : undefined;

    const messages: LlmMessage[] = opts.messages.map((m) => ({ role: m.role, content: m.content }));
    const toolsUsed = new Set<string>();

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

      const blocks: any[] = resp.content || [];
      const toolUses = canUseTools ? blocks.filter((b) => b.type === 'tool_use') : [];

      if (toolUses.length === 0) {
        return {
          text: blocks.filter((b) => b.type === 'text').map((b) => b.text).join('\n').trim(),
          stopReason: resp.stop_reason ?? null,
          toolsUsed: [...toolsUsed],
        };
      }

      messages.push({ role: 'assistant', content: blocks });
      const results: any[] = [];
      for (const tu of toolUses) {
        toolsUsed.add(tu.name);
        let out: any;
        try {
          out = await opts.toolRunner!(tu.name, tu.input);
        } catch (e: any) {
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

  // ─── OpenAI-compatible (Groq / Gemini / OpenRouter / Ollama / …) ─────────────────

  private async completeOpenAICompat(opts: CompleteOpts, model: string): Promise<LlmResult> {
    const maxTokens = opts.maxTokens ?? 1024;
    const temperature = opts.temperature ?? 0.7;
    const maxRounds = opts.maxToolRounds ?? 3;

    const messages: any[] = [];
    if (opts.system) messages.push({ role: 'system', content: opts.system });
    for (const m of opts.messages) {
      messages.push({ role: m.role, content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content) });
    }

    const tools = opts.tools?.map((t) => ({
      type: 'function',
      function: { name: t.name, description: t.description, parameters: t.input_schema },
    }));
    const toolsUsed = new Set<string>();

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
        let args: any = {};
        try {
          args = JSON.parse(tc.function?.arguments || '{}');
        } catch {
          /* leave args empty */
        }
        let out: any;
        try {
          out = await opts.toolRunner!(tc.function.name, args);
        } catch (e: any) {
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
}
