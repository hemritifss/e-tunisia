import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Collection } from './collection.entity';

@Injectable()
export class CollectionsService {
    constructor(
        @InjectRepository(Collection)
        private collectionsRepo: Repository<Collection>,
    ) {}

    async findAll() {
        return this.collectionsRepo.find({
            where: { isActive: true, isPublic: true },
            order: { createdAt: 'DESC' },
            relations: ['owner'],
        });
    }

    async findById(id: string) {
        const collection = await this.collectionsRepo.findOne({
            where: { id },
            relations: ['owner'],
        });
        if (!collection) throw new NotFoundException('Collection not found');
        return collection;
    }

    async create(ownerId: string, data: Partial<Collection>) {
        const collection = this.collectionsRepo.create({ ...data, ownerId });
        return this.collectionsRepo.save(collection);
    }

    async addPlace(id: string, placeId: string) {
        const collection = await this.findById(id);
        if (!collection.placeIds) collection.placeIds = [];
        if (!collection.placeIds.includes(placeId)) {
            collection.placeIds.push(placeId);
        }
        return this.collectionsRepo.save(collection);
    }

    async removePlace(id: string, placeId: string) {
        const collection = await this.findById(id);
        collection.placeIds = (collection.placeIds || []).filter(p => p !== placeId);
        return this.collectionsRepo.save(collection);
    }

    async like(id: string) {
        const collection = await this.findById(id);
        collection.likeCount += 1;
        return this.collectionsRepo.save(collection);
    }
}
