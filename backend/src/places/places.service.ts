import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, MoreThanOrEqual, LessThan } from 'typeorm';
import { Place } from './place.entity';
import { CreatePlaceDto } from './dto/create-place.dto';
import { QueryPlacesDto } from './dto/query-places.dto';
import slugify from 'slugify';
import { CreditsService } from '../credits/credits.service';

/** Pricing model for listing boosts — credits per duration. */
export const BOOST_TIERS = {
    1:  { days: 1,  credits: 50,   label: '1 day'   },
    7:  { days: 7,  credits: 280,  label: '7 days'  },
    30: { days: 30, credits: 1000, label: '30 days' },
} as const;
export type BoostTier = keyof typeof BOOST_TIERS;

@Injectable()
export class PlacesService {
    constructor(
        @InjectRepository(Place)
        private placesRepo: Repository<Place>,
        private credits: CreditsService,
    ) { }

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
            order = 'DESC', featured,
        } = query;

        const qb = this.placesRepo
            .createQueryBuilder('place')
            .leftJoinAndSelect('place.category', 'category')
            .where('place.isActive = :active', { active: true });

        if (search) {
            qb.andWhere(
                '(place.name ILIKE :search OR place.description ILIKE :search OR place.city ILIKE :search OR place.tags ILIKE :search)',
                { search: `%${search}%` },
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

        qb.orderBy(`place.${sortBy}`, order as 'ASC' | 'DESC');
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

    async findBySlug(slug: string): Promise<Place> {
        const place = await this.placesRepo.findOne({
            where: { slug, isActive: true },
            relations: ['category', 'reviews', 'reviews.user'],
        });
        if (!place) throw new NotFoundException('Place not found');

        // Increment view count
        place.viewCount += 1;
        await this.placesRepo.save(place);

        return place;
    }

    async findById(id: string): Promise<Place> {
        const place = await this.placesRepo.findOne({
            where: { id },
            relations: ['category', 'reviews', 'reviews.user'],
        });
        if (!place) throw new NotFoundException('Place not found');
        return place;
    }

    async create(dto: CreatePlaceDto): Promise<Place> {
        const slug = slugify(dto.name, { lower: true, strict: true });
        const place = this.placesRepo.create({ ...dto, slug });
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
            where: { isActive: true },
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