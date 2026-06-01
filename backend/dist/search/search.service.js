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
exports.SearchService = void 0;
const common_1 = require("@nestjs/common");
const MeiliSearch = require('meilisearch').MeiliSearch;
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const place_entity_1 = require("../places/place.entity");
const post_entity_1 = require("../posts/post.entity");
const user_entity_1 = require("../users/user.entity");
let SearchService = class SearchService {
    constructor(placesRepo, postsRepo, usersRepo) {
        this.placesRepo = placesRepo;
        this.postsRepo = postsRepo;
        this.usersRepo = usersRepo;
        this.isReady = false;
        const host = process.env.MEILISEARCH_HOST;
        const apiKey = process.env.MEILISEARCH_API_KEY || '';
        if (host && typeof MeiliSearch === 'function') {
            try {
                this.client = new MeiliSearch({ host, apiKey });
            }
            catch {
                this.client = undefined;
            }
        }
    }
    async onModuleInit() {
        if (!this.client)
            return;
        try {
            await this.client.health();
            this.isReady = true;
            await this.ensureIndexes();
        }
        catch {
            this.isReady = false;
        }
    }
    async ensureIndexes() {
        const indexes = ['places', 'posts', 'users'];
        for (const uid of indexes) {
            try {
                await this.client.getIndex(uid);
            }
            catch {
                await this.client.createIndex(uid, { primaryKey: 'id' });
            }
        }
        await this.client.index('places').updateSearchableAttributes(['name', 'description', 'city', 'category']);
        await this.client.index('posts').updateSearchableAttributes(['title', 'body', 'category', 'location']);
        await this.client.index('users').updateSearchableAttributes(['fullName', 'handle', 'bio']);
    }
    async indexPlace(place) {
        if (!this.isReady)
            return;
        await this.client.index('places').addDocuments([{
                id: place.id,
                name: place.name,
                description: place.description,
                city: place.city,
                category: place.category,
                slug: place.slug,
                image: place.images?.[0],
                rating: place.rating,
            }]);
    }
    async indexPost(post) {
        if (!this.isReady)
            return;
        await this.client.index('posts').addDocuments([{
                id: post.id,
                title: post.title,
                body: post.body,
                category: post.category,
                location: post.location,
                authorId: post.authorId,
                createdAt: post.createdAt,
            }]);
    }
    async indexUser(user) {
        if (!this.isReady)
            return;
        await this.client.index('users').addDocuments([{
                id: user.id,
                fullName: user.fullName,
                handle: user.handle,
                bio: user.bio,
                avatar: user.avatar,
            }]);
    }
    async search(query, options) {
        if (!this.isReady) {
            return this.databaseFallbackSearch(query, options);
        }
        const limit = options?.limit || 20;
        const offset = options?.offset || 0;
        const [places, posts, users] = await Promise.all([
            this.client.index('places').search(query, { limit, offset }),
            this.client.index('posts').search(query, { limit, offset }),
            this.client.index('users').search(query, { limit, offset }),
        ]);
        return {
            places: places.hits,
            posts: posts.hits,
            users: users.hits,
            total: places.estimatedTotalHits + posts.estimatedTotalHits + users.estimatedTotalHits,
        };
    }
    async databaseFallbackSearch(query, options) {
        const limit = options?.limit || 20;
        const q = (0, typeorm_2.ILike)(`%${query}%`);
        const [places, posts, users] = await Promise.all([
            this.placesRepo.find({ where: [
                    { name: q }, { city: q }, { description: q },
                ], take: limit }),
            this.postsRepo.find({ where: [
                    { title: q }, { body: q },
                ], take: limit }),
            this.usersRepo.find({
                where: [{ fullName: q }, { handle: q }],
                select: ['id', 'fullName', 'handle', 'avatar', 'bio', 'country', 'plan', 'role', 'followersCount'],
                take: limit,
            }),
        ]);
        return { places, posts, users, total: places.length + posts.length + users.length };
    }
    async reindexAll() {
        if (!this.isReady)
            return { message: 'Meilisearch not available' };
        const [places, posts, users] = await Promise.all([
            this.placesRepo.find(),
            this.postsRepo.find(),
            this.usersRepo.find(),
        ]);
        await Promise.all([
            this.client.index('places').addDocuments(places.map((p) => ({
                id: p.id, name: p.name, description: p.description,
                city: p.city, category: p.category, slug: p.slug,
                image: p.images?.[0], rating: p.rating,
            }))),
            this.client.index('posts').addDocuments(posts.map((p) => ({
                id: p.id, title: p.title, body: p.body,
                category: p.category, location: p.location,
                authorId: p.authorId, createdAt: p.createdAt,
            }))),
            this.client.index('users').addDocuments(users.map((u) => ({
                id: u.id, fullName: u.fullName, handle: u.handle,
                bio: u.bio, avatar: u.avatar,
            }))),
        ]);
        return { message: 'Reindexed', places: places.length, posts: posts.length, users: users.length };
    }
};
exports.SearchService = SearchService;
exports.SearchService = SearchService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(place_entity_1.Place)),
    __param(1, (0, typeorm_1.InjectRepository)(post_entity_1.Post)),
    __param(2, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], SearchService);
//# sourceMappingURL=search.service.js.map