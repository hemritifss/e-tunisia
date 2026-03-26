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
exports.PlacesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const place_entity_1 = require("./place.entity");
const slugify_1 = require("slugify");
let PlacesService = class PlacesService {
    constructor(placesRepo) {
        this.placesRepo = placesRepo;
    }
    async findAll(query) {
        const { search, categoryId, city, governorate, minRating, page = 1, limit = 20, sortBy = 'createdAt', order = 'DESC', featured, } = query;
        const qb = this.placesRepo
            .createQueryBuilder('place')
            .leftJoinAndSelect('place.category', 'category')
            .where('place.isActive = :active', { active: true });
        if (search) {
            qb.andWhere('(place.name ILIKE :search OR place.description ILIKE :search OR place.city ILIKE :search OR place.tags ILIKE :search)', { search: `%${search}%` });
        }
        if (categoryId) {
            qb.andWhere('place.categoryId = :categoryId', { categoryId });
        }
        if (city) {
            qb.andWhere('place.city ILIKE :city', { city: `%${city}%` });
        }
        if (governorate) {
            qb.andWhere('place.governorate ILIKE :gov', { gov: `%${governorate}%` });
        }
        if (minRating) {
            qb.andWhere('place.rating >= :minRating', { minRating });
        }
        if (featured === 'true') {
            qb.andWhere('place.isFeatured = :featured', { featured: true });
        }
        qb.orderBy(`place.${sortBy}`, order);
        qb.skip((page - 1) * limit).take(limit);
        const [data, total] = await qb.getManyAndCount();
        return {
            data,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async findBySlug(slug) {
        const place = await this.placesRepo.findOne({
            where: { slug, isActive: true },
            relations: ['category', 'reviews', 'reviews.user'],
        });
        if (!place)
            throw new common_1.NotFoundException('Place not found');
        place.viewCount += 1;
        await this.placesRepo.save(place);
        return place;
    }
    async findById(id) {
        const place = await this.placesRepo.findOne({
            where: { id },
            relations: ['category', 'reviews', 'reviews.user'],
        });
        if (!place)
            throw new common_1.NotFoundException('Place not found');
        return place;
    }
    async create(dto) {
        const slug = (0, slugify_1.default)(dto.name, { lower: true, strict: true });
        const place = this.placesRepo.create({ ...dto, slug });
        return this.placesRepo.save(place);
    }
    async update(id, data) {
        await this.placesRepo.update(id, data);
        return this.findById(id);
    }
    async getFeatured() {
        return this.placesRepo.find({
            where: { isFeatured: true, isActive: true },
            relations: ['category'],
            order: { rating: 'DESC' },
            take: 10,
        });
    }
    async getPopular() {
        return this.placesRepo.find({
            where: { isActive: true },
            relations: ['category'],
            order: { viewCount: 'DESC' },
            take: 10,
        });
    }
    async getNearby(lat, lng, radiusKm = 50) {
        const places = await this.placesRepo
            .createQueryBuilder('place')
            .leftJoinAndSelect('place.category', 'category')
            .where('place.isActive = :active', { active: true })
            .addSelect(`(6371 * acos(cos(radians(:lat)) * cos(radians(place.latitude)) * cos(radians(place.longitude) - radians(:lng)) + sin(radians(:lat)) * sin(radians(place.latitude))))`, 'distance')
            .having('distance < :radius', { radius: radiusKm })
            .setParameters({ lat, lng })
            .orderBy('distance', 'ASC')
            .take(20)
            .getRawAndEntities();
        return places.entities;
    }
    async getByIds(ids) {
        if (!ids || ids.length === 0)
            return [];
        return this.placesRepo
            .createQueryBuilder('place')
            .leftJoinAndSelect('place.category', 'category')
            .whereInIds(ids)
            .getMany();
    }
    async updateRating(placeId) {
        const result = await this.placesRepo
            .createQueryBuilder('place')
            .leftJoin('place.reviews', 'review')
            .select('AVG(review.rating)', 'avg')
            .addSelect('COUNT(review.id)', 'count')
            .where('place.id = :id', { id: placeId })
            .getRawOne();
        await this.placesRepo.update(placeId, {
            rating: parseFloat(result.avg) || 0,
            reviewCount: parseInt(result.count) || 0,
        });
    }
    async seed() {
        const count = await this.placesRepo.count();
        if (count > 0)
            return;
    }
};
exports.PlacesService = PlacesService;
exports.PlacesService = PlacesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(place_entity_1.Place)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], PlacesService);
//# sourceMappingURL=places.service.js.map