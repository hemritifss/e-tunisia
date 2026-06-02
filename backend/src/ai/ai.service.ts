import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { PlacesService } from '../places/places.service';
import { SearchService } from '../search/search.service';
import { BillingService } from '../billing/billing.service';
import { RedisService } from '../redis/redis.service';
import { UserPlan } from '../users/user.entity';
import { LlmService } from './llm.service';

export interface ItineraryDay {
  day: number;
  title: string;
  description: string;
  places: Array<{
    id: string;
    name: string;
    description: string;
    duration: string;
    price?: number;
    image?: string;
  }>;
  meals: string[];
  transport: string;
  estimatedCost: number;
}

export interface AIItinerary {
  title: string;
  description: string;
  duration: number;
  totalEstimatedCost: number;
  currency: string;
  tags: string[];
  days: ItineraryDay[];
  tips: string[];
  bestFor: string[];
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/** A real place pulled from the DB and surfaced to the chat UI as a clickable card. */
export interface GroundedPlace {
  id: string;
  name: string;
  city: string | null;
  category: string | null;
  rating: number | null;
  description: string;
  url: string;
}

/** Daily AI-message allowance for guests (no account). Plan caps cover logged-in users. */
const GUEST_AI_DAILY = Number(process.env.AI_GUEST_DAILY || 3);

/** Language codes → human names for the translation prompt. */
const LANG_NAMES: Record<string, string> = {
  fr: 'French',
  ar: 'Arabic',
  en: 'English',
  derja: 'Tunisian Arabic (derja)',
  it: 'Italian',
  de: 'German',
  es: 'Spanish',
};

export type AssistAction = 'improve' | 'translate' | 'shorten' | 'expand';

const CONCIERGE_SYSTEM = `You are e-Tunisia's AI travel concierge — an enthusiastic local who knows every hidden gem, restaurant, and secret beach in Tunisia.

GROUNDING — this is critical:
- Before recommending ANY specific place, call the \`search_places\` tool to check e-Tunisia's real database.
- Only name places that the tool actually returns. Never invent places, addresses, or prices.
- If the database has nothing relevant, say so honestly and offer general guidance instead.

STYLE:
- Warm, concise (max 3 short paragraphs). Prices in TND.
- You may mix in a little Tunisian derja when it feels natural.
- End with a light question or next step to keep the conversation going.`;

const SEARCH_PARSE_SYSTEM = `You convert a traveler's natural-language search into structured filters for e-Tunisia's places database. The query may be in Tunisian derja, Arabic, French or English (often mixed).

Return ONLY a JSON object, no prose:
{"keywords":"<core subject terms, cleaned>","city":"<a real Tunisian city, or empty>","category":"<beaches|food|historical|nature|culture|nightlife|shopping, or empty>","minRating":<0-5 number, default 0>,"summary":"<one short human phrase describing the search>"}

Rules:
- kahwa/café/restaurant/manger/food/couscous → category "food". plage/beach/mer → "beaches". musée/medina/ruins/historique → "historical". montagne/oasis/parc/nature/désert → "nature".
- Set "city" only if a real Tunisian city is named (Tunis, Sousse, Sfax, Djerba, Sidi Bou Said, Tozeur, Hammamet, Bizerte, Kairouan, Tabarka, Douz, Nabeul, Monastir...).
- "top/best/meilleur/highly rated/4 étoiles" → minRating 4, else 0.
- "keywords" drops filler (find me, I want, near, cheap, b...) but keeps the subject; leave empty if the city+category already capture it.`;

const AUTOTAG_SYSTEM = `You categorize a short social/travel post for e-Tunisia. Posts may be in Tunisian derja, Arabic, French or English.

Return ONLY JSON:
{"category":"<beaches|food|historical|nature|culture|nightlife|shopping|events|tips, or empty>","tags":["<3-6 short lowercase topical tags, no # symbol>"],"location":"<a Tunisian city/place named in the post, or empty>"}

Rules:
- Tags are concise topics (e.g. "couscous", "sunset", "hiking", "medina"), not sentences. No hashtag symbol.
- Only set "location" if a real Tunisian place is mentioned.
- Pick the single best-fit category, or empty if none fits.`;

const KNOWN_CATEGORIES = new Set([
  'beaches', 'food', 'historical', 'nature', 'culture', 'nightlife', 'shopping', 'events', 'tips',
]);

const CAPTION_SYSTEM = `You write short, punchy social captions for Tunisia travel reels (e-Tunisia app).
- 1-2 lines, warm and authentic, a touch of Tunisian flavour (a derja word like "barcha", "3aslema", "yezzi" is welcome but optional).
- Then a new line with 3-5 relevant hashtags (always include #Tunisia).
- Match the language of the notes if given; otherwise English.
Output ONLY the caption text — no quotes, no commentary.`;

const RERANK_SYSTEM = `You re-rank candidate Tunisian places for a traveler by how well they fit the traveler's interests.
Input is JSON: {"interests":[...],"candidates":[{"id","name","city","category","rating","tags"}]}.
Return ONLY a JSON array, best-first, of up to 10 items: [{"id":"<a candidate id>","reason":"<one short, personalized reason>"}].
Use only ids that appear in candidates. Prefer strong interest/tag matches and higher ratings.`;

const SURPRISE_SYSTEM = `You are e-Tunisia's spontaneous-day planner. Given 2-3 real places, write a short, fun, energetic single-day plan (2-3 sentences) weaving them together. Tunisian flavour welcome (a derja word like "yalla" is fine), mention the place names, end on an upbeat note. No lists, no hashtags, no quotes.`;

const PERSONALITY_SYSTEM = `Given a Tunisian traveler's interests and how much they've explored, invent a fun, flattering "travel personality".
Return ONLY JSON: {"type":"<2-3 word title, e.g. Coastal Wanderer>","emoji":"<one emoji>","description":"<2 warm second-person sentences>","traits":["<3 short adjectives>"]}.
Keep it positive, playful and Tunisia-flavoured.`;

@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);

  constructor(
    private readonly placesService: PlacesService,
    private readonly searchService: SearchService,
    private readonly llm: LlmService,
    private readonly billing: BillingService,
    private readonly redis: RedisService,
  ) {}

  // ──────────────── Usage metering (plan-aware, Redis daily counter) ────────────────

  /**
   * Count one AI request against the caller's daily allowance and throw a 403
   * (`ai_quota_reached`) when they're over. Logged-in users are metered against
   * their plan's `aiMessagesPerDay` cap; guests against a small per-IP allowance.
   * Fails OPEN if Redis is unavailable — AI is never blocked by an infra hiccup.
   */
  async assertQuotaAndCount(identity: { userId?: string | null; ip?: string }): Promise<{ plan: UserPlan; premium: boolean }> {
    let plan = UserPlan.FREE;
    let cap: number;

    if (identity.userId) {
      plan = await this.billing.effectivePlan(identity.userId);
      cap = this.billing.caps(plan).aiMessagesPerDay;
    } else {
      cap = GUEST_AI_DAILY;
    }

    // Paid users (Pro/Business) get routed to Claude; everyone else to the free model.
    const result = { plan, premium: plan !== UserPlan.FREE };
    if (!Number.isFinite(cap)) return result; // unlimited (Business)

    const day = new Date().toISOString().slice(0, 10); // UTC day bucket
    const subject = identity.userId || `ip:${identity.ip || 'unknown'}`;
    const key = `ai:quota:${day}:${subject}`;

    let used: number;
    try {
      used = await this.redis.increment(key);
      if (used === 1) await this.redis.expire(key, 60 * 60 * 26); // expire ~1 day after first use
    } catch {
      return result; // Redis down → don't block the feature
    }

    if (used > cap) {
      throw new ForbiddenException({
        code: 'ai_quota_reached',
        message: identity.userId
          ? `You've reached your ${cap} AI messages for today. Upgrade for more.`
          : `Guests get ${cap} AI messages a day. Sign in or upgrade for more.`,
        cap,
        plan,
        scope: identity.userId ? 'user' : 'guest',
      });
    }

    return result;
  }

  // ──────────────── Itinerary generation ────────────────

  async generateItinerary(preferences: {
    duration: number;
    budget: number;
    travelers: number;
    interests: string[];
    startLocation?: string;
    travelStyle?: string;
  }, premium = false): Promise<AIItinerary> {
    const placesResponse = await this.placesService.findAll({} as any);
    const places = placesResponse.data || [];
    const featuredPlaces = places.filter((p: any) => p.isFeatured || p.rating >= 4.0);

    if (!this.llm.live) {
      return this.generateMockItinerary(preferences, featuredPlaces);
    }

    const prompt = this.buildItineraryPrompt(preferences, featuredPlaces);

    try {
      const result = await this.llm.complete({
        premium,
        heavy: true,
        system:
          'You are an expert Tunisian travel planner. Create detailed, authentic itineraries featuring hidden gems and local experiences. Return ONLY valid JSON matching the requested format.',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        maxTokens: 4000,
      });

      const jsonMatch = result.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
      throw new Error('Invalid JSON response');
    } catch (error: any) {
      this.logger.error('AI itinerary generation failed:', error.message);
      return this.generateMockItinerary(preferences, featuredPlaces);
    }
  }

  // ──────────────── Grounded chat concierge ────────────────

  async chatTravelPlanner(
    messages: ChatMessage[],
    premium = false,
  ): Promise<{ reply: string; suggestions?: string[]; places?: GroundedPlace[] }> {
    if (!this.llm.live) {
      return this.generateMockChatResponse(messages);
    }

    // Collect the real places the model looked up so the UI can render them as cards.
    const referenced = new Map<string, GroundedPlace>();

    const tools = [
      {
        name: 'search_places',
        description:
          "Search e-Tunisia's real database of places (beaches, restaurants, historical sites, nature, etc.). Always call this before recommending any place so you only mention places that actually exist on the platform.",
        input_schema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Free-text, e.g. "rooftop cafe", "hidden beach", "couscous".' },
            city: { type: 'string', description: 'Filter to a city, e.g. "Tunis", "Sousse", "Djerba".' },
            category: { type: 'string', description: 'Category slug, e.g. beaches, food, historical, nature.' },
            minRating: { type: 'number', description: 'Minimum star rating 0-5.' },
            limit: { type: 'number', description: 'How many results (default 6, max 12).' },
          },
        },
      },
    ];

    const toolRunner = async (name: string, input: any) => {
      if (name !== 'search_places') return { error: `Unknown tool: ${name}` };
      const res = await this.placesService.findAll({
        search: input.query,
        city: input.city,
        category: input.category,
        minRating: input.minRating,
        limit: Math.min(12, Math.max(1, Number(input.limit) || 6)),
      } as any);

      const list: GroundedPlace[] = (res.data || []).map((p: any) => {
        const card: GroundedPlace = {
          id: p.id,
          name: p.name,
          city: p.city ?? null,
          category: p.category?.name ?? (typeof p.category === 'string' ? p.category : null),
          rating: p.rating ?? null,
          description: (p.description || '').slice(0, 160),
          url: `/#/place/${p.id}`,
        };
        referenced.set(card.id, card);
        return card;
      });

      return { count: list.length, places: list };
    };

    // Keep the last few turns, but Anthropic requires the first message to be a
    // 'user' turn — drop any leading assistant messages the window may start on.
    const convo = messages.slice(-8).map((m) => ({ role: m.role, content: m.content }));
    while (convo.length && convo[0].role !== 'user') convo.shift();
    if (convo.length === 0) convo.push({ role: 'user', content: 'Hi!' });

    try {
      const result = await this.llm.complete({
        premium,
        system: CONCIERGE_SYSTEM,
        messages: convo,
        temperature: 0.7,
        maxTokens: 1024,
        tools,
        toolRunner,
        maxToolRounds: 3,
      });

      return {
        reply: result.text,
        suggestions: this.extractSuggestions(result.text),
        places: [...referenced.values()].slice(0, 6),
      };
    } catch (error: any) {
      this.logger.error('AI chat failed:', error.message);
      return this.generateMockChatResponse(messages);
    }
  }

  // ──────────────── Compose assist + translation (Phase 3) ────────────────

  /**
   * Rewrite a piece of user text: improve / translate / shorten / expand.
   * Returns `{ mock: true }` (and the original text untouched) when no LLM is
   * configured, so the UI can tell the user the feature needs a key.
   */
  async assist(input: {
    text: string;
    action: AssistAction | string;
    targetLang?: string;
    tone?: string;
  }, premium = false): Promise<{ text: string; mock?: boolean }> {
    const text = (input.text || '').trim();
    if (!text) return { text: '' };
    if (!this.llm.live) return { text, mock: true };

    const action: AssistAction = (['improve', 'translate', 'shorten', 'expand'] as const).includes(
      input.action as AssistAction,
    )
      ? (input.action as AssistAction)
      : 'improve';

    const langName = LANG_NAMES[(input.targetLang || '').toLowerCase()] || input.targetLang;

    let instruction: string;
    switch (action) {
      case 'translate':
        instruction = `Translate the post below into ${langName || 'French'}. Preserve the meaning, tone, emojis, @mentions and #hashtags. Output ONLY the translation.`;
        break;
      case 'shorten':
        instruction = 'Rewrite the post below to be shorter and punchier while keeping the key point and language. Output ONLY the rewrite.';
        break;
      case 'expand':
        instruction = 'Expand the post below with a little more vivid, authentic detail (without getting long-winded), keeping the same language. Output ONLY the rewrite.';
        break;
      default:
        instruction =
          "Fix the spelling, grammar and flow of the social post below. Keep the author's voice, language (derja stays derja), emojis, @mentions and #hashtags. Do not change the meaning or add hashtags. Output ONLY the improved text.";
    }

    try {
      const result = await this.llm.complete({
        premium,
        system: `You are a writing assistant for e-Tunisia, a Tunisian travel & social app. Users write in Tunisian derja, Arabic, French or English, often mixed.${input.tone ? ` Tone: ${input.tone}.` : ''} Never add commentary, quotes or labels — return only the resulting text.`,
        messages: [{ role: 'user', content: `${instruction}\n\n"""\n${text.slice(0, 3000)}\n"""` }],
        temperature: action === 'translate' ? 0.2 : 0.5,
        maxTokens: 800,
      });
      const out = result.text.trim().replace(/^"""\s*|\s*"""$/g, '').trim();
      return { text: out || text };
    } catch (error: any) {
      this.logger.error('AI assist failed:', error.message);
      return { text, mock: true };
    }
  }

  // ──────────────── Reels caption generator (Phase 5) ────────────────

  /** Generate a short reel caption (+ hashtags) from optional notes and a location. */
  async generateCaption(input: { topic?: string; location?: string }, premium = false): Promise<{ caption: string; mock?: boolean }> {
    const topic = (input.topic || '').trim();
    const loc = (input.location || '').trim();

    if (!this.llm.live) {
      const base = topic || (loc ? `Exploring ${loc}` : 'A little Tunisia moment');
      const tags = ['Tunisia', ...(loc ? [loc.replace(/\s+/g, '')] : []), 'eTunisia', 'travel'];
      return { caption: `${base} ✨\n${tags.map((t) => `#${t}`).join(' ')}`, mock: true };
    }

    try {
      const result = await this.llm.complete({
        premium,
        system: CAPTION_SYSTEM,
        messages: [{ role: 'user', content: `Notes: ${topic || '(none)'}\nLocation: ${loc || '(none)'}` }],
        temperature: 0.9,
        maxTokens: 220,
      });
      const caption = result.text.trim();
      return { caption: caption || `${topic || 'Tunisia'} ✨\n#Tunisia #eTunisia` };
    } catch (error: any) {
      this.logger.error('Caption generation failed:', error.message);
      const base = topic || (loc ? `Exploring ${loc}` : 'A little Tunisia moment');
      return { caption: `${base} ✨\n#Tunisia #eTunisia #travel`, mock: true };
    }
  }

  // ──────────────── Nice-to-have delights ────────────────

  /** One-tap spontaneous day plan from a few real places. */
  async surpriseMe(premium = false): Promise<{ blurb: string; places: GroundedPlace[]; mock?: boolean }> {
    const res = await this.placesService.findAll({ limit: 40 } as any);
    const all = res.data || [];
    const pool = all.filter((p: any) => p.isFeatured || (p.rating || 0) >= 4);
    const source = pool.length >= 3 ? pool : all;
    const picks = [...source].sort(() => Math.random() - 0.5).slice(0, 3);

    const places: GroundedPlace[] = picks.map((p: any) => ({
      id: p.id,
      name: p.name,
      city: p.city ?? null,
      category: p.category?.name ?? (typeof p.category === 'string' ? p.category : null),
      rating: p.rating ?? null,
      description: (p.description || '').slice(0, 160),
      url: `/#/place/${p.id}`,
    }));

    const fallbackBlurb = places.length
      ? `Today's spontaneous plan: kick off at ${places[0].name}${places[0].city ? ` in ${places[0].city}` : ''}, then drift over to ${places.slice(1).map((p) => p.name).join(' and ')}. Yalla! 🎲`
      : "Add a few places first and I'll surprise you with a plan!";

    if (!this.llm.live || places.length === 0) {
      return { blurb: fallbackBlurb, places, mock: !this.llm.live };
    }

    try {
      const result = await this.llm.complete({
        premium,
        system: SURPRISE_SYSTEM,
        messages: [{ role: 'user', content: `Weave these real places into one fun spontaneous Tunisia day: ${picks.map((p: any) => `${p.name} (${p.city})`).join('; ')}` }],
        temperature: 1,
        maxTokens: 220,
      });
      return { blurb: result.text.trim() || fallbackBlurb, places };
    } catch (error: any) {
      this.logger.warn(`Surprise-me failed: ${error.message}`);
      return { blurb: fallbackBlurb, places, mock: true };
    }
  }

  /** A fun, shareable "travel personality" from the user's interests + exploration. */
  async travelPersonality(profile: { interests?: string[]; visitedCount?: number }, premium = false): Promise<{
    type: string;
    emoji: string;
    description: string;
    traits: string[];
    mock?: boolean;
  }> {
    const interests = profile.interests || [];

    if (!this.llm.live) return this.mockPersonality(interests);

    try {
      const result = await this.llm.complete({
        premium,
        system: PERSONALITY_SYSTEM,
        messages: [{ role: 'user', content: JSON.stringify({ interests, placesVisited: profile.visitedCount || 0 }) }],
        temperature: 0.85,
        maxTokens: 250,
      });
      const m = result.text.match(/\{[\s\S]*\}/);
      if (!m) return this.mockPersonality(interests);
      const p = JSON.parse(m[0]);
      return {
        type: String(p.type || 'Tunisia Explorer').slice(0, 40),
        emoji: String(p.emoji || '🌍').slice(0, 4),
        description: String(p.description || '').slice(0, 300),
        traits: Array.isArray(p.traits) ? p.traits.map((t: any) => String(t)).slice(0, 3) : [],
      };
    } catch (error: any) {
      this.logger.warn(`Personality failed: ${error.message}`);
      return this.mockPersonality(interests);
    }
  }

  private mockPersonality(interests: string[]): { type: string; emoji: string; description: string; traits: string[]; mock: boolean } {
    const map: Record<string, { type: string; emoji: string; description: string; traits: string[] }> = {
      beaches: { type: 'Coastal Wanderer', emoji: '🌊', description: 'You chase the sound of the Mediterranean and the perfect golden hour. Sand between your toes is your happy place.', traits: ['relaxed', 'sun-seeker', 'free'] },
      food: { type: 'Flavour Hunter', emoji: '🍽️', description: 'Your map is drawn in spices and street food. You travel stomach-first and never regret a single bite.', traits: ['curious', 'social', 'bold'] },
      historical: { type: 'Medina Soul', emoji: '🏛️', description: 'Old stones whisper stories and you always stop to listen. History is your favourite travel companion.', traits: ['thoughtful', 'curious', 'grounded'] },
      nature: { type: 'Sahara Dreamer', emoji: '🏜️', description: 'Wide horizons and quiet trails call your name. You always find yourself somewhere off the map.', traits: ['adventurous', 'calm', 'free'] },
      culture: { type: 'Culture Collector', emoji: '🎭', description: "You read a place through its music, art and people. Every city leaves a mark on you.", traits: ['warm', 'open', 'curious'] },
    };
    const key = interests.map((i) => i.toLowerCase()).find((i) => map[i]) || 'historical';
    return { ...map[key], mock: true };
  }

  /** A short personalized home greeting. Cached per user per day; always free + unmetered. */
  async greeting(userId: string, name?: string): Promise<{ text: string; cached?: boolean }> {
    const first = (name || '').split(' ')[0] || 'traveler';
    const day = new Date().toISOString().slice(0, 10);
    const key = `ai:greeting:${userId}:${day}`;

    try {
      const cached = await this.redis.get(key);
      if (cached) return { text: cached, cached: true };
    } catch { /* fall through to generate */ }

    let text: string;
    if (!this.llm.live) {
      text = this.templatedGreeting(first);
    } else {
      try {
        const hour = new Date().getHours();
        const part = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
        const r = await this.llm.complete({
          system: "Write ONE short, warm welcome line (max 12 words) for a Tunisian travel app home screen. Use the person's first name, a touch of Tunisian derja is welcome, finish with one emoji. No quotes.",
          messages: [{ role: 'user', content: `Name: ${first}. Time of day: ${part}.` }],
          temperature: 1,
          maxTokens: 40,
        });
        text = r.text.trim() || this.templatedGreeting(first);
      } catch {
        text = this.templatedGreeting(first);
      }
    }

    try { await this.redis.set(key, text, 60 * 60 * 24); } catch { /* best-effort cache */ }
    return { text };
  }

  private templatedGreeting(first: string): string {
    const h = new Date().getHours();
    const g = h < 12 ? 'Sbah el khir' : h < 18 ? 'Ahla w sahla' : 'Good evening';
    return `${g}, ${first} — Tunisia is calling ☀️`;
  }

  // ──────────────── Natural-language search (Phase 3b) ────────────────

  /**
   * Turn a free-form query ("kahwa rooftop b wifi fi tunis", "best hidden beaches")
   * into structured place filters via the LLM, then run them. Posts + users come from
   * the existing keyword index. Falls back to plain keyword search with no LLM.
   */
  async smartSearch(query: string, premium = false): Promise<{
    places: any[];
    posts: any[];
    users: any[];
    interpreted:
      | { summary?: string; city?: string; category?: string; minRating?: number; keywords?: string }
      | null;
    mock?: boolean;
  }> {
    const q = (query || '').trim();
    if (!q) return { places: [], posts: [], users: [], interpreted: null };

    if (!this.llm.live) {
      const r = await this.searchService.search(q, { limit: 20 });
      return { places: r.places || [], posts: r.posts || [], users: r.users || [], interpreted: null, mock: true };
    }

    let filters: any = {};
    try {
      const result = await this.llm.complete({
        premium,
        system: SEARCH_PARSE_SYSTEM,
        messages: [{ role: 'user', content: q.slice(0, 300) }],
        temperature: 0,
        maxTokens: 250,
      });
      const m = result.text.match(/\{[\s\S]*\}/);
      if (m) filters = JSON.parse(m[0]);
    } catch (error: any) {
      this.logger.warn(`Smart-search parse failed, using raw query: ${error.message}`);
    }

    const keywords = String(filters.keywords || '').trim().slice(0, 120);
    const city = filters.city ? String(filters.city).trim() : undefined;
    const category = filters.category ? String(filters.category).trim() : undefined;
    const minRating = Number.isFinite(filters.minRating) && filters.minRating > 0 ? Number(filters.minRating) : undefined;

    const [placesRes, kw] = await Promise.all([
      this.placesService.findAll({
        search: keywords || (city || category ? undefined : q),
        city,
        category,
        minRating,
        limit: 20,
      } as any),
      this.searchService.search(keywords || q, { limit: 12 }),
    ]);

    return {
      places: placesRes.data || [],
      posts: kw.posts || [],
      users: kw.users || [],
      interpreted: {
        summary: filters.summary || undefined,
        city,
        category,
        minRating,
        keywords: keywords || undefined,
      },
    };
  }

  // ──────────────── Auto-tagging (Phase 4) ────────────────

  /**
   * Suggest a category, topical tags and a location for a post from its text.
   * Used to auto-enrich posts on create (and available as an endpoint for the
   * composer). Falls back to a hashtag/keyword heuristic with no LLM.
   */
  async autoTag(input: { title?: string; body?: string }): Promise<{
    category?: string;
    tags: string[];
    location?: string;
  }> {
    const text = `${input.title || ''}\n${input.body || ''}`.trim();
    if (!text) return { tags: [] };
    if (!this.llm.live) return this.heuristicTags(text);

    try {
      // Auto-tagging is high-volume + server-side → always the free model.
      const result = await this.llm.complete({
        system: AUTOTAG_SYSTEM,
        messages: [{ role: 'user', content: text.slice(0, 2000) }],
        temperature: 0,
        maxTokens: 200,
      });
      const m = result.text.match(/\{[\s\S]*\}/);
      if (!m) return this.heuristicTags(text);
      const parsed = JSON.parse(m[0]);
      const category = parsed.category ? String(parsed.category).toLowerCase().trim() : undefined;
      return {
        category: category && KNOWN_CATEGORIES.has(category) ? category : undefined,
        tags: Array.isArray(parsed.tags)
          ? parsed.tags.map((t: any) => String(t).replace(/^#/, '').trim().toLowerCase()).filter(Boolean).slice(0, 6)
          : [],
        location: parsed.location ? String(parsed.location).trim() : undefined,
      };
    } catch (error: any) {
      this.logger.warn(`Auto-tag failed, using heuristic: ${error.message}`);
      return this.heuristicTags(text);
    }
  }

  /** No-LLM tagging: pull #hashtags + a couple of keyword/category guesses. */
  private heuristicTags(text: string): { category?: string; tags: string[]; location?: string } {
    const t = text.toLowerCase();
    const hashtags = (text.match(/#([\p{L}0-9_]{2,30})/gu) || []).map((h) => h.slice(1).toLowerCase());

    const catRules: Array<[string, RegExp]> = [
      ['food', /\b(food|eat|restaurant|cafe|café|kahwa|couscous|brik|lablabi|dinner|lunch)\b/],
      ['beaches', /\b(beach|plage|sea|mer|sun|sand|swim)\b/],
      ['historical', /\b(medina|ruins|museum|musée|carthage|amphitheater|history|historical)\b/],
      ['nature', /\b(mountain|montagne|oasis|desert|sahara|hike|hiking|park|nature)\b/],
      ['nightlife', /\b(club|bar|party|nightlife|dj)\b/],
      ['shopping', /\b(souk|market|shopping|shop|boutique)\b/],
    ];
    const category = catRules.find(([, re]) => re.test(t))?.[0];

    const cities = ['tunis', 'sousse', 'sfax', 'djerba', 'sidi bou said', 'tozeur', 'hammamet', 'bizerte', 'kairouan', 'tabarka', 'nabeul', 'monastir', 'douz'];
    const location = cities.find((c) => t.includes(c));

    const tags = [...new Set([...hashtags, ...(category ? [category] : [])])].slice(0, 6);
    return { category, tags, location: location ? location.replace(/\b\w/g, (c) => c.toUpperCase()) : undefined };
  }

  // ──────────────── Place suggestions (rule-based for now — Phase 5 upgrades this) ────────────────

  async suggestPlaces(userProfile: {
    visitedPlaceIds: string[];
    favoriteIds: string[];
    interests: string[];
  }, premium = false): Promise<Array<{ placeId: string; reason: string; score: number; place: any }>> {
    const placesResponse = await this.placesService.findAll({} as any);
    const allPlaces = placesResponse.data || [];

    // Rule-based scoring picks a candidate pool; the LLM (when live) re-ranks it.
    const scored = allPlaces
      .filter((p: any) => !userProfile.visitedPlaceIds.includes(p.id))
      .map((place: any) => {
        let score = (place.rating || 0) * 20;
        const matchingTags =
          place.tags?.filter((tag: string) =>
            userProfile.interests.some((i) => tag.toLowerCase().includes(i.toLowerCase())),
          ) || [];
        score += matchingTags.length * 15;
        if (place.isFeatured) score += 10;
        if (place.isBoosted) score += 5;
        if (userProfile.favoriteIds.includes(place.id)) score -= 30;
        return { place, placeId: place.id, reason: this.generateReason(place, matchingTags), score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);

    const ruleTop = () => scored.slice(0, 10).map(({ placeId, reason, score, place }) => ({ placeId, reason, score, place }));

    // No LLM, too few candidates, or no stated interests → just use the scoring.
    if (!this.llm.live || scored.length <= 3 || userProfile.interests.length === 0) {
      return ruleTop();
    }

    try {
      const candidates = scored.map((s) => ({
        id: s.place.id,
        name: s.place.name,
        city: s.place.city,
        category: s.place.category?.name ?? s.place.category,
        rating: s.place.rating,
        tags: (s.place.tags || []).slice(0, 6),
      }));

      const result = await this.llm.complete({
        premium,
        system: RERANK_SYSTEM,
        messages: [{ role: 'user', content: JSON.stringify({ interests: userProfile.interests, candidates }) }],
        temperature: 0.3,
        maxTokens: 700,
      });

      const m = result.text.match(/\[[\s\S]*\]/);
      if (!m) return ruleTop();
      const ranked: Array<{ id: string; reason?: string }> = JSON.parse(m[0]);

      const byId = new Map(scored.map((s) => [s.place.id, s]));
      const out: Array<{ placeId: string; reason: string; score: number; place: any }> = [];
      for (const r of ranked) {
        const s = byId.get(r.id);
        if (s && !out.find((o) => o.placeId === s.place.id)) {
          out.push({ placeId: s.place.id, reason: r.reason || s.reason, score: s.score, place: s.place });
        }
        if (out.length >= 10) break;
      }
      // Backfill from the scored pool if the model returned fewer than 10.
      for (const s of scored) {
        if (out.length >= 10) break;
        if (!out.find((o) => o.placeId === s.place.id)) {
          out.push({ placeId: s.place.id, reason: s.reason, score: s.score, place: s.place });
        }
      }
      return out;
    } catch (error: any) {
      this.logger.warn(`Recommendation re-rank failed, using scores: ${error.message}`);
      return ruleTop();
    }
  }

  // ──────────────── Prompt builders + mock fallbacks ────────────────

  private buildItineraryPrompt(prefs: any, places: any[]): string {
    const placeList = places
      .map((p) => `- ${p.name} (${p.city}): ${p.description?.slice(0, 100)}... Rating: ${p.rating}/5`)
      .join('\n');

    return `Create a ${prefs.duration}-day Tunisia itinerary for ${prefs.travelers} travelers with a budget of ${prefs.budget} TND.

Interests: ${prefs.interests?.join(', ') || 'culture, food, nature'}
Travel style: ${prefs.travelStyle || 'balanced'}
Start from: ${prefs.startLocation || 'Tunis'}

Available places:\n${placeList}

Return JSON with this exact structure:
{
  "title": "...",
  "description": "...",
  "duration": ${prefs.duration},
  "totalEstimatedCost": number,
  "currency": "TND",
  "tags": ["..."],
  "days": [
    {
      "day": 1,
      "title": "...",
      "description": "...",
      "places": [{"id": "...", "name": "...", "description": "...", "duration": "2 hours", "price": 0}],
      "meals": ["breakfast at...", "lunch at..."],
      "transport": "...",
      "estimatedCost": 0
    }
  ],
  "tips": ["..."],
  "bestFor": ["..."]
}`;
  }

  private generateMockItinerary(prefs: any, places: any[]): AIItinerary {
    const days: ItineraryDay[] = [];
    const dayPlaces = [
      ['Sidi Bou Said', 'Carthage Ruins'],
      ['Medina of Tunis', 'Bardo Museum'],
      ['Sousse Medina', 'Port El Kantaoui'],
      ['El Jem Amphitheater', 'Sfax Medina'],
      ['Douz Sahara', 'Chott el Djerid'],
      ['Djerba Island', 'Houmt Souk'],
      ['Tozeur Oasis', 'Chebika Mountain'],
      ['Tabarka Beach', 'Kroumerie Mountains'],
    ];

    for (let i = 0; i < prefs.duration; i++) {
      const placeNames = dayPlaces[i % dayPlaces.length];
      const dayPlacesData = placeNames.map((name) => {
        const place = places.find((p) => p.name.toLowerCase().includes(name.toLowerCase()));
        return {
          id: place?.id || `mock-${i}`,
          name: name,
          description: `Explore the beauty of ${name} with local guides.`,
          duration: '2-3 hours',
          price: Math.floor(Math.random() * 50) + 20,
          image: place?.images?.[0],
        };
      });

      days.push({
        day: i + 1,
        title: `Day ${i + 1}: ${placeNames.join(' & ')}`,
        description: `Discover the hidden gems of ${placeNames[0]} and experience authentic Tunisian culture.`,
        places: dayPlacesData,
        meals: [
          'Traditional Tunisian breakfast with bambalouni',
          `Lunch at a local restaurant in ${placeNames[0]}`,
          'Fresh seafood dinner by the coast',
        ],
        transport: i === 0 ? 'Airport pickup + private car' : 'Private car with driver',
        estimatedCost: Math.floor(prefs.budget / prefs.duration),
      });
    }

    return {
      title: `${prefs.duration}-Day Hidden Tunisia Adventure`,
      description: `An unforgettable journey through Tunisia's most authentic experiences, curated for ${prefs.travelers} travelers seeking ${prefs.interests?.join(', ') || 'culture and adventure'}.`,
      duration: prefs.duration,
      totalEstimatedCost: prefs.budget,
      currency: 'TND',
      tags: prefs.interests || ['culture', 'adventure', 'food'],
      days,
      tips: [
        'Best time to visit: March-May or September-November',
        'Carry cash for small vendors and tips',
        'Learn basic Arabic greetings - locals love it!',
        "Try the local dates from Kebili - they're the best in the world",
        'Sunscreen is essential even in winter',
      ],
      bestFor: prefs.interests || ['couples', 'families', 'solo travelers'],
    };
  }

  private generateMockChatResponse(messages: ChatMessage[]): { reply: string; suggestions: string[] } {
    const lastMessage = messages[messages.length - 1]?.content?.toLowerCase() || '';

    if (lastMessage.includes('beach')) {
      return {
        reply: `Tunisia has incredible beaches! My top hidden gem picks:\n\n🏖️ **Tabarka** - Crystal clear water, fewer tourists than Hammamet\n🏖️ **Raf Raf** - Local secret with amazing cliff views\n🏖️ **Sidi Bou Said beach** - Combine with the blue village visit\n\nFor the best experience, visit weekdays before 11am. The water is warmest in September!`,
        suggestions: ['Best time to visit Tabarka?', 'Hidden beaches near Tunis?', 'Beach restaurants to try?'],
      };
    }

    if (lastMessage.includes('food') || lastMessage.includes('eat')) {
      return {
        reply: `You're in for a treat! Tunisian food is incredible:\n\n🍽️ **Must-try dishes:**\n- Brik (crispy tuna pastry)\n- Couscous with lamb on Fridays\n- Lablabi (chickpea soup) - the street-food king\n- Tunisian "pizza" - totally different from the Italian one!\n\n🍋 **Hidden spot:** Chez Slah in the Medina for the best brik in Tunis.`,
        suggestions: ['Best restaurants in Tunis?', 'Food tours available?', 'Vegetarian options?'],
      };
    }

    return {
      reply: `I'd love to help plan your Tunisia adventure! 🇹🇳\n\nWhether you're looking for hidden beaches, ancient ruins, Sahara desert experiences, or the best local food - I've got insider knowledge on everything.\n\nWhat kind of traveler are you? Adventure seeker, culture lover, foodie, or beach bum?`,
      suggestions: ['Plan a 5-day trip', 'Best hidden gems?', 'Budget travel tips?', 'Sahara desert tours?'],
    };
  }

  private generateReason(place: any, matchingTags: string[]): string {
    if (matchingTags.length > 0) return `Matches your interest in ${matchingTags[0]}`;
    if (place.rating >= 4.5) return 'Top-rated by travelers';
    if (place.isFeatured) return "Editor's pick";
    return 'Popular with locals';
  }

  private extractSuggestions(_reply: string): string[] {
    const commonQuestions = [
      'How do I get there?',
      'Best time to visit?',
      'How much does it cost?',
      'Where should I stay?',
      'Local tips?',
    ];
    return commonQuestions.slice(0, 3);
  }
}
