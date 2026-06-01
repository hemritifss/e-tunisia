import { OnModuleInit } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Place } from './place.entity';
import { TourPackage } from './tour-package.entity';
interface CreatePackageInput {
    title: string;
    description: string;
    durationDays?: number;
    pricePerPerson: number;
    currency?: string;
    minPartySize?: number;
    maxPartySize?: number;
    includes?: string[];
    images?: string[];
    badge?: string | null;
}
export declare class PackagesService implements OnModuleInit {
    private packages;
    private places;
    private static UUID_RE;
    private readonly log;
    constructor(packages: Repository<TourPackage>, places: Repository<Place>);
    onModuleInit(): Promise<void>;
    listForPlace(placeId: string): Promise<TourPackage[]>;
    findOne(id: string): Promise<TourPackage & {
        place?: any;
    }>;
    create(placeId: string, ownerUserId: string, input: CreatePackageInput): Promise<TourPackage>;
    update(id: string, ownerUserId: string, input: Partial<CreatePackageInput> & {
        isActive?: boolean;
    }): Promise<TourPackage>;
    remove(id: string, ownerUserId: string): Promise<{
        deleted: boolean;
    }>;
    private sanitize;
}
export {};
