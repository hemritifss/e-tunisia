import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, In } from 'typeorm';
import { Story } from './story.entity';
import { StoryReaction, isValidStoryReaction } from './story-reaction.entity';
import { StoryView } from './story-view.entity';
import { User } from '../users/user.entity';
import { MessagesService } from '../messages/messages.service';

@Injectable()
export class StoriesService {
    constructor(
        @InjectRepository(Story) private repo: Repository<Story>,
        @InjectRepository(StoryReaction) private reactionsRepo: Repository<StoryReaction>,
        @InjectRepository(StoryView) private viewsRepo: Repository<StoryView>,
        @InjectRepository(User) private usersRepo: Repository<User>,
        private messages: MessagesService,
    ) {}

    async create(authorId: string, data: { imageUrl: string; caption?: string }) {
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 h
        const story = this.repo.create({ ...data, authorId, expiresAt, isActive: true });
        return this.repo.save(story);
    }

    /**
     * Returns active stories grouped by author — each author surfaces once with their
     * latest image as the thumbnail and the full list available behind it.
     *
     * When `viewerId` is given, each item carries the viewer's own seen/reaction state
     * so the strip can dim already-watched rings without a request per story.
     */
    async listActiveGrouped(viewerId?: string | null) {
        const stories = await this.repo.find({
            where: { isActive: true, expiresAt: MoreThan(new Date()) },
            relations: ['author'],
            order: { createdAt: 'DESC' },
        });
        if (!stories.length) return [];

        const ids = stories.map((s) => s.id);
        const [seen, reactionCounts, myReactions] = await Promise.all([
            viewerId
                ? this.viewsRepo.find({ where: { storyId: In(ids), viewerId }, select: ['storyId'] })
                : Promise.resolve([]),
            this.reactionsRepo
                .createQueryBuilder('r')
                .select('r.storyId', 'storyId')
                .addSelect('COUNT(*)', 'count')
                .where('r.storyId IN (:...ids)', { ids })
                .groupBy('r.storyId')
                .getRawMany<{ storyId: string; count: string }>(),
            viewerId
                ? this.reactionsRepo.find({ where: { storyId: In(ids), userId: viewerId }, select: ['storyId', 'emoji'] })
                : Promise.resolve([]),
        ]);

        const seenSet = new Set(seen.map((v) => v.storyId));
        const countByStory = new Map(reactionCounts.map((r) => [r.storyId, Number(r.count) || 0]));
        const mineByStory = new Map(myReactions.map((r) => [r.storyId, r.emoji]));

        const byAuthor = new Map<string, any>();
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
            byAuthor.get(aid)!.items.push({
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
            // Oldest-first inside a group so the viewer advances chronologically.
            items: g.items.slice().reverse(),
            hasUnseen: g.items.some((i: any) => !i.hasSeen),
        }));

        // Unseen authors first, then most recent — the standard stories-strip ordering.
        return groups.sort((a, b) => {
            if (a.hasUnseen !== b.hasUnseen) return a.hasUnseen ? -1 : 1;
            return new Date(b.latestAt).getTime() - new Date(a.latestAt).getTime();
        });
    }

    /**
     * Idempotent per-viewer view. viewCount only moves on a viewer's first view,
     * and the author viewing their own story is not counted.
     */
    async recordView(id: string, viewerId?: string | null) {
        if (!viewerId) return { ok: true, counted: false };

        const story = await this.repo.findOne({ where: { id }, select: ['id', 'authorId'] });
        if (!story) throw new NotFoundException('Story not found');
        if (story.authorId === viewerId) return { ok: true, counted: false };

        // ON CONFLICT DO NOTHING — concurrent opens can race the unique index.
        const res = await this.viewsRepo
            .createQueryBuilder()
            .insert()
            .into(StoryView)
            .values({ storyId: id, viewerId })
            .orIgnore()
            .execute();

        const inserted = (res.identifiers?.[0] as any) != null;
        if (inserted) await this.repo.increment({ id }, 'viewCount', 1);
        return { ok: true, counted: inserted };
    }

    /** Set or replace the viewer's reaction. Returns the fresh summary. */
    async react(storyId: string, userId: string, emoji: string) {
        if (!isValidStoryReaction(emoji)) throw new BadRequestException('Unsupported reaction');

        const story = await this.repo.findOne({ where: { id: storyId }, select: ['id'] });
        if (!story) throw new NotFoundException('Story not found');

        const existing = await this.reactionsRepo.findOne({ where: { storyId, userId } });
        if (existing) {
            existing.emoji = emoji;
            await this.reactionsRepo.save(existing);
        } else {
            await this.reactionsRepo
                .createQueryBuilder()
                .insert()
                .into(StoryReaction)
                .values({ storyId, userId, emoji })
                .orIgnore()
                .execute();
        }
        return this.reactionSummary(storyId, userId);
    }

    async unreact(storyId: string, userId: string) {
        await this.reactionsRepo.delete({ storyId, userId });
        return this.reactionSummary(storyId, userId);
    }

    private async reactionSummary(storyId: string, userId: string) {
        const [rows, mine] = await Promise.all([
            this.reactionsRepo
                .createQueryBuilder('r')
                .select('r.emoji', 'emoji')
                .addSelect('COUNT(*)', 'count')
                .where('r.storyId = :storyId', { storyId })
                .groupBy('r.emoji')
                .getRawMany<{ emoji: string; count: string }>(),
            this.reactionsRepo.findOne({ where: { storyId, userId }, select: ['emoji'] }),
        ]);

        const counts: Record<string, number> = {};
        let total = 0;
        for (const r of rows) {
            const n = Number(r.count) || 0;
            counts[r.emoji] = n;
            total += n;
        }
        return { storyId, counts, total, myReaction: mine?.emoji || null };
    }

    /**
     * Reply to a story — delivered as a DM to the author, tagged so the thread can
     * render the story it answers. Replying to your own story is pointless, so it's blocked.
     */
    async reply(storyId: string, senderId: string, text: string) {
        const body = (text || '').trim();
        if (!body) throw new BadRequestException('Reply cannot be empty');

        const story = await this.repo.findOne({ where: { id: storyId } });
        if (!story) throw new NotFoundException('Story not found');
        if (story.authorId === senderId) throw new BadRequestException('Cannot reply to your own story');

        const room = await this.messages.createRoom(senderId, [story.authorId], undefined, 'direct');
        const message = await this.messages.saveMessage(room.id, senderId, body, 'story_reply', {
            storyId: story.id,
            storyImageUrl: story.imageUrl,
            storyCaption: story.caption || null,
            storyAuthorId: story.authorId,
        });

        return { ok: true, roomId: room.id, messageId: message.id };
    }

    /** Author-only: who watched this story, newest first, with their reaction. */
    async listViewers(storyId: string, requesterId: string) {
        const story = await this.repo.findOne({ where: { id: storyId }, select: ['id', 'authorId', 'viewCount'] });
        if (!story) throw new NotFoundException('Story not found');
        if (story.authorId !== requesterId) throw new ForbiddenException('Only the author can see viewers');

        const views = await this.viewsRepo.find({ where: { storyId }, order: { createdAt: 'DESC' } });
        if (!views.length) return { total: 0, viewers: [] };

        const viewerIds = views.map((v) => v.viewerId);
        const [users, reactions] = await Promise.all([
            this.usersRepo.find({ where: { id: In(viewerIds) }, select: ['id', 'fullName', 'avatar', 'handle'] }),
            this.reactionsRepo.find({ where: { storyId, userId: In(viewerIds) }, select: ['userId', 'emoji'] }),
        ]);

        const userById = new Map(users.map((u) => [u.id, u]));
        const emojiByUser = new Map(reactions.map((r) => [r.userId, r.emoji]));

        return {
            total: views.length,
            viewers: views
                .filter((v) => userById.has(v.viewerId))
                .map((v) => {
                    const u = userById.get(v.viewerId)!;
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

    async remove(id: string, requesterId: string) {
        const s = await this.repo.findOne({ where: { id } });
        if (!s) return { deleted: false };
        if (s.authorId !== requesterId) return { deleted: false };
        s.isActive = false;
        await this.repo.save(s);
        return { deleted: true };
    }

    /** Owner-only: pin/unpin a story to the profile's Highlights ("My Tunisia Journey"). */
    async toggleHighlight(id: string, requesterId: string) {
        const s = await this.repo.findOne({ where: { id } });
        if (!s || s.authorId !== requesterId) return { ok: false, isHighlight: false };
        s.isHighlight = !s.isHighlight;
        await this.repo.save(s);
        return { ok: true, isHighlight: s.isHighlight };
    }

    /** Public: a user's highlighted stories (persist past 24h). */
    async listHighlights(handle: string) {
        const h = (handle || '').toLowerCase();
        if (!h) return [];
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
}
