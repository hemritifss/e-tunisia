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
const story_reaction_entity_1 = require("./story-reaction.entity");
const story_view_entity_1 = require("./story-view.entity");
const user_entity_1 = require("../users/user.entity");
const messages_service_1 = require("../messages/messages.service");
let StoriesService = class StoriesService {
    constructor(repo, reactionsRepo, viewsRepo, usersRepo, messages) {
        this.repo = repo;
        this.reactionsRepo = reactionsRepo;
        this.viewsRepo = viewsRepo;
        this.usersRepo = usersRepo;
        this.messages = messages;
    }
    async create(authorId, data) {
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        const story = this.repo.create({ ...data, authorId, expiresAt, isActive: true });
        return this.repo.save(story);
    }
    async listActiveGrouped(viewerId) {
        const stories = await this.repo.find({
            where: { isActive: true, expiresAt: (0, typeorm_2.MoreThan)(new Date()) },
            relations: ['author'],
            order: { createdAt: 'DESC' },
        });
        if (!stories.length)
            return [];
        const ids = stories.map((s) => s.id);
        const [seen, reactionCounts, myReactions] = await Promise.all([
            viewerId
                ? this.viewsRepo.find({ where: { storyId: (0, typeorm_2.In)(ids), viewerId }, select: ['storyId'] })
                : Promise.resolve([]),
            this.reactionsRepo
                .createQueryBuilder('r')
                .select('r.storyId', 'storyId')
                .addSelect('COUNT(*)', 'count')
                .where('r.storyId IN (:...ids)', { ids })
                .groupBy('r.storyId')
                .getRawMany(),
            viewerId
                ? this.reactionsRepo.find({ where: { storyId: (0, typeorm_2.In)(ids), userId: viewerId }, select: ['storyId', 'emoji'] })
                : Promise.resolve([]),
        ]);
        const seenSet = new Set(seen.map((v) => v.storyId));
        const countByStory = new Map(reactionCounts.map((r) => [r.storyId, Number(r.count) || 0]));
        const mineByStory = new Map(myReactions.map((r) => [r.storyId, r.emoji]));
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
                        handle: s.author.handle || null,
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
                viewCount: s.viewCount,
                hasSeen: seenSet.has(s.id),
                reactionCount: countByStory.get(s.id) || 0,
                myReaction: mineByStory.get(s.id) || null,
            });
        }
        const groups = Array.from(byAuthor.values()).map((g) => ({
            ...g,
            items: g.items.slice().reverse(),
            hasUnseen: g.items.some((i) => !i.hasSeen),
        }));
        return groups.sort((a, b) => {
            if (a.hasUnseen !== b.hasUnseen)
                return a.hasUnseen ? -1 : 1;
            return new Date(b.latestAt).getTime() - new Date(a.latestAt).getTime();
        });
    }
    async recordView(id, viewerId) {
        if (!viewerId)
            return { ok: true, counted: false };
        const story = await this.repo.findOne({ where: { id }, select: ['id', 'authorId'] });
        if (!story)
            throw new common_1.NotFoundException('Story not found');
        if (story.authorId === viewerId)
            return { ok: true, counted: false };
        const res = await this.viewsRepo
            .createQueryBuilder()
            .insert()
            .into(story_view_entity_1.StoryView)
            .values({ storyId: id, viewerId })
            .orIgnore()
            .execute();
        const inserted = res.identifiers?.[0] != null;
        if (inserted)
            await this.repo.increment({ id }, 'viewCount', 1);
        return { ok: true, counted: inserted };
    }
    async react(storyId, userId, emoji) {
        if (!(0, story_reaction_entity_1.isValidStoryReaction)(emoji))
            throw new common_1.BadRequestException('Unsupported reaction');
        const story = await this.repo.findOne({ where: { id: storyId }, select: ['id'] });
        if (!story)
            throw new common_1.NotFoundException('Story not found');
        const existing = await this.reactionsRepo.findOne({ where: { storyId, userId } });
        if (existing) {
            existing.emoji = emoji;
            await this.reactionsRepo.save(existing);
        }
        else {
            await this.reactionsRepo
                .createQueryBuilder()
                .insert()
                .into(story_reaction_entity_1.StoryReaction)
                .values({ storyId, userId, emoji })
                .orIgnore()
                .execute();
        }
        return this.reactionSummary(storyId, userId);
    }
    async unreact(storyId, userId) {
        await this.reactionsRepo.delete({ storyId, userId });
        return this.reactionSummary(storyId, userId);
    }
    async reactionSummary(storyId, userId) {
        const [rows, mine] = await Promise.all([
            this.reactionsRepo
                .createQueryBuilder('r')
                .select('r.emoji', 'emoji')
                .addSelect('COUNT(*)', 'count')
                .where('r.storyId = :storyId', { storyId })
                .groupBy('r.emoji')
                .getRawMany(),
            this.reactionsRepo.findOne({ where: { storyId, userId }, select: ['emoji'] }),
        ]);
        const counts = {};
        let total = 0;
        for (const r of rows) {
            const n = Number(r.count) || 0;
            counts[r.emoji] = n;
            total += n;
        }
        return { storyId, counts, total, myReaction: mine?.emoji || null };
    }
    async reply(storyId, senderId, text) {
        const body = (text || '').trim();
        if (!body)
            throw new common_1.BadRequestException('Reply cannot be empty');
        const story = await this.repo.findOne({ where: { id: storyId } });
        if (!story)
            throw new common_1.NotFoundException('Story not found');
        if (story.authorId === senderId)
            throw new common_1.BadRequestException('Cannot reply to your own story');
        const room = await this.messages.createRoom(senderId, [story.authorId], undefined, 'direct');
        const message = await this.messages.saveMessage(room.id, senderId, body, 'story_reply', {
            storyId: story.id,
            storyImageUrl: story.imageUrl,
            storyCaption: story.caption || null,
            storyAuthorId: story.authorId,
        });
        return { ok: true, roomId: room.id, messageId: message.id };
    }
    async listViewers(storyId, requesterId) {
        const story = await this.repo.findOne({ where: { id: storyId }, select: ['id', 'authorId', 'viewCount'] });
        if (!story)
            throw new common_1.NotFoundException('Story not found');
        if (story.authorId !== requesterId)
            throw new common_1.ForbiddenException('Only the author can see viewers');
        const views = await this.viewsRepo.find({ where: { storyId }, order: { createdAt: 'DESC' } });
        if (!views.length)
            return { total: 0, viewers: [] };
        const viewerIds = views.map((v) => v.viewerId);
        const [users, reactions] = await Promise.all([
            this.usersRepo.find({ where: { id: (0, typeorm_2.In)(viewerIds) }, select: ['id', 'fullName', 'avatar', 'handle'] }),
            this.reactionsRepo.find({ where: { storyId, userId: (0, typeorm_2.In)(viewerIds) }, select: ['userId', 'emoji'] }),
        ]);
        const userById = new Map(users.map((u) => [u.id, u]));
        const emojiByUser = new Map(reactions.map((r) => [r.userId, r.emoji]));
        return {
            total: views.length,
            viewers: views
                .filter((v) => userById.has(v.viewerId))
                .map((v) => {
                const u = userById.get(v.viewerId);
                return {
                    id: u.id,
                    fullName: u.fullName,
                    avatar: u.avatar || null,
                    handle: u.handle || null,
                    reaction: emojiByUser.get(v.viewerId) || null,
                    viewedAt: v.createdAt,
                };
            }),
        };
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
    __param(1, (0, typeorm_1.InjectRepository)(story_reaction_entity_1.StoryReaction)),
    __param(2, (0, typeorm_1.InjectRepository)(story_view_entity_1.StoryView)),
    __param(3, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        messages_service_1.MessagesService])
], StoriesService);
//# sourceMappingURL=stories.service.js.map