import { OnModuleInit } from '@nestjs/common';
import { CategoriesService } from './categories.service';
export declare class CategoriesController implements OnModuleInit {
    private categoriesService;
    constructor(categoriesService: CategoriesService);
    onModuleInit(): Promise<void>;
    findAll(): Promise<import("./category.entity").Category[]>;
    findOne(id: string): Promise<import("./category.entity").Category>;
}
