import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { Follow } from './follow.entity';
import { Endorsement } from './endorsement.entity';
import { Review } from '../reviews/review.entity';
import { Place } from '../places/place.entity';
import { TripPlan } from '../itineraries/trip-plan.entity';
import { UsersService } from './users.service';
import { effectivePlan } from './effective-plan';

export type ActivityType = 'review' | 'trip' | 'endorse' | 'follow';

export interface ActivityActor {
    id: string;
    handle: string | null;
    fullName: string;
    avatar: string | null;
    plan: 'free' | 'premium' | 'business';
    role?: string;
}

export interface ActivityEntry {
    type: ActivityType;
    createdAt: string;
    actor: ActivityActor;
    /** Type-specific payload. */
    target?: any;
}

const PER_SOURCE = 50;

/**
 * Cross-table "what people you follow just did" feed.
 *
 * v1 approach: query each event source by followed userId set, sort+merge in
 * memory, return top-N. Fine while followee lists stay small. If activity
 * scales, materialise into a dedicated activity table.
 */
@Injectable()
export class ActivityService {
    constructor(
        @InjectRepository(Follow) private followsRepo: Repository<Follow>,
        @InjectRepository(Review) private reviewsRepo: Repository<Review>,
        @InjectRepository(TripPlan) private tripsRepo: Repository<TripPlan>,
        @InjectRepository(Endorsement) private endorsementsRepo: Repository<Endorsement>,
        @InjectRepository(User) private usersRepo: Repository<User>,
        @InjectRepository(Place) private placesRepo: Repository<Place>,
        @Inject(forwardRef(() => UsersService)) private users: UsersService,
    ) {}

    /** Recent activity across the whole platform (discovery surface). */
    async globalFeed(limit = 20): Promise<ActivityEntry[]> {
        const [reviews, trips, endorsements] = await Promise.all([
            this.reviewsRepo
                .find({
                    order: { createdAt: 'DESC' },
                    take: PER_SOURCE,
                    relations: ['place'],
                })
                .catch(() => [] as Review[]),
            this.tripsRepo
                .find({
                    where: { isPublic: true },
                    order: { createdAt: 'DESC' },
                    take: PER_SOURCE,
                })
                .catch(() => [] as TripPlan[]),
            this.endorsementsRepo
                .find({
                    order: { createdAt: 'DESC' },
                    take: PER_SOURCE,
                })
                .catch(() => [] as Endorsement[]),
        ]);

        const actorIds = new Set<string>();
        const targetUserIds = new Set<string>();
        reviews.forEach((r) => actorIds.add(r.userId));
        trips.forEach((t) => t.userId && actorIds.add(t.userId));
        endorsements.forEach((e) => {
            actorIds.add(e.endorserId);
            targetUserIds.add(e.endorsedId);
        });

        const allUserIds = Array.from(new Set([...actorIds, ...targetUserIds]));
        const userRows = allUserIds.length
            ? await this.usersRepo.find({
                  where: allUserIds.map((id) => ({ id })),
                  select: ['id', 'handle', 'fullName', 'avatar', 'plan', 'role', 'subscriptionExpiresAt'] as any,
              })
            : [];
        const userById = new Map<string, ActivityActor>(
            userRows.map((u: any) => [
                u.id,
                { id: u.id, handle: u.handle ?? null, fullName: u.fullName, avatar: u.avatar || null, plan: effectivePlan(u), role: u.role },
            ]),
        );
        const actor = (id: string) =>
            userById.get(id) || { id, handle: null, fullName: 'Someone', avatar: null, plan: 'free' as const };

        const entries: ActivityEntry[] = [];

        for (const r of reviews) {
            entries.push({
                type: 'review',
                createdAt: r.createdAt.toISOString(),
                actor: actor(r.userId),
                target: {
                    placeId: r.placeId,
                    placeName: (r as any).place?.name || null,
                    placeCity: (r as any).place?.city || null,
                    rating: r.rating,
                    snippet: (r.comment || '').slice(0, 140),
                },
            });
        }
        for (const t of trips) {
            if (!t.userId) continue;
            entries.push({
                type: 'trip',
                createdAt: t.createdAt.toISOString(),
                actor: actor(t.userId),
                target: {
                    slug: t.slug,
                    title: t.title,
                    days: t.days,
                    travelers: t.travelers,
                    stopCount: Array.isArray(t.stops) ? t.stops.length : 0,
                },
            });
        }
        for (const e of endorsements) {
            entries.push({
                type: 'endorse',
                createdAt: e.createdAt.toISOString(),
                actor: actor(e.endorserId),
                target: { user: actor(e.endorsedId), topic: e.topic },
            });
        }

        entries.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
        return entries.slice(0, Math.min(100, Math.max(1, limit)));
    }

    /** Recent activity from users that the viewer follows. */
    async followingFeed(viewerId: string, limit = 20): Promise<ActivityEntry[]> {
        const follows = await this.followsRepo.find({
            where: { followerId: viewerId },
            select: ['followedId'],
        });
        const followedIds = follows.map((f) => f.followedId);
        if (!followedIds.length) return [];

        const [reviews, trips, endorsements, follows2] = await Promise.all([
            this.reviewsRepo
                .find({
                    where: followedIds.map((id) => ({ userId: id })),
                    order: { createdAt: 'DESC' },
                    take: PER_SOURCE,
                    relations: ['place'],
                })
                .catch(() => [] as Review[]),
            this.tripsRepo
                .find({
                    where: followedIds.map((id) => ({ userId: id, isPublic: true })),
                    order: { createdAt: 'DESC' },
                    take: PER_SOURCE,
                })
                .catch(() => [] as TripPlan[]),
            this.endorsementsRepo
                .find({
                    where: followedIds.map((id) => ({ endorserId: id })),
                    order: { createdAt: 'DESC' },
                    take: PER_SOURCE,
                })
                .catch(() => [] as Endorsement[]),
            this.followsRepo
                .find({
                    where: followedIds.map((id) => ({ followerId: id })),
                    order: { createdAt: 'DESC' },
                    take: PER_SOURCE,
                })
                .catch(() => [] as Follow[]),
        ]);

        // Need actor + target user lookups in two batches to keep round-trips low.
        const actorIds = new Set<string>();
        const targetUserIds = new Set<string>();
        reviews.forEach((r) => actorIds.add(r.userId));
        trips.forEach((t) => t.userId && actorIds.add(t.userId));
        endorsements.forEach((e) => {
            actorIds.add(e.endorserId);
            targetUserIds.add(e.endorsedId);
        });
        follows2.forEach((f) => {
            actorIds.add(f.followerId);
            targetUserIds.add(f.followedId);
        });

        const allUserIds = Array.from(new Set([...actorIds, ...targetUserIds]));
        const userRows = allUserIds.length
            ? await this.usersRepo.find({
                  where: allUserIds.map((id) => ({ id })),
                  select: ['id', 'handle', 'fullName', 'avatar', 'plan', 'role', 'subscriptionExpiresAt'] as any,
              })
            : [];
        const userById = new Map<string, ActivityActor>(
            userRows.map((u: any) => [
                u.id,
                { id: u.id, handle: u.handle ?? null, fullName: u.fullName, avatar: u.avatar || null, plan: effectivePlan(u), role: u.role },
            ]),
        );
        const actor = (id: string) =>
            userById.get(id) || { id, handle: null, fullName: 'Someone', avatar: null, plan: 'free' as const };

        const entries: ActivityEntry[] = [];

        for (const r of reviews) {
            entries.push({
                type: 'review',
                createdAt: r.createdAt.toISOString(),
                actor: actor(r.userId),
                target: {
                    placeId: r.placeId,
                    placeName: (r as any).place?.name || null,
                    placeCity: (r as any).place?.city || null,
                    rating: r.rating,
                    snippet: (r.comment || '').slice(0, 140),
                },
            });
        }

        for (const t of trips) {
            if (!t.userId) continue;
            entries.push({
                type: 'trip',
                createdAt: t.createdAt.toISOString(),
                actor: actor(t.userId),
                target: {
                    slug: t.slug,
                    title: t.title,
                    days: t.days,
                    travelers: t.travelers,
                    stopCount: Array.isArray(t.stops) ? t.stops.length : 0,
                },
            });
        }

        for (const e of endorsements) {
            entries.push({
                type: 'endorse',
                createdAt: e.createdAt.toISOString(),
                actor: actor(e.endorserId),
                target: { user: actor(e.endorsedId), topic: e.topic },
            });
        }

        for (const f of follows2) {
            entries.push({
                type: 'follow',
                createdAt: f.createdAt.toISOString(),
                actor: actor(f.followerId),
                target: { user: actor(f.followedId) },
            });
        }

        entries.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
        return entries.slice(0, Math.min(100, Math.max(1, limit)));
    }
}
