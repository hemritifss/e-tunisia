import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
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

    /**
     * Only the collection's owner may change its contents. Without this check
     * any authenticated user could add/remove places in anyone's collection
     * (the controller passes ids only — `create` already scopes by owner).
     */
    private assertOwner(collection: Collection, userId: string) {
        if (collection.ownerId !== userId) {
            throw new ForbiddenException('You can only edit your own collections');
        }
    }

    async addPlace(id: string, placeId: string, userId: string) {
        const collection = await this.findById(id);
        this.assertOwner(collection, userId);
        if (!collection.placeIds) collection.placeIds = [];
        if (!collection.placeIds.includes(placeId)) {
            collection.placeIds.push(placeId);
        }
        return this.collectionsRepo.save(collection);
    }

    async removePlace(id: string, placeId: string, userId: string) {
        const collection = await this.findById(id);
        this.assertOwner(collection, userId);
        collection.placeIds = (collection.placeIds || []).filter(p => p !== placeId);
        return this.collectionsRepo.save(collection);
    }

    async like(id: string) {
        const collection = await this.findById(id);
        await this.collectionsRepo.increment({ id: collection.id }, 'likeCount', 1);
        collection.likeCount += 1;
        return collection;
    }
}
