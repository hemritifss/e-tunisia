import { Repository } from 'typeorm';
import { Category } from './category.entity';
export declare class CategoriesService {
    private categoriesRepo;
    constructor(categoriesRepo: Repository<Category>);
    findAll(): Promise<Category[]>;
    findById(id: string): Promise<Category>;
    create(data: Partial<Category>): Promise<Category>;
    seed(): Promise<void>;
}
