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

        itinerary.viewCount += 1;
        await this.itinerariesRepo.save(itinerary);

        return itinerary;
    }

    async create(authorId: string, data: Partial<Itinerary>) {
        const itinerary = this.itinerariesRepo.create({ ...data, authorId });
        return this.itinerariesRepo.save(itinerary);
    }

    async like(id: string) {
        const itinerary = await this.findById(id);
        itinerary.likeCount += 1;
        return this.itinerariesRepo.save(itinerary);
    }
}
