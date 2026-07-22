import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Itinerary } from './itinerary.entity';

@Injectable()
export class ItinerariesService {
    constructor(
        @InjectRepository(Itinerary)
        private itinerariesRepo: Repository<Itinerary>,
    ) {}

    async findAll() {
        return this.itinerariesRepo.find({
            where: { isActive: true, isPublic: true },
            order: { createdAt: 'DESC' },
            relations: ['author'],
        });
    }

    async findById(id: string) {
        const itinerary = await this.itinerariesRepo.findOne({
            where: { id },
            relations: ['author'],
        });
        if (!itinerary) throw new NotFoundException('Itinerary not found');

        // Atomic increment (avoids the read-modify-write lost-update race).
        await this.itinerariesRepo.increment({ id: itinerary.id }, 'viewCount', 1);
        itinerary.viewCount += 1;

        return itinerary;
    }

    async create(authorId: string, data: Partial<Itinerary>) {
        const itinerary = this.itinerariesRepo.create({ ...data, authorId });
        return this.itinerariesRepo.save(itinerary);
    }

    async like(id: string) {
        const itinerary = await this.findById(id);
        await this.itinerariesRepo.increment({ id: itinerary.id }, 'likeCount', 1);
        itinerary.likeCount += 1;
        return itinerary;
    }
}
