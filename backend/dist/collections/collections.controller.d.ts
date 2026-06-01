import { CollectionsService } from './collections.service';
export declare class CollectionsController {
    private collectionsService;
    constructor(collectionsService: CollectionsService);
    findAll(): Promise<import("./collection.entity").Collection[]>;
    findOne(id: string): Promise<import("./collection.entity").Collection>;
    create(req: any, body: any): Promise<import("./collection.entity").Collection>;
    addPlace(id: string, placeId: string): Promise<import("./collection.entity").Collection>;
    removePlace(id: string, placeId: string): Promise<import("./collection.entity").Collection>;
    like(id: string): Promise<import("./collection.entity").Collection>;
}
