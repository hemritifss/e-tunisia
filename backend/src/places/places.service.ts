import { Injectable, NotFoundException, ForbiddenException, BadRequestException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, MoreThanOrEqual, LessThan } from 'typeorm';
import { Place } from './place.entity';
import { User } from '../users/user.entity';
import { CreatePlaceDto } from './dto/create-place.dto';
import { QueryPlacesDto } from './dto/query-places.dto';
import slugify from 'slugify';
import { CreditsService } from '../credits/credits.service';
import { applyFuzzy, ensureFuzzySearch } from '../common/fuzzy-search';

/** Pricing model for listing boosts — credits per duration. */
export const BOOST_TIERS = {
    1:  { days: 1,  credits: 50,   label: '1 day'   },
    7:  { days: 7,  credits: 280,  label: '7 days'  },
    30: { days: 30, credits: 1000, label: '30 days' },
} as const;
export type BoostTier = keyof typeof BOOST_TIERS;

@Injectable()
export class PlacesService implements OnModuleInit {
    /** Connection is Postgres — enables ILIKE and the trigram search path. */
    private isPg = false;
    /** pg_trgm/unaccent installed — findAll() can do typo/accent-tolerant search. */
    private fuzzyReady = false;

    constructor(
        @InjectRepository(Place)
        private placesRepo: Repository<Place>,
        @InjectRepository(User)
        private usersRepo: Repository<User>,
        private credits: CreditsService,
    ) { }

    async onModuleInit() {
        this.isPg = this.placesRepo.manager.connection.options.type === 'postgres';
        this.fuzzyReady = await ensureFuzzySearch(this.placesRepo);
    }

    /**
     * "Discovered by @handle" — permanent credit for community-submitted gems
     * (the contribution ladder's status payoff). Attached to detail payloads.
     */
    private async attachDiscoveredBy<T extends Place>(place: T): Promise<T> {
        if (!place?.submittedBy) return place;
        const u = await this.usersRepo.findOne({
            where: { id: place.submittedBy },
            select: ['id', 'handle', 'fullName', 'avatar'] as any,
        }).catch(() => null);
        if (u) {
            (place as any).discoveredBy = {
                id: u.id, handle: u.handle, fullName: u.fullName, avatar: u.avatar || null,
            };
        }
        return place;
    }

    /**
     * Sweep places whose boost expired and flip the flag back.
     * Cheap to call before any read-side endpoint that surfaces "featured" places.
     */
    async sweepExpiredBoosts(): Promise<void> {
        const now = new Date();
        await this.placesRepo.createQueryBuilder()
            .update(Place)
            .set({ isBoosted: false })
            .where('isBoosted = :b', { b: true })
            .andWhere('boostExpiresAt IS NOT NULL AND boostExpiresAt < :now', { now })
            .execute();
    }

    /**
     * Charge credits and turn on boost for a place. Owner-only.
     * Stacking: if a place is already boosted, we EXTEND the existing window.
     */
    async boostListing(placeId: string, ownerUserId: string, days: number) {
        if (!(days in BOOST_TIERS)) throw new BadRequestException('Invalid boost duration');
        const tier = (BOOST_TIERS as any)[days];

        const place = await this.placesRepo.findOne({ where: { id: placeId } });
        if (!place) throw new NotFoundException('Place not found');
        if (place.submittedBy !== ownerUserId) {
            throw new ForbiddenException('Only the listing owner can boost it');
        }

        // Stack on top of any existing boost; otherwise start fresh from now.
        const start = (place.isBoosted && place.boostExpiresAt && new Date(place.boostExpiresAt) > new Date())
            ? new Date(place.boostExpiresAt)
            : new Date();
        const expiresAt = new Date(start.getTime() + tier.days * 24 * 60 * 60 * 1000);

        // Deduct credits first (throws if insufficient).
        const result = await this.credits.chargeBoost(
            ownerUserId, tier.credits,
            `Boost: ${place.name} (${tier.label})`,
            place.id,
        );

        place.isBoosted = true;
        place.boostExpiresAt = expiresAt;
        // Boosted places also surface on the Featured carousel
        place.isFeatured = true;
        await this.placesRepo.save(place);

        return {
            placeId: place.id,
            isBoosted: true,
            boostExpiresAt: expiresAt,
            balanceAfter: result.balance,
            charged: result.charged,
        };
    }

    async findAll(query: QueryPlacesDto) {
        const {
            search, categoryId, category, city, governorate,
            minRating, page = 1, limit = 20, sortBy = 'createdAt',
            order = 'DESC', featured, verified,
        } = query;

        const qb = this.placesRepo
            .createQueryBuilder('place')
            .leftJoinAndSelect('place.category', 'category')
            .where('place.isActive = :active', { active: true })
            // Community-submitted gems stay out of listings until confirmed/approved —
            // they remain reachable by direct link so friends can confirm them.
            .andWhere('place.isApproved = :approved', { approved: true });

        // Typo/accent-tolerant across the name (incl. AR/FR variants), city, tags and
        // description. `searchRank` orders the closest matches first when available.
        let searchRank: string | null = null;
        if (search) {
            searchRank = applyFuzzy(
                qb,
                this.isPg,
                this.fuzzyReady,
                {
                    like: ['place.name', 'place.nameFr', 'place.nameAr', 'place.city', 'place.tags', 'place.description'],
                    fuzzy: ['place.name', 'place.nameFr', 'place.nameAr', 'place.city'],
                },
                search,
            );
        }

        if (categoryId) {
            qb.andWhere('place.categoryId = :categoryId', { categoryId });
        } else if (category) {
            // Slug fallback: resolve "beaches", "food", "historical" etc. against the
            // category.name column (no separate slug column exists). Tolerant ILIKE
            // so "beach" matches "Beaches", "historical" matches "Historical Sites".
            qb.andWhere('category.name ILIKE :catSlug', { catSlug: `%${category}%` });
        }

        if (city) {
            qb.andWhere('place.city ILIKE :city', { city: `%${city}%` });
        }

        if (governorate) {
            qb.andWhere('place.governorate ILIKE :gov', { gov: `%${governorate}%` });
        }

        if (minRating) {
            qb.andWhere('place.rating >= :minRating', { minRating });
        }

        if (featured === 'true') {
            qb.andWhere('place.isFeatured = :featured', { featured: true });
        }

        // Verified Business filter: owner (submittedBy) is on an effective Business plan.
        if (verified === 'true') {
            qb.andWhere(
                `place.submittedBy IN (SELECT u.id FROM users u WHERE u.plan = 'business' AND (u."subscriptionExpiresAt" IS NULL OR u."subscriptionExpiresAt" > :nowVerified))`,
                { nowVerified: new Date() },
            );
        }

        // Best fuzzy match first when searching; then the requested sort.
        if (searchRank) {
            qb.orderBy(searchRank, 'DESC');
            qb.addOrderBy(`place.${sortBy}`, order as 'ASC' | 'DESC');
        } else {
            qb.orderBy(`place.${sortBy}`, order as 'ASC' | 'DESC');
        }
        qb.skip((page - 1) * limit).take(limit);

        const [data, total] = await qb.getManyAndCount();

        return {
            data,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Typeahead suggestions for the search box — a slim, fast counterpart to
     * findAll(): only the fields a dropdown row needs, capped low, and typo/accent
     * tolerant via the same trigram path so "Djar…" already surfaces "Djerba".
     */
    async suggest(q: string, limit = 8): Promise<Partial<Place>[]> {
        const term = (q || '').trim();
        if (term.length < 2) return [];

        const qb = this.placesRepo
            .createQueryBuilder('place')
            .select(['place.id', 'place.name', 'place.slug', 'place.city', 'place.governorate', 'place.coverImage'])
            .where('place.isActive = :active', { active: true })
            .andWhere('place.isApproved = :approved', { approved: true })
            .take(Math.min(Math.max(Number(limit) || 8, 1), 12));

        const rank = applyFuzzy(
            qb,
            this.isPg,
            this.fuzzyReady,
            {
                like: ['place.name', 'place.nameFr', 'place.nameAr', 'place.city'],
                fuzzy: ['place.name', 'place.nameFr', 'place.nameAr', 'place.city'],
            },
            term,
            's',
        );
        // Closest match first; popular places break ties (and order the substring fallback).
        if (rank) qb.orderBy(rank, 'DESC').addOrderBy('place.viewCount', 'DESC');
        else qb.orderBy('place.viewCount', 'DESC');

        return qb.getMany();
    }

    async findBySlug(slug: string): Promise<Place> {
        const place = await this.placesRepo.findOne({
            where: { slug, isActive: true },
            relations: ['category', 'reviews', 'reviews.user'],
        });
        if (!place) throw new NotFoundException('Place not found');

        // Atomic increment — `place.viewCount += 1; save(place)` is a
        // read-modify-write race (concurrent views lose counts) and re-persists
        // the whole row with possibly-stale sibling columns.
        await this.placesRepo.increment({ id: place.id }, 'viewCount', 1);
        place.viewCount += 1; // reflect it in the response without a re-read

        return this.attachDiscoveredBy(place);
    }

    async findById(id: string): Promise<Place> {
        const place = await this.placesRepo.findOne({
            where: { id },
            relations: ['category', 'reviews', 'reviews.user'],
        });
        if (!place) throw new NotFoundException('Place not found');
        return this.attachDiscoveredBy(place);
    }

    async create(dto: CreatePlaceDto, submittedBy?: string): Promise<Place> {
        const slug = slugify(dto.name, { lower: true, strict: true });
        // Attribute the creator — every place should have a human behind it.
        const place = this.placesRepo.create({ ...dto, slug, ...(submittedBy ? { submittedBy } : {}) });
        return this.placesRepo.save(place);
    }

    async update(id: string, data: Partial<Place>): Promise<Place> {
        await this.placesRepo.update(id, data);
        return this.findById(id);
    }

    /** Places owned/submitted by the given user — for the owner dashboard. */
    async listMine(userId: string): Promise<Place[]> {
        return this.placesRepo.find({
            where: { submittedBy: userId },
            relations: ['category'],
            order: { createdAt: 'DESC' },
        });
    }

    async getFeatured(): Promise<Place[]> {
        // Drop expired boosts before reading so the UI always reflects truth.
        await this.sweepExpiredBoosts();
        return this.placesRepo
            .createQueryBuilder('place')
            .leftJoinAndSelect('place.category', 'category')
            .where('place.isFeatured = :f AND place.isActive = :a', { f: true, a: true })
            .orderBy('place.isBoosted', 'DESC')         // boosted first
            .addOrderBy('place.rating', 'DESC')
            .take(12)
            .getMany();
    }

    async getPopular(): Promise<Place[]> {
        return this.placesRepo.find({
            where: { isActive: true, isApproved: true },
            relations: ['category'],
            order: { viewCount: 'DESC' },
            take: 10,
        });
    }

    async getNearby(lat: number, lng: number, radiusKm: number = 50): Promise<Place[]> {
        // Haversine approximation using raw query
        const places = await this.placesRepo
            .createQueryBuilder('place')
            .leftJoinAndSelect('place.category', 'category')
            .where('place.isActive = :active', { active: true })
            .andWhere('place.isApproved = :approved', { approved: true })
            .addSelect(
                `(6371 * acos(cos(radians(:lat)) * cos(radians(place.latitude)) * cos(radians(place.longitude) - radians(:lng)) + sin(radians(:lat)) * sin(radians(place.latitude))))`,
                'distance',
            )
            .having('distance < :radius', { radius: radiusKm })
            .setParameters({ lat, lng })
            .orderBy('distance', 'ASC')
            .take(20)
            .getRawAndEntities();

        return places.entities;
    }

    async getByIds(ids: string[]): Promise<Place[]> {
        if (!ids || ids.length === 0) return [];
        // Filter out anything that's not a valid UUID so a stale '1'/'2' from older
        // mock favorites doesn't crash the query.
        const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        const valid = ids.filter((id) => typeof id === 'string' && uuidRe.test(id));
        if (valid.length === 0) return [];
        return this.placesRepo
            .createQueryBuilder('place')
            .leftJoinAndSelect('place.category', 'category')
            .whereInIds(valid)
            .getMany();
    }

    async updateRating(placeId: string): Promise<void> {
        const result = await this.placesRepo
            .createQueryBuilder('place')
            .leftJoin('place.reviews', 'review')
            .select('AVG(review.rating)', 'avg')
            .addSelect('COUNT(review.id)', 'count')
            .where('place.id = :id', { id: placeId })
            .getRawOne();

        await this.placesRepo.update(placeId, {
            rating: parseFloat(result.avg) || 0,
            reviewCount: parseInt(result.count) || 0,
        });
    }

    async seed(): Promise<void> {
        const count = await this.placesRepo.count();
        if (count > 0) return;

        // Will be seeded by a separate seed script
    }
}