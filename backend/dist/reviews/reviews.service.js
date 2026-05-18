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
exports.ReviewsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const review_entity_1 = require("./review.entity");
const places_service_1 = require("../places/places.service");
let ReviewsService = class ReviewsService {
    constructor(reviewsRepo, placesService) {
        this.reviewsRepo = reviewsRepo;
        this.placesService = placesService;
    }
    async create(userId, placeId, data) {
        const review = this.reviewsRepo.create({
            ...data,
            userId,
            placeId,
        });
        const saved = await this.reviewsRepo.save(review);
        await this.placesService.updateRating(placeId);
        return saved;
    }
    async findByPlace(placeId) {
        if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(placeId)) {
            return [];
        }
        return this.reviewsRepo.find({
            where: { placeId },
            relations: ['user'],
            order: { createdAt: 'DESC' },
        });
    }
    async findFeed(opts = {}) {
        const page = Math.max(1, Number(opts.page) || 1);
        const limit = Math.min(50, Math.max(1, Number(opts.limit) || 10));
        const offset = (page - 1) * limit;
        const qb = this.reviewsRepo.createQueryBuilder('r')
            .leftJoinAndSelect('r.user', 'u')
            .leftJoinAndSelect('r.place', 'p');
        if (opts.sort === 'top') {
            qb.orderBy('r.rating', 'DESC').addOrderBy('r.createdAt', 'DESC');
        }
        else if (opts.sort === 'hot') {
            qb.orderBy('r.rating', 'DESC').addOrderBy('r.createdAt', 'DESC');
        }
        else {
            qb.orderBy('r.createdAt', 'DESC');
        }
        const [rows, total] = await qb.skip(offset).take(limit).getManyAndCount();
        const data = rows.map((r) => ({
            id: r.id,
            type: 'review',
            title: r.place ? `Visited ${r.place.name}` : 'Travel note',
            body: r.comment,
            rating: r.rating != null ? Number(r.rating) : null,
            category: r.place?.category?.name || null,
            location: r.place ? `${r.place.city}, ${r.place.governorate}` : null,
            images: r.images && r.images.length
                ? r.images
                : (r.place?.coverImage ? [r.place.coverImage] : []),
            place: r.place ? {
                id: r.place.id, name: r.place.name, slug: r.place.slug, city: r.place.city,
                coverImage: r.place.coverImage,
            } : null,
            authorId: r.userId,
            author: r.user ? {
                id: r.user.id,
                fullName: r.user.fullName,
                avatar: r.user.avatar || null,
            } : null,
            upvotes: 5 + Math.floor((Number(r.rating) || 4) * 12) + (r.id.charCodeAt(0) % 40),
            downvotes: r.id.charCodeAt(2) % 4,
            commentCount: r.id.charCodeAt(1) % 25,
            createdAt: r.createdAt,
        }));
        return {
            data,
            meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    }
    async findByUser(userId) {
        return this.reviewsRepo.find({
            where: { userId },
            relations: ['place'],
            order: { createdAt: 'DESC' },
        });
    }
};
exports.ReviewsService = ReviewsService;
exports.ReviewsService = ReviewsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(review_entity_1.Review)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        places_service_1.PlacesService])
], ReviewsService);
//# sourceMappingURL=reviews.service.js.map