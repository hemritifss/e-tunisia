import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import slugify from 'slugify';
import { Place } from '../places/place.entity';
import { Category } from '../categories/category.entity';
import { User } from '../users/user.entity';
import { PlaceConfirmation } from './place-confirmation.entity';
import { LlmService } from '../ai/llm.service';
import { GamificationService } from '../gamification/gamification.service';
import { BadgesService } from '../badges/badges.service';

/**
 * The contribution engine (GROWTH.md §3) — how gems actually get collected.
 *
 *   submit (photo → pin → one line)
 *     → geo+name dedup against the catalog
 *     → AI enrichment (polished description + category guess; best-effort)
 *     → PENDING place, credited to the submitter
 *     → live after 2 community confirmations (or admin approval)
 *     → "Discovered by @handle" on the place page, forever.
 *
 * XP: +25 on submit, +200 when the gem goes live, +10 per confirmation given.
 */

export interface SubmitGemInput {
    name: string;
    description: string;
    latitude: number;
    longitude: number;
    images?: string[];
    city?: string;
    governorate?: string;
    categoryId?: string;
}

/** Reference towns with governorates — nearest-town fallback when the pin has no named city. */
const TOWNS: Array<{ name: string; governorate: string; lat: number; lng: number }> = [
    { name: 'Tunis', governorate: 'Tunis', lat: 36.8065, lng: 10.1815 },
    { name: 'Sidi Bou Said', governorate: 'Tunis', lat: 36.8687, lng: 10.3416 },
    { name: 'Ariana', governorate: 'Ariana', lat: 36.8665, lng: 10.1647 },
    { name: 'Ben Arous', governorate: 'Ben Arous', lat: 36.7435, lng: 10.2320 },
    { name: 'Manouba', governorate: 'Manouba', lat: 36.8101, lng: 10.0956 },
    { name: 'Nabeul', governorate: 'Nabeul', lat: 36.4561, lng: 10.7376 },
    { name: 'Hammamet', governorate: 'Nabeul', lat: 36.4000, lng: 10.6167 },
    { name: 'Zaghouan', governorate: 'Zaghouan', lat: 36.4029, lng: 10.1429 },
    { name: 'Bizerte', governorate: 'Bizerte', lat: 37.2744, lng: 9.8739 },
    { name: 'Béja', governorate: 'Béja', lat: 36.7256, lng: 9.1817 },
    { name: 'Jendouba', governorate: 'Jendouba', lat: 36.5011, lng: 8.7802 },
    { name: 'Tabarka', governorate: 'Jendouba', lat: 36.9544, lng: 8.7580 },
    { name: 'Le Kef', governorate: 'Le Kef', lat: 36.1742, lng: 8.7049 },
    { name: 'Siliana', governorate: 'Siliana', lat: 36.0849, lng: 9.3708 },
    { name: 'Sousse', governorate: 'Sousse', lat: 35.8256, lng: 10.6369 },
    { name: 'Monastir', governorate: 'Monastir', lat: 35.7643, lng: 10.8113 },
    { name: 'Mahdia', governorate: 'Mahdia', lat: 35.5047, lng: 11.0622 },
    { name: 'Sfax', governorate: 'Sfax', lat: 34.7406, lng: 10.7603 },
    { name: 'Kairouan', governorate: 'Kairouan', lat: 35.6781, lng: 10.0963 },
    { name: 'Kasserine', governorate: 'Kasserine', lat: 35.1676, lng: 8.8365 },
    { name: 'Sidi Bouzid', governorate: 'Sidi Bouzid', lat: 35.0382, lng: 9.4849 },
    { name: 'Gabès', governorate: 'Gabès', lat: 33.8815, lng: 10.0982 },
    { name: 'Matmata', governorate: 'Gabès', lat: 33.5449, lng: 9.9715 },
    { name: 'Médenine', governorate: 'Médenine', lat: 33.3549, lng: 10.5055 },
    { name: 'Djerba', governorate: 'Médenine', lat: 33.8076, lng: 10.8451 },
    { name: 'Tataouine', governorate: 'Tataouine', lat: 32.9297, lng: 10.4518 },
    { name: 'Gafsa', governorate: 'Gafsa', lat: 34.4250, lng: 8.7842 },
    { name: 'Tozeur', governorate: 'Tozeur', lat: 33.9197, lng: 8.1335 },
    { name: 'Kébili', governorate: 'Kébili', lat: 33.7050, lng: 8.9690 },
    { name: 'Douz', governorate: 'Kébili', lat: 33.4664, lng: 9.0203 },
];

/**
 * How many mapped places make a governorate feel "complete" (v1 targets — the
 * completeness game needs a finish line, not a perfect number). Tourist-heavy
 * governorates get bigger targets.
 */
const GOVERNORATE_TARGETS: Record<string, number> = {
    Tunis: 60, Nabeul: 45, Sousse: 45, 'Médenine': 40, Sfax: 30, Bizerte: 30,
    Monastir: 25, Mahdia: 20, Kairouan: 25, Tozeur: 25, Tataouine: 20,
    'Gabès': 20, 'Kébili': 20, Gafsa: 15, Jendouba: 25, 'Béja': 15,
    'Le Kef': 20, Siliana: 12, Zaghouan: 12, Kasserine: 15,
    'Sidi Bouzid': 12, Ariana: 15, 'Ben Arous': 12, Manouba: 12,
};

const CONFIRMATIONS_TO_GO_LIVE = 2;

@Injectable()
export class GemsService {
    private readonly logger = new Logger(GemsService.name);

    constructor(
        @InjectRepository(Place) private readonly places: Repository<Place>,
        @InjectRepository(Category) private readonly categories: Repository<Category>,
        @InjectRepository(User) private readonly users: Repository<User>,
        @InjectRepository(PlaceConfirmation) private readonly confirmations: Repository<PlaceConfirmation>,
        private readonly llm: LlmService,
        private readonly gamification: GamificationService,
        private readonly badges: BadgesService,
    ) {}

    private normName(s: string): string {
        return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    }

    private nearestTown(lat: number, lng: number) {
        let best = TOWNS[0], bestD = Infinity;
        for (const t of TOWNS) {
            const d = (t.lat - lat) ** 2 + (t.lng - lng) ** 2;
            if (d < bestD) { bestD = d; best = t; }
        }
        return best;
    }

    /** Same-name place within ~400 m ⇒ duplicate. Returns it so the UI can redirect. */
    private async findDuplicate(name: string, lat: number, lng: number): Promise<Place | null> {
        const box = 0.004; // ≈ 400 m
        const nearby = await this.places
            .createQueryBuilder('p')
            .where('p.latitude BETWEEN :la1 AND :la2', { la1: lat - box, la2: lat + box })
            .andWhere('p.longitude BETWEEN :lo1 AND :lo2', { lo1: lng - box, lo2: lng + box })
            .getMany();
        const n = this.normName(name);
        return nearby.find((p) => {
            const pn = this.normName(p.name);
            return pn === n || pn.includes(n) || n.includes(pn);
        }) || null;
    }

    /** Best-effort LLM polish: nicer description + category guess. Never blocks a submit. */
    private async enrich(input: SubmitGemInput, categoryNames: string[]): Promise<{ description: string; categoryName: string | null }> {
        const fallback = { description: input.description.trim(), categoryName: null as string | null };
        if (!this.llm.live) return fallback;
        try {
            const result = await this.llm.complete({
                system:
                    'You polish community submissions for a Tunisia travel catalog. Given a place name and a one-line note, ' +
                    'write a warm 2–3 sentence description in English. NEVER invent facts (no prices, hours, history you were not given). ' +
                    'Also pick the single best category from the provided list. Return ONLY JSON: {"description": string, "category": string}.',
                messages: [{
                    role: 'user',
                    content: JSON.stringify({ name: input.name, note: input.description, city: input.city, categories: categoryNames }),
                }],
                temperature: 0.4,
                maxTokens: 300,
            });
            const parsed = JSON.parse(String(result.text || '').replace(/^```(?:json)?|```$/g, '').trim());
            const description = typeof parsed.description === 'string' && parsed.description.length >= 20
                ? parsed.description.slice(0, 900) : fallback.description;
            const categoryName = categoryNames.includes(parsed.category) ? parsed.category : null;
            return { description, categoryName };
        } catch (e: any) {
            this.logger.debug(`Gem enrichment skipped: ${e?.message}`);
            return fallback;
        }
    }

    async submit(userId: string, input: SubmitGemInput) {
        const name = String(input.name || '').trim();
        const note = String(input.description || '').trim();
        const lat = Number(input.latitude), lng = Number(input.longitude);
        if (name.length < 2 || name.length > 120) throw new BadRequestException('Name must be 2–120 characters');
        if (note.length < 5 || note.length > 300) throw new BadRequestException('Tell us one line (5–300 characters)');
        if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < 30 || lat > 38.5 || lng < 7 || lng > 12.5) {
            throw new BadRequestException('Pin must be inside Tunisia');
        }

        // Dedup BEFORE anything else — confirming an existing gem beats duplicating it.
        const dup = await this.findDuplicate(name, lat, lng);
        if (dup) {
            return { duplicate: true as const, place: { id: dup.id, name: dup.name, slug: dup.slug, city: dup.city } };
        }

        const cats = await this.categories.find();
        const { description, categoryName } = await this.enrich({ ...input, name, description: note }, cats.map((c) => c.name));
        const town = this.nearestTown(lat, lng);
        const category =
            (input.categoryId && cats.find((c) => c.id === input.categoryId)) ||
            (categoryName && cats.find((c) => c.name === categoryName)) ||
            cats.find((c) => /nature|beach/i.test(c.name)) || cats[0];

        const images = (input.images || []).filter((u) => typeof u === 'string' && u.length < 500).slice(0, 5);
        const slugBase = slugify(name, { lower: true, strict: true });
        const slug = `${slugBase}-${Date.now().toString(36).slice(-4)}`; // avoid unique-slug collisions

        const draft = this.places.create({
            name,
            slug,
            description,
            address: input.city || town.name,
            city: (input.city || town.name).slice(0, 100),
            governorate: (input.governorate || town.governorate).slice(0, 100),
            latitude: lat,
            longitude: lng,
            images,
            coverImage: images[0] || undefined,
            tags: ['hidden-gem', 'community'],
            submittedBy: userId,
            isApproved: false,   // pending until 2 confirmations (or admin approval)
            isActive: true,
            isFeatured: false,
        });
        if (category) (draft as any).categoryId = category.id;
        const place = await this.places.save(draft);

        // Rewards: a taste now, the real payout when the community approves it.
        // Sequenced (not concurrent): both writers read-modify-write users.points,
        // so firing them in parallel loses one update (verified live).
        try {
            await this.badges.awardIfEligible(userId, 'gem.submitted', {});
            await this.gamification.addPoints(userId, 25, 'Submitted a hidden gem');
        } catch { /* rewards are best-effort */ }

        return {
            duplicate: false as const,
            place: { id: place.id, name: place.name, slug: place.slug, city: place.city, governorate: place.governorate },
            needsConfirmations: CONFIRMATIONS_TO_GO_LIVE,
        };
    }

    /** Confirm a place ("still exists, still worth it"). +10 XP, once per user per place. */
    async confirm(placeId: string, userId: string) {
        const place = await this.places.findOne({ where: { id: placeId } });
        if (!place) throw new NotFoundException('Place not found');
        if (place.submittedBy === userId) throw new BadRequestException("You can't confirm your own gem — share it with friends!");

        try {
            await this.confirmations.insert({ placeId, userId });
        } catch {
            throw new BadRequestException('You already confirmed this place');
        }
        void this.gamification.addPoints(userId, 10, 'Confirmed a gem').catch(() => {});

        const count = await this.confirmations.count({ where: { placeId } });
        let wentLive = false;
        if (!place.isApproved && count >= CONFIRMATIONS_TO_GO_LIVE) {
            await this.places.update(placeId, { isApproved: true });
            wentLive = true;
            if (place.submittedBy) {
                // The big payout: the community validated your discovery.
                // Sequenced — see submit(): concurrent writers clobber users.points.
                try {
                    await this.badges.awardIfEligible(place.submittedBy, 'gem.approved', {});
                    await this.gamification.addPoints(place.submittedBy, 200, `Your gem "${place.name}" went live`);
                } catch { /* rewards are best-effort */ }
            }
        }
        return { confirmations: count, wentLive, approved: place.isApproved || wentLive };
    }

    /** Confirmation status for a place (drives the confirm button + pending banner). */
    async status(placeId: string, userId?: string) {
        const [count, mine, place] = await Promise.all([
            this.confirmations.count({ where: { placeId } }),
            userId ? this.confirmations.count({ where: { placeId, userId } }) : Promise.resolve(0),
            this.places.findOne({ where: { id: placeId }, select: ['id', 'isApproved', 'submittedBy'] as any }),
        ]);
        if (!place) throw new NotFoundException('Place not found');
        return {
            confirmations: count,
            confirmedByMe: mine > 0,
            pending: !place.isApproved,
            needed: CONFIRMATIONS_TO_GO_LIVE,
            isMine: !!userId && place.submittedBy === userId,
        };
    }

    /** Accent-insensitive grouping key — the DB mixes "Medenine"/"Médenine" spellings. */
    private foldKey(s: string): string {
        const k = String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
        return k === 'kef' ? 'le kef' : k; // seeded rows say "Kef"
    }

    /** The completeness game: % mapped + gems missing, per governorate. */
    async completeness() {
        const rows: Array<{ governorate: string; n: string }> = await this.places
            .createQueryBuilder('p')
            .select('p.governorate', 'governorate')
            .addSelect('COUNT(*)', 'n')
            .where('p.isActive = true AND p.isApproved = true')
            .groupBy('p.governorate')
            .getRawMany();
        const counts = new Map<string, number>();
        for (const r of rows) {
            const key = this.foldKey(r.governorate);
            counts.set(key, (counts.get(key) || 0) + Number(r.n));
        }
        return Object.entries(GOVERNORATE_TARGETS)
            .map(([governorate, target]) => {
                const count = counts.get(this.foldKey(governorate)) || 0;
                return {
                    governorate,
                    count,
                    target,
                    pct: Math.min(100, Math.round((count / target) * 100)),
                    missing: Math.max(0, target - count),
                };
            })
            .sort((a, b) => a.pct - b.pct); // emptiest first — that's the call to action
    }
}
