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
        return this.reviewsRepo.find({
            where: { placeId },
            relations: ['user'],
            order: { createdAt: 'DESC' },
        });
    }

    async findByUser(userId: string): Promise<Review[]> {
        return this.reviewsRepo.find({
            where: { userId },
            relations: ['place'],
            order: { createdAt: 'DESC' },
        });
    }
}