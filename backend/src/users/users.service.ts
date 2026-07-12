import { Inject, Injectable, NotFoundException, forwardRef } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';
import { User } from './user.entity';
import * as bcrypt from 'bcrypt';
import { Review } from '../reviews/review.entity';
import { Place } from '../places/place.entity';
import { TripPlan } from '../itineraries/trip-plan.entity';
import { SavedPost } from '../posts/saved-post.entity';
import { PassportView } from './passport-view.entity';
import { PlaceVisit } from './place-visit.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/notification.entity';
import { PassportDto, deriveLevel } from './dto/passport.dto';
import { BadgesService } from '../badges/badges.service';
import { GamificationService } from '../gamification/gamification.service';
import { EndorsementsService } from './endorsements.service';
import { effectivePlan } from './effective-plan';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User) private usersRepository: Repository<User>,
        @InjectRepository(Review) private reviewsRepo: Repository<Review>,
        @InjectRepository(Place) private placesRepo: Repository<Place>,
        @InjectRepository(TripPlan) private tripsRepo: Repository<TripPlan>,
        @InjectRepository(SavedPost) private savesRepo: Repository<SavedPost>,
        @InjectRepository(PassportView) private passportViewsRepo: Repository<PassportView>,
        @InjectRepository(PlaceVisit) private placeVisitsRepo: Repository<PlaceVisit>,
        @Inject(CACHE_MANAGER) private cache: Cache,
        private badges: BadgesService,
        private notifications: NotificationsService,
        private gamification: GamificationService,
        @Inject(forwardRef(() => EndorsementsService)) private endorsements: EndorsementsService,
    ) { }

    async findByEmail(email: string): Promise<User | null> {
        return this.usersRepository.findOne({ where: { email } });
    }

    /**
     * Founders' program: the first 1000 real accounts get a permanent numbered
     * passport. Concurrency-safe via the partial unique index — a collision on
     * simultaneous signups just retries with the next number.
     */
    async assignFounderNumber(userId: string): Promise<number | null> {
        for (let attempt = 0; attempt < 3; attempt++) {
            try {
                const row = await this.usersRepository
                    .createQueryBuilder('u')
                    .select('COALESCE(MAX(u.founderNumber), 0)', 'max')
                    .getRawOne();
                const next = Number(row?.max || 0) + 1;
                if (next > 1000) return null;
                const res = await this.usersRepository.update(
                    { id: userId, founderNumber: IsNull() },
                    { founderNumber: next },
                );
                if (res.affected) return next;
                return null; // already numbered
            } catch { /* unique collision — retry with a fresh MAX */ }
        }
        return null;
    }

    async findByHandle(handle: string): Promise<User | null> {
        if (!handle) return null;
        return this.usersRepository.findOne({ where: { handle: handle.toLowerCase() } });
    }

    async findByResetToken(token: string): Promise<User | null> {
        return this.usersRepository.findOne({ where: { passwordResetToken: token } });
    }

    /**
     * Auto-generate a unique handle from a fullName. Reuses the backfill
     * algorithm so registered + backfilled accounts share a name scheme.
     * Falls back to a random suffix after 8 collisions.
     */
    async generateAvailableHandle(fullName: string): Promise<string> {
        const { HANDLE_PATTERN, RESERVED_HANDLES } = await import('./reserved-handles');
        const slugify = (s: string) =>
            (s || 'traveler')
                .toLowerCase()
                .normalize('NFKD')
                .replace(/[^\x00-\x7f]/g, '')
                .replace(/[^a-z0-9]+/g, '_')
                .replace(/^_+|_+$/g, '')
                .replace(/^[^a-z]+/, 't_')
                .slice(0, 22) || 'traveler';
        let base = slugify(fullName);
        if (base.length < 3) base = base + '_t';

        for (let i = 0; i < 8; i++) {
            const candidate = i === 0 ? base : `${base}_${Math.random().toString(36).slice(2, 6)}`;
            if (!HANDLE_PATTERN.test(candidate)) continue;
            if (RESERVED_HANDLES.has(candidate)) continue;
            const clash = await this.usersRepository.findOne({ where: { handle: candidate } });
            if (!clash) return candidate;
        }
        // Pathological last resort: timestamp suffix.
        return `${base}_${Date.now().toString(36)}`;
    }

    async isHandleAvailable(handle: string): Promise<boolean> {
        const h = (handle || '').toLowerCase();
        const { isHandleFormatValid, isHandleReserved } = await import('./reserved-handles');
        if (!isHandleFormatValid(h)) return false;
        if (isHandleReserved(h)) return false;
        const existing = await this.usersRepository.findOne({ where: { handle: h } });
        return !existing;
    }

    async findById(id: string): Promise<User> {
        const user = await this.usersRepository.findOne({
            where: { id },
            relations: ['reviews'],
        });
        if (!user) throw new NotFoundException('User not found');
        return user;
    }

    async create(data: Partial<User>): Promise<User> {
        const hashedPassword = await bcrypt.hash(data.password, 12);
        const user = this.usersRepository.create({
            ...data,
            password: hashedPassword,
            favoriteIds: [],
        });
        return this.usersRepository.save(user);
    }

    async update(id: string, data: Partial<User>): Promise<User> {
        await this.usersRepository.update(id, data);
        await this.invalidatePassportCache(id);
        return this.findById(id);
    }

    /** Record a passport view by a logged-in, non-owner viewer (deduped per 12h). Fire-and-forget. */
    async recordPassportView(ownerHandle: string, viewerId: string): Promise<void> {
        try {
            const owner = await this.usersRepository.findOne({ where: { handle: ownerHandle.toLowerCase() }, select: ['id'] });
            if (!owner || owner.id === viewerId) return;
            const since = new Date(Date.now() - 12 * 3600 * 1000);
            const recent = await this.passportViewsRepo
                .createQueryBuilder('v')
                .where('v.ownerId = :o AND v.viewerId = :vw AND v.createdAt > :since', { o: owner.id, vw: viewerId, since })
                .getCount();
            if (recent > 0) return;
            await this.passportViewsRepo.save(this.passportViewsRepo.create({ ownerId: owner.id, viewerId }));
            await this.maybeNotifyPassportViews(owner.id);
        } catch { /* never block the view */ }
    }

    /**
     * Smart-batched "someone viewed your passport" ping — at most once per 24h per owner,
     * with a deduped count ("3 people viewed your passport"). Throttled via the cache so
     * a burst of views produces one digest, not a notification storm.
     */
    private async maybeNotifyPassportViews(ownerId: string): Promise<void> {
        const throttleKey = `pv-notif:${ownerId}`;
        try {
            if (await this.cache.get(throttleKey)) return;
            const since = new Date(Date.now() - 24 * 3600 * 1000);
            const row = await this.passportViewsRepo.createQueryBuilder('v')
                .select('COUNT(DISTINCT v.viewerId)', 'c')
                .where('v.ownerId = :o AND v.createdAt > :since', { o: ownerId, since })
                .getRawOne();
            const n = Number(row?.c || 0);
            if (n < 1) return;
            await this.notifications.create(
                ownerId,
                n === 1 ? 'Someone viewed your passport' : `${n} people viewed your passport`,
                n === 1
                    ? 'A traveler checked out your Tunisia journey.'
                    : `${n} travelers checked out your Tunisia journey recently.`,
                NotificationType.PASSPORT_VIEW,
                { count: n },
            );
            await this.cache.set(throttleKey, '1', 24 * 3600 * 1000); // 24h cooldown
        } catch { /* notifications are best-effort */ }
    }

    /** Pro analytics: who viewed your passport. */
    async getPassportAnalytics(ownerId: string) {
        const weekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000);
        const [totalViews, viewsThisWeek, uniqueRow, recentRows] = await Promise.all([
            this.passportViewsRepo.count({ where: { ownerId } }),
            this.passportViewsRepo.createQueryBuilder('v')
                .where('v.ownerId = :o AND v.createdAt > :w', { o: ownerId, w: weekAgo }).getCount(),
            this.passportViewsRepo.createQueryBuilder('v')
                .select('COUNT(DISTINCT v.viewerId)', 'c').where('v.ownerId = :o', { o: ownerId }).getRawOne(),
            this.passportViewsRepo.createQueryBuilder('v')
                .where('v.ownerId = :o', { o: ownerId }).orderBy('v.createdAt', 'DESC').limit(10).getMany(),
        ]);

        const viewerIds = [...new Set(recentRows.map((r) => r.viewerId))];
        const viewers = viewerIds.length
            ? await this.usersRepository.find({
                where: { id: In(viewerIds) },
                select: ['id', 'handle', 'fullName', 'avatar', 'country', 'plan', 'subscriptionExpiresAt', 'role'] as any,
            })
            : [];
        const byId = new Map(viewers.map((u) => [u.id, u]));
        const recentViewers = recentRows
            .map((r) => {
                const u = byId.get(r.viewerId);
                return u ? { handle: u.handle, fullName: u.fullName, avatar: u.avatar || null, plan: effectivePlan(u), role: u.role, viewedAt: r.createdAt } : null;
            })
            .filter(Boolean);

        const countryRows = await this.passportViewsRepo.createQueryBuilder('v')
            // viewerId is stored as varchar; users.id is uuid — cast to compare (Postgres has no implicit cast).
            .innerJoin(User, 'u', 'u.id::text = v.viewerId')
            .select('u.country', 'country')
            .addSelect('COUNT(DISTINCT v.viewerId)', 'count')
            .where('v.ownerId = :o AND u.country IS NOT NULL', { o: ownerId })
            .groupBy('u.country').orderBy('count', 'DESC').limit(3).getRawMany();
        const topCountries = countryRows.map((r) => ({ country: r.country, count: Number(r.count) }));

        return {
            totalViews,
            viewsThisWeek,
            uniqueViewers: Number(uniqueRow?.c || 0),
            recentViewers,
            topCountries,
        };
    }

    async toggleFavorite(userId: string, placeId: string): Promise<string[]> {
        const user = await this.findById(userId);
        const favorites = user.favoriteIds || [];
        const index = favorites.indexOf(placeId);

        if (index > -1) {
            favorites.splice(index, 1);
        } else {
            favorites.push(placeId);
        }

        user.favoriteIds = favorites;
        await this.usersRepository.save(user);
        await this.invalidatePassportCache(userId);
        return favorites;
    }

    async getFavoriteIds(userId: string): Promise<string[]> {
        const user = await this.findById(userId);
        return user.favoriteIds || [];
    }

    async toggleVisited(userId: string, placeId: string): Promise<string[]> {
        const user = await this.findById(userId);
        const visited = user.visitedPlaceIds || [];
        const index = visited.indexOf(placeId);
        const wasAdded = index === -1;

        if (index > -1) {
            visited.splice(index, 1);
        } else {
            visited.push(placeId);
        }

        user.visitedPlaceIds = visited;
        await this.usersRepository.save(user);
        await this.invalidatePassportCache(userId);

        // Dual-write the normalized place_visits row (powers rarity + analytics).
        if (wasAdded) {
            const place = await this.placesRepo.findOne({ where: { id: placeId }, select: ['city'] }).catch(() => null);
            let firstEver = false;
            try {
                await this.placeVisitsRepo.insert(this.placeVisitsRepo.create({ userId, placeId, city: place?.city || null }));
                firstEver = true;
            } catch { /* unique (userId, placeId) — a re-toggle, not a first visit */ }
            if (this.badges) await this.badges.awardIfEligible(userId, 'place.visited', { city: place?.city });
            // "Kont houni" — first rung of the contribution ladder. XP only on
            // the first-ever visit of this place: the immutable place_visits
            // row is the guard that makes toggle-farming impossible.
            if (firstEver) void this.gamification.addPoints(userId, 5, 'Visited a place').catch(() => {});
        }
        // Un-toggling removes the stamp from the passport (visitedPlaceIds) but
        // keeps the place_visits history row — it powers rarity/analytics and
        // is the XP-farming guard above.
        return visited;
    }

    /** Active travelers on the map — recent place visits with coordinates. */
    async activeTravelers(limit = 50) {
        const rows = await this.placeVisitsRepo.createQueryBuilder('v')
            .select([
                'v.userId as userId',
                'v.placeId as placeId',
                'v.city as city',
                'p.latitude as lat',
                'p.longitude as lng',
                'p.name as placeName',
                'u.fullName as fullName',
                'u.handle as handle',
                'u.avatar as avatar',
            ])
            .innerJoin('places', 'p', 'p.id::text = v.placeId')
            .innerJoin('users', 'u', 'u.id::text = v.userId')
            .where('u.isActive = :a', { a: true })
            .andWhere('p.latitude IS NOT NULL')
            .andWhere('p.longitude IS NOT NULL')
            .orderBy('v.createdAt', 'DESC')
            .limit(limit)
            .getRawMany();
        return rows.map((r: any) => ({
            userId: r.userId,
            fullName: r.fullName,
            handle: r.handle,
            avatar: r.avatar,
            placeId: r.placeId,
            placeName: r.placeName,
            city: r.city,
            lat: Number(r.lat),
            lng: Number(r.lng),
        }));
    }

    /** Distinct-visitor counts per city — honest "N explorers" rarity for passport stamps. */
    async cityVisitorCounts(cities: string[]): Promise<Record<string, number>> {
        const list = (cities || []).filter(Boolean);
        if (list.length === 0) return {};
        const rows = await this.placeVisitsRepo.createQueryBuilder('v')
            .select('v.city', 'city')
            .addSelect('COUNT(DISTINCT v.userId)', 'count')
            .where('v.city IN (:...cities)', { cities: list })
            .groupBy('v.city')
            .getRawMany();
        const map: Record<string, number> = {};
        for (const r of rows) map[r.city] = Number(r.count);
        return map;
    }

    async getVisitedIds(userId: string): Promise<string[]> {
        const user = await this.findById(userId);
        return user.visitedPlaceIds || [];
    }

    /** Cold-start suggestions: real users excluding the platform / inactive accounts. */
    async suggestedUsers(limit = 6) {
        const rows = await this.usersRepository
            .createQueryBuilder('u')
            .where('u.isActive = :active', { active: true })
            .andWhere('u.email NOT LIKE :platformPrefix', { platformPrefix: 'platform@%' })
            .andWhere('u.email NOT LIKE :adminPrefix', { adminPrefix: 'admin@%' })
            .orderBy('u.points', 'DESC')
            .addOrderBy('u.createdAt', 'DESC')
            .take(limit)
            .getMany();
        return rows.map((u: any) => ({
            id: u.id,
            handle: u.handle ?? null,
            fullName: u.fullName,
            avatar: u.avatar || null,
            country: u.country || null,
            bio: u.bio || null,
            level: u.level || 1,
            points: u.points || 0,
            role: u.role,
            plan: effectivePlan(u),
        }));
    }

    /** Public passport view. Excludes sensitive fields. Throws NotFound if handle missing. */
    async assemblePassport(handle: string): Promise<PassportDto> {
        const key = `passport:${handle}`;
        const cached = await this.cache.get<PassportDto>(key);
        if (cached) return cached;

        const user = await this.findByHandle(handle);
        if (!user) throw new NotFoundException('Passport not found');

        const visitedIds = Array.isArray(user.visitedPlaceIds) ? user.visitedPlaceIds : [];

        const [reviewsCount, tripsPlanned, savesCount, visitedCities] = await Promise.all([
            this.reviewsRepo.count({ where: { user: { id: user.id } } as any }).catch(() => 0),
            this.tripsRepo.count({ where: { userId: user.id } }).catch(() => 0),
            this.savesRepo.count({ where: { userId: user.id } as any }).catch(() => 0),
            visitedIds.length
                ? this.placesRepo
                    .createQueryBuilder('p')
                    .select('DISTINCT p.city', 'city')
                    .where('p.id IN (:...ids)', { ids: visitedIds })
                    .getRawMany()
                    .then((rows) => rows.map((r) => r.city).filter(Boolean))
                    .catch(() => [])
                : Promise.resolve([] as string[]),
        ]);

        // Honest stamp rarity: how many explorers have visited each of the owner's cities.
        const stampRarity = await this.cityVisitorCounts(visitedCities);

        const passport: PassportDto = {
            handle: user.handle as string,
            fullName: user.fullName,
            avatar: user.avatar || null,
            country: user.country || null,
            bio: user.bio || null,
            website: user.website || null,
            interests: Array.isArray(user.interests) ? user.interests : [],
            badges: Array.isArray(user.badges) ? user.badges : [],
            points: user.points || 0,
            passportLevel: deriveLevel(user.points || 0),
            role: user.role as any,
            joinedAt: user.createdAt.toISOString(),
            stats: {
                citiesVisited: visitedCities.length,
                tripsPlanned,
                reviewsCount,
                savesCount,
            },
            visitedCities,
            followersCount: user.followersCount || 0,
            followingCount: user.followingCount || 0,
            topEndorsements: await this.endorsements.topForUser(user.id, 3).catch(() => []),
            topCityRank: await this.topCityRankForUser(user.id).catch(() => null),
            plan: this.resolveEffectivePlan(user),
            passportTheme: (user as any).passportTheme || null,
            stampRarity,
            founderNumber: user.founderNumber ?? null,
        };

        await this.cache.set(key, passport, 300_000);
        return passport;
    }

    /**
     * Search users by handle prefix or fullName substring. Public-safe shape.
     * Returns up to `limit` matches sorted by points DESC then fullName ASC.
     */
    async searchUsers(query: string, limit = 12) {
        const q = (query || '').trim();
        if (q.length < 1) return [];
        const safe = q.replace(/[%_]/g, (m) => `\\${m}`);
        const handlePrefix = `${safe.toLowerCase()}%`;
        const nameNeedle = `%${safe}%`;
        const lim = Math.min(50, Math.max(1, limit));

        const rows = await this.usersRepository
            .createQueryBuilder('u')
            .where('LOWER(u.handle) LIKE :hp', { hp: handlePrefix })
            .orWhere('u.fullName ILIKE :nn', { nn: nameNeedle })
            .orderBy('u.points', 'DESC')
            .addOrderBy('u.fullName', 'ASC')
            .limit(lim)
            .getMany()
            .catch(async () => {
                // SQLite / MySQL fallback (no ILIKE): use LOWER + LIKE.
                return this.usersRepository
                    .createQueryBuilder('u')
                    .where('LOWER(u.handle) LIKE :hp', { hp: handlePrefix })
                    .orWhere('LOWER(u.fullName) LIKE :nn', { nn: nameNeedle.toLowerCase() })
                    .orderBy('u.points', 'DESC')
                    .addOrderBy('u.fullName', 'ASC')
                    .limit(lim)
                    .getMany();
            });

        return rows.map((u: any) => ({
            id: u.id,
            handle: u.handle ?? null,
            fullName: u.fullName,
            avatar: u.avatar || null,
            country: u.country || null,
            bio: u.bio ? u.bio.slice(0, 120) : null,
            points: u.points || 0,
            role: u.role,
            plan: effectivePlan(u),
            followersCount: u.followersCount || 0,
        }));
    }

    /**
     * Cities (with at least one review) for the leaderboard city picker.
     * Sorted by total review activity DESC. Public surface, used by the
     * frontend leaderboard page dropdown.
     */
    async listCitiesWithReviews(limit = 30): Promise<Array<{ city: string; reviews: number }>> {
        const rows = await this.reviewsRepo
            .createQueryBuilder('r')
            .innerJoin('r.place', 'p')
            .select('p.city', 'city')
            .addSelect('COUNT(*)', 'reviews')
            .where("p.city IS NOT NULL AND p.city <> ''")
            .groupBy('p.city')
            .orderBy('reviews', 'DESC')
            .limit(Math.min(100, Math.max(1, limit)))
            .getRawMany()
            .catch(() => [] as Array<{ city: string; reviews: string }>);
        return rows.map((r: any) => ({ city: r.city, reviews: Number(r.reviews) }));
    }

    /**
     * Top reviewers in a given city, with public-safe author fields.
     * Returns rank-ordered list ready to render on the leaderboard page.
     */
    async getCityReviewerLeaderboard(city: string, limit = 20) {
        const trimmed = (city || '').trim();
        if (!trimmed) return [];

        const rows = await this.reviewsRepo
            .createQueryBuilder('r')
            .innerJoin('r.place', 'p')
            .select('r.userId', 'userId')
            .addSelect('COUNT(*)', 'reviews')
            .where('p.city = :city', { city: trimmed })
            .groupBy('r.userId')
            .orderBy('reviews', 'DESC')
            .limit(Math.min(100, Math.max(1, limit)))
            .getRawMany()
            .catch(() => [] as Array<{ userId: string; reviews: string }>);
        if (!rows.length) return [];

        const userIds = rows.map((r: any) => r.userId);
        const users = await this.usersRepository.find({
            where: userIds.map((id) => ({ id })),
            select: ['id', 'handle', 'fullName', 'avatar', 'country', 'points', 'role', 'plan', 'subscriptionExpiresAt'] as any,
        });
        const byId = new Map(users.map((u: any) => [u.id, u]));

        return rows
            .map((r: any, i: number) => {
                const u: any = byId.get(r.userId);
                if (!u) return null;
                return {
                    rank: i + 1,
                    reviews: Number(r.reviews),
                    user: {
                        id: u.id,
                        handle: u.handle ?? null,
                        fullName: u.fullName,
                        avatar: u.avatar || null,
                        country: u.country || null,
                        points: u.points || 0,
                        role: u.role,
                        plan: effectivePlan(u),
                    },
                };
            })
            .filter(Boolean);
    }

    /**
     * Compute the city where this user has their best review-count rank.
     * Returns { city, rank, total } only when they're top-3 in that city.
     * Cheap enough on read because Phase-1 cache already wraps the passport.
     */
    async topCityRankForUser(userId: string): Promise<{ city: string; rank: number; total: number } | null> {
        const myCities = await this.reviewsRepo
            .createQueryBuilder('r')
            .innerJoin('r.place', 'p')
            .select('p.city', 'city')
            .addSelect('COUNT(*)', 'reviews')
            .where('r.userId = :uid', { uid: userId })
            .groupBy('p.city')
            .orderBy('reviews', 'DESC')
            .limit(5)
            .getRawMany()
            .catch(() => [] as Array<{ city: string; reviews: string }>);
        if (!myCities.length) return null;

        for (const row of myCities) {
            const city = row.city;
            if (!city) continue;
            // Get every reviewer's count for this city, sorted desc.
            const ranking = await this.reviewsRepo
                .createQueryBuilder('r')
                .innerJoin('r.place', 'p')
                .select('r.userId', 'userId')
                .addSelect('COUNT(*)', 'reviews')
                .where('p.city = :city', { city })
                .groupBy('r.userId')
                .orderBy('reviews', 'DESC')
                .limit(50)
                .getRawMany()
                .catch(() => [] as Array<{ userId: string; reviews: string }>);
            const idx = ranking.findIndex((r: any) => r.userId === userId);
            if (idx >= 0 && idx < 3) {
                return { city, rank: idx + 1, total: ranking.length };
            }
        }
        return null;
    }

    /** Self-attest Local Guide application. Promotes role: 'user' → 'creator' when the
     *  user has built enough trust signal (points + reviews + trip plans). Idempotent. */
    async applyLocalGuide(userId: string) {
        const user = await this.findById(userId);
        if (user.role === 'creator' || user.role === 'admin') {
            return { ok: true, role: user.role, alreadyGuide: true };
        }
        const points = user.points || 0;
        const reviewsCount = await this.reviewsRepo.count({ where: { user: { id: userId } } as any }).catch(() => 0);
        const tripsCount = await this.tripsRepo.count({ where: { userId } }).catch(() => 0);

        // Trust gate — at least one of:
        //   • 50+ points (broad activity)
        //   • 3+ reviews   (review signal)
        //   • 2+ trips    (planning signal)
        const passesGate = points >= 50 || reviewsCount >= 3 || tripsCount >= 2;
        if (!passesGate) {
            return {
                ok: false,
                role: user.role,
                reason: 'gate_not_met',
                progress: {
                    points, pointsRequired: 50,
                    reviewsCount, reviewsRequired: 3,
                    tripsCount, tripsRequired: 2,
                },
            };
        }

        user.role = 'creator' as any;
        // A small badge-like bump so the change is visible immediately.
        user.points = points + 25;
        await this.usersRepository.save(user);
        await this.invalidatePassportCache(userId);
        return { ok: true, role: 'creator' };
    }

    /** Seed a freshly-signed-up user's passport from an anonymous draft. Used post-signup. */
    async seedFromDraft(userId: string, draft: { visitedCities?: string[]; interests?: string[] }) {
        const user = await this.findById(userId);
        const existingInterests = Array.isArray(user.interests) ? user.interests : [];
        const newInterests = (draft.interests || []).map(s => (s || '').trim()).filter(Boolean);
        const interests = Array.from(new Set([...existingInterests, ...newInterests])).slice(0, 16);

        let visitedPlaceIds = Array.isArray(user.visitedPlaceIds) ? user.visitedPlaceIds : [];
        const cities = (draft.visitedCities || []).map(s => (s || '').trim()).filter(Boolean);
        if (cities.length) {
            const matched = await this.placesRepo
                .createQueryBuilder('p')
                .where('LOWER(p.city) IN (:...c)', { c: cities.map((c) => c.toLowerCase()) })
                .select(['p.id', 'p.city'])
                .getMany()
                .catch(() => [] as Array<{ id: string; city: string }>);
            const newIds = matched.map((p) => p.id).filter((id) => !visitedPlaceIds.includes(id));
            visitedPlaceIds = visitedPlaceIds.concat(newIds);
        }

        user.interests = interests;
        user.visitedPlaceIds = visitedPlaceIds;
        await this.usersRepository.save(user);
        await this.invalidatePassportCache(userId);

        // Each newly-marked city can earn first_steps / medina / desert / beach badges.
        if (this.badges) {
            for (const c of cities) {
                await this.badges.awardIfEligible(userId, 'place.visited', { city: c });
            }
        }
        return { ok: true, visitedPlaceIds: visitedPlaceIds.length, interests: interests.length };
    }

    /** Resolves the user's current effective plan. If subscriptionExpiresAt is
     *  past, premium/business silently revert to free without touching the row. */
    private resolveEffectivePlan(user: User): 'free' | 'premium' | 'business' {
        return effectivePlan(user as any);
    }

    /** Call this whenever a user's data changes. */
    async invalidatePassportCache(userId: string): Promise<void> {
        const user = await this.usersRepository.findOne({ where: { id: userId }, select: ['handle'] });
        if (user?.handle) await this.cache.del(`passport:${user.handle}`);
    }
}