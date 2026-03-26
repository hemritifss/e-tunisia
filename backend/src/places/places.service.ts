import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, MoreThanOrEqual } from 'typeorm';
import { Place } from './place.entity';
import { CreatePlaceDto } from './dto/create-place.dto';
import { QueryPlacesDto } from './dto/query-places.dto';
import slugify from 'slugify';

@Injectable()
export class PlacesService {
    constructor(
        @InjectRepository(Place)
        private placesRepo: Repository<Place>,
    ) { }

    async findAll(query: QueryPlacesDto) {
        const {
            search, categoryId, city, governorate,
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

    async getFeatured(): Promise<Place[]> {
        return this.placesRepo.find({
            where: { isFeatured: true, isActive: true },
            relations: ['category'],
            order: { rating: 'DESC' },
            take: 10,
        });
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
        return this.placesRepo
            .createQueryBuilder('place')
            .leftJoinAndSelect('place.category', 'category')
            .whereInIds(ids)
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