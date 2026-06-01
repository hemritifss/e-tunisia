import { Injectable, Logger } from '@nestjs/common';
import { ReportReason } from '../safety/report.entity';
import { LlmService } from './llm.service';

export type ModerationAction = 'allow' | 'flag' | 'block';

export interface ModerationVerdict {
  /** allow = publish; flag = publish + queue for human review; block = reject. */
  action: ModerationAction;
  /** Best-fit report category, or null when allowed. */
  reason: ReportReason | null;
  /** Short, user-facing explanation (safe to surface on a block). */
  explanation: string;
}

const ALLOW: ModerationVerdict = { action: 'allow', reason: null, explanation: '' };

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

@Injectable()
export class ModerationService {
  private readonly logger = new Logger(ModerationService.name);

  constructor(private readonly llm: LlmService) {}

  /**
   * Classify a piece of user text before it's published. Resilient by design:
   * any LLM/parse failure falls back to ALLOW so legitimate users are never
   * blocked by an infra hiccup — only a confident "block" verdict rejects.
   */
  async moderateText(text: string): Promise<ModerationVerdict> {
    const clean = (text || '').trim();
    if (!clean) return ALLOW;

    if (!this.llm.live) return this.heuristic(clean);

    try {
      const result = await this.llm.complete({
        // Moderation is high-volume + safety, not user-facing quality → free model.
        system: MODERATION_SYSTEM,
        messages: [{ role: 'user', content: `Content to classify:\n"""\n${clean.slice(0, 4000)}\n"""` }],
        temperature: 0,
        maxTokens: 200,
      });
      return this.parseVerdict(result.text) ?? this.heuristic(clean);
    } catch (e: any) {
      this.logger.warn(`Moderation call failed, allowing: ${e?.message || e}`);
      return ALLOW;
    }
  }

  // ─── internals ───────────────────────────────────────────────────────────────

  private parseVerdict(raw: string): ModerationVerdict | null {
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return null;
    let parsed: any;
    try {
      parsed = JSON.parse(match[0]);
    } catch {
      return null;
    }

    const action: ModerationAction =
      parsed.action === 'block' || parsed.action === 'flag' ? parsed.action : 'allow';
    if (action === 'allow') return ALLOW;

    return {
      action,
      reason: this.toReason(parsed.reason),
      explanation: String(parsed.explanation || '').slice(0, 280),
    };
  }

  private toReason(value: any): ReportReason | null {
    const v = String(value || '').toLowerCase();
    const known = Object.values(ReportReason) as string[];
    return known.includes(v) ? (v as ReportReason) : ReportReason.OTHER;
  }

  /**
   * Mock-mode / fallback classifier — a tiny keyword screen so the feature is
   * testable without an API key. Deliberately conservative: it only catches
   * blatant cases and otherwise allows.
   */
  private heuristic(text: string): ModerationVerdict {
    const t = text.toLowerCase();

    // Obvious scam / spam patterns → flag (not block; humans confirm).
    const spammy = /\b(free\s+money|click\s+here|whatsapp\s*\+?\d|crypto\s+giveaway|earn\s+\$?\d+\s*\/?\s*day|t\.me\/|bit\.ly\/)\b/i;
    if (spammy.test(t)) {
      return { action: 'flag', reason: ReportReason.SPAM, explanation: 'Looks like spam or a promotional scam.' };
    }

    // A minimal hard-block list (slurs/explicit). Kept short on purpose.
    const blocked = ['kill yourself', 'kys ', 'child porn', 'cp video'];
    if (blocked.some((w) => t.includes(w))) {
      return { action: 'block', reason: ReportReason.HATE, explanation: 'Contains content that violates our safety rules.' };
    }

    return ALLOW;
  }
}
