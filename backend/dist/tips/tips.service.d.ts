import { Repository } from 'typeorm';
import { Tip } from './tip.entity';
export declare class TipsService {
    private tipsRepo;
    constructor(tipsRepo: Repository<Tip>);
    findAll(category?: string): Promise<Tip[]>;
    findById(id: string): Promise<Tip>;
    create(authorId: string, data: Partial<Tip>): Promise<Tip>;
    like(id: string): Promise<Tip>;
    findAllAdmin(): Promise<Tip[]>;
    toggleApproval(id: string): Promise<Tip>;
}
