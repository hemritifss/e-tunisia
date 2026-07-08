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
const comment_like_entity_1 = require("./comment-like.entity");
const post_reaction_entity_1 = require("./post-reaction.entity");
const saved_post_entity_1 = require("./saved-post.entity");
const repost_entity_1 = require("./repost.entity");
const effective_plan_1 = require("../users/effective-plan");
const billing_service_1 = require("../billing/billing.service");
const badges_service_1 = require("../badges/badges.service");
const user_entity_1 = require("../users/user.entity");
const notifications_service_1 = require("../notifications/notifications.service");
const notification_entity_1 = require("../notifications/notification.entity");
const moderation_service_1 = require("../ai/moderation.service");
const ai_service_1 = require("../ai/ai.service");
const safety_service_1 = require("../safety/safety.service");
const report_entity_1 = require("../safety/report.entity");
let PostsService = class PostsService {
    constructor(postsRepo, commentsRepo, commentLikesRepo, reactionsRepo, savedRepo, repostsRepo, usersRepo, notifications, badges, billing, moderation, safety, ai) {
        this.postsRepo = postsRepo;
        this.commentsRepo = commentsRepo;
        this.commentLikesRepo = commentLikesRepo;
        this.reactionsRepo = reactionsRepo;
        this.savedRepo = savedRepo;
        this.repostsRepo = repostsRepo;
        this.usersRepo = usersRepo;
        this.notifications = notifications;
        this.badges = badges;
        this.billing = billing;
        this.moderation = moderation;
        this.safety = safety;
        this.ai = ai;
    }
    async autoEnrich(data) {
        const needsCategory = !data.category;
        const needsTags = !data.tags || data.tags.length === 0;
        if (!needsCategory && !needsTags && data.location)
            return {};
        try {
            const s = await this.ai.autoTag({ title: data.title || '', body: data.body || '' });
            return {
                category: needsCategory ? s.category : undefined,
                tags: needsTags && s.tags.length ? s.tags : undefined,
                location: !data.location ? s.location : undefined,
            };
        }
        catch {
            return {};
        }
    }
    async screenContent(text) {
        const verdict = await this.moderation.moderateText(text);
        if (verdict.action === 'block') {
            throw new common_1.ForbiddenException({
                code: 'content_blocked',
                message: verdict.explanation || 'This content violates our community guidelines.',
            });
        }
        return verdict;
    }
    async fileAutoReport(verdict, targetType, targetId, ownerId) {
        if (verdict.action !== 'flag')
            return;
        try {
            await this.safety.report('ai-moderation', {
                targetType,
                targetId,
                reason: verdict.reason || report_entity_1.ReportReason.OTHER,
                details: `[auto] ${verdict.explanation}`.slice(0, 600),
                targetOwnerId: ownerId,
            });
        }
        catch {
        }
    }
    async listReactors(postId, opts = {}) {
        if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(postId)) {
            return { data: [], meta: { page: 1, limit: 0, total: 0, totalPages: 0 } };
        }
        const page = Math.max(1, Number(opts.page) || 1);
        const limit = Math.min(100, Math.max(1, Number(opts.limit) || 30));
        const offset = (page - 1) * limit;
        const where = { postId };
        if (opts.type)
            where.type = opts.type;
        const [rows, total] = await this.reactionsRepo.findAndCount({
            where,
            order: { createdAt: 'DESC' },
            skip: offset,
            take: limit,
        });
        if (rows.length === 0)
            return { data: [], meta: { page, limit, total, totalPages: 0 } };
        const users = await this.usersRepo.find({
            where: { id: (0, typeorm_2.In)(rows.map(r => r.userId)) },
            select: ['id', 'fullName', 'avatar', 'country', 'handle', 'plan', 'role', 'subscriptionExpiresAt'],
        });
        const byId = new Map(users.map(u => [u.id, u]));
        const data = rows.map(r => {
            const u = byId.get(r.userId);
            return {
                userId: r.userId,
                type: r.type,
                createdAt: r.createdAt,
                user: u ? { id: u.id, fullName: u.fullName, avatar: u.avatar, country: u.country, handle: u.handle, plan: (0, effective_plan_1.effectivePlan)(u), role: u.role } : null,
            };
        }).filter(r => r.user);
        return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
    }
    isUuid(id) {
        return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    }
    async savePost(postId, userId) {
        if (!this.isUuid(postId))
            throw new common_1.NotFoundException('Post not found');
        const post = await this.postsRepo.findOne({ where: { id: postId } });
        if (!post)
            throw new common_1.NotFoundException('Post not found');
        const existing = await this.savedRepo.findOne({ where: { postId, userId } });
        if (!existing) {
            const current = await this.savedRepo.count({ where: { userId } });
            const { ok, cap, plan } = await this.billing.checkCap(userId, 'maxSaves', current);
            if (!ok) {
                throw new common_1.ForbiddenException({
                    code: 'cap_reached',
                    feature: 'maxSaves',
                    cap,
                    plan,
                    message: `Free plan saves up to ${cap} posts. Upgrade to Pro for unlimited.`,
                });
            }
            await this.savedRepo.save(this.savedRepo.create({ postId, userId }));
            if (this.badges)
                await this.badges.awardIfEligible(userId, 'post.saved', {});
        }
        return { saved: true };
    }
    async unsavePost(postId, userId) {
        if (!this.isUuid(postId))
            return { saved: false };
        await this.savedRepo.delete({ postId, userId });
        return { saved: false };
    }
    async listSavedByHandle(handle, opts = {}) {
        const user = await this.usersRepo.findOne({ where: { handle: (handle || '').toLowerCase() } });
        if (!user)
            return { data: [], meta: { page: 1, limit: 0, total: 0, totalPages: 0 } };
        return this.listSaved(user.id, opts);
    }
    async listSaved(userId, opts = {}) {
        const page = Math.max(1, Number(opts.page) || 1);
        const limit = Math.min(50, Math.max(1, Number(opts.limit) || 12));
        const offset = (page - 1) * limit;
        const [rows, total] = await this.savedRepo.findAndCount({
            where: { userId },
            order: { createdAt: 'DESC' },
            skip: offset,
            take: limit,
        });
        if (rows.length === 0) {
            return { data: [], meta: { page, limit, total, totalPages: 0 } };
        }
        const posts = await this.postsRepo.createQueryBuilder('p')
            .leftJoinAndSelect('p.author', 'a')
            .where('p.id IN (:...ids)', { ids: rows.map(r => r.postId) })
            .andWhere('p.isActive = :a', { a: true })
            .getMany();
        const byId = new Map(posts.map(p => [p.id, p]));
        const data = rows.map(r => {
            const p = byId.get(r.postId);
            if (!p)
                return null;
            return {
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
                    handle: p.author.handle ?? null,
                    plan: (0, effective_plan_1.effectivePlan)(p.author),
                    role: p.author.role,
                } : null,
                upvotes: p.upvotes,
                downvotes: p.downvotes,
                commentCount: p.commentCount,
                isPinned: p.isPinned,
                createdAt: p.createdAt,
                savedAt: r.createdAt,
            };
        }).filter(Boolean);
        return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
    }
    async saveCountsBulk(postIds) {
        const out = {};
        for (const id of postIds)
            out[id] = 0;
        if (postIds.length === 0)
            return out;
        const rows = await this.savedRepo.createQueryBuilder('s')
            .select('s.postId', 'postId')
            .addSelect('COUNT(*)', 'c')
            .where('s.postId IN (:...ids)', { ids: postIds })
            .groupBy('s.postId')
            .getRawMany();
        for (const r of rows)
            out[r.postId] = Number(r.c) || 0;
        return out;
    }
    async savedBulk(postIds, viewerId) {
        const out = {};
        for (const id of postIds)
            out[id] = false;
        if (!viewerId || postIds.length === 0)
            return out;
        const rows = await this.savedRepo.find({
            where: { userId: viewerId, postId: (0, typeorm_2.In)(postIds) },
        });
        for (const r of rows)
            out[r.postId] = true;
        return out;
    }
    async react(postId, userId, type) {
        const post = await this.postsRepo.findOne({ where: { id: postId } });
        if (!post)
            throw new common_1.NotFoundException('Post not found');
        const existing = await this.reactionsRepo.findOne({ where: { postId, userId } });
        if (!type) {
            if (existing)
                await this.reactionsRepo.delete({ postId, userId });
        }
        else if (existing) {
            existing.type = type;
            await this.reactionsRepo.save(existing);
        }
        else {
            await this.reactionsRepo.save(this.reactionsRepo.create({ postId, userId, type }));
        }
        const total = await this.reactionsRepo.count({ where: { postId } });
        post.upvotes = total;
        await this.postsRepo.save(post);
        if (type && post.authorId && post.authorId !== userId) {
            try {
                await this.notifications.create(post.authorId, 'Someone reacted', `Your post "${post.title}" got a new ${type}`, notification_entity_1.NotificationType.COMMENT, { postId: post.id, fromUserId: userId, reaction: type });
            }
            catch { }
        }
        return this.aggregate(postId);
    }
    async aggregate(postId, viewerId) {
        if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(postId)) {
            return { total: 0, breakdown: {}, mine: null };
        }
        const rows = await this.reactionsRepo.find({ where: { postId } });
        const breakdown = {};
        let mine = null;
        for (const r of rows) {
            breakdown[r.type] = (breakdown[r.type] || 0) + 1;
            if (viewerId && r.userId === viewerId)
                mine = r.type;
        }
        return { total: rows.length, breakdown, mine };
    }
    async aggregateBulk(postIds, viewerId) {
        if (postIds.length === 0)
            return {};
        const rows = await this.reactionsRepo.find({ where: { postId: (0, typeorm_2.In)(postIds) } });
        const out = {};
        for (const id of postIds)
            out[id] = { total: 0, breakdown: {}, mine: null };
        for (const r of rows) {
            const bucket = out[r.postId];
            if (!bucket)
                continue;
            bucket.total++;
            bucket.breakdown[r.type] = (bucket.breakdown[r.type] || 0) + 1;
            if (viewerId && r.userId === viewerId)
                bucket.mine = r.type;
        }
        return out;
    }
    async listComments(postId, viewerId) {
        if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(postId)) {
            return [];
        }
        const rows = await this.commentsRepo.find({
            where: { postId },
            order: { createdAt: 'ASC' },
        });
        let myLikes = new Set();
        if (viewerId && rows.length > 0) {
            const likes = await this.commentLikesRepo.find({
                where: { userId: viewerId, commentId: (0, typeorm_2.In)(rows.map(r => r.id)) },
            });
            myLikes = new Set(likes.map(l => l.commentId));
        }
        const shape = (c) => ({
            id: c.id,
            postId: c.postId,
            body: c.body,
            parentId: c.parentId || null,
            likeCount: c.likeCount || 0,
            replyCount: c.replyCount || 0,
            likedByMe: myLikes.has(c.id),
            createdAt: c.createdAt,
            author: c.author ? {
                id: c.author.id,
                fullName: c.author.fullName,
                avatar: c.author.avatar || null,
            } : null,
        });
        const byId = new Map();
        const top = [];
        for (const c of rows) {
            const v = { ...shape(c), replies: [] };
            byId.set(c.id, v);
            if (!c.parentId)
                top.push(v);
        }
        for (const c of rows) {
            if (c.parentId) {
                const parent = byId.get(c.parentId);
                if (parent)
                    parent.replies.push(byId.get(c.id));
                else
                    top.push(byId.get(c.id));
            }
        }
        return top;
    }
    async addComment(postId, authorId, body, parentId) {
        if (!body || !body.trim())
            throw new common_1.ForbiddenException('Comment cannot be empty');
        const verdict = await this.screenContent(body);
        const post = await this.postsRepo.findOne({ where: { id: postId } });
        if (!post)
            throw new common_1.NotFoundException('Post not found');
        let parent = null;
        if (parentId) {
            parent = await this.commentsRepo.findOne({ where: { id: parentId, postId } });
            if (!parent)
                throw new common_1.NotFoundException('Parent comment not found');
            if (parent.parentId)
                parentId = parent.parentId;
        }
        const saved = await this.commentsRepo.save(this.commentsRepo.create({
            postId, authorId, body: body.trim(),
            parentId: parentId || null,
        }));
        await this.fileAutoReport(verdict, report_entity_1.ReportTargetType.COMMENT, saved.id, authorId);
        post.commentCount = (post.commentCount || 0) + 1;
        await this.postsRepo.save(post);
        if (parent) {
            parent.replyCount = (parent.replyCount || 0) + 1;
            await this.commentsRepo.save(parent);
        }
        const notifyTargets = new Set();
        if (post.authorId && post.authorId !== authorId)
            notifyTargets.add(post.authorId);
        if (parent && parent.authorId && parent.authorId !== authorId)
            notifyTargets.add(parent.authorId);
        for (const targetId of notifyTargets) {
            try {
                await this.notifications.create(targetId, parent ? 'New reply' : 'New comment', parent
                    ? `Someone replied to your comment on "${post.title}"`
                    : `Someone commented on "${post.title}"`, notification_entity_1.NotificationType.COMMENT, { postId: post.id, commentId: saved.id, fromUserId: authorId });
            }
            catch { }
        }
        return saved;
    }
    async toggleCommentLike(commentId, userId) {
        const comment = await this.commentsRepo.findOne({ where: { id: commentId } });
        if (!comment)
            throw new common_1.NotFoundException('Comment not found');
        const existing = await this.commentLikesRepo.findOne({ where: { commentId, userId } });
        let liked;
        if (existing) {
            await this.commentLikesRepo.delete({ commentId, userId });
            comment.likeCount = Math.max(0, (comment.likeCount || 0) - 1);
            liked = false;
        }
        else {
            await this.commentLikesRepo.save(this.commentLikesRepo.create({ commentId, userId }));
            comment.likeCount = (comment.likeCount || 0) + 1;
            liked = true;
        }
        await this.commentsRepo.save(comment);
        if (liked && comment.authorId && comment.authorId !== userId) {
            try {
                await this.notifications.create(comment.authorId, 'Comment liked', `Someone liked your comment`, notification_entity_1.NotificationType.COMMENT, { postId: comment.postId, commentId, fromUserId: userId });
            }
            catch { }
        }
        return { liked, likeCount: comment.likeCount };
    }
    async trackView(postId) {
        if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(postId))
            return;
        await this.postsRepo.increment({ id: postId }, 'viewCount', 1);
    }
    async create(authorId, data) {
        const [verdict, enrich] = await Promise.all([
            this.screenContent(`${data.title || ''}\n${data.body || ''}`),
            this.autoEnrich(data),
        ]);
        const post = this.postsRepo.create({
            ...data,
            category: data.category || enrich.category,
            tags: (data.tags && data.tags.length) ? data.tags : (enrich.tags ?? data.tags),
            location: data.location || enrich.location,
            authorId,
            isActive: true,
        });
        const saved = await this.postsRepo.save(post);
        await this.fileAutoReport(verdict, report_entity_1.ReportTargetType.POST, saved.id, authorId);
        const text = `${data.title || ''} ${data.body || ''}`;
        const mentionMatches = text.match(/@([a-zA-Z0-9_]{3,30})/g);
        if (mentionMatches) {
            const handles = [...new Set(mentionMatches.map((m) => m.slice(1).toLowerCase()))];
            const mentionedUsers = await this.usersRepo.find({
                where: handles.map((h) => ({ handle: h })),
            });
            for (const user of mentionedUsers) {
                if (user.id === authorId)
                    continue;
                await this.notifications.create(user.id, 'You were mentioned', `${data.authorName || 'Someone'} mentioned you in a post`, notification_entity_1.NotificationType.MENTION, { postId: saved.id });
            }
        }
        return saved;
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
            videoUrl: p.videoUrl || null,
            tags: p.tags || [],
            authorId: p.authorId,
            author: p.author ? {
                id: p.author.id,
                fullName: p.author.fullName,
                avatar: p.author.avatar,
                handle: p.author.handle,
            } : null,
            upvotes: p.upvotes,
            downvotes: p.downvotes,
            commentCount: p.commentCount,
            viewCount: p.viewCount,
            isPinned: p.isPinned,
            kind: p.kind || null,
            meta: p.meta || null,
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
    async repost(postId, userId, comment) {
        const existing = await this.repostsRepo.findOne({ where: { postId, userId } });
        if (existing)
            throw new common_1.ForbiddenException('Already reposted');
        const repost = this.repostsRepo.create({ postId, userId, comment });
        await this.repostsRepo.save(repost);
        await this.postsRepo.increment({ id: postId }, 'repostCount', 1);
        return repost;
    }
    async undoRepost(postId, userId) {
        const repost = await this.repostsRepo.findOne({ where: { postId, userId } });
        if (!repost)
            throw new common_1.NotFoundException('Repost not found');
        await this.repostsRepo.remove(repost);
        await this.postsRepo.decrement({ id: postId }, 'repostCount', 1);
        return { removed: true };
    }
    async listReposts(postId) {
        return this.repostsRepo.find({
            where: { postId },
            relations: ['user'],
            order: { createdAt: 'DESC' },
        });
    }
};
exports.PostsService = PostsService;
exports.PostsService = PostsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(post_entity_1.Post)),
    __param(1, (0, typeorm_1.InjectRepository)(comment_entity_1.Comment)),
    __param(2, (0, typeorm_1.InjectRepository)(comment_like_entity_1.CommentLike)),
    __param(3, (0, typeorm_1.InjectRepository)(post_reaction_entity_1.PostReaction)),
    __param(4, (0, typeorm_1.InjectRepository)(saved_post_entity_1.SavedPost)),
    __param(5, (0, typeorm_1.InjectRepository)(repost_entity_1.Repost)),
    __param(6, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        notifications_service_1.NotificationsService,
        badges_service_1.BadgesService,
        billing_service_1.BillingService,
        moderation_service_1.ModerationService,
        safety_service_1.SafetyService,
        ai_service_1.AIService])
], PostsService);
//# sourceMappingURL=posts.service.js.map