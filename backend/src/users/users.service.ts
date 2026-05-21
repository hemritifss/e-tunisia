import { Inject, Injectable, NotFoundException, forwardRef } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import * as bcrypt from 'bcrypt';
import { Review } from '../reviews/review.entity';
import { Place } from '../places/place.entity';
import { TripPlan } from '../itineraries/trip-plan.entity';
import { SavedPost } from '../posts/saved-post.entity';
import { PassportDto, deriveLevel } from './dto/passport.dto';
import { BadgesService } from '../badges/badges.service';
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
        @Inject(CACHE_MANAGER) private cache: Cache,
        private badges: BadgesService,
        @Inject(forwardRef(() => EndorsementsService)) private endorsements: EndorsementsService,
    ) { }

    async findByEmail(email: string): Promise<User | null> {
        return this.usersRepository.findOne({ where: { email } });
    }

    async findByHandle(handle: string): Promise<User | null> {
        if (!handle) return null;
        return this.usersRepository.findOne({ where: { handle: handle.toLowerCase() } });
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

        if (wasAdded && this.badges) {
            const place = await this.placesRepo.findOne({ where: { id: placeId }, select: ['city'] }).catch(() => null);
            await this.badges.awardIfEligible(userId, 'place.visited', { city: place?.city });
        }
        return visited;
    }

    async getVisitedIds(userId: string): Promise<string[]> {
        const user = await this.findById(userId);
        return user.visitedPlaceIds || [];
    }

    /** Cold-start suggestions: real users excluding the platform / inactive accounts. */
    async suggestedUsers(limit = 6) {
        const rows = await this.usersRepository
            .createQueryBuilder('u')
            .where('u.isActive = :a', { a: true })
            .andWhere('u.email NOT LIKE :p', { p: 'platform@%' })
            .andWhere('u.email NOT LIKE :a', { a: 'admin@%' })
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