import { AdsService } from './ads.service';
export declare class AdsController {
    private readonly adsService;
    constructor(adsService: AdsService);
    findActive(placement?: string): Promise<import("./ad.entity").Ad[]>;
    findAll(): Promise<import("./ad.entity").Ad[]>;
    getStats(): Promise<any>;
    findOne(id: string): Promise<import("./ad.entity").Ad>;
    create(body: Partial<any>): Promise<import("./ad.entity").Ad>;
    trackImpression(id: string): Promise<void>;
    trackClick(id: string): Promise<import("./ad.entity").Ad>;
    update(id: string, body: Partial<any>): Promise<import("./ad.entity").Ad>;
    remove(id: string): Promise<{
        message: string;
    }>;
}
