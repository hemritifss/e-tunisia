import { Repository } from 'typeorm';
import { Place } from '../places/place.entity';
import { CIRCUIT_BY_SLUG, CircuitAnchor, CircuitTemplate } from './circuits.data';
export interface CircuitStop {
    placeId: string;
    slug: string;
    name: string;
    city: string;
    governorate: string;
    latitude: number;
    longitude: number;
    cover: string | null;
    rating: number;
    reviewCount: number;
    tags: string[];
    entryPrice: number | null;
    openingHours: string | null;
    kind: CircuitAnchor['kind'];
    why: string;
    priority: 1 | 2 | 3;
    minutes: number;
    slot: NonNullable<CircuitAnchor['slot']>;
    hopKm: number;
}
export interface CircuitSummary {
    slug: string;
    title: string;
    tagline: string;
    summary: string;
    theme: CircuitTemplate['theme'];
    region: CircuitTemplate['region'];
    difficulty: CircuitTemplate['difficulty'];
    defaultDays: number;
    dayRange: [number, number];
    bestMonths: number[];
    avoidMonths: CircuitTemplate['avoidMonths'];
    carFree: boolean;
    stayBandTnd: number;
    distanceKm: number;
    stopCount: number;
    cities: string[];
    stopIds: string[];
    covers: string[];
    entryCostTnd: number;
    onSiteMinutes: number;
}
export interface CircuitDetail extends CircuitSummary {
    knowHow: string[];
    packing: string[];
    stops: CircuitStop[];
}
export declare class CircuitsService {
    private placesRepo;
    constructor(placesRepo: Repository<Place>);
    private cache;
    list(): Promise<CircuitSummary[]>;
    findOne(slug: string): Promise<CircuitDetail>;
    allStopIds(): Promise<string[]>;
    private hydrateAll;
    private hydrateOne;
    private resolveAnchor;
}
export { CIRCUIT_BY_SLUG };
