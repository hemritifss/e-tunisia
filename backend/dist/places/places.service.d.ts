import { Repository } from 'typeorm';
import { Place } from './place.entity';
import { CreatePlaceDto } from './dto/create-place.dto';
import { QueryPlacesDto } from './dto/query-places.dto';
export declare class PlacesService {
    private placesRepo;
    constructor(placesRepo: Repository<Place>);
    findAll(query: QueryPlacesDto): Promise<{
        data: Place[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findBySlug(slug: string): Promise<Place>;
    findById(id: string): Promise<Place>;
    create(dto: CreatePlaceDto): Promise<Place>;
    update(id: string, data: Partial<Place>): Promise<Place>;
    getFeatured(): Promise<Place[]>;
    getPopular(): Promise<Place[]>;
    getNearby(lat: number, lng: number, radiusKm?: number): Promise<Place[]>;
    getByIds(ids: string[]): Promise<Place[]>;
    updateRating(placeId: string): Promise<void>;
    seed(): Promise<void>;
}
