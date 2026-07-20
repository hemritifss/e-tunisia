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
exports.MappingService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const mapping_event_entity_1 = require("./mapping-event.entity");
const place_entity_1 = require("../places/place.entity");
const user_entity_1 = require("../users/user.entity");
const place_confirmation_entity_1 = require("../gems/place-confirmation.entity");
const place_visit_entity_1 = require("../users/place-visit.entity");
const review_entity_1 = require("../reviews/review.entity");
const beach_report_entity_1 = require("../beaches/beach-report.entity");
const WEIGHTS = { gem: 10, confirm: 5, review: 3, checkIn: 2, beachReport: 2 };
let MappingService = class MappingService {
    constructor(events, places, users, confirmations, visits, reviews, beachReports) {
        this.events = events;
        this.places = places;
        this.users = users;
        this.confirmations = confirmations;
        this.visits = visits;
        this.reviews = reviews;
        this.beachReports = beachReports;
    }
    fold(s) {
        return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
    }
    async featured() {
        const featured = await this.events.findOne({ where: { isFeatured: true }, order: { startsAt: 'DESC' } });
        if (featured)
            return featured;
        const now = new Date();
        const live = await this.events.findOne({ where: { startsAt: (0, typeorm_2.Between)(new Date(0), now), endsAt: (0, typeorm_2.MoreThan)(now) } });
        if (live)
            return live;
        const upcoming = await this.events.findOne({ where: { startsAt: (0, typeorm_2.MoreThan)(now) }, order: { startsAt: 'ASC' } });
        if (upcoming)
            return upcoming;
        return this.events.findOne({ where: {}, order: { startsAt: 'DESC' } });
    }
    status(event, now = new Date()) {
        if (now < event.startsAt)
            return 'upcoming';
        if (now >= event.endsAt)
            return 'ended';
        return 'live';
    }
    async standings(slug, viewerId) {
        const event = slug
            ? await this.events.findOne({ where: { slug } })
            : await this.featured();
        if (!event)
            throw new common_1.NotFoundException('No mapping event');
        const now = new Date();
        const from = event.startsAt;
        const to = now < event.endsAt ? now : event.endsAt;
        const range = (0, typeorm_2.Between)(from, to);
        const [gems, confirms, visits, reviews, beaches] = await Promise.all([
            this.places.createQueryBuilder('p')
                .select(['p.id AS id', 'p.governorate AS governorate', 'p.submittedBy AS "userId"'])
                .where('p.submittedBy IS NOT NULL')
                .andWhere('p.createdAt BETWEEN :from AND :to', { from, to })
                .andWhere(`(p.tags LIKE '%hidden-gem%' OR p.tags LIKE '%community%')`)
                .getRawMany().catch(() => []),
            this.confirmations.find({ where: { createdAt: range } }).catch(() => []),
            this.visits.find({ where: { createdAt: range } }).catch(() => []),
            this.reviews.find({ where: { createdAt: range } }).catch(() => []),
            this.beachReports.find({ where: { createdAt: range } }).catch(() => []),
        ]);
        const placeIds = new Set();
        confirms.forEach((c) => placeIds.add(c.placeId));
        visits.forEach((v) => placeIds.add(v.placeId));
        reviews.forEach((r) => placeIds.add(r.placeId));
        beaches.forEach((b) => placeIds.add(b.placeId));
        const placeRows = placeIds.size
            ? await this.places.find({ where: { id: (0, typeorm_2.In)([...placeIds]) }, select: ['id', 'governorate'] }).catch(() => [])
            : [];
        const govByPlace = new Map(placeRows.map((p) => [p.id, p.governorate]));
        const govAgg = new Map();
        const userAgg = new Map();
        const add = (gov, userId, pts, isGem = false) => {
            const display = (gov || '').trim();
            if (display) {
                const key = this.fold(display);
                const g = govAgg.get(key) || { display, points: 0, gems: 0, users: new Set() };
                g.points += pts;
                if (isGem)
                    g.gems += 1;
                if (userId)
                    g.users.add(userId);
                govAgg.set(key, g);
            }
            if (userId) {
                const u = userAgg.get(userId) || { points: 0, gov: display || null };
                u.points += pts;
                if (!u.gov && display)
                    u.gov = display;
                userAgg.set(userId, u);
            }
        };
        for (const g of gems)
            add(g.governorate, g.userId, WEIGHTS.gem, true);
        for (const c of confirms)
            add(govByPlace.get(c.placeId), c.userId, WEIGHTS.confirm);
        for (const v of visits)
            add(govByPlace.get(v.placeId), v.userId, WEIGHTS.checkIn);
        for (const r of reviews)
            add(govByPlace.get(r.placeId), r.userId, WEIGHTS.review);
        for (const b of beaches)
            add(govByPlace.get(b.placeId), b.userId, WEIGHTS.beachReport);
        const governorates = [...govAgg.values()]
            .map((g) => ({ governorate: g.display, points: g.points, gems: g.gems, contributors: g.users.size }))
            .sort((a, b) => b.points - a.points || b.gems - a.gems)
            .map((g, i) => ({ ...g, rank: i + 1 }));
        const userIds = [...userAgg.keys()];
        const userRows = userIds.length
            ? await this.users.find({ where: { id: (0, typeorm_2.In)(userIds) }, select: ['id', 'handle', 'fullName', 'avatar'] }).catch(() => [])
            : [];
        const userById = new Map(userRows.map((u) => [u.id, u]));
        const ranked = [...userAgg.entries()]
            .map(([userId, u]) => ({ userId, ...u }))
            .sort((a, b) => b.points - a.points);
        const topContributors = ranked.slice(0, 25).map((u, i) => {
            const info = userById.get(u.userId);
            return {
                handle: info?.handle || null,
                fullName: info?.fullName || 'Explorer',
                avatar: info?.avatar || null,
                governorate: u.gov,
                points: u.points,
                rank: i + 1,
            };
        });
        const totals = {
            contributors: userAgg.size,
            gems: gems.length,
            governorates: govAgg.size,
            points: [...userAgg.values()].reduce((s, u) => s + u.points, 0),
        };
        let me = null;
        if (viewerId && userAgg.has(viewerId)) {
            const rank = ranked.findIndex((u) => u.userId === viewerId) + 1;
            const mine = userAgg.get(viewerId);
            me = { points: mine.points, rank, governorate: mine.gov };
        }
        return {
            event: {
                slug: event.slug, title: event.title, subtitle: event.subtitle,
                startsAt: event.startsAt, endsAt: event.endsAt, prizes: event.prizes,
            },
            status: this.status(event, now),
            now: now.toISOString(),
            totals,
            governorates,
            topContributors,
            me,
        };
    }
    async create(input) {
        if (input.featured !== false) {
            await this.events.update({ isFeatured: true }, { isFeatured: false });
        }
        const event = this.events.create({
            slug: input.slug,
            title: input.title,
            subtitle: input.subtitle || null,
            startsAt: new Date(input.startsAt),
            endsAt: new Date(input.endsAt),
            prizes: input.prizes || null,
            isFeatured: input.featured !== false,
        });
        return this.events.save(event);
    }
};
exports.MappingService = MappingService;
exports.MappingService = MappingService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(mapping_event_entity_1.MappingEvent)),
    __param(1, (0, typeorm_1.InjectRepository)(place_entity_1.Place)),
    __param(2, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(3, (0, typeorm_1.InjectRepository)(place_confirmation_entity_1.PlaceConfirmation)),
    __param(4, (0, typeorm_1.InjectRepository)(place_visit_entity_1.PlaceVisit)),
    __param(5, (0, typeorm_1.InjectRepository)(review_entity_1.Review)),
    __param(6, (0, typeorm_1.InjectRepository)(beach_report_entity_1.BeachReport)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], MappingService);
//# sourceMappingURL=mapping.service.js.map