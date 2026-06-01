import { Repository } from 'typeorm';
import { Ad } from './ad.entity';
export declare class AdsService {
    private adsRepo;
    constructor(adsRepo: Repository<Ad>);
    findActive(placement?: string): Promise<Ad[]>;
    findAll(): Promise<Ad[]>;
    findOne(id: string): Promise<Ad>;
    create(data: Partial<Ad>): Promise<Ad>;
    update(id: string, data: Partial<Ad>): Promise<Ad>;
    remove(id: string): Promise<{
        message: string;
    }>;
    trackImpression(id: string): Promise<void>;
    trackClick(id: string): Promise<Ad>;
    getStats(): Promise<any>;
    seed(): Promise<void>;
}
