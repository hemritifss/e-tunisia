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
exports.TripsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const crypto_1 = require("crypto");
const trip_plan_entity_1 = require("./trip-plan.entity");
const trip_member_entity_1 = require("./trip-member.entity");
const place_entity_1 = require("../places/place.entity");
const tour_package_entity_1 = require("../places/tour-package.entity");
const inquiries_service_1 = require("../places/inquiries.service");
const users_service_1 = require("../users/users.service");
const badges_service_1 = require("../badges/badges.service");
const billing_service_1 = require("../billing/billing.service");
function cleanDate(v) {
    return typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null;
}
let TripsService = class TripsService {
    constructor(trips, members, places, packages, inquiries, users, badges, billing) {
        this.trips = trips;
        this.members = members;
        this.places = places;
        this.packages = packages;
        this.inquiries = inquiries;
        this.users = users;
        this.badges = badges;
        this.billing = billing;
    }
    sanitize(trip) {
        const { inviteCode: _secret, ...safe } = trip;
        return safe;
    }
    async listByHandle(handle) {
        const user = await this.users.findByHandle(handle);
        if (!user)
            return [];
        const rows = await this.trips.find({
            where: { userId: user.id, isPublic: true },
            order: { updatedAt: 'DESC' },
            take: 50,
        });
        return rows.map((t) => this.sanitize(t));
    }
    async batchInquire(slug, viewerUserId, input) {
        const trip = await this.trips.findOne({ where: { slug } });
        if (!trip)
            throw new common_1.NotFoundException('Trip not found');
        if (trip.stops.length === 0)
            throw new common_1.BadRequestException('Trip has no stops');
        if (!input.name?.trim())
            throw new common_1.BadRequestException('Name is required');
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email?.trim() || '')) {
            throw new common_1.BadRequestException('Valid email is required');
        }
        if (!input.message || input.message.trim().length < 5) {
            throw new common_1.BadRequestException('Message is too short');
        }
        const seen = new Set();
        const results = [];
        const failures = [];
        for (const stop of trip.stops) {
            const key = `${stop.placeId}::${stop.packageId || ''}`;
            if (seen.has(key))
                continue;
            seen.add(key);
            const tripUrl = `/#/trip/${slug}`;
            const composedMessage = `${input.message.trim()}\n\n— sent via my trip plan: ${tripUrl}`;
            try {
                const inq = await this.inquiries.submit(stop.placeId, viewerUserId, {
                    name: input.name.trim(),
                    email: input.email.trim(),
                    phone: input.phone?.trim() || null,
                    partySize: trip.travelers,
                    dateFrom: input.dateFrom || null,
                    dateTo: input.dateTo || null,
                    budget: input.budget ?? null,
                    currency: trip.currency,
                    message: composedMessage,
                    source: `trip:${slug}`,
                    packageId: stop.packageId || null,
                });
                results.push({ placeId: stop.placeId, inquiryId: inq.id, placeName: inq.placeName });
            }
            catch (e) {
                failures.push({ placeId: stop.placeId, reason: e?.message || 'Submit failed' });
            }
        }
        if (results.length === 0) {
            throw new common_1.BadRequestException(failures[0]?.reason || 'Could not submit any inquiry');
        }
        return {
            slug,
            sent: results.length,
            failures,
            inquiries: results,
        };
    }
    async generateSlug() {
        const alpha = 'abcdefghjkmnpqrstuvwxyz23456789';
        for (let attempt = 0; attempt < 8; attempt++) {
            let s = '';
            for (let i = 0; i < 8; i++)
                s += alpha[Math.floor(Math.random() * alpha.length)];
            const existing = await this.trips.findOne({ where: { slug: s } });
            if (!existing)
                return s;
        }
        return Date.now().toString(36);
    }
    async hydrateStops(input) {
        const placeIds = Array.from(new Set(input.map(s => s.placeId).filter(Boolean)));
        const packageIds = Array.from(new Set(input.map(s => s.packageId).filter(Boolean)));
        const [places, packages] = await Promise.all([
            placeIds.length > 0
                ? this.places.find({ where: placeIds.map(id => ({ id })) })
                : Promise.resolve([]),
            packageIds.length > 0
                ? this.packages.find({ where: packageIds.map(id => ({ id })) })
                : Promise.resolve([]),
        ]);
        const placeById = new Map(places.map(p => [p.id, p]));
        const pkgById = new Map(packages.map(p => [p.id, p]));
        const now = new Date().toISOString();
        return input
            .filter(s => placeById.has(s.placeId))
            .map((s, idx) => {
            const place = placeById.get(s.placeId);
            const pkg = s.packageId ? pkgById.get(s.packageId) : undefined;
            return {
                placeId: place.id,
                placeName: place.name,
                placeCity: place.city,
                placeCover: place.coverImage || (place.images && place.images[0]) || null,
                latitude: place.latitude != null ? Number(place.latitude) : null,
                longitude: place.longitude != null ? Number(place.longitude) : null,
                packageId: pkg?.id || null,
                packageTitle: pkg?.title || null,
                pricePerPerson: pkg?.pricePerPerson ?? null,
                currency: pkg?.currency || null,
                dayIndex: Number.isFinite(s.dayIndex) ? Number(s.dayIndex) : idx,
                timeSlot: typeof s.timeSlot === 'string' && /^\d{2}:\d{2}$/.test(s.timeSlot) ? s.timeSlot : null,
                addedAt: now,
            };
        });
    }
    async create(userId, input) {
        if (!Array.isArray(input.stops) || input.stops.length === 0) {
            throw new common_1.BadRequestException('Trip needs at least one stop');
        }
        if (input.stops.length > 30) {
            throw new common_1.BadRequestException('Trips capped at 30 stops');
        }
        if (userId) {
            const existing = await this.trips.count({ where: { userId } });
            const { ok, cap, plan } = await this.billing.checkCap(userId, 'maxTrips', existing);
            if (!ok) {
                throw new common_1.ForbiddenException({
                    code: 'cap_reached',
                    feature: 'maxTrips',
                    cap,
                    plan,
                    message: `Free plan allows ${cap} trips. Upgrade to Pro for unlimited.`,
                });
            }
        }
        const stops = await this.hydrateStops(input.stops);
        if (stops.length === 0)
            throw new common_1.BadRequestException('No valid stops');
        const days = Math.max(1, Number(input.days) || (Math.max(...stops.map(s => s.dayIndex)) + 1));
        const slug = await this.generateSlug();
        const saved = await this.trips.save(this.trips.create({
            slug,
            userId: userId || null,
            title: (input.title || 'My Tunisia trip').slice(0, 200),
            travelers: Math.min(50, Math.max(1, Number(input.travelers) || 2)),
            currency: (input.currency || 'TND').toUpperCase().slice(0, 8),
            stops,
            days,
            startDate: cleanDate(input.startDate),
            isPublic: input.isPublic !== false,
        }));
        if (userId)
            await this.badges.awardIfEligible(userId, 'trip.created', {});
        return saved;
    }
    async canEdit(trip, userId) {
        if (!trip.userId || trip.userId === userId)
            return true;
        const member = await this.members.findOne({ where: { tripId: trip.id, userId } });
        return !!member;
    }
    async update(slug, userId, input) {
        const trip = await this.trips.findOne({ where: { slug } });
        if (!trip)
            throw new common_1.NotFoundException('Trip not found');
        if (!(await this.canEdit(trip, userId))) {
            throw new common_1.ForbiddenException('Not your trip');
        }
        if (Array.isArray(input.stops)) {
            if (input.stops.length === 0)
                throw new common_1.BadRequestException('Trip needs at least one stop');
            if (input.stops.length > 30)
                throw new common_1.BadRequestException('Trips capped at 30 stops');
            trip.stops = await this.hydrateStops(input.stops);
            if (trip.stops.length === 0)
                throw new common_1.BadRequestException('No valid stops');
        }
        if (input.title)
            trip.title = String(input.title).slice(0, 200);
        if (input.travelers)
            trip.travelers = Math.min(50, Math.max(1, Number(input.travelers)));
        if (input.currency)
            trip.currency = String(input.currency).toUpperCase().slice(0, 8);
        if (input.days)
            trip.days = Math.max(1, Number(input.days));
        if ('startDate' in input)
            trip.startDate = cleanDate(input.startDate);
        if (typeof input.isPublic === 'boolean')
            trip.isPublic = input.isPublic;
        return this.trips.save(trip);
    }
    async listMine(userId) {
        const memberships = await this.members.find({ where: { userId }, select: { tripId: true } });
        const memberIds = memberships.map((m) => m.tripId);
        const [own, shared] = await Promise.all([
            this.trips.find({ where: { userId }, order: { updatedAt: 'DESC' } }),
            memberIds.length
                ? this.trips.find({ where: memberIds.map((id) => ({ id })), order: { updatedAt: 'DESC' } })
                : Promise.resolve([]),
        ]);
        const seen = new Set(own.map((t) => t.id));
        return [...own, ...shared.filter((t) => !seen.has(t.id))].map((t) => this.sanitize(t));
    }
    async ensureInviteCode(slug, userId) {
        const trip = await this.trips.findOne({ where: { slug } });
        if (!trip)
            throw new common_1.NotFoundException('Trip not found');
        if (trip.userId !== userId)
            throw new common_1.ForbiddenException('Only the owner can invite co-planners');
        if (!trip.inviteCode) {
            trip.inviteCode = (0, crypto_1.randomBytes)(9).toString('base64url');
            await this.trips.save(trip);
        }
        return { code: trip.inviteCode };
    }
    async join(slug, userId, code) {
        const trip = await this.trips.findOne({ where: { slug } });
        if (!trip)
            throw new common_1.NotFoundException('Trip not found');
        if (!trip.inviteCode || !code || trip.inviteCode !== String(code).trim()) {
            throw new common_1.ForbiddenException('Invalid or expired invite');
        }
        if (trip.userId === userId)
            return { joined: true, alreadyOwner: true, title: trip.title };
        try {
            await this.members.insert({ tripId: trip.id, userId, invitedBy: trip.userId });
        }
        catch { }
        return { joined: true, title: trip.title };
    }
    async listMembers(slug, viewerId) {
        const trip = await this.trips.findOne({ where: { slug } });
        if (!trip)
            throw new common_1.NotFoundException('Trip not found');
        const rows = await this.members.find({ where: { tripId: trip.id }, order: { createdAt: 'ASC' } });
        const ids = [trip.userId, ...rows.map((r) => r.userId)].filter(Boolean);
        const people = await Promise.all(ids.map(async (id) => {
            const u = await this.users.findById(id).catch(() => null);
            return u ? {
                id: u.id, handle: u.handle || null, fullName: u.fullName,
                avatar: u.avatar || null, isOwner: id === trip.userId,
            } : null;
        }));
        const members = people.filter(Boolean);
        return {
            members,
            canEdit: !!viewerId && (viewerId === trip.userId || rows.some((r) => r.userId === viewerId)),
            isOwner: !!viewerId && viewerId === trip.userId,
        };
    }
    async discover(opts = {}) {
        const page = Math.max(1, Number(opts.page) || 1);
        const limit = Math.min(48, Math.max(1, Number(opts.limit) || 24));
        const offset = (page - 1) * limit;
        const qb = this.trips.createQueryBuilder('t')
            .where('t.isPublic = :p', { p: true });
        if (opts.minDays)
            qb.andWhere('t.days >= :minD', { minD: Number(opts.minDays) });
        if (opts.maxDays)
            qb.andWhere('t.days <= :maxD', { maxD: Number(opts.maxDays) });
        if (opts.city) {
            qb.andWhere('CAST(t.stops AS TEXT) ILIKE :c', { c: `%${opts.city}%` });
        }
        if (opts.sort === 'new') {
            qb.orderBy('t.updatedAt', 'DESC');
        }
        else {
            qb.orderBy('t.viewCount', 'DESC').addOrderBy('t.updatedAt', 'DESC');
        }
        const [rows, total] = await qb.skip(offset).take(limit).getManyAndCount();
        const data = rows.map(t => ({
            slug: t.slug,
            title: t.title,
            travelers: t.travelers,
            days: t.days,
            currency: t.currency,
            viewCount: t.viewCount,
            stopCount: t.stops.length,
            previewCities: Array.from(new Set(t.stops.map(s => s.placeCity).filter(Boolean))).slice(0, 3),
            previewCovers: t.stops.map(s => s.placeCover).filter(Boolean).slice(0, 3),
            updatedAt: t.updatedAt,
        }));
        return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
    }
    async findBySlug(slug, viewerUserId) {
        const trip = await this.trips.findOne({ where: { slug } });
        if (!trip)
            throw new common_1.NotFoundException('Trip not found');
        if (!trip.isPublic && trip.userId !== viewerUserId) {
            const isMember = viewerUserId
                ? !!(await this.members.findOne({ where: { tripId: trip.id, userId: viewerUserId } }))
                : false;
            if (!isMember)
                throw new common_1.ForbiddenException('This trip is private');
        }
        if (viewerUserId !== trip.userId) {
            trip.viewCount = (trip.viewCount || 0) + 1;
            await this.trips.save(trip).catch(() => { });
        }
        return this.sanitize(trip);
    }
    async remove(slug, userId) {
        const trip = await this.trips.findOne({ where: { slug } });
        if (!trip)
            throw new common_1.NotFoundException('Trip not found');
        if (trip.userId !== userId)
            throw new common_1.ForbiddenException('Not your trip');
        await this.trips.remove(trip);
        return { deleted: true };
    }
};
exports.TripsService = TripsService;
TripsService.UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
exports.TripsService = TripsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(trip_plan_entity_1.TripPlan)),
    __param(1, (0, typeorm_1.InjectRepository)(trip_member_entity_1.TripMember)),
    __param(2, (0, typeorm_1.InjectRepository)(place_entity_1.Place)),
    __param(3, (0, typeorm_1.InjectRepository)(tour_package_entity_1.TourPackage)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        inquiries_service_1.InquiriesService,
        users_service_1.UsersService,
        badges_service_1.BadgesService,
        billing_service_1.BillingService])
], TripsService);
//# sourceMappingURL=trips.service.js.map