import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In, MoreThan } from 'typeorm';
import { MappingEvent } from './mapping-event.entity';
import { Place } from '../places/place.entity';
import { User } from '../users/user.entity';
import { PlaceConfirmation } from '../gems/place-confirmation.entity';
import { PlaceVisit } from '../users/place-visit.entity';
import { Review } from '../reviews/review.entity';
import { BeachReport } from '../beaches/beach-report.entity';

/**
 * Live scoring for the Great Tunisia Mapping Weekend (GROWTH §8). Standings are
 * computed on the fly from real activity inside the event window — no
 * denormalized counters to drift. Mapping actions (submitting + verifying gems)
 * are weighted highest because that's the whole point of the weekend.
 */

const WEIGHTS = { gem: 10, confirm: 5, review: 3, checkIn: 2, beachReport: 2 };

export type EventStatus = 'upcoming' | 'live' | 'ended';

@Injectable()
export class MappingService {
    constructor(
        @InjectRepository(MappingEvent) private readonly events: Repository<MappingEvent>,
        @InjectRepository(Place) private readonly places: Repository<Place>,
        @InjectRepository(User) private readonly users: Repository<User>,
        @InjectRepository(PlaceConfirmation) private readonly confirmations: Repository<PlaceConfirmation>,
        @InjectRepository(PlaceVisit) private readonly visits: Repository<PlaceVisit>,
        @InjectRepository(Review) private readonly reviews: Repository<Review>,
        @InjectRepository(BeachReport) private readonly beachReports: Repository<BeachReport>,
    ) {}

    private fold(s?: string | null): string {
        return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
    }

    /** The event shown at /mapping-weekend: the featured one, else the live one,
     *  else the nearest upcoming, else the most recent. */
    async featured(): Promise<MappingEvent | null> {
        const featured = await this.events.findOne({ where: { isFeatured: true }, order: { startsAt: 'DESC' } });
        if (featured) return featured;
        const now = new Date();
        const live = await this.events.findOne({ where: { startsAt: Between(new Date(0), now), endsAt: MoreThan(now) } });
        if (live) return live;
        const upcoming = await this.events.findOne({ where: { startsAt: MoreThan(now) }, order: { startsAt: 'ASC' } });
        if (upcoming) return upcoming;
        return this.events.findOne({ where: {}, order: { startsAt: 'DESC' } });
    }

    status(event: MappingEvent, now = new Date()): EventStatus {
        if (now < event.startsAt) return 'upcoming';
        if (now >= event.endsAt) return 'ended';
        return 'live';
    }

    async standings(slug?: string, viewerId?: string) {
        const event = slug
            ? await this.events.findOne({ where: { slug } })
            : await this.featured();
        if (!event) throw new NotFoundException('No mapping event');

        const now = new Date();
        const from = event.startsAt;
        // Score up to now while live so the board moves; the full window once ended.
        const to = now < event.endsAt ? now : event.endsAt;
        const range = Between(from, to);

        // ── Pull the raw scoring rows for the window ──────────────
        const [gems, confirms, visits, reviews, beaches] = await Promise.all([
            this.places.createQueryBuilder('p')
                .select(['p.id AS id', 'p.governorate AS governorate', 'p.submittedBy AS "userId"'])
                .where('p.submittedBy IS NOT NULL')
                .andWhere('p.createdAt BETWEEN :from AND :to', { from, to })
                .andWhere(`(p.tags LIKE '%hidden-gem%' OR p.tags LIKE '%community%')`)
                .getRawMany().catch(() => []),
            this.confirmations.find({ where: { createdAt: range } }).catch(() => []),
            this.visits.find({ where: { createdAt: range } }).catch(() => []),
            this.reviews.find({ where: { createdAt: range } as any }).catch(() => []),
            this.beachReports.find({ where: { createdAt: range } as any }).catch(() => []),
        ]);

        // Resolve governorate for every place referenced by a non-gem action.
        const placeIds = new Set<string>();
        confirms.forEach((c) => placeIds.add(c.placeId));
        visits.forEach((v) => placeIds.add(v.placeId));
        reviews.forEach((r) => placeIds.add((r as any).placeId));
        beaches.forEach((b) => placeIds.add((b as any).placeId));
        const placeRows = placeIds.size
            ? await this.places.find({ where: { id: In([...placeIds]) }, select: ['id', 'governorate'] }).catch(() => [])
            : [];
        const govByPlace = new Map(placeRows.map((p) => [p.id, p.governorate]));

        // ── Aggregate by governorate + by contributor ────────────
        const govAgg = new Map<string, { display: string; points: number; gems: number; users: Set<string> }>();
        const userAgg = new Map<string, { points: number; gov: string | null }>();

        const add = (gov: string | null | undefined, userId: string | null | undefined, pts: number, isGem = false) => {
            const display = (gov || '').trim();
            if (display) {
                const key = this.fold(display);
                const g = govAgg.get(key) || { display, points: 0, gems: 0, users: new Set<string>() };
                g.points += pts;
                if (isGem) g.gems += 1;
                if (userId) g.users.add(userId);
                govAgg.set(key, g);
            }
            if (userId) {
                const u = userAgg.get(userId) || { points: 0, gov: display || null };
                u.points += pts;
                if (!u.gov && display) u.gov = display;
                userAgg.set(userId, u);
            }
        };

        for (const g of gems) add(g.governorate, g.userId, WEIGHTS.gem, true);
        for (const c of confirms) add(govByPlace.get(c.placeId), c.userId, WEIGHTS.confirm);
        for (const v of visits) add(govByPlace.get(v.placeId), v.userId, WEIGHTS.checkIn);
        for (const r of reviews) add(govByPlace.get((r as any).placeId), (r as any).userId, WEIGHTS.review);
        for (const b of beaches) add(govByPlace.get((b as any).placeId), (b as any).userId, WEIGHTS.beachReport);

        // ── Shape governorate standings ──────────────────────────
        const governorates = [...govAgg.values()]
            .map((g) => ({ governorate: g.display, points: g.points, gems: g.gems, contributors: g.users.size }))
            .sort((a, b) => b.points - a.points || b.gems - a.gems)
            .map((g, i) => ({ ...g, rank: i + 1 }));

        // ── Shape contributor standings (need user display fields) ─
        const userIds = [...userAgg.keys()];
        const userRows = userIds.length
            ? await this.users.find({ where: { id: In(userIds) }, select: ['id', 'handle', 'fullName', 'avatar'] }).catch(() => [])
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

        let me: { points: number; rank: number; governorate: string | null } | null = null;
        if (viewerId && userAgg.has(viewerId)) {
            const rank = ranked.findIndex((u) => u.userId === viewerId) + 1;
            const mine = userAgg.get(viewerId)!;
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

    /** Admin: create/replace the featured event. */
    async create(input: { slug: string; title: string; subtitle?: string; startsAt: string; endsAt: string; prizes?: string; featured?: boolean }) {
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
}
