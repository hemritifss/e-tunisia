import { Repository } from 'typeorm';
import { Collection } from './collection.entity';
export declare class CollectionsService {
    private collectionsRepo;
    constructor(collectionsRepo: Repository<Collection>);
    findAll(): Promise<Collection[]>;
    findById(id: string): Promise<Collection>;
    create(ownerId: string, data: Partial<Collection>): Promise<Collection>;
    addPlace(id: string, placeId: string): Promise<Collection>;
    removePlace(id: string, placeId: string): Promise<Collection>;
    like(id: string): Promise<Collection>;
}
