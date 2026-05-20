import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Place } from './place.entity';
import { PlaceInquiry, InquiryStatus } from './place-inquiry.entity';
import { TourPackage } from './tour-package.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/notification.entity';

interface CreateInquiryInput {
    name: string;
    email: string;
    phone?: string | null;
    partySize?: number;
    dateFrom?: string | null;
    dateTo?: string | null;
    budget?: number | null;
    currency?: string;
    message: string;
    source?: string | null;
    packageId?: string | null;
}

@Injectable()
export class InquiriesService {
    constructor(
        @InjectRepository(PlaceInquiry) private inquiries: Repository<PlaceInquiry>,
        @InjectRepository(Place) private places: Repository<Place>,
        @InjectRepository(TourPackage) private packages: Repository<TourPackage>,
        private notifications: NotificationsService,
    ) {}

    private static UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    async submit(placeId: string, viewerUserId: string | null, input: CreateInquiryInput) {
        if (!InquiriesService.UUID_RE.test(placeId)) throw new NotFoundException('Place not found');

        const place = await this.places.findOne({ where: { id: placeId } });
        if (!place || !place.isActive) throw new NotFoundException('Place not found');

        // Lightweight validation — DTO would normally enforce this, but we want guests too.
        const name = (input.name || '').trim().slice(0, 120);
        const email = (input.email || '').trim().slice(0, 200);
        const message = (input.message || '').trim().slice(0, 2000);
        if (!name) throw new BadRequestException('Name is required');
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new BadRequestException('Valid email is required');
        if (message.length < 5) throw new BadRequestException('Message is too short');

        const partySize = Math.min(50, Math.max(1, Number(input.partySize) || 1));
        const dateFrom = input.dateFrom ? String(input.dateFrom).slice(0, 10) : null;
        const dateTo   = input.dateTo   ? String(input.dateTo).slice(0, 10)   : null;
        if (dateFrom && dateTo && new Date(dateTo) < new Date(dateFrom)) {
            throw new BadRequestException('End date must be after start date');
        }
        const budget = input.budget != null ? Math.max(0, Math.floor(Number(input.budget))) : null;
        const currency = (input.currency || 'TND').toUpperCase().slice(0, 8);
        const source = input.source ? String(input.source).slice(0, 80) : null;
        const phone = input.phone ? String(input.phone).trim().slice(0, 40) : null;

        // Optional package linkage — only persisted when the package exists & belongs to this place.
        let packageId: string | null = null;
        let packageTitle: string | null = null;
        if (input.packageId && InquiriesService.UUID_RE.test(input.packageId)) {
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
            status: InquiryStatus.NEW,
        }));

        // Notify the place owner if known. Falls back silently when the place was
        // seeded without an owner (submittedBy is null) — admins still see it in their dashboard.
        if (place.submittedBy && place.submittedBy !== viewerUserId) {
            try {
                const subject = packageTitle ? `"${packageTitle}"` : `"${place.name}"`;
                await this.notifications.create(
                    place.submittedBy,
                    packageTitle ? 'Booking request' : 'New inquiry',
                    `${name} asked about ${subject} — ${partySize} ${partySize === 1 ? 'traveler' : 'travelers'}`,
                    NotificationType.SYSTEM,
                    {
                        inquiryId: saved.id,
                        placeId, placeName: place.name,
                        packageId, packageTitle,
                        partySize, dateFrom, dateTo,
                        source,
                    },
                );
            } catch {}
        }

        return {
            id: saved.id,
            placeId: saved.placeId,
            placeName: place.name,
            status: saved.status,
            createdAt: saved.createdAt,
        };
    }

    /** Inquiries the logged-in user submitted, newest first. */
    async listMine(userId: string, opts: { page?: number; limit?: number } = {}) {
        const page  = Math.max(1, Number(opts.page)  || 1);
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
            const p: any = byId.get(r.placeId) || null;
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

    /** Inquiries received by the place owner (submittedBy === userId). */
    async listReceived(userId: string, opts: { page?: number; limit?: number } = {}) {
        const page  = Math.max(1, Number(opts.page)  || 1);
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
            const p: any = byId.get(r.placeId) || null;
            return {
                ...r,
                place: p ? { id: p.id, name: p.name, city: p.city, coverImage: p.coverImage } : null,
            };
        });
        return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
    }

    /** Inquiry stats for the owner dashboard. */
    async statsForOwner(userId: string) {
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
            counts[i.status as keyof typeof counts]++;
            if (i.createdAt && new Date(i.createdAt).getTime() >= weekAgo) last7Days++;
        }
        const total = all.length;
        const conversionRate = total > 0 ? Math.round((counts.booked / total) * 100) : 0;
        return {
            placeCount: myPlaces.length, total, ...counts,
            last7Days, conversionRate,
        };
    }

    /**
     * Per-channel breakdown so owners can see ROI:
     *   - top sources (e.g. "place-detail", "package:<id>", "post:<id>")
     *   - top packages by inquiries received + booked
     */
    async breakdownForOwner(userId: string) {
        const myPlaces = await this.places.find({ where: { submittedBy: userId } });
        if (myPlaces.length === 0) return { sources: [], packages: [] };
        const placeIds = myPlaces.map(p => p.id);
        const all = await this.inquiries.find({
            where: placeIds.map(id => ({ placeId: id })),
        });

        // Aggregate by source
        const srcCounts = new Map<string, { total: number; booked: number }>();
        for (const i of all) {
            const key = (() => {
                const s = i.source || 'direct';
                // Collapse "package:<uuid>" → "package" so the chart is readable
                if (s.startsWith('package:')) return 'package';
                if (s.startsWith('post:'))    return 'post';
                return s;
            })();
            const bucket = srcCounts.get(key) || { total: 0, booked: 0 };
            bucket.total++;
            if (i.status === InquiryStatus.BOOKED) bucket.booked++;
            srcCounts.set(key, bucket);
        }
        const sources = [...srcCounts.entries()]
            .map(([source, v]) => ({ source, ...v }))
            .sort((a, b) => b.total - a.total);

        // Aggregate by package
        const pkgIds = Array.from(new Set(all.map(i => i.packageId).filter(Boolean) as string[]));
        const pkgRows = pkgIds.length > 0
            ? await this.places.manager.find(TourPackage, { where: pkgIds.map(id => ({ id })) })
            : [];
        const pkgById = new Map(pkgRows.map(p => [p.id, p]));
        const pkgCounts = new Map<string, { total: number; booked: number }>();
        for (const i of all) {
            if (!i.packageId) continue;
            const bucket = pkgCounts.get(i.packageId) || { total: 0, booked: 0 };
            bucket.total++;
            if (i.status === InquiryStatus.BOOKED) bucket.booked++;
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

    async updateStatus(inquiryId: string, viewerUserId: string, status: InquiryStatus) {
        if (!InquiriesService.UUID_RE.test(inquiryId)) throw new NotFoundException('Inquiry not found');
        const inq = await this.inquiries.findOne({ where: { id: inquiryId } });
        if (!inq) throw new NotFoundException('Inquiry not found');
        const place = await this.places.findOne({ where: { id: inq.placeId } });
        // Only the place owner can update status. (Admin role gating can be layered on top later.)
        if (!place || place.submittedBy !== viewerUserId) throw new ForbiddenException('Not your inquiry');
        const prevStatus = inq.status;
        inq.status = status;
        await this.inquiries.save(inq);

        // Notify the traveler when status actually changes (and they're a signed-in user).
        if (inq.userId && prevStatus !== status) {
            try {
                const { title, body } = this.statusNotifyCopy(status, place.name);
                await this.notifications.create(
                    inq.userId,
                    title, body,
                    NotificationType.SYSTEM,
                    {
                        inquiryId: inq.id,
                        placeId: inq.placeId, placeName: place.name,
                        packageId: inq.packageId,
                        status, prevStatus,
                    },
                );
            } catch {}
        }
        return inq;
    }

    private statusNotifyCopy(status: InquiryStatus, placeName: string): { title: string; body: string } {
        switch (status) {
            case InquiryStatus.CONTACTED:
                return { title: 'Your host replied',  body: `${placeName} just opened your inquiry.` };
            case InquiryStatus.QUOTED:
                return { title: 'Quote received',     body: `${placeName} sent you a quote — check your email.` };
            case InquiryStatus.BOOKED:
                return { title: 'Booking confirmed',  body: `Your trip with ${placeName} is locked in — leave a review after your visit!` };
            case InquiryStatus.CLOSED:
                return { title: 'Inquiry closed',     body: `${placeName} closed your inquiry.` };
            default:
                return { title: 'Inquiry updated',    body: `${placeName} updated your inquiry.` };
        }
    }
}
