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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var GemsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GemsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const slugify_1 = require("slugify");
const place_entity_1 = require("../places/place.entity");
const category_entity_1 = require("../categories/category.entity");
const user_entity_1 = require("../users/user.entity");
const place_confirmation_entity_1 = require("./place-confirmation.entity");
const llm_service_1 = require("../ai/llm.service");
const gamification_service_1 = require("../gamification/gamification.service");
const badges_service_1 = require("../badges/badges.service");
const TOWNS = [
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
const GOVERNORATE_TARGETS = {
    Tunis: 60, Nabeul: 45, Sousse: 45, 'Médenine': 40, Sfax: 30, Bizerte: 30,
    Monastir: 25, Mahdia: 20, Kairouan: 25, Tozeur: 25, Tataouine: 20,
    'Gabès': 20, 'Kébili': 20, Gafsa: 15, Jendouba: 25, 'Béja': 15,
    'Le Kef': 20, Siliana: 12, Zaghouan: 12, Kasserine: 15,
    'Sidi Bouzid': 12, Ariana: 15, 'Ben Arous': 12, Manouba: 12,
};
const CONFIRMATIONS_TO_GO_LIVE = 2;
let GemsService = GemsService_1 = class GemsService {
    constructor(places, categories, users, confirmations, llm, gamification, badges) {
        this.places = places;
        this.categories = categories;
        this.users = users;
        this.confirmations = confirmations;
        this.llm = llm;
        this.gamification = gamification;
        this.badges = badges;
        this.logger = new common_1.Logger(GemsService_1.name);
    }
    normName(s) {
        return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    }
    nearestTown(lat, lng) {
        let best = TOWNS[0], bestD = Infinity;
        for (const t of TOWNS) {
            const d = (t.lat - lat) ** 2 + (t.lng - lng) ** 2;
            if (d < bestD) {
                bestD = d;
                best = t;
            }
        }
        return best;
    }
    async findDuplicate(name, lat, lng) {
        const box = 0.004;
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
    async enrich(input, categoryNames) {
        const fallback = { description: input.description.trim(), categoryName: null };
        if (!this.llm.live)
            return fallback;
        try {
            const result = await this.llm.complete({
                system: 'You polish community submissions for a Tunisia travel catalog. Given a place name and a one-line note, ' +
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
        }
        catch (e) {
            this.logger.debug(`Gem enrichment skipped: ${e?.message}`);
            return fallback;
        }
    }
    async submit(userId, input) {
        const name = String(input.name || '').trim();
        const note = String(input.description || '').trim();
        const lat = Number(input.latitude), lng = Number(input.longitude);
        if (name.length < 2 || name.length > 120)
            throw new common_1.BadRequestException('Name must be 2–120 characters');
        if (note.length < 5 || note.length > 300)
            throw new common_1.BadRequestException('Tell us one line (5–300 characters)');
        if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < 30 || lat > 38.5 || lng < 7 || lng > 12.5) {
            throw new common_1.BadRequestException('Pin must be inside Tunisia');
        }
        const dup = await this.findDuplicate(name, lat, lng);
        if (dup) {
            return { duplicate: true, place: { id: dup.id, name: dup.name, slug: dup.slug, city: dup.city } };
        }
        const cats = await this.categories.find();
        const { description, categoryName } = await this.enrich({ ...input, name, description: note }, cats.map((c) => c.name));
        const town = this.nearestTown(lat, lng);
        const category = (input.categoryId && cats.find((c) => c.id === input.categoryId)) ||
            (categoryName && cats.find((c) => c.name === categoryName)) ||
            cats.find((c) => /nature|beach/i.test(c.name)) || cats[0];
        const images = (input.images || []).filter((u) => typeof u === 'string' && u.length < 500).slice(0, 5);
        const slugBase = (0, slugify_1.default)(name, { lower: true, strict: true });
        const slug = `${slugBase}-${Date.now().toString(36).slice(-4)}`;
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
            isApproved: false,
            isActive: true,
            isFeatured: false,
        });
        if (category)
            draft.categoryId = category.id;
        const place = await this.places.save(draft);
        try {
            await this.badges.awardIfEligible(userId, 'gem.submitted', {});
            await this.gamification.addPoints(userId, 25, 'Submitted a hidden gem');
        }
        catch { }
        return {
            duplicate: false,
            place: { id: place.id, name: place.name, slug: place.slug, city: place.city, governorate: place.governorate },
            needsConfirmations: CONFIRMATIONS_TO_GO_LIVE,
        };
    }
    async confirm(placeId, userId) {
        const place = await this.places.findOne({ where: { id: placeId } });
        if (!place)
            throw new common_1.NotFoundException('Place not found');
        if (place.submittedBy === userId)
            throw new common_1.BadRequestException("You can't confirm your own gem — share it with friends!");
        try {
            await this.confirmations.insert({ placeId, userId });
        }
        catch {
            throw new common_1.BadRequestException('You already confirmed this place');
        }
        void this.gamification.addPoints(userId, 10, 'Confirmed a gem').catch(() => { });
        const count = await this.confirmations.count({ where: { placeId } });
        let wentLive = false;
        if (!place.isApproved && count >= CONFIRMATIONS_TO_GO_LIVE) {
            await this.places.update(placeId, { isApproved: true });
            wentLive = true;
            if (place.submittedBy) {
                try {
                    await this.badges.awardIfEligible(place.submittedBy, 'gem.approved', {});
                    await this.gamification.addPoints(place.submittedBy, 200, `Your gem "${place.name}" went live`);
                }
                catch { }
            }
        }
        return { confirmations: count, wentLive, approved: place.isApproved || wentLive };
    }
    async adminApprove(placeId) {
        const place = await this.places.findOne({ where: { id: placeId } });
        if (!place)
            throw new common_1.NotFoundException('Place not found');
        if (place.isApproved)
            return { message: 'Already approved' };
        await this.places.update(placeId, { isApproved: true });
        if (place.submittedBy && (place.tags || []).includes('community')) {
            try {
                await this.badges.awardIfEligible(place.submittedBy, 'gem.approved', {});
                await this.gamification.addPoints(place.submittedBy, 200, `Your gem "${place.name}" went live`);
            }
            catch { }
        }
        return { message: 'Place approved' };
    }
    async status(placeId, userId) {
        const [count, mine, place] = await Promise.all([
            this.confirmations.count({ where: { placeId } }),
            userId ? this.confirmations.count({ where: { placeId, userId } }) : Promise.resolve(0),
            this.places.findOne({ where: { id: placeId }, select: ['id', 'isApproved', 'submittedBy'] }),
        ]);
        if (!place)
            throw new common_1.NotFoundException('Place not found');
        return {
            confirmations: count,
            confirmedByMe: mine > 0,
            pending: !place.isApproved,
            needed: CONFIRMATIONS_TO_GO_LIVE,
            isMine: !!userId && place.submittedBy === userId,
        };
    }
    foldKey(s) {
        const k = String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
        return k === 'kef' ? 'le kef' : k;
    }
    async ambassadors() {
        const monthRows = await this.places.query(`SELECT governorate, "submittedBy" AS "userId", count(*)::int AS gems
               FROM places
              WHERE "submittedBy" IS NOT NULL AND "isApproved" = true AND "isActive" = true
                AND "createdAt" >= date_trunc('month', now())
              GROUP BY governorate, "submittedBy"
              ORDER BY gems DESC`).catch(() => []);
        const allTimeRows = await this.places.query(`SELECT "submittedBy" AS "userId", count(*)::int AS gems
               FROM places
              WHERE "submittedBy" IS NOT NULL AND "isApproved" = true AND "isActive" = true
              GROUP BY "submittedBy" ORDER BY gems DESC LIMIT 10`).catch(() => []);
        const userIds = Array.from(new Set([...monthRows.map((r) => r.userId), ...allTimeRows.map((r) => r.userId)]));
        const users = userIds.length
            ? await this.users.find({ where: userIds.map((id) => ({ id })), select: ['id', 'handle', 'fullName', 'avatar'] })
            : [];
        const byId = new Map(users.map((u) => [u.id, { id: u.id, handle: u.handle || null, fullName: u.fullName, avatar: u.avatar || null }]));
        const seen = new Set();
        const ambassadors = [];
        for (const r of monthRows) {
            const gov = this.foldKey(r.governorate);
            if (seen.has(gov) || !byId.has(r.userId))
                continue;
            seen.add(gov);
            ambassadors.push({ governorate: r.governorate, gems: Number(r.gems), user: byId.get(r.userId) });
        }
        return {
            month: new Date().toISOString().slice(0, 7),
            ambassadors,
            topHunters: allTimeRows
                .filter((r) => byId.has(r.userId))
                .map((r) => ({ gems: Number(r.gems), user: byId.get(r.userId) })),
        };
    }
    async completeness() {
        const rows = await this.places
            .createQueryBuilder('p')
            .select('p.governorate', 'governorate')
            .addSelect('COUNT(*)', 'n')
            .where('p.isActive = true AND p.isApproved = true')
            .groupBy('p.governorate')
            .getRawMany();
        const counts = new Map();
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
            .sort((a, b) => a.pct - b.pct);
    }
};
exports.GemsService = GemsService;
exports.GemsService = GemsService = GemsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(place_entity_1.Place)),
    __param(1, (0, typeorm_1.InjectRepository)(category_entity_1.Category)),
    __param(2, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(3, (0, typeorm_1.InjectRepository)(place_confirmation_entity_1.PlaceConfirmation)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        llm_service_1.LlmService,
        gamification_service_1.GamificationService,
        badges_service_1.BadgesService])
], GemsService);
//# sourceMappingURL=gems.service.js.map