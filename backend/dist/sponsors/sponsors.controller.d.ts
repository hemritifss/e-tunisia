import { SponsorsService } from './sponsors.service';
export declare class SponsorsController {
    private readonly sponsorsService;
    constructor(sponsorsService: SponsorsService);
    findActive(): Promise<import("./sponsor.entity").Sponsor[]>;
    findAll(): Promise<import("./sponsor.entity").Sponsor[]>;
    getStats(): Promise<{
        total: number;
        active: number;
        totalRevenue: any;
    }>;
    findOne(id: string): Promise<import("./sponsor.entity").Sponsor>;
    create(body: Partial<any>): Promise<import("./sponsor.entity").Sponsor>;
    trackClick(id: string): Promise<import("./sponsor.entity").Sponsor>;
    update(id: string, body: Partial<any>): Promise<import("./sponsor.entity").Sponsor>;
    remove(id: string): Promise<{
        message: string;
    }>;
}
