import { PlacesService } from './places.service';
import { CreatePlaceDto } from './dto/create-place.dto';
import { QueryPlacesDto } from './dto/query-places.dto';
export declare class PlacesController {
    private placesService;
    constructor(placesService: PlacesService);
    findAll(query: QueryPlacesDto): Promise<{
        data: import("./place.entity").Place[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    getFeatured(): Promise<import("./place.entity").Place[]>;
    getPopular(): Promise<import("./place.entity").Place[]>;
    getNearby(lat: number, lng: number, radius?: number): Promise<import("./place.entity").Place[]>;
    findBySlug(slug: string): Promise<import("./place.entity").Place>;
    findOne(id: string): Promise<import("./place.entity").Place>;
    create(dto: CreatePlaceDto): Promise<import("./place.entity").Place>;
    getByIds(body: {
        ids: string[];
    }): Promise<import("./place.entity").Place[]>;
}
