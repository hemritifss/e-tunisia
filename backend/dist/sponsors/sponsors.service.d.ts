import { Repository } from 'typeorm';
import { Sponsor } from './sponsor.entity';
export declare class SponsorsService {
    private sponsorsRepo;
    constructor(sponsorsRepo: Repository<Sponsor>);
    findAll(): Promise<Sponsor[]>;
    findActive(): Promise<Sponsor[]>;
    findOne(id: string): Promise<Sponsor>;
    create(data: Partial<Sponsor>): Promise<Sponsor>;
    update(id: string, data: Partial<Sponsor>): Promise<Sponsor>;
    remove(id: string): Promise<{
        message: string;
    }>;
    trackClick(id: string): Promise<Sponsor>;
    trackImpression(id: string): Promise<void>;
    getStats(): Promise<{
        total: number;
        active: number;
        totalRevenue: any;
    }>;
    seed(): Promise<void>;
}
