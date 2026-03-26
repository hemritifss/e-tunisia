import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './category.entity';

@Injectable()
export class CategoriesService {
    constructor(
        @InjectRepository(Category)
        private categoriesRepo: Repository<Category>,
    ) { }

    async findAll(): Promise<Category[]> {
        return this.categoriesRepo.find({
            order: { sortOrder: 'ASC' },
            relations: ['places'],
        });
    }

    async findById(id: string): Promise<Category> {
        const cat = await this.categoriesRepo.findOne({
            where: { id },
            relations: ['places'],
        });
        if (!cat) throw new NotFoundException('Category not found');
        return cat;
    }

    async create(data: Partial<Category>): Promise<Category> {
        const category = this.categoriesRepo.create(data);
        return this.categoriesRepo.save(category);
    }

    async seed(): Promise<void> {
        const count = await this.categoriesRepo.count();
        if (count > 0) return;

        const categories = [
            {
                name: 'Historical Sites',
                nameAr: 'المواقع التاريخية',
                nameFr: 'Sites Historiques',
                icon: 'castle',
                color: '#C84B31',
                sortOrder: 1,
                description: 'Discover ancient ruins, medinas and historical monuments',
            },
            {
                name: 'Gastronomy',
                nameAr: 'فن الطبخ',
                nameFr: 'Gastronomie',
                icon: 'restaurant',
                color: '#F4A261',
                sortOrder: 2,
                description: 'Taste authentic Tunisian cuisine and street food',
            },
            {
                name: 'Nature & Beaches',
                nameAr: 'الطبيعة والشواطئ',
                nameFr: 'Nature & Plages',
                icon: 'beach_access',
                color: '#1B6B93',
                sortOrder: 3,
                description: 'Explore stunning landscapes, deserts, and coastlines',
            },
            {
                name: 'Artisanat',
                nameAr: 'الحرف اليدوية',
                nameFr: 'Artisanat',
                icon: 'palette',
                color: '#A37A5C',
                sortOrder: 4,
                description: 'Traditional crafts, ceramics, carpets and pottery',
            },
            {
                name: 'Festivals',
                nameAr: 'المهرجانات',
                nameFr: 'Festivals',
                icon: 'celebration',
                color: '#E76F51',
                sortOrder: 5,
                description: 'Music, art and cultural festivals throughout Tunisia',
            },
            {
                name: 'Hotels & Riads',
                nameAr: 'الفنادق',
                nameFr: 'Hôtels & Riads',
                icon: 'hotel',
                color: '#2A9D8F',
                sortOrder: 6,
                description: 'Charming accommodations from luxury resorts to riads',
            },
        ];

        for (const cat of categories) {
            await this.categoriesRepo.save(this.categoriesRepo.create(cat));
        }
    }
}