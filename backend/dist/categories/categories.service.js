"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoriesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const category_entity_1 = require("./category.entity");
let CategoriesService = class CategoriesService {
    constructor(categoriesRepo) {
        this.categoriesRepo = categoriesRepo;
    }
    async findAll() {
        return this.categoriesRepo.find({
            order: { sortOrder: 'ASC' },
            relations: ['places'],
        });
    }
    async findById(id) {
        const cat = await this.categoriesRepo.findOne({
            where: { id },
            relations: ['places'],
        });
        if (!cat)
            throw new common_1.NotFoundException('Category not found');
        return cat;
    }
    async create(data) {
        const category = this.categoriesRepo.create(data);
        return this.categoriesRepo.save(category);
    }
    async seed() {
        const count = await this.categoriesRepo.count();
        if (count > 0)
            return;
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
};
exports.CategoriesService = CategoriesService;
exports.CategoriesService = CategoriesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(category_entity_1.Category)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], CategoriesService);
//# sourceMappingURL=categories.service.js.map