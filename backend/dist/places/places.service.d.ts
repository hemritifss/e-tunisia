import { OnModuleInit } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Place } from './place.entity';
import { User } from '../users/user.entity';
import { CreatePlaceDto } from './dto/create-place.dto';
import { QueryPlacesDto } from './dto/query-places.dto';
import { CreditsService } from '../credits/credits.service';
export declare const BOOST_TIERS: {
    readonly 1: {
        readonly days: 1;
        readonly credits: 50;
        readonly label: "1 day";
    };
    readonly 7: {
        readonly days: 7;
        readonly credits: 280;
        readonly label: "7 days";
    };
    readonly 30: {
        readonly days: 30;
        readonly credits: 1000;
        readonly label: "30 days";
    };
};
export type BoostTier = keyof typeof BOOST_TIERS;
export declare class PlacesService implements OnModuleInit {
    private placesRepo;
    private usersRepo;
    private credits;
    private isPg;
    private fuzzyReady;
    constructor(placesRepo: Repository<Place>, usersRepo: Repository<User>, credits: CreditsService);
    onModuleInit(): Promise<void>;
    private attachDiscoveredBy;
    sweepExpiredBoosts(): Promise<void>;
    boostListing(placeId: string, ownerUserId: string, days: number): Promise<{
        placeId: string;
        isBoosted: boolean;
        boostExpiresAt: Date;
        balanceAfter: number;
        charged: number;
    }>;
    findAll(query: QueryPlacesDto): Promise<{
        data: Place[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    suggest(q: string, limit?: number): Promise<Partial<Place>[]>;
    findBySlug(slug: string): Promise<Place>;
    findById(id: string): Promise<Place>;
    create(dto: CreatePlaceDto, submittedBy?: string): Promise<Place>;
    update(id: string, data: Partial<Place>): Promise<Place>;
    listMine(userId: string): Promise<Place[]>;
    getFeatured(): Promise<Place[]>;
    getPopular(): Promise<Place[]>;
    getNearby(lat: number, lng: number, radiusKm?: number): Promise<Place[]>;
    getByIds(ids: string[]): Promise<Place[]>;
    updateRating(placeId: string): Promise<void>;
    seed(): Promise<void>;
}
