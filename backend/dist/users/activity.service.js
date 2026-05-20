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
exports.ActivityService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("./user.entity");
const follow_entity_1 = require("./follow.entity");
const endorsement_entity_1 = require("./endorsement.entity");
const review_entity_1 = require("../reviews/review.entity");
const place_entity_1 = require("../places/place.entity");
const trip_plan_entity_1 = require("../itineraries/trip-plan.entity");
const users_service_1 = require("./users.service");
const PER_SOURCE = 50;
let ActivityService = class ActivityService {
    constructor(followsRepo, reviewsRepo, tripsRepo, endorsementsRepo, usersRepo, placesRepo, users) {
        this.followsRepo = followsRepo;
        this.reviewsRepo = reviewsRepo;
        this.tripsRepo = tripsRepo;
        this.endorsementsRepo = endorsementsRepo;
        this.usersRepo = usersRepo;
        this.placesRepo = placesRepo;
        this.users = users;
    }
    async followingFeed(viewerId, limit = 20) {
        const follows = await this.followsRepo.find({
            where: { followerId: viewerId },
            select: ['followedId'],
        });
        const followedIds = follows.map((f) => f.followedId);
        if (!followedIds.length)
            return [];
        const [reviews, trips, endorsements, follows2] = await Promise.all([
            this.reviewsRepo
                .find({
                where: followedIds.map((id) => ({ userId: id })),
                order: { createdAt: 'DESC' },
                take: PER_SOURCE,
                relations: ['place'],
            })
                .catch(() => []),
            this.tripsRepo
                .find({
                where: followedIds.map((id) => ({ userId: id, isPublic: true })),
                order: { createdAt: 'DESC' },
                take: PER_SOURCE,
            })
                .catch(() => []),
            this.endorsementsRepo
                .find({
                where: followedIds.map((id) => ({ endorserId: id })),
                order: { createdAt: 'DESC' },
                take: PER_SOURCE,
            })
                .catch(() => []),
            this.followsRepo
                .find({
                where: followedIds.map((id) => ({ followerId: id })),
                order: { createdAt: 'DESC' },
                take: PER_SOURCE,
            })
                .catch(() => []),
        ]);
        const actorIds = new Set();
        const targetUserIds = new Set();
        reviews.forEach((r) => actorIds.add(r.userId));
        trips.forEach((t) => t.userId && actorIds.add(t.userId));
        endorsements.forEach((e) => {
            actorIds.add(e.endorserId);
            targetUserIds.add(e.endorsedId);
        });
        follows2.forEach((f) => {
            actorIds.add(f.followerId);
            targetUserIds.add(f.followedId);
        });
        const allUserIds = Array.from(new Set([...actorIds, ...targetUserIds]));
        const userRows = allUserIds.length
            ? await this.usersRepo.find({
                where: allUserIds.map((id) => ({ id })),
                select: ['id', 'handle', 'fullName', 'avatar'],
            })
            : [];
        const userById = new Map(userRows.map((u) => [
            u.id,
            { id: u.id, handle: u.handle ?? null, fullName: u.fullName, avatar: u.avatar || null },
        ]));
        const actor = (id) => userById.get(id) || { id, handle: null, fullName: 'Someone', avatar: null };
        const entries = [];
        for (const r of reviews) {
            entries.push({
                type: 'review',
                createdAt: r.createdAt.toISOString(),
                actor: actor(r.userId),
                target: {
                    placeId: r.placeId,
                    placeName: r.place?.name || null,
                    placeCity: r.place?.city || null,
                    rating: r.rating,
                    snippet: (r.comment || '').slice(0, 140),
                },
            });
        }
        for (const t of trips) {
            if (!t.userId)
                continue;
            entries.push({
                type: 'trip',
                createdAt: t.createdAt.toISOString(),
                actor: actor(t.userId),
                target: {
                    slug: t.slug,
                    title: t.title,
                    days: t.days,
                    travelers: t.travelers,
                    stopCount: Array.isArray(t.stops) ? t.stops.length : 0,
                },
            });
        }
        for (const e of endorsements) {
            entries.push({
                type: 'endorse',
                createdAt: e.createdAt.toISOString(),
                actor: actor(e.endorserId),
                target: { user: actor(e.endorsedId), topic: e.topic },
            });
        }
        for (const f of follows2) {
            entries.push({
                type: 'follow',
                createdAt: f.createdAt.toISOString(),
                actor: actor(f.followerId),
                target: { user: actor(f.followedId) },
            });
        }
        entries.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
        return entries.slice(0, Math.min(100, Math.max(1, limit)));
    }
};
exports.ActivityService = ActivityService;
exports.ActivityService = ActivityService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(follow_entity_1.Follow)),
    __param(1, (0, typeorm_1.InjectRepository)(review_entity_1.Review)),
    __param(2, (0, typeorm_1.InjectRepository)(trip_plan_entity_1.TripPlan)),
    __param(3, (0, typeorm_1.InjectRepository)(endorsement_entity_1.Endorsement)),
    __param(4, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(5, (0, typeorm_1.InjectRepository)(place_entity_1.Place)),
    __param(6, (0, common_1.Inject)((0, common_1.forwardRef)(() => users_service_1.UsersService))),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        users_service_1.UsersService])
], ActivityService);
//# sourceMappingURL=activity.service.js.map