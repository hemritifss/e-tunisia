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
exports.PostsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const post_entity_1 = require("./post.entity");
const comment_entity_1 = require("./comment.entity");
const notifications_service_1 = require("../notifications/notifications.service");
const notification_entity_1 = require("../notifications/notification.entity");
let PostsService = class PostsService {
    constructor(postsRepo, commentsRepo, notifications) {
        this.postsRepo = postsRepo;
        this.commentsRepo = commentsRepo;
        this.notifications = notifications;
    }
    async listComments(postId) {
        if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(postId)) {
            return [];
        }
        const rows = await this.commentsRepo.find({
            where: { postId },
            order: { createdAt: 'ASC' },
        });
        return rows.map((c) => ({
            id: c.id,
            postId: c.postId,
            body: c.body,
            upvotes: c.upvotes,
            createdAt: c.createdAt,
            author: c.author ? {
                id: c.author.id,
                fullName: c.author.fullName,
                avatar: c.author.avatar || null,
            } : null,
        }));
    }
    async addComment(postId, authorId, body) {
        if (!body || !body.trim())
            throw new common_1.ForbiddenException('Comment cannot be empty');
        const post = await this.postsRepo.findOne({ where: { id: postId } });
        if (!post)
            throw new common_1.NotFoundException('Post not found');
        const saved = await this.commentsRepo.save(this.commentsRepo.create({
            postId, authorId, body: body.trim(),
        }));
        post.commentCount = (post.commentCount || 0) + 1;
        await this.postsRepo.save(post);
        if (post.authorId && post.authorId !== authorId) {
            try {
                await this.notifications.create(post.authorId, 'New comment', `Someone commented on "${post.title}"`, notification_entity_1.NotificationType.COMMENT, { postId: post.id, fromUserId: authorId });
            }
            catch { }
        }
        return saved;
    }
    async create(authorId, data) {
        const post = this.postsRepo.create({
            ...data,
            authorId,
            isActive: true,
        });
        return this.postsRepo.save(post);
    }
    async list(opts = {}) {
        const page = Math.max(1, Number(opts.page) || 1);
        const limit = Math.min(50, Math.max(1, Number(opts.limit) || 10));
        const offset = (page - 1) * limit;
        const qb = this.postsRepo.createQueryBuilder('p')
            .leftJoinAndSelect('p.author', 'a')
            .where('p.isActive = :a', { a: true });
        if (opts.authorId)
            qb.andWhere('p.authorId = :u', { u: opts.authorId });
        if (opts.category)
            qb.andWhere('p.category = :c', { c: opts.category });
        if (opts.sort === 'top') {
            qb.orderBy('p.upvotes', 'DESC')
                .addOrderBy('p.downvotes', 'ASC')
                .addOrderBy('p.createdAt', 'DESC');
        }
        else if (opts.sort === 'hot') {
            qb.orderBy('p.upvotes', 'DESC')
                .addOrderBy('p.commentCount', 'DESC')
                .addOrderBy('p.createdAt', 'DESC');
        }
        else {
            qb.orderBy('p.isPinned', 'DESC').addOrderBy('p.createdAt', 'DESC');
        }
        const [rows, total] = await qb.skip(offset).take(limit).getManyAndCount();
        const data = rows.map((p) => ({
            id: p.id,
            type: 'post',
            title: p.title,
            body: p.body,
            category: p.category,
            location: p.location,
            placeId: p.placeId,
            images: p.images || [],
            tags: p.tags || [],
            authorId: p.authorId,
            author: p.author ? {
                id: p.author.id,
                fullName: p.author.fullName,
                avatar: p.author.avatar,
            } : null,
            upvotes: p.upvotes,
            downvotes: p.downvotes,
            commentCount: p.commentCount,
            isPinned: p.isPinned,
            createdAt: p.createdAt,
        }));
        return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
    }
    async findOne(id) {
        const post = await this.postsRepo.findOne({ where: { id }, relations: ['author'] });
        if (!post)
            throw new common_1.NotFoundException('Post not found');
        return post;
    }
    async vote(id, dir) {
        const post = await this.findOne(id);
        if (dir === 'up')
            post.upvotes++;
        else if (dir === 'down')
            post.downvotes++;
        else if (dir === 'clear') {
            if (post.upvotes > 0)
                post.upvotes--;
        }
        return this.postsRepo.save(post);
    }
    async remove(id, requesterId) {
        const post = await this.findOne(id);
        if (post.authorId !== requesterId)
            throw new common_1.ForbiddenException('Not your post');
        post.isActive = false;
        await this.postsRepo.save(post);
        return { deleted: true };
    }
};
exports.PostsService = PostsService;
exports.PostsService = PostsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(post_entity_1.Post)),
    __param(1, (0, typeorm_1.InjectRepository)(comment_entity_1.Comment)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        notifications_service_1.NotificationsService])
], PostsService);
//# sourceMappingURL=posts.service.js.map