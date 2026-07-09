import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './review.entity';
import { PlacesService } from '../places/places.service';
import { PlaceInquiry, InquiryStatus } from '../places/place-inquiry.entity';
import { Place } from '../places/place.entity';
import { UsersService } from '../users/users.service';
import { BadgesService } from '../badges/badges.service';

@Injectable()
export class ReviewsService {
    constructor(
        @InjectRepository(Review) private reviewsRepo: Repository<Review>,
        @InjectRepository(PlaceInquiry) private inquiriesRepo: Repository<PlaceInquiry>,
        @InjectRepository(Place) private placesRepo: Repository<Place>,
        private placesService: PlacesService,
        private usersService: UsersService,
        private badgesService: BadgesService,
    ) { }

    /** Public list of reviews authored by a given handle. Empty array on unknown handle. */
    async listByHandle(handle: string) {
        const user = await this.usersService.findByHandle(handle);
        if (!user) return [];
        return this.reviewsRepo.find({
            where: { userId: user.id },
            order: { createdAt: 'DESC' },
            relations: ['place'],
            take: 50,
        });
    }

    private static UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    async create(
        userId: string,
        placeId: string,
        data: { rating: number; comment: string; images?: string[]; inquiryId?: string | null },
    ): Promise<Review> {
        // If the user passed an inquiryId, verify it belongs to them, is for THIS place,
        // and was actually booked. Otherwise the review is "unverified" (still valid, just no badge).
        let verifiedInquiryId: string | null = null;
        if (data.inquiryId && ReviewsService.UUID_RE.test(data.inquiryId)) {
            const inq = await this.inquiriesRepo.findOne({ where: { id: data.inquiryId } });
            if (inq && inq.userId === userId && inq.placeId === placeId && inq.status === InquiryStatus.BOOKED) {
                verifiedInquiryId = inq.id;
            }
        }

        const review = this.reviewsRepo.create({
            rating: data.rating,
            comment: data.comment,
            images: data.images,
            userId,
            placeId,
            verifiedInquiryId,
        });
        const saved = await this.reviewsRepo.save(review);
        await this.placesService.updateRating(placeId);
        await this.badgesService.awardIfEligible(userId, 'review.created', {});
        return saved;
    }

    async hostReply(reviewId: string, hostUserId: string, body: string): Promise<Review> {
        if (!ReviewsService.UUID_RE.test(reviewId)) throw new NotFoundException('Review not found');
        const review = await this.reviewsRepo.findOne({ where: { id: reviewId } });
        if (!review) throw new NotFoundException('Review not found');
        const place = await this.placesRepo.findOne({ where: { id: review.placeId } });
        if (!place) throw new NotFoundException('Place not found');
        if (place.submittedBy !== hostUserId) {
            throw new ForbiddenException('Only the listing owner can reply');
        }
        const trimmed = String(body || '').trim().slice(0, 2000);
        if (trimmed.length < 2) throw new BadRequestException('Reply is too short');
        review.hostReply = trimmed;
        review.hostRepliedAt = new Date();
        return this.reviewsRepo.save(review);
    }

    async deleteHostReply(reviewId: string, hostUserId: string): Promise<Review> {
        if (!ReviewsService.UUID_RE.test(reviewId)) throw new NotFoundException('Review not found');
        const review = await this.reviewsRepo.findOne({ where: { id: reviewId } });
        if (!review) throw new NotFoundException('Review not found');
        const place = await this.placesRepo.findOne({ where: { id: review.placeId } });
        if (!place || place.submittedBy !== hostUserId) {
            throw new ForbiddenException('Only the listing owner can edit the reply');
        }
        review.hostReply = null;
        review.hostRepliedAt = null;
        return this.reviewsRepo.save(review);
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
            // Reviews are shaped as feed cards but have no reaction/comment system
            // of their own — the honest engagement signal is the star rating above.
            // Never fabricate counts (previously derived from id.charCodeAt()).
            upvotes: 0,
            downvotes: 0,
            commentCount: 0,
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