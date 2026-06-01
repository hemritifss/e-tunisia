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
var InquiriesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.InquiriesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const place_entity_1 = require("./place.entity");
const place_inquiry_entity_1 = require("./place-inquiry.entity");
const tour_package_entity_1 = require("./tour-package.entity");
const notifications_service_1 = require("../notifications/notifications.service");
const notification_entity_1 = require("../notifications/notification.entity");
let InquiriesService = InquiriesService_1 = class InquiriesService {
    constructor(inquiries, places, packages, notifications) {
        this.inquiries = inquiries;
        this.places = places;
        this.packages = packages;
        this.notifications = notifications;
    }
    async submit(placeId, viewerUserId, input) {
        if (!InquiriesService_1.UUID_RE.test(placeId))
            throw new common_1.NotFoundException('Place not found');
        const place = await this.places.findOne({ where: { id: placeId } });
        if (!place || !place.isActive)
            throw new common_1.NotFoundException('Place not found');
        const name = (input.name || '').trim().slice(0, 120);
        const email = (input.email || '').trim().slice(0, 200);
        const message = (input.message || '').trim().slice(0, 2000);
        if (!name)
            throw new common_1.BadRequestException('Name is required');
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
            throw new common_1.BadRequestException('Valid email is required');
        if (message.length < 5)
            throw new common_1.BadRequestException('Message is too short');
        const partySize = Math.min(50, Math.max(1, Number(input.partySize) || 1));
        const dateFrom = input.dateFrom ? String(input.dateFrom).slice(0, 10) : null;
        const dateTo = input.dateTo ? String(input.dateTo).slice(0, 10) : null;
        if (dateFrom && dateTo && new Date(dateTo) < new Date(dateFrom)) {
            throw new common_1.BadRequestException('End date must be after start date');
        }
        const budget = input.budget != null ? Math.max(0, Math.floor(Number(input.budget))) : null;
        const currency = (input.currency || 'TND').toUpperCase().slice(0, 8);
        const source = input.source ? String(input.source).slice(0, 80) : null;
        const phone = input.phone ? String(input.phone).trim().slice(0, 40) : null;
        let packageId = null;
        let packageTitle = null;
        if (input.packageId && InquiriesService_1.UUID_RE.test(input.packageId)) {
            const pkg = await this.packages.findOne({ where: { id: input.packageId } });
            if (pkg && pkg.placeId === placeId && pkg.isActive) {
                packageId = pkg.id;
                packageTitle = pkg.title;
            }
        }
        const saved = await this.inquiries.save(this.inquiries.create({
            placeId,
            userId: viewerUserId || null,
            name, email, phone,
            partySize, dateFrom, dateTo,
            budget, currency, message, source,
            packageId,
            status: place_inquiry_entity_1.InquiryStatus.NEW,
        }));
        if (place.submittedBy && place.submittedBy !== viewerUserId) {
            try {
                const subject = packageTitle ? `"${packageTitle}"` : `"${place.name}"`;
                await this.notifications.create(place.submittedBy, packageTitle ? 'Booking request' : 'New inquiry', `${name} asked about ${subject} — ${partySize} ${partySize === 1 ? 'traveler' : 'travelers'}`, notification_entity_1.NotificationType.SYSTEM, {
                    inquiryId: saved.id,
                    placeId, placeName: place.name,
                    packageId, packageTitle,
                    partySize, dateFrom, dateTo,
                    source,
                });
            }
            catch { }
        }
        return {
            id: saved.id,
            placeId: saved.placeId,
            placeName: place.name,
            status: saved.status,
            createdAt: saved.createdAt,
        };
    }
    async listMine(userId, opts = {}) {
        const page = Math.max(1, Number(opts.page) || 1);
        const limit = Math.min(50, Math.max(1, Number(opts.limit) || 20));
        const offset = (page - 1) * limit;
        const [rows, total] = await this.inquiries.findAndCount({
            where: { userId },
            order: { createdAt: 'DESC' },
            skip: offset, take: limit,
        });
        if (rows.length === 0) {
            return { data: [], meta: { page, limit, total, totalPages: 0 } };
        }
        const placeIds = Array.from(new Set(rows.map(r => r.placeId)));
        const places = await this.places.find({ where: placeIds.map(id => ({ id })) });
        const byId = new Map(places.map(p => [p.id, p]));
        const data = rows.map(r => {
            const p = byId.get(r.placeId) || null;
            return {
                ...r,
                place: p ? {
                    id: p.id, name: p.name, slug: p.slug,
                    city: p.city, coverImage: p.coverImage,
                } : null,
            };
        });
        return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
    }
    async listReceived(userId, opts = {}) {
        const page = Math.max(1, Number(opts.page) || 1);
        const limit = Math.min(50, Math.max(1, Number(opts.limit) || 20));
        const offset = (page - 1) * limit;
        const myPlaces = await this.places.find({ where: { submittedBy: userId } });
        if (myPlaces.length === 0) {
            return { data: [], meta: { page, limit, total: 0, totalPages: 0 } };
        }
        const placeIds = myPlaces.map(p => p.id);
        const [rows, total] = await this.inquiries.findAndCount({
            where: placeIds.map(id => ({ placeId: id })),
            order: { createdAt: 'DESC' },
            skip: offset, take: limit,
        });
        const byId = new Map(myPlaces.map(p => [p.id, p]));
        const data = rows.map(r => {
            const p = byId.get(r.placeId) || null;
            return {
                ...r,
                place: p ? { id: p.id, name: p.name, city: p.city, coverImage: p.coverImage } : null,
            };
        });
        return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
    }
    async statsForOwner(userId) {
        const myPlaces = await this.places.find({ where: { submittedBy: userId } });
        if (myPlaces.length === 0) {
            return {
                placeCount: 0, total: 0, new: 0, contacted: 0, quoted: 0, booked: 0, closed: 0,
                last7Days: 0, conversionRate: 0,
            };
        }
        const placeIds = myPlaces.map(p => p.id);
        const all = await this.inquiries.find({
            where: placeIds.map(id => ({ placeId: id })),
        });
        const counts = {
            new: 0, contacted: 0, quoted: 0, booked: 0, closed: 0,
        };
        const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        let last7Days = 0;
        for (const i of all) {
            counts[i.status]++;
            if (i.createdAt && new Date(i.createdAt).getTime() >= weekAgo)
                last7Days++;
        }
        const total = all.length;
        const conversionRate = total > 0 ? Math.round((counts.booked / total) * 100) : 0;
        return {
            placeCount: myPlaces.length, total, ...counts,
            last7Days, conversionRate,
        };
    }
    async breakdownForOwner(userId) {
        const myPlaces = await this.places.find({ where: { submittedBy: userId } });
        if (myPlaces.length === 0)
            return { sources: [], packages: [] };
        const placeIds = myPlaces.map(p => p.id);
        const all = await this.inquiries.find({
            where: placeIds.map(id => ({ placeId: id })),
        });
        const srcCounts = new Map();
        for (const i of all) {
            const key = (() => {
                const s = i.source || 'direct';
                if (s.startsWith('package:'))
                    return 'package';
                if (s.startsWith('post:'))
                    return 'post';
                return s;
            })();
            const bucket = srcCounts.get(key) || { total: 0, booked: 0 };
            bucket.total++;
            if (i.status === place_inquiry_entity_1.InquiryStatus.BOOKED)
                bucket.booked++;
            srcCounts.set(key, bucket);
        }
        const sources = [...srcCounts.entries()]
            .map(([source, v]) => ({ source, ...v }))
            .sort((a, b) => b.total - a.total);
        const pkgIds = Array.from(new Set(all.map(i => i.packageId).filter(Boolean)));
        const pkgRows = pkgIds.length > 0
            ? await this.places.manager.find(tour_package_entity_1.TourPackage, { where: pkgIds.map(id => ({ id })) })
            : [];
        const pkgById = new Map(pkgRows.map(p => [p.id, p]));
        const pkgCounts = new Map();
        for (const i of all) {
            if (!i.packageId)
                continue;
            const bucket = pkgCounts.get(i.packageId) || { total: 0, booked: 0 };
            bucket.total++;
            if (i.status === place_inquiry_entity_1.InquiryStatus.BOOKED)
                bucket.booked++;
            pkgCounts.set(i.packageId, bucket);
        }
        const packages = [...pkgCounts.entries()]
            .map(([id, v]) => ({
            id,
            title: pkgById.get(id)?.title || 'Package',
            pricePerPerson: pkgById.get(id)?.pricePerPerson || 0,
            currency: pkgById.get(id)?.currency || 'TND',
            ...v,
        }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 10);
        return { sources, packages };
    }
    async updateStatus(inquiryId, viewerUserId, status) {
        if (!InquiriesService_1.UUID_RE.test(inquiryId))
            throw new common_1.NotFoundException('Inquiry not found');
        const inq = await this.inquiries.findOne({ where: { id: inquiryId } });
        if (!inq)
            throw new common_1.NotFoundException('Inquiry not found');
        const place = await this.places.findOne({ where: { id: inq.placeId } });
        if (!place || place.submittedBy !== viewerUserId)
            throw new common_1.ForbiddenException('Not your inquiry');
        const prevStatus = inq.status;
        inq.status = status;
        await this.inquiries.save(inq);
        if (inq.userId && prevStatus !== status) {
            try {
                const { title, body } = this.statusNotifyCopy(status, place.name);
                await this.notifications.create(inq.userId, title, body, notification_entity_1.NotificationType.SYSTEM, {
                    inquiryId: inq.id,
                    placeId: inq.placeId, placeName: place.name,
                    packageId: inq.packageId,
                    status, prevStatus,
                });
            }
            catch { }
        }
        return inq;
    }
    statusNotifyCopy(status, placeName) {
        switch (status) {
            case place_inquiry_entity_1.InquiryStatus.CONTACTED:
                return { title: 'Your host replied', body: `${placeName} just opened your inquiry.` };
            case place_inquiry_entity_1.InquiryStatus.QUOTED:
                return { title: 'Quote received', body: `${placeName} sent you a quote — check your email.` };
            case place_inquiry_entity_1.InquiryStatus.BOOKED:
                return { title: 'Booking confirmed', body: `Your trip with ${placeName} is locked in — leave a review after your visit!` };
            case place_inquiry_entity_1.InquiryStatus.CLOSED:
                return { title: 'Inquiry closed', body: `${placeName} closed your inquiry.` };
            default:
                return { title: 'Inquiry updated', body: `${placeName} updated your inquiry.` };
        }
    }
};
exports.InquiriesService = InquiriesService;
InquiriesService.UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
exports.InquiriesService = InquiriesService = InquiriesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(place_inquiry_entity_1.PlaceInquiry)),
    __param(1, (0, typeorm_1.InjectRepository)(place_entity_1.Place)),
    __param(2, (0, typeorm_1.InjectRepository)(tour_package_entity_1.TourPackage)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        notifications_service_1.NotificationsService])
], InquiriesService);
//# sourceMappingURL=inquiries.service.js.map