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
exports.WrappedService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("../users/user.entity");
const place_entity_1 = require("../places/place.entity");
const review_entity_1 = require("../reviews/review.entity");
const place_visit_entity_1 = require("../users/place-visit.entity");
const beach_report_entity_1 = require("../beaches/beach-report.entity");
const passport_dto_1 = require("../users/dto/passport.dto");
const DESERT_GOVS = new Set(['tozeur', 'kebili', 'kébili', 'douz', 'tataouine', 'gafsa', 'kasserine']);
const COASTAL_GOVS = new Set([
    'tunis', 'ariana', 'ben arous', 'nabeul', 'bizerte', 'jendouba',
    'sousse', 'monastir', 'mahdia', 'sfax', 'gabes', 'gabès', 'medenine', 'médenine',
]);
const cp = (...codes) => String.fromCodePoint(...codes);
const PERSONALITIES = {
    trailblazer: { key: 'trailblazer', label: 'The Trailblazer', emoji: cp(0x1F9ED), blurb: 'You did not just visit Tunisia — you put new places on the map. Others will follow the trail you left.' },
    'beach-oracle': { key: 'beach-oracle', label: 'The Beach Oracle', emoji: cp(0x1FABC), blurb: 'The whole coast checked with you before diving in. Jellyfish feared you. Summer answered to you.' },
    'coastal-explorer': { key: 'coastal-explorer', label: 'The Coastal Explorer', emoji: cp(0x1F3D6, 0xFE0F), blurb: 'Salt in your hair, sand everywhere. You chased the Mediterranean from cove to cove all season.' },
    'desert-wanderer': { key: 'desert-wanderer', label: 'The Desert Wanderer', emoji: cp(0x1F42A), blurb: 'While everyone crowded the beaches, you went where the map turns gold. The south is yours.' },
    'culture-seeker': { key: 'culture-seeker', label: 'The Culture Seeker', emoji: cp(0x1F54C), blurb: 'Medinas, mosques and old stones — you read Tunisia like a book, one ancient street at a time.' },
    'city-hopper': { key: 'city-hopper', label: 'The City Hopper', emoji: cp(0x1F3D9, 0xFE0F), blurb: 'You could not sit still. City after city, you collected Tunisia like stamps in a passport.' },
    storyteller: { key: 'storyteller', label: 'The Storyteller', emoji: cp(0x270D, 0xFE0F), blurb: 'You did not keep it to yourself — you wrote it down so the next traveler knows where to go.' },
    explorer: { key: 'explorer', label: 'The Explorer', emoji: cp(0x1F305), blurb: 'Curious, open, always moving toward the next horizon. Tunisia is bigger because you looked.' },
};
let WrappedService = class WrappedService {
    constructor(users, places, reviews, visits, beachReports) {
        this.users = users;
        this.places = places;
        this.reviews = reviews;
        this.visits = visits;
        this.beachReports = beachReports;
    }
    fold(s) {
        return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
    }
    summerWindow(now = new Date()) {
        const y = now.getUTCFullYear();
        const year = now.getUTCMonth() >= 5 ? y : y - 1;
        return { from: new Date(Date.UTC(year, 5, 1)), to: new Date(Date.UTC(year, 8, 1)), year };
    }
    async build(handle) {
        const user = await this.users.findOne({ where: { handle: (handle || '').toLowerCase() } });
        if (!user)
            throw new common_1.NotFoundException('Wrapped not found');
        const { from, to, year } = this.summerWindow();
        const range = (0, typeorm_2.Between)(from, to);
        const [visitRows, reviewCount, beachReportCount, gemCount] = await Promise.all([
            this.visits.find({ where: { userId: user.id, createdAt: range }, order: { createdAt: 'ASC' } }),
            this.reviews.count({ where: { userId: user.id, createdAt: range } }).catch(() => 0),
            this.beachReports.count({ where: { userId: user.id, createdAt: range } }).catch(() => 0),
            this.places
                .createQueryBuilder('p')
                .where('p.submittedBy = :uid', { uid: user.id })
                .andWhere('p.createdAt BETWEEN :from AND :to', { from, to })
                .andWhere(`(p.tags LIKE '%hidden-gem%' OR p.tags LIKE '%community%')`)
                .getCount()
                .catch(() => 0),
        ]);
        const placeIds = Array.from(new Set(visitRows.map((v) => v.placeId)));
        const visitedPlaces = placeIds.length
            ? await this.places.find({ where: { id: (0, typeorm_2.In)(placeIds) }, relations: ['category'] }).catch(() => [])
            : [];
        const placeById = new Map(visitedPlaces.map((p) => [p.id, p]));
        const cityCount = new Map();
        const govs = new Set();
        let coastal = 0, desert = 0, culture = 0;
        for (const v of visitRows) {
            const p = placeById.get(v.placeId);
            const city = (v.city || p?.city || '').trim();
            if (city)
                cityCount.set(city, (cityCount.get(city) || 0) + 1);
            const gov = this.fold(p?.governorate);
            if (gov)
                govs.add(gov);
            const cat = this.fold(p?.category?.name);
            const name = this.fold(p?.name);
            if (COASTAL_GOVS.has(gov) && /beach|plage|marsa|corniche|lido|island|ile|plage/.test(name + ' ' + cat))
                coastal++;
            else if (DESERT_GOVS.has(gov) || /desert|sahara|dune|oasis/.test(name + ' ' + cat))
                desert++;
            else if (/medina|mosqu|museum|musee|kasbah|ribat|fort|historic|ruin|heritage|medersa/.test(name + ' ' + cat))
                culture++;
            else if (COASTAL_GOVS.has(gov))
                coastal++;
        }
        const cities = [...cityCount.keys()];
        const topCityEntry = [...cityCount.entries()].sort((a, b) => b[1] - a[1])[0] || null;
        const firstVisit = visitRows[0] || null;
        const isEmpty = visitRows.length === 0 && reviewCount === 0 && gemCount === 0 && beachReportCount === 0;
        return {
            handle: user.handle,
            fullName: user.fullName,
            avatar: user.avatar || null,
            period: { label: `Summer ${year}`, from: from.toISOString(), to: to.toISOString(), year },
            isEmpty,
            stats: {
                checkIns: visitRows.length,
                citiesCount: cities.length,
                governoratesCount: govs.size,
                reviews: reviewCount,
                gems: gemCount,
                beachReports: beachReportCount,
            },
            cities,
            topCity: topCityEntry ? { city: topCityEntry[0], count: topCityEntry[1] } : null,
            firstTrip: firstVisit
                ? { city: (firstVisit.city || placeById.get(firstVisit.placeId)?.city || 'Tunisia'), at: firstVisit.createdAt.toISOString() }
                : null,
            personality: this.derivePersonality({ coastal, desert, culture, citiesCount: cities.length, reviews: reviewCount, gems: gemCount, beachReports: beachReportCount }),
            points: user.points || 0,
            passportLevel: (0, passport_dto_1.deriveLevel)(user.points || 0),
            founderNumber: user.founderNumber ?? null,
        };
    }
    derivePersonality(s) {
        if (s.gems >= 2)
            return PERSONALITIES.trailblazer;
        if (s.beachReports >= 3)
            return PERSONALITIES['beach-oracle'];
        if (s.reviews >= 5 && s.reviews >= s.citiesCount)
            return PERSONALITIES.storyteller;
        const geo = Math.max(s.coastal, s.desert, s.culture);
        if (geo > 0) {
            if (s.desert === geo)
                return PERSONALITIES['desert-wanderer'];
            if (s.culture === geo)
                return PERSONALITIES['culture-seeker'];
            if (s.coastal === geo)
                return PERSONALITIES['coastal-explorer'];
        }
        if (s.citiesCount >= 4)
            return PERSONALITIES['city-hopper'];
        return PERSONALITIES.explorer;
    }
};
exports.WrappedService = WrappedService;
exports.WrappedService = WrappedService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(place_entity_1.Place)),
    __param(2, (0, typeorm_1.InjectRepository)(review_entity_1.Review)),
    __param(3, (0, typeorm_1.InjectRepository)(place_visit_entity_1.PlaceVisit)),
    __param(4, (0, typeorm_1.InjectRepository)(beach_report_entity_1.BeachReport)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], WrappedService);
//# sourceMappingURL=wrapped.service.js.map