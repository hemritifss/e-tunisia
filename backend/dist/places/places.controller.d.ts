import { PlacesService } from './places.service';
import { CreatePlaceDto } from './dto/create-place.dto';
import { QueryPlacesDto } from './dto/query-places.dto';
declare class BoostListingDto {
    days: 1 | 7 | 30;
}
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
    suggest(q: string, limit?: string): Promise<Partial<import("./place.entity").Place>[]>;
    getNearby(lat: number, lng: number, radius?: number): Promise<import("./place.entity").Place[]>;
    listMine(req: any): Promise<import("./place.entity").Place[]>;
    boostTiers(): ({
        readonly days: 1;
        readonly credits: 50;
        readonly label: "1 day";
    } | {
        readonly days: 7;
        readonly credits: 280;
        readonly label: "7 days";
    } | {
        readonly days: 30;
        readonly credits: 1000;
        readonly label: "30 days";
    })[];
    boost(req: any, id: string, body: BoostListingDto): Promise<{
        placeId: string;
        isBoosted: boolean;
        boostExpiresAt: Date;
        balanceAfter: number;
        charged: number;
    }>;
    findBySlug(slug: string): Promise<import("./place.entity").Place>;
    findOne(id: string): Promise<import("./place.entity").Place>;
    create(req: any, dto: CreatePlaceDto): Promise<import("./place.entity").Place>;
    getByIds(body: {
        ids: string[];
    }): Promise<import("./place.entity").Place[]>;
}
export {};
