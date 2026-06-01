import { PackagesService } from './packages.service';
declare class CreatePackageDto {
    title: string;
    description: string;
    pricePerPerson: number;
    currency?: string;
    durationDays?: number;
    minPartySize?: number;
    maxPartySize?: number;
    includes?: string[];
    images?: string[];
    badge?: string;
}
declare class UpdatePackageDto {
    title?: string;
    description?: string;
    pricePerPerson?: number;
    currency?: string;
    durationDays?: number;
    minPartySize?: number;
    maxPartySize?: number;
    includes?: string[];
    images?: string[];
    badge?: string;
    isActive?: boolean;
}
export declare class PackagesController {
    private packages;
    constructor(packages: PackagesService);
    listForPlace(id: string): Promise<import("./tour-package.entity").TourPackage[]>;
    findOne(id: string): Promise<import("./tour-package.entity").TourPackage & {
        place?: any;
    }>;
    create(req: any, id: string, body: CreatePackageDto): Promise<import("./tour-package.entity").TourPackage>;
    update(req: any, id: string, body: UpdatePackageDto): Promise<import("./tour-package.entity").TourPackage>;
    remove(req: any, id: string): Promise<{
        deleted: boolean;
    }>;
}
export {};
