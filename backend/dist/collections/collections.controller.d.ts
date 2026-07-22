import { CollectionsService } from './collections.service';
import { CreateCollectionDto } from './dto/create-collection.dto';
export declare class CollectionsController {
    private collectionsService;
    constructor(collectionsService: CollectionsService);
    findAll(): Promise<import("./collection.entity").Collection[]>;
    findOne(id: string): Promise<import("./collection.entity").Collection>;
    create(req: any, body: CreateCollectionDto): Promise<import("./collection.entity").Collection>;
    addPlace(req: any, id: string, placeId: string): Promise<import("./collection.entity").Collection>;
    removePlace(req: any, id: string, placeId: string): Promise<import("./collection.entity").Collection>;
    like(id: string): Promise<import("./collection.entity").Collection>;
}
