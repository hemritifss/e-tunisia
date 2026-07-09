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
var ReviewsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const review_entity_1 = require("./review.entity");
const places_service_1 = require("../places/places.service");
const place_inquiry_entity_1 = require("../places/place-inquiry.entity");
const place_entity_1 = require("../places/place.entity");
const users_service_1 = require("../users/users.service");
const badges_service_1 = require("../badges/badges.service");
let ReviewsService = ReviewsService_1 = class ReviewsService {
    constructor(reviewsRepo, inquiriesRepo, placesRepo, placesService, usersService, badgesService) {
        this.reviewsRepo = reviewsRepo;
        this.inquiriesRepo = inquiriesRepo;
        this.placesRepo = placesRepo;
        this.placesService = placesService;
        this.usersService = usersService;
        this.badgesService = badgesService;
    }
    async listByHandle(handle) {
        const user = await this.usersService.findByHandle(handle);
        if (!user)
            return [];
        return this.reviewsRepo.find({
            where: { userId: user.id },
            order: { createdAt: 'DESC' },
            relations: ['place'],
            take: 50,
        });
    }
    async create(userId, placeId, data) {
        let verifiedInquiryId = null;
        if (data.inquiryId && ReviewsService_1.UUID_RE.test(data.inquiryId)) {
            const inq = await this.inquiriesRepo.findOne({ where: { id: data.inquiryId } });
            if (inq && inq.userId === userId && inq.placeId === placeId && inq.status === place_inquiry_entity_1.InquiryStatus.BOOKED) {
                verifiedInquiryId = inq.id;
            }
        }
        const review = this.reviewsRepo.create({
            rating: data.rating,
            comment: data.comment,
            images: data.images,
            userId,
            placeId,
            verifiedInquiryId,
        });
        const saved = await this.reviewsRepo.save(review);
        await this.placesService.updateRating(placeId);
        await this.badgesService.awardIfEligible(userId, 'review.created', {});
        return saved;
    }
    async hostReply(reviewId, hostUserId, body) {
        if (!ReviewsService_1.UUID_RE.test(reviewId))
            throw new common_1.NotFoundException('Review not found');
        const review = await this.reviewsRepo.findOne({ where: { id: reviewId } });
        if (!review)
            throw new common_1.NotFoundException('Review not found');
        const place = await this.placesRepo.findOne({ where: { id: review.placeId } });
        if (!place)
            throw new common_1.NotFoundException('Place not found');
        if (place.submittedBy !== hostUserId) {
            throw new common_1.ForbiddenException('Only the listing owner can reply');
        }
        const trimmed = String(body || '').trim().slice(0, 2000);
        if (trimmed.length < 2)
            throw new common_1.BadRequestException('Reply is too short');
        review.hostReply = trimmed;
        review.hostRepliedAt = new Date();
        return this.reviewsRepo.save(review);
    }
    async deleteHostReply(reviewId, hostUserId) {
        if (!ReviewsService_1.UUID_RE.test(reviewId))
            throw new common_1.NotFoundException('Review not found');
        const review = await this.reviewsRepo.findOne({ where: { id: reviewId } });
        if (!review)
            throw new common_1.NotFoundException('Review not found');
        const place = await this.placesRepo.findOne({ where: { id: review.placeId } });
        if (!place || place.submittedBy !== hostUserId) {
            throw new common_1.ForbiddenException('Only the listing owner can edit the reply');
        }
        review.hostReply = null;
        review.hostRepliedAt = null;
        return this.reviewsRepo.save(review);
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
            upvotes: 0,
            downvotes: 0,
            commentCount: 0,
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
ReviewsService.UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
exports.ReviewsService = ReviewsService = ReviewsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(review_entity_1.Review)),
    __param(1, (0, typeorm_1.InjectRepository)(place_inquiry_entity_1.PlaceInquiry)),
    __param(2, (0, typeorm_1.InjectRepository)(place_entity_1.Place)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        places_service_1.PlacesService,
        users_service_1.UsersService,
        badges_service_1.BadgesService])
], ReviewsService);
//# sourceMappingURL=reviews.service.js.map