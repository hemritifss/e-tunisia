import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import { TripPlan, TripStop } from './trip-plan.entity';
import { TripMember } from './trip-member.entity';
import { Place } from '../places/place.entity';
import { TourPackage } from '../places/tour-package.entity';
import { InquiriesService } from '../places/inquiries.service';
import { UsersService } from '../users/users.service';
import { BadgesService } from '../badges/badges.service';
import { BillingService } from '../billing/billing.service';

interface BatchInquiryInput {
    name: string;
    email: string;
    phone?: string;
    dateFrom?: string;
    dateTo?: string;
    budget?: number;
    message: string;
}

interface UpsertInput {
    title?: string;
    travelers?: number;
    currency?: string;
    stops: Array<{
        placeId: string;
        packageId?: string | null;
        dayIndex?: number;
        timeSlot?: string | null;
    }>;
    days?: number;
    startDate?: string | null;
    isPublic?: boolean;
}

/** Accept only a clean "YYYY-MM-DD" date, else null. */
function cleanDate(v: unknown): string | null {
    return typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null;
}

@Injectable()
export class TripsService {
    private static UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    constructor(
        @InjectRepository(TripPlan) private trips: Repository<TripPlan>,
        @InjectRepository(TripMember) private members: Repository<TripMember>,
        @InjectRepository(Place) private places: Repository<Place>,
        @InjectRepository(TourPackage) private packages: Repository<TourPackage>,
        private inquiries: InquiriesService,
        private users: UsersService,
        private badges: BadgesService,
        private billing: BillingService,
    ) {}

    /** Strip fields that must never leave the server (the invite code grants edit access). */
    private sanitize<T extends TripPlan>(trip: T): Omit<T, 'inviteCode'> {
        const { inviteCode: _secret, ...safe } = trip as any;
        return safe;
    }

    /** Public list of trips authored by a given handle. Empty array on unknown handle. */
    async listByHandle(handle: string) {
        const user = await this.users.findByHandle(handle);
        if (!user) return [];
        const rows = await this.trips.find({
            where: { userId: user.id, isPublic: true },
            order: { updatedAt: 'DESC' },
            take: 50,
        });
        return rows.map((t) => this.sanitize(t));
    }

    /**
     * Fan out a single bundle inquiry across every stop in a trip.
     * One traveler message → N hosts notified, all linked via source=`trip:<slug>`.
     */
    async batchInquire(slug: string, viewerUserId: string | null, input: BatchInquiryInput) {
        const trip = await this.trips.findOne({ where: { slug } });
        if (!trip) throw new NotFoundException('Trip not found');
        if (trip.stops.length === 0) throw new BadRequestException('Trip has no stops');

        // Validate once — the per-stop submit will revalidate, but failing fast saves N round-trips.
        if (!input.name?.trim()) throw new BadRequestException('Name is required');
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email?.trim() || '')) {
            throw new BadRequestException('Valid email is required');
        }
        if (!input.message || input.message.trim().length < 5) {
            throw new BadRequestException('Message is too short');
        }

        // Group stops by (placeId, packageId) so duplicates collapse — one inquiry per host,
        // not one per stop on the same day if the cart accidentally double-added.
        const seen = new Set<string>();
        const results: Array<{ placeId: string; inquiryId: string; placeName: string }> = [];
        const failures: Array<{ placeId: string; reason: string }> = [];

        for (const stop of trip.stops) {
            const key = `${stop.placeId}::${stop.packageId || ''}`;
            if (seen.has(key)) continue;
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
            } catch (e: any) {
                failures.push({ placeId: stop.placeId, reason: e?.message || 'Submit failed' });
            }
        }

        if (results.length === 0) {
            throw new BadRequestException(failures[0]?.reason || 'Could not submit any inquiry');
        }

        return {
            slug,
            sent: results.length,
            failures,
            inquiries: results,
        };
    }

    /** 8-char shareable code, retried if collision. */
    private async generateSlug(): Promise<string> {
        const alpha = 'abcdefghjkmnpqrstuvwxyz23456789'; // no 0/O/1/l/i ambiguity
        for (let attempt = 0; attempt < 8; attempt++) {
            let s = '';
            for (let i = 0; i < 8; i++) s += alpha[Math.floor(Math.random() * alpha.length)];
            const existing = await this.trips.findOne({ where: { slug: s } });
            if (!existing) return s;
        }
        // Extreme bad luck — append timestamp for uniqueness
        return Date.now().toString(36);
    }

    /** Hydrate stops with the latest place + package details so the saved snapshot is rich. */
    private async hydrateStops(input: UpsertInput['stops']): Promise<TripStop[]> {
        const placeIds = Array.from(new Set(input.map(s => s.placeId).filter(Boolean)));
        const packageIds = Array.from(new Set(input.map(s => s.packageId).filter(Boolean) as string[]));

        const [places, packages] = await Promise.all([
            placeIds.length > 0
                ? this.places.find({ where: placeIds.map(id => ({ id })) })
                : Promise.resolve([] as Place[]),
            packageIds.length > 0
                ? this.packages.find({ where: packageIds.map(id => ({ id })) })
                : Promise.resolve([] as TourPackage[]),
        ]);
        const placeById = new Map(places.map(p => [p.id, p]));
        const pkgById = new Map(packages.map(p => [p.id, p]));

        const now = new Date().toISOString();
        return input
            .filter(s => placeById.has(s.placeId))
            .map((s, idx) => {
                const place = placeById.get(s.placeId)!;
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
                } as TripStop;
            });
    }

    async create(userId: string | null, input: UpsertInput) {
        if (!Array.isArray(input.stops) || input.stops.length === 0) {
            throw new BadRequestException('Trip needs at least one stop');
        }
        if (input.stops.length > 30) {
            throw new BadRequestException('Trips capped at 30 stops');
        }

        // Plan cap: Free users get 3 trip plans, Pro/Business unlimited.
        // Anonymous drafts (userId === null) skip the cap — they're throwaway.
        if (userId) {
            const existing = await this.trips.count({ where: { userId } });
            const { ok, cap, plan } = await this.billing.checkCap(userId, 'maxTrips', existing);
            if (!ok) {
                throw new ForbiddenException({
                    code: 'cap_reached',
                    feature: 'maxTrips',
                    cap,
                    plan,
                    message: `Free plan allows ${cap} trips. Upgrade to Pro for unlimited.`,
                });
            }
        }

        const stops = await this.hydrateStops(input.stops);
        if (stops.length === 0) throw new BadRequestException('No valid stops');

        const days = Math.max(1, Number(input.days) || (
            // derive days from the max dayIndex if not provided
            Math.max(...stops.map(s => s.dayIndex)) + 1
        ));

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
        if (userId) await this.badges.awardIfEligible(userId, 'trip.created', {});
        return saved;
    }

    /** Owner or invited co-planner — collaborative trips share edit rights. */
    private async canEdit(trip: TripPlan, userId: string): Promise<boolean> {
        if (!trip.userId || trip.userId === userId) return true;
        const member = await this.members.findOne({ where: { tripId: trip.id, userId } });
        return !!member;
    }

    async update(slug: string, userId: string, input: UpsertInput) {
        const trip = await this.trips.findOne({ where: { slug } });
        if (!trip) throw new NotFoundException('Trip not found');
        if (!(await this.canEdit(trip, userId))) {
            throw new ForbiddenException('Not your trip');
        }
        if (Array.isArray(input.stops)) {
            if (input.stops.length === 0) throw new BadRequestException('Trip needs at least one stop');
            if (input.stops.length > 30) throw new BadRequestException('Trips capped at 30 stops');
            trip.stops = await this.hydrateStops(input.stops);
            if (trip.stops.length === 0) throw new BadRequestException('No valid stops');
        }
        if (input.title) trip.title = String(input.title).slice(0, 200);
        if (input.travelers) trip.travelers = Math.min(50, Math.max(1, Number(input.travelers)));
        if (input.currency) trip.currency = String(input.currency).toUpperCase().slice(0, 8);
        if (input.days) trip.days = Math.max(1, Number(input.days));
        if ('startDate' in input) trip.startDate = cleanDate(input.startDate);
        if (typeof input.isPublic === 'boolean') trip.isPublic = input.isPublic;
        return this.trips.save(trip);
    }

    async listMine(userId: string) {
        // Own trips + trips I was invited to co-plan.
        const memberships = await this.members.find({ where: { userId }, select: { tripId: true } });
        const memberIds = memberships.map((m) => m.tripId);
        const [own, shared] = await Promise.all([
            this.trips.find({ where: { userId }, order: { updatedAt: 'DESC' } }),
            memberIds.length
                ? this.trips.find({ where: memberIds.map((id) => ({ id })), order: { updatedAt: 'DESC' } })
                : Promise.resolve([] as TripPlan[]),
        ]);
        const seen = new Set(own.map((t) => t.id));
        return [...own, ...shared.filter((t) => !seen.has(t.id))].map((t) => this.sanitize(t));
    }

    // ── Collaborative planning (invite → join → co-edit) ─────────────────────

    /** Owner-only: get (or mint) the trip's secret invite code. */
    async ensureInviteCode(slug: string, userId: string) {
        const trip = await this.trips.findOne({ where: { slug } });
        if (!trip) throw new NotFoundException('Trip not found');
        if (trip.userId !== userId) throw new ForbiddenException('Only the owner can invite co-planners');
        if (!trip.inviteCode) {
            trip.inviteCode = randomBytes(9).toString('base64url'); // 12 chars, URL-safe
            await this.trips.save(trip);
        }
        return { code: trip.inviteCode };
    }

    /** Join a trip as co-planner via its invite code. Idempotent. */
    async join(slug: string, userId: string, code: string) {
        const trip = await this.trips.findOne({ where: { slug } });
        if (!trip) throw new NotFoundException('Trip not found');
        if (!trip.inviteCode || !code || trip.inviteCode !== String(code).trim()) {
            throw new ForbiddenException('Invalid or expired invite');
        }
        if (trip.userId === userId) return { joined: true, alreadyOwner: true, title: trip.title };
        try {
            await this.members.insert({ tripId: trip.id, userId, invitedBy: trip.userId });
        } catch { /* unique(tripId,userId) — already a member; joining twice is fine */ }
        return { joined: true, title: trip.title };
    }

    /** Who's planning this trip — owner first, then co-planners. */
    async listMembers(slug: string, viewerId?: string) {
        const trip = await this.trips.findOne({ where: { slug } });
        if (!trip) throw new NotFoundException('Trip not found');
        const rows = await this.members.find({ where: { tripId: trip.id }, order: { createdAt: 'ASC' } });
        const ids = [trip.userId, ...rows.map((r) => r.userId)].filter(Boolean) as string[];
        const people = await Promise.all(ids.map(async (id) => {
            const u = await this.users.findById(id).catch(() => null);
            return u ? {
                id: u.id, handle: (u as any).handle || null, fullName: u.fullName,
                avatar: (u as any).avatar || null, isOwner: id === trip.userId,
            } : null;
        }));
        const members = people.filter(Boolean);
        return {
            members,
            canEdit: !!viewerId && (viewerId === trip.userId || rows.some((r) => r.userId === viewerId)),
            isOwner: !!viewerId && viewerId === trip.userId,
        };
    }

    /**
     * Public discovery — list popular shareable trips.
     * Optional filters: city/days; sort by viewCount then recency by default.
     */
    async discover(opts: {
        page?: number; limit?: number;
        city?: string; minDays?: number; maxDays?: number;
        sort?: 'popular' | 'new';
    } = {}) {
        const page  = Math.max(1, Number(opts.page)  || 1);
        const limit = Math.min(48, Math.max(1, Number(opts.limit) || 24));
        const offset = (page - 1) * limit;

        const qb = this.trips.createQueryBuilder('t')
            .where('t.isPublic = :p', { p: true });

        if (opts.minDays) qb.andWhere('t.days >= :minD', { minD: Number(opts.minDays) });
        if (opts.maxDays) qb.andWhere('t.days <= :maxD', { maxD: Number(opts.maxDays) });

        // City filter is awkward on a JSON column — keep it simple and do a LIKE on the raw text.
        if (opts.city) {
            qb.andWhere('CAST(t.stops AS TEXT) ILIKE :c', { c: `%${opts.city}%` });
        }

        if (opts.sort === 'new') {
            qb.orderBy('t.updatedAt', 'DESC');
        } else {
            qb.orderBy('t.viewCount', 'DESC').addOrderBy('t.updatedAt', 'DESC');
        }

        const [rows, total] = await qb.skip(offset).take(limit).getManyAndCount();

        // Project a compact card-shape that doesn't leak full stop data.
        const data = rows.map(t => ({
            slug: t.slug,
            title: t.title,
            travelers: t.travelers,
            days: t.days,
            currency: t.currency,
            viewCount: t.viewCount,
            stopCount: t.stops.length,
            // First-few cities + cover images so the cards have visual punch
            previewCities: Array.from(new Set(t.stops.map(s => s.placeCity).filter(Boolean) as string[])).slice(0, 3),
            previewCovers: t.stops.map(s => s.placeCover).filter(Boolean).slice(0, 3) as string[],
            updatedAt: t.updatedAt,
        }));

        return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
    }

    async findBySlug(slug: string, viewerUserId: string | null) {
        const trip = await this.trips.findOne({ where: { slug } });
        if (!trip) throw new NotFoundException('Trip not found');
        if (!trip.isPublic && trip.userId !== viewerUserId) {
            // Co-planners can open a private trip too.
            const isMember = viewerUserId
                ? !!(await this.members.findOne({ where: { tripId: trip.id, userId: viewerUserId } }))
                : false;
            if (!isMember) throw new ForbiddenException('This trip is private');
        }
        // Best-effort view counter (skip own views). Atomic increment rather
        // than read-modify-write save(trip): save() here would also re-persist
        // the whole trip row (including invite code) on a public read path.
        if (viewerUserId !== trip.userId) {
            await this.trips.increment({ id: trip.id }, 'viewCount', 1).catch(() => {});
            trip.viewCount = (trip.viewCount || 0) + 1;
        }
        // NEVER leak the invite code on the public read — it grants edit access.
        // Owners fetch it explicitly via POST /trips/:slug/invite.
        return this.sanitize(trip);
    }

    async remove(slug: string, userId: string) {
        const trip = await this.trips.findOne({ where: { slug } });
        if (!trip) throw new NotFoundException('Trip not found');
        if (trip.userId !== userId) throw new ForbiddenException('Not your trip');
        await this.trips.remove(trip);
        return { deleted: true };
    }
}
