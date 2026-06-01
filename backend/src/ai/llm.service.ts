import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Central Claude (Anthropic) wrapper — the ONE place the platform talks to an LLM.
 *
 * Every AI feature (concierge, itineraries, future moderation/translation/auto-tag)
 * goes through `complete()`. Benefits of keeping it here:
 *   - single provider/SDK init + model config
 *   - a built-in tool-use loop so callers just pass tool defs + a runner
 *   - prompt caching on the system prompt (cheap repeated calls)
 *   - graceful "mock mode" via `live` — no key, no crash; callers fall back to canned data
 *
 * Set ANTHROPIC_API_KEY to go live. Models are env-overridable:
 *   ANTHROPIC_MODEL      (default: Haiku — fast/cheap, used for chat)
 *   ANTHROPIC_MODEL_PRO  (default: Opus  — slower/smarter, used for itineraries)
 */

export interface LlmMessage {
  role: 'user' | 'assistant';
  content: any; // string, or Anthropic content blocks (tool_use / tool_result)
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
  /** Tool definitions exposed to the model. */
  tools?: LlmTool[];
  /** Invoked for each tool_use block; return value is JSON-serialised back to the model. */
  toolRunner?: (name: string, input: any) => Promise<any>;
  /** How many tool round-trips before forcing a final text answer. Default 3. */
  maxToolRounds?: number;
}

export interface LlmResult {
  text: string;
  stopReason: string | null;
  /** Names of tools the model actually invoked (useful for telemetry/grounding). */
  toolsUsed: string[];
}

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);
  private client: any = null;

  readonly defaultModel: string;
  readonly proModel: string;

  constructor(private readonly config: ConfigService) {
    this.defaultModel = this.config.get<string>('ANTHROPIC_MODEL') || 'claude-haiku-4-5-20251001';
    this.proModel = this.config.get<string>('ANTHROPIC_MODEL_PRO') || 'claude-opus-4-8';

    const apiKey = this.config.get<string>('ANTHROPIC_API_KEY');
    if (!apiKey) {
      this.logger.warn('ANTHROPIC_API_KEY not set — AI runs in mock mode');
      return;
    }
    try {
      const mod = require('@anthropic-ai/sdk');
      const Anthropic = mod.default || mod;
      this.client = new Anthropic({ apiKey });
      this.logger.log(`Claude initialised (chat=${this.defaultModel}, pro=${this.proModel})`);
    } catch (e: any) {
      this.logger.warn(`@anthropic-ai/sdk not loadable — AI runs in mock mode (${e?.message || e})`);
    }
  }

  /** True when a real Claude client is wired. Callers use this to decide mock vs live. */
  get live(): boolean {
    return !!this.client;
  }

  /**
   * Run a completion, transparently looping through any tool calls the model makes.
   * The final round is always tool-free so the model is forced to answer in text.
   */
  async complete(opts: CompleteOpts): Promise<LlmResult> {
    if (!this.client) throw new Error('LLM not configured (mock mode)');

    const model = opts.model || this.defaultModel;
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

      const resp = await this.client.messages.create({
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

      // Echo the assistant turn (incl. tool_use blocks) then answer each tool call.
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

    // Unreachable in practice (last round is tool-free), but keep TS happy.
    return { text: '', stopReason: null, toolsUsed: [...toolsUsed] };
  }
}
