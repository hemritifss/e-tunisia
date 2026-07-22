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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CIRCUIT_BY_SLUG = exports.CircuitsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const place_entity_1 = require("../places/place.entity");
const circuits_data_1 = require("./circuits.data");
Object.defineProperty(exports, "CIRCUIT_BY_SLUG", { enumerable: true, get: function () { return circuits_data_1.CIRCUIT_BY_SLUG; } });
const R_KM = 6371;
function haversine(aLat, aLng, bLat, bLng) {
    const toRad = (d) => (d * Math.PI) / 180;
    const dLat = toRad(bLat - aLat);
    const dLng = toRad(bLng - aLng);
    const s = Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
    return 2 * R_KM * Math.asin(Math.min(1, Math.sqrt(s)));
}
const norm = (s) => (s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toLowerCase();
const GOV_ALIASES = {
    kebili: 'kebili', kbili: 'kebili',
    gabes: 'gabes',
    beja: 'beja',
    medenine: 'medenine', mednine: 'medenine',
    kef: 'kef', lekef: 'kef',
    manouba: 'manouba', mannouba: 'manouba',
};
const govKey = (s) => {
    const n = norm(s);
    return GOV_ALIASES[n] || n;
};
const TTL_MS = 10 * 60 * 1000;
let CircuitsService = class CircuitsService {
    constructor(placesRepo) {
        this.placesRepo = placesRepo;
        this.cache = null;
    }
    async list() {
        const all = await this.hydrateAll();
        return all.map(({ stops, knowHow, packing, ...card }) => card);
    }
    async findOne(slug) {
        const all = await this.hydrateAll();
        const found = all.find((c) => c.slug === slug);
        if (!found)
            throw new common_1.NotFoundException('Circuit not found');
        return found;
    }
    async allStopIds() {
        const all = await this.hydrateAll();
        return [...new Set(all.flatMap((c) => c.stops.map((s) => s.placeId)))];
    }
    async hydrateAll() {
        if (this.cache && Date.now() - this.cache.at < TTL_MS)
            return this.cache.details;
        const places = await this.placesRepo.find({
            where: { isActive: true, isApproved: true },
            select: [
                'id', 'slug', 'name', 'city', 'governorate', 'latitude', 'longitude',
                'coverImage', 'images', 'rating', 'reviewCount', 'tags',
                'entryPrice', 'avgVisitMinutes', 'openingHours',
            ],
        });
        const bySlug = new Map();
        const byCity = new Map();
        const byGov = new Map();
        for (const p of places) {
            if (!Number.isFinite(Number(p.latitude)) || !Number.isFinite(Number(p.longitude)))
                continue;
            if (p.slug)
                bySlug.set(p.slug, p);
            const c = norm(p.city);
            const g = govKey(p.governorate);
            if (!byCity.has(c))
                byCity.set(c, []);
            byCity.get(c).push(p);
            if (!byGov.has(g))
                byGov.set(g, []);
            byGov.get(g).push(p);
        }
        const details = circuits_data_1.CIRCUIT_TEMPLATES
            .map((tpl) => this.hydrateOne(tpl, bySlug, byCity, byGov))
            .filter((c) => c !== null);
        this.cache = { at: Date.now(), details };
        return details;
    }
    hydrateOne(tpl, bySlug, byCity, byGov) {
        const used = new Set();
        const stops = [];
        for (const anchor of tpl.anchors) {
            const place = this.resolveAnchor(anchor, bySlug, byCity, byGov, used);
            if (!place)
                continue;
            used.add(place.id);
            const lat = Number(place.latitude);
            const lng = Number(place.longitude);
            const prev = stops[stops.length - 1];
            stops.push({
                placeId: place.id,
                slug: place.slug,
                name: place.name,
                city: place.city,
                governorate: place.governorate,
                latitude: lat,
                longitude: lng,
                cover: place.coverImage || place.images?.[0] || null,
                rating: Number(place.rating) || 0,
                reviewCount: place.reviewCount || 0,
                tags: place.tags || [],
                entryPrice: place.entryPrice != null ? Number(place.entryPrice) : null,
                openingHours: place.openingHours || null,
                kind: anchor.kind,
                why: anchor.why,
                priority: anchor.priority,
                minutes: anchor.minutes ?? place.avgVisitMinutes ?? circuits_data_1.DWELL_BY_KIND[anchor.kind],
                slot: anchor.slot ?? 'midday',
                hopKm: prev ? Math.round(haversine(prev.latitude, prev.longitude, lat, lng)) : 0,
            });
        }
        if (stops.length < 3)
            return null;
        const cities = [];
        for (const s of stops)
            if (!cities.includes(s.city))
                cities.push(s.city);
        return {
            slug: tpl.slug,
            title: tpl.title,
            tagline: tpl.tagline,
            summary: tpl.summary,
            theme: tpl.theme,
            region: tpl.region,
            difficulty: tpl.difficulty,
            defaultDays: tpl.defaultDays,
            dayRange: tpl.dayRange,
            bestMonths: tpl.bestMonths,
            avoidMonths: tpl.avoidMonths,
            carFree: tpl.carFree,
            stayBandTnd: tpl.stayBandTnd,
            distanceKm: stops.reduce((sum, s) => sum + s.hopKm, 0),
            stopCount: stops.length,
            cities,
            stopIds: stops.map((s) => s.placeId),
            covers: stops.map((s) => s.cover).filter((c) => !!c).slice(0, 4),
            entryCostTnd: stops.reduce((sum, s) => sum + (s.entryPrice || 0), 0),
            onSiteMinutes: stops.reduce((sum, s) => sum + s.minutes, 0),
            knowHow: tpl.knowHow,
            packing: tpl.packing,
            stops,
        };
    }
    resolveAnchor(anchor, bySlug, byCity, byGov, used) {
        for (const slug of anchor.prefer || []) {
            const p = bySlug.get(slug);
            if (p && !used.has(p.id))
                return p;
        }
        const wanted = (anchor.tags || []).map(norm);
        const score = (p) => {
            const tags = (p.tags || []).map(norm);
            const hits = wanted.filter((w) => tags.some((t) => t.includes(w) || w.includes(t))).length;
            return hits * 100 + Number(p.rating || 0) * 10 + Math.min(20, (p.reviewCount || 0) / 25);
        };
        const best = (pool, requireTag) => {
            if (!pool?.length)
                return null;
            const eligible = pool
                .filter((p) => !used.has(p.id))
                .filter((p) => !requireTag || score(p) >= 100);
            if (!eligible.length)
                return null;
            return eligible.reduce((a, b) => (score(b) > score(a) ? b : a));
        };
        const city = byCity.get(norm(anchor.city));
        const gov = byGov.get(govKey(anchor.governorate));
        return (best(city, true) ||
            best(gov, true) ||
            best(city, false) ||
            best(gov, false));
    }
};
exports.CircuitsService = CircuitsService;
exports.CircuitsService = CircuitsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(place_entity_1.Place)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], CircuitsService);
//# sourceMappingURL=circuits.service.js.map