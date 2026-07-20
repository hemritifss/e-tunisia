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
exports.BeachesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const place_entity_1 = require("../places/place.entity");
const user_entity_1 = require("../users/user.entity");
const beach_report_entity_1 = require("./beach-report.entity");
const gamification_service_1 = require("../gamification/gamification.service");
const JELLYFISH = new Set(['none', 'few', 'lots']);
const WATER = new Set(['clear', 'seaweed', 'murky']);
const CROWD = new Set(['empty', 'ok', 'packed']);
const COASTAL = new Set([
    'tunis', 'ariana', 'ben arous', 'nabeul', 'bizerte', 'jendouba',
    'sousse', 'monastir', 'mahdia', 'sfax', 'gabes', 'gabès', 'medenine', 'médenine',
]);
const FRESH_MS = 24 * 60 * 60 * 1000;
const XP_THROTTLE_MS = 3 * 60 * 60 * 1000;
let BeachesService = class BeachesService {
    constructor(places, users, reports, gamification) {
        this.places = places;
        this.users = users;
        this.reports = reports;
        this.gamification = gamification;
    }
    fold(s) {
        return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
    }
    isBeach(place) {
        const cat = this.fold(place.category?.name);
        const gov = this.fold(place.governorate);
        const name = this.fold(place.name);
        if (/beach|plage|marsa|corniche|lido/.test(name))
            return true;
        const inland = /\bain |montagne| mont|jebel|jbel|forest|foret|gorge|barrage|\blac |lake|oasis|dune|sahara|source|grotte|\bcaves?\b|cascade|parc national|national park|lagoon|hot spring|thermal|\bhammam\b|medina|mosqu|kasbah|ribat|\bfort|musee|museum|ruins|ruine/;
        return cat.includes('beach') && COASTAL.has(gov) && !inland.test(name);
    }
    async list(governorate) {
        const all = await this.places.find({
            where: { isActive: true, isApproved: true },
            relations: ['category'],
        });
        let beaches = all.filter((p) => this.isBeach(p));
        if (governorate) {
            const g = this.fold(governorate);
            beaches = beaches.filter((p) => this.fold(p.governorate) === g);
        }
        if (beaches.length === 0)
            return [];
        const ids = beaches.map((b) => b.id);
        const since = new Date(Date.now() - FRESH_MS);
        const recent = await this.reports
            .createQueryBuilder('r')
            .where('r.placeId IN (:...ids)', { ids })
            .andWhere('r.createdAt > :since', { since })
            .orderBy('r.createdAt', 'DESC')
            .getMany();
        const latest = new Map();
        const todayCount = new Map();
        for (const r of recent) {
            if (!latest.has(r.placeId))
                latest.set(r.placeId, r);
            todayCount.set(r.placeId, (todayCount.get(r.placeId) || 0) + 1);
        }
        return beaches
            .map((b) => {
            const r = latest.get(b.id) || null;
            return {
                placeId: b.id,
                name: b.name,
                slug: b.slug,
                city: b.city,
                governorate: b.governorate,
                coverImage: b.coverImage || (b.images && b.images[0]) || null,
                latitude: b.latitude != null ? Number(b.latitude) : null,
                longitude: b.longitude != null ? Number(b.longitude) : null,
                jellyfish: r?.jellyfish || null,
                water: r?.water || null,
                crowd: r?.crowd || null,
                note: r?.note || null,
                reportedAt: r?.createdAt || null,
                reportsToday: todayCount.get(b.id) || 0,
            };
        })
            .sort((a, b) => {
            if (!!a.reportedAt !== !!b.reportedAt)
                return a.reportedAt ? -1 : 1;
            if (a.reportedAt && b.reportedAt)
                return +new Date(b.reportedAt) - +new Date(a.reportedAt);
            return a.name.localeCompare(b.name);
        });
    }
    async beach(placeId) {
        const place = await this.places.findOne({ where: { id: placeId }, relations: ['category'] });
        if (!place)
            throw new common_1.NotFoundException('Beach not found');
        const since = new Date(Date.now() - FRESH_MS);
        const recent = await this.reports.find({
            where: { placeId, createdAt: (0, typeorm_2.MoreThan)(since) },
            order: { createdAt: 'DESC' },
            take: 12,
        });
        const timeline = recent.map((r) => ({
            jellyfish: r.jellyfish, water: r.water, crowd: r.crowd, note: r.note, at: r.createdAt,
        }));
        return {
            place: { id: place.id, name: place.name, slug: place.slug, city: place.city, governorate: place.governorate },
            current: timeline[0] || null,
            reportsToday: timeline.length,
            timeline,
        };
    }
    async report(userId, placeId, input) {
        if (!JELLYFISH.has(input.jellyfish))
            throw new common_1.BadRequestException('jellyfish must be none | few | lots');
        if (input.water && !WATER.has(input.water))
            throw new common_1.BadRequestException('invalid water value');
        if (input.crowd && !CROWD.has(input.crowd))
            throw new common_1.BadRequestException('invalid crowd value');
        const place = await this.places.findOne({ where: { id: placeId }, relations: ['category'] });
        if (!place)
            throw new common_1.NotFoundException('Beach not found');
        if (!this.isBeach(place))
            throw new common_1.BadRequestException('This place is not a beach');
        const saved = await this.reports.save(this.reports.create({
            placeId,
            userId,
            jellyfish: input.jellyfish,
            water: input.water || null,
            crowd: input.crowd || null,
            note: input.note ? String(input.note).slice(0, 160) : null,
        }));
        const prior = await this.reports.count({
            where: { placeId, userId, createdAt: (0, typeorm_2.MoreThan)(new Date(Date.now() - XP_THROTTLE_MS)) },
        });
        if (prior <= 1) {
            void this.gamification.addPoints(userId, 5, 'Reported beach conditions').catch(() => { });
        }
        return { id: saved.id, awarded: prior <= 1 };
    }
};
exports.BeachesService = BeachesService;
exports.BeachesService = BeachesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(place_entity_1.Place)),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(2, (0, typeorm_1.InjectRepository)(beach_report_entity_1.BeachReport)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        gamification_service_1.GamificationService])
], BeachesService);
//# sourceMappingURL=beaches.service.js.map