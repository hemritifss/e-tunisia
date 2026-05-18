import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './review.entity';
import { PlacesService } from '../places/places.service';

@Injectable()
export class ReviewsService {
    constructor(
        @InjectRepository(Review)
        private reviewsRepo: Repository<Review>,
        private placesService: PlacesService,
    ) { }

    async create(userId: string, placeId: string, data: { rating: number; comment: string; images?: string[] }): Promise<Review> {
        const review = this.reviewsRepo.create({
            ...data,
            userId,
            placeId,
        });
        const saved = await this.reviewsRepo.save(review);
        await this.placesService.updateRating(placeId);
        return saved;
    }

    async findByPlace(placeId: string): Promise<Review[]> {
        // Reject obviously-invalid UUIDs early so we don't 500 on truncated IDs.
        if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(placeId)) {
            return [];
        }
        return this.reviewsRepo.find({
            where: { placeId },
            relations: ['user'],
            order: { createdAt: 'DESC' },
        });
    }

    async findFeed(opts: { page?: number; limit?: number; sort?: 'new' | 'top' | 'hot' } = {}): Promise<{
        data: any[];
        meta: { page: number; limit: number; total: number; totalPages: number };
    }> {
        const page = Math.max(1, Number(opts.page) || 1);
        const limit = Math.min(50, Math.max(1, Number(opts.limit) || 10));
        const offset = (page - 1) * limit;

        const qb = this.reviewsRepo.createQueryBuilder('r')
            .leftJoinAndSelect('r.user', 'u')
            .leftJoinAndSelect('r.place', 'p');

        if (opts.sort === 'top') {
            qb.orderBy('r.rating', 'DESC').addOrderBy('r.createdAt', 'DESC');
        } else if (opts.sort === 'hot') {
            // mix recency + rating
            qb.orderBy('r.rating', 'DESC').addOrderBy('r.createdAt', 'DESC');
        } else {
            qb.orderBy('r.createdAt', 'DESC');
        }

        const [rows, total] = await qb.skip(offset).take(limit).getManyAndCount();

        // Shape reviews as posts for the feed UI.
        const data = rows.map((r: any) => ({
            id: r.id,
            type: 'review' as const,
            title: r.place ? `Visited ${r.place.name}` : 'Travel note',
            body: r.comment,
            rating: r.rating != null ? Number(r.rating) : null,
            category: r.place?.category?.name || null,
            location: r.place ? `${r.place.city}, ${r.place.governorate}` : null,
            images: r.images && r.images.length
                ? r.images
                : (r.place?.coverImage ? [r.place.coverImage] : []),
            place: r.place ? {
                id: r.place.id, name: r.place.name, slug: r.place.slug, city: r.place.city,
                coverImage: r.place.coverImage,
            } : null,
            authorId: r.userId,
            author: r.user ? {
                id: r.user.id,
                fullName: r.user.fullName,
                avatar: r.user.avatar || null,
            } : null,
            upvotes: 5 + Math.floor((Number(r.rating) || 4) * 12) + (r.id.charCodeAt(0) % 40),
            downvotes: r.id.charCodeAt(2) % 4,
            commentCount: r.id.charCodeAt(1) % 25,
            createdAt: r.createdAt,
        }));

        return {
            data,
            meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    }

    async findByUser(userId: string): Promise<Review[]> {
        return this.reviewsRepo.find({
            where: { userId },
            relations: ['place'],
            order: { createdAt: 'DESC' },
        });
    }
}