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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const cache_manager_1 = require("@nestjs/cache-manager");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("./user.entity");
const bcrypt = require("bcrypt");
const review_entity_1 = require("../reviews/review.entity");
const place_entity_1 = require("../places/place.entity");
const trip_plan_entity_1 = require("../itineraries/trip-plan.entity");
const saved_post_entity_1 = require("../posts/saved-post.entity");
const passport_dto_1 = require("./dto/passport.dto");
const badges_service_1 = require("../badges/badges.service");
const endorsements_service_1 = require("./endorsements.service");
let UsersService = class UsersService {
    constructor(usersRepository, reviewsRepo, placesRepo, tripsRepo, savesRepo, cache, badges, endorsements) {
        this.usersRepository = usersRepository;
        this.reviewsRepo = reviewsRepo;
        this.placesRepo = placesRepo;
        this.tripsRepo = tripsRepo;
        this.savesRepo = savesRepo;
        this.cache = cache;
        this.badges = badges;
        this.endorsements = endorsements;
    }
    async findByEmail(email) {
        return this.usersRepository.findOne({ where: { email } });
    }
    async findByHandle(handle) {
        if (!handle)
            return null;
        return this.usersRepository.findOne({ where: { handle: handle.toLowerCase() } });
    }
    async isHandleAvailable(handle) {
        const h = (handle || '').toLowerCase();
        const { isHandleFormatValid, isHandleReserved } = await Promise.resolve().then(() => require('./reserved-handles'));
        if (!isHandleFormatValid(h))
            return false;
        if (isHandleReserved(h))
            return false;
        const existing = await this.usersRepository.findOne({ where: { handle: h } });
        return !existing;
    }
    async findById(id) {
        const user = await this.usersRepository.findOne({
            where: { id },
            relations: ['reviews'],
        });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        return user;
    }
    async create(data) {
        const hashedPassword = await bcrypt.hash(data.password, 12);
        const user = this.usersRepository.create({
            ...data,
            password: hashedPassword,
            favoriteIds: [],
        });
        return this.usersRepository.save(user);
    }
    async update(id, data) {
        await this.usersRepository.update(id, data);
        await this.invalidatePassportCache(id);
        return this.findById(id);
    }
    async toggleFavorite(userId, placeId) {
        const user = await this.findById(userId);
        const favorites = user.favoriteIds || [];
        const index = favorites.indexOf(placeId);
        if (index > -1) {
            favorites.splice(index, 1);
        }
        else {
            favorites.push(placeId);
        }
        user.favoriteIds = favorites;
        await this.usersRepository.save(user);
        await this.invalidatePassportCache(userId);
        return favorites;
    }
    async getFavoriteIds(userId) {
        const user = await this.findById(userId);
        return user.favoriteIds || [];
    }
    async toggleVisited(userId, placeId) {
        const user = await this.findById(userId);
        const visited = user.visitedPlaceIds || [];
        const index = visited.indexOf(placeId);
        const wasAdded = index === -1;
        if (index > -1) {
            visited.splice(index, 1);
        }
        else {
            visited.push(placeId);
        }
        user.visitedPlaceIds = visited;
        await this.usersRepository.save(user);
        await this.invalidatePassportCache(userId);
        if (wasAdded && this.badges) {
            const place = await this.placesRepo.findOne({ where: { id: placeId }, select: ['city'] }).catch(() => null);
            await this.badges.awardIfEligible(userId, 'place.visited', { city: place?.city });
        }
        return visited;
    }
    async getVisitedIds(userId) {
        const user = await this.findById(userId);
        return user.visitedPlaceIds || [];
    }
    async suggestedUsers(limit = 6) {
        const rows = await this.usersRepository
            .createQueryBuilder('u')
            .where('u.isActive = :a', { a: true })
            .andWhere('u.email NOT LIKE :p', { p: 'platform@%' })
            .andWhere('u.email NOT LIKE :a', { a: 'admin@%' })
            .orderBy('u.points', 'DESC')
            .addOrderBy('u.createdAt', 'DESC')
            .take(limit)
            .getMany();
        return rows.map((u) => ({
            id: u.id,
            fullName: u.fullName,
            avatar: u.avatar || null,
            country: u.country || null,
            bio: u.bio || null,
            level: u.level || 1,
            points: u.points || 0,
        }));
    }
    async assemblePassport(handle) {
        const key = `passport:${handle}`;
        const cached = await this.cache.get(key);
        if (cached)
            return cached;
        const user = await this.findByHandle(handle);
        if (!user)
            throw new common_1.NotFoundException('Passport not found');
        const visitedIds = Array.isArray(user.visitedPlaceIds) ? user.visitedPlaceIds : [];
        const [reviewsCount, tripsPlanned, savesCount, visitedCities] = await Promise.all([
            this.reviewsRepo.count({ where: { user: { id: user.id } } }).catch(() => 0),
            this.tripsRepo.count({ where: { userId: user.id } }).catch(() => 0),
            this.savesRepo.count({ where: { userId: user.id } }).catch(() => 0),
            visitedIds.length
                ? this.placesRepo
                    .createQueryBuilder('p')
                    .select('DISTINCT p.city', 'city')
                    .where('p.id IN (:...ids)', { ids: visitedIds })
                    .getRawMany()
                    .then((rows) => rows.map((r) => r.city).filter(Boolean))
                    .catch(() => [])
                : Promise.resolve([]),
        ]);
        const passport = {
            handle: user.handle,
            fullName: user.fullName,
            avatar: user.avatar || null,
            country: user.country || null,
            bio: user.bio || null,
            website: user.website || null,
            interests: Array.isArray(user.interests) ? user.interests : [],
            badges: Array.isArray(user.badges) ? user.badges : [],
            points: user.points || 0,
            passportLevel: (0, passport_dto_1.deriveLevel)(user.points || 0),
            role: user.role,
            joinedAt: user.createdAt.toISOString(),
            stats: {
                citiesVisited: visitedCities.length,
                tripsPlanned,
                reviewsCount,
                savesCount,
            },
            visitedCities,
            followersCount: user.followersCount || 0,
            followingCount: user.followingCount || 0,
            topEndorsements: await this.endorsements.topForUser(user.id, 3).catch(() => []),
            topCityRank: await this.topCityRankForUser(user.id).catch(() => null),
        };
        await this.cache.set(key, passport, 300_000);
        return passport;
    }
    async listCitiesWithReviews(limit = 30) {
        const rows = await this.reviewsRepo
            .createQueryBuilder('r')
            .innerJoin('r.place', 'p')
            .select('p.city', 'city')
            .addSelect('COUNT(*)', 'reviews')
            .where("p.city IS NOT NULL AND p.city <> ''")
            .groupBy('p.city')
            .orderBy('reviews', 'DESC')
            .limit(Math.min(100, Math.max(1, limit)))
            .getRawMany()
            .catch(() => []);
        return rows.map((r) => ({ city: r.city, reviews: Number(r.reviews) }));
    }
    async getCityReviewerLeaderboard(city, limit = 20) {
        const trimmed = (city || '').trim();
        if (!trimmed)
            return [];
        const rows = await this.reviewsRepo
            .createQueryBuilder('r')
            .innerJoin('r.place', 'p')
            .select('r.userId', 'userId')
            .addSelect('COUNT(*)', 'reviews')
            .where('p.city = :city', { city: trimmed })
            .groupBy('r.userId')
            .orderBy('reviews', 'DESC')
            .limit(Math.min(100, Math.max(1, limit)))
            .getRawMany()
            .catch(() => []);
        if (!rows.length)
            return [];
        const userIds = rows.map((r) => r.userId);
        const users = await this.usersRepository.find({
            where: userIds.map((id) => ({ id })),
            select: ['id', 'handle', 'fullName', 'avatar', 'country', 'points', 'role'],
        });
        const byId = new Map(users.map((u) => [u.id, u]));
        return rows
            .map((r, i) => {
            const u = byId.get(r.userId);
            if (!u)
                return null;
            return {
                rank: i + 1,
                reviews: Number(r.reviews),
                user: {
                    id: u.id,
                    handle: u.handle ?? null,
                    fullName: u.fullName,
                    avatar: u.avatar || null,
                    country: u.country || null,
                    points: u.points || 0,
                    role: u.role,
                },
            };
        })
            .filter(Boolean);
    }
    async topCityRankForUser(userId) {
        const myCities = await this.reviewsRepo
            .createQueryBuilder('r')
            .innerJoin('r.place', 'p')
            .select('p.city', 'city')
            .addSelect('COUNT(*)', 'reviews')
            .where('r.userId = :uid', { uid: userId })
            .groupBy('p.city')
            .orderBy('reviews', 'DESC')
            .limit(5)
            .getRawMany()
            .catch(() => []);
        if (!myCities.length)
            return null;
        for (const row of myCities) {
            const city = row.city;
            if (!city)
                continue;
            const ranking = await this.reviewsRepo
                .createQueryBuilder('r')
                .innerJoin('r.place', 'p')
                .select('r.userId', 'userId')
                .addSelect('COUNT(*)', 'reviews')
                .where('p.city = :city', { city })
                .groupBy('r.userId')
                .orderBy('reviews', 'DESC')
                .limit(50)
                .getRawMany()
                .catch(() => []);
            const idx = ranking.findIndex((r) => r.userId === userId);
            if (idx >= 0 && idx < 3) {
                return { city, rank: idx + 1, total: ranking.length };
            }
        }
        return null;
    }
    async applyLocalGuide(userId) {
        const user = await this.findById(userId);
        if (user.role === 'creator' || user.role === 'admin') {
            return { ok: true, role: user.role, alreadyGuide: true };
        }
        const points = user.points || 0;
        const reviewsCount = await this.reviewsRepo.count({ where: { user: { id: userId } } }).catch(() => 0);
        const tripsCount = await this.tripsRepo.count({ where: { userId } }).catch(() => 0);
        const passesGate = points >= 50 || reviewsCount >= 3 || tripsCount >= 2;
        if (!passesGate) {
            return {
                ok: false,
                role: user.role,
                reason: 'gate_not_met',
                progress: {
                    points, pointsRequired: 50,
                    reviewsCount, reviewsRequired: 3,
                    tripsCount, tripsRequired: 2,
                },
            };
        }
        user.role = 'creator';
        user.points = points + 25;
        await this.usersRepository.save(user);
        await this.invalidatePassportCache(userId);
        return { ok: true, role: 'creator' };
    }
    async seedFromDraft(userId, draft) {
        const user = await this.findById(userId);
        const existingInterests = Array.isArray(user.interests) ? user.interests : [];
        const newInterests = (draft.interests || []).map(s => (s || '').trim()).filter(Boolean);
        const interests = Array.from(new Set([...existingInterests, ...newInterests])).slice(0, 16);
        let visitedPlaceIds = Array.isArray(user.visitedPlaceIds) ? user.visitedPlaceIds : [];
        const cities = (draft.visitedCities || []).map(s => (s || '').trim()).filter(Boolean);
        if (cities.length) {
            const matched = await this.placesRepo
                .createQueryBuilder('p')
                .where('LOWER(p.city) IN (:...c)', { c: cities.map((c) => c.toLowerCase()) })
                .select(['p.id', 'p.city'])
                .getMany()
                .catch(() => []);
            const newIds = matched.map((p) => p.id).filter((id) => !visitedPlaceIds.includes(id));
            visitedPlaceIds = visitedPlaceIds.concat(newIds);
        }
        user.interests = interests;
        user.visitedPlaceIds = visitedPlaceIds;
        await this.usersRepository.save(user);
        await this.invalidatePassportCache(userId);
        if (this.badges) {
            for (const c of cities) {
                await this.badges.awardIfEligible(userId, 'place.visited', { city: c });
            }
        }
        return { ok: true, visitedPlaceIds: visitedPlaceIds.length, interests: interests.length };
    }
    async invalidatePassportCache(userId) {
        const user = await this.usersRepository.findOne({ where: { id: userId }, select: ['handle'] });
        if (user?.handle)
            await this.cache.del(`passport:${user.handle}`);
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(review_entity_1.Review)),
    __param(2, (0, typeorm_1.InjectRepository)(place_entity_1.Place)),
    __param(3, (0, typeorm_1.InjectRepository)(trip_plan_entity_1.TripPlan)),
    __param(4, (0, typeorm_1.InjectRepository)(saved_post_entity_1.SavedPost)),
    __param(5, (0, common_1.Inject)(cache_manager_1.CACHE_MANAGER)),
    __param(7, (0, common_1.Inject)((0, common_1.forwardRef)(() => endorsements_service_1.EndorsementsService))),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository, Object, badges_service_1.BadgesService,
        endorsements_service_1.EndorsementsService])
], UsersService);
//# sourceMappingURL=users.service.js.map