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
exports.StoriesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const story_entity_1 = require("./story.entity");
let StoriesService = class StoriesService {
    constructor(repo) {
        this.repo = repo;
    }
    async create(authorId, data) {
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        const story = this.repo.create({ ...data, authorId, expiresAt, isActive: true });
        return this.repo.save(story);
    }
    async listActiveGrouped() {
        const stories = await this.repo.find({
            where: { isActive: true, expiresAt: (0, typeorm_2.MoreThan)(new Date()) },
            relations: ['author'],
            order: { createdAt: 'DESC' },
        });
        const byAuthor = new Map();
        for (const s of stories) {
            const aid = s.authorId;
            if (!byAuthor.has(aid)) {
                byAuthor.set(aid, {
                    authorId: aid,
                    author: s.author ? {
                        id: s.author.id,
                        fullName: s.author.fullName,
                        avatar: s.author.avatar || null,
                    } : null,
                    latestAt: s.createdAt,
                    items: [],
                });
            }
            byAuthor.get(aid).items.push({
                id: s.id,
                imageUrl: s.imageUrl,
                caption: s.caption,
                createdAt: s.createdAt,
                expiresAt: s.expiresAt,
                isHighlight: s.isHighlight,
            });
        }
        return Array.from(byAuthor.values())
            .sort((a, b) => new Date(b.latestAt).getTime() - new Date(a.latestAt).getTime());
    }
    async recordView(id) {
        await this.repo.increment({ id }, 'viewCount', 1);
        return { ok: true };
    }
    async remove(id, requesterId) {
        const s = await this.repo.findOne({ where: { id } });
        if (!s)
            return { deleted: false };
        if (s.authorId !== requesterId)
            return { deleted: false };
        s.isActive = false;
        await this.repo.save(s);
        return { deleted: true };
    }
    async toggleHighlight(id, requesterId) {
        const s = await this.repo.findOne({ where: { id } });
        if (!s || s.authorId !== requesterId)
            return { ok: false, isHighlight: false };
        s.isHighlight = !s.isHighlight;
        await this.repo.save(s);
        return { ok: true, isHighlight: s.isHighlight };
    }
    async listHighlights(handle) {
        const h = (handle || '').toLowerCase();
        if (!h)
            return [];
        const rows = await this.repo.createQueryBuilder('s')
            .innerJoin('s.author', 'a')
            .where('LOWER(a.handle) = :h AND s.isHighlight = true AND s.isActive = true', { h })
            .orderBy('s.createdAt', 'DESC')
            .getMany();
        return rows.map((s) => ({
            id: s.id,
            imageUrl: s.imageUrl,
            caption: s.caption,
            createdAt: s.createdAt,
        }));
    }
};
exports.StoriesService = StoriesService;
exports.StoriesService = StoriesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(story_entity_1.Story)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], StoriesService);
//# sourceMappingURL=stories.service.js.map