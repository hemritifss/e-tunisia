import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Post } from './post.entity';
import { Comment } from './comment.entity';
import { CommentLike } from './comment-like.entity';
import { PostReaction, ReactionType } from './post-reaction.entity';
import { SavedPost } from './saved-post.entity';
import { Repost } from './repost.entity';
import { effectivePlan } from '../users/effective-plan';
import { BillingService } from '../billing/billing.service';
import { BadgesService } from '../badges/badges.service';
import { User } from '../users/user.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/notification.entity';

interface ListOpts {
    page?: number;
    limit?: number;
    sort?: 'new' | 'top' | 'hot';
    authorId?: string;
    category?: string;
}

@Injectable()
export class PostsService {
    constructor(
        @InjectRepository(Post) private postsRepo: Repository<Post>,
        @InjectRepository(Comment) private commentsRepo: Repository<Comment>,
        @InjectRepository(CommentLike) private commentLikesRepo: Repository<CommentLike>,
        @InjectRepository(PostReaction) private reactionsRepo: Repository<PostReaction>,
        @InjectRepository(SavedPost) private savedRepo: Repository<SavedPost>,
        @InjectRepository(Repost) private repostsRepo: Repository<Repost>,
        @InjectRepository(User) private usersRepo: Repository<User>,
        private notifications: NotificationsService,
        private badges: BadgesService,
        private billing: BillingService,
    ) {}

    /** Who reacted to a post — paginated, optionally filtered by reaction type. */
    async listReactors(postId: string, opts: { type?: string | null; page?: number; limit?: number } = {}) {
        if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(postId)) {
            return { data: [], meta: { page: 1, limit: 0, total: 0, totalPages: 0 } };
        }
        const page = Math.max(1, Number(opts.page) || 1);
        const limit = Math.min(100, Math.max(1, Number(opts.limit) || 30));
        const offset = (page - 1) * limit;

        const where: any = { postId };
        if (opts.type) where.type = opts.type;

        const [rows, total] = await this.reactionsRepo.findAndCount({
            where,
            order: { createdAt: 'DESC' },
            skip: offset,
            take: limit,
        });
        if (rows.length === 0) return { data: [], meta: { page, limit, total, totalPages: 0 } };

        const users = await this.usersRepo.find({
            where: { id: In(rows.map(r => r.userId)) },
            select: ['id', 'fullName', 'avatar', 'country', 'handle', 'plan', 'role', 'subscriptionExpiresAt'] as any,
        });
        const byId = new Map(users.map(u => [u.id, u]));
        const data = rows.map(r => {
            const u: any = byId.get(r.userId);
            return {
                userId: r.userId,
                type: r.type,
                createdAt: r.createdAt,
                user: u ? { id: u.id, fullName: u.fullName, avatar: u.avatar, country: u.country, handle: u.handle, plan: effectivePlan(u), role: u.role } : null,
            };
        }).filter(r => r.user); // drop reactions whose author was deleted

        return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
    }

    // ──────────────── Bookmarks / Saved posts ────────────────
    private isUuid(id: string): boolean {
        return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    }

    async savePost(postId: string, userId: string) {
        if (!this.isUuid(postId)) throw new NotFoundException('Post not found');
        const post = await this.postsRepo.findOne({ where: { id: postId } });
        if (!post) throw new NotFoundException('Post not found');
        const existing = await this.savedRepo.findOne({ where: { postId, userId } });
        if (!existing) {
            // Plan cap: Free users get 20 saved posts. Toggling off is always allowed,
            // so the check only fires on the additive path.
            const current = await this.savedRepo.count({ where: { userId } });
            const { ok, cap, plan } = await this.billing.checkCap(userId, 'maxSaves', current);
            if (!ok) {
                throw new ForbiddenException({
                    code: 'cap_reached',
                    feature: 'maxSaves',
                    cap,
                    plan,
                    message: `Free plan saves up to ${cap} posts. Upgrade to Pro for unlimited.`,
                });
            }
            await this.savedRepo.save(this.savedRepo.create({ postId, userId }));
            if (this.badges) await this.badges.awardIfEligible(userId, 'post.saved', {});
        }
        return { saved: true };
    }

    async unsavePost(postId: string, userId: string) {
        if (!this.isUuid(postId)) return { saved: false };
        await this.savedRepo.delete({ postId, userId });
        return { saved: false };
    }

    /** Public: list a given handle's saved posts. Empty result for unknown handle. */
    async listSavedByHandle(handle: string, opts: { page?: number; limit?: number } = {}) {
        const user = await this.usersRepo.findOne({ where: { handle: (handle || '').toLowerCase() } });
        if (!user) return { data: [], meta: { page: 1, limit: 0, total: 0, totalPages: 0 } };
        return this.listSaved(user.id, opts);
    }

    async listSaved(userId: string, opts: { page?: number; limit?: number } = {}) {
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
            const p: any = byId.get(r.postId);
            if (!p) return null;
            return {
                id: p.id,
                type: 'post' as const,
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
                    handle: (p.author as any).handle ?? null,
                    plan: effectivePlan(p.author as any),
                    role: (p.author as any).role,
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

    /** Bulk lookup: which of these post ids has the viewer saved? */
    async savedBulk(postIds: string[], viewerId?: string): Promise<Record<string, boolean>> {
        const out: Record<string, boolean> = {};
        for (const id of postIds) out[id] = false;
        if (!viewerId || postIds.length === 0) return out;
        const rows = await this.savedRepo.find({
            where: { userId: viewerId, postId: In(postIds) },
        });
        for (const r of rows) out[r.postId] = true;
        return out;
    }

    // ──────────────── Reactions ────────────────
    /** Set or clear the current user's reaction on a post. dir=null clears. */
    async react(postId: string, userId: string, type: ReactionType | null) {
        const post = await this.postsRepo.findOne({ where: { id: postId } });
        if (!post) throw new NotFoundException('Post not found');

        const existing = await this.reactionsRepo.findOne({ where: { postId, userId } });
        if (!type) {
            if (existing) await this.reactionsRepo.delete({ postId, userId });
        } else if (existing) {
            existing.type = type;
            await this.reactionsRepo.save(existing);
        } else {
            await this.reactionsRepo.save(this.reactionsRepo.create({ postId, userId, type }));
        }
        // Keep `upvotes` in sync as the total-reaction-count surface for legacy components.
        const total = await this.reactionsRepo.count({ where: { postId } });
        post.upvotes = total;
        await this.postsRepo.save(post);

        // Notify post author (skip self-reacts + clears)
        if (type && post.authorId && post.authorId !== userId) {
            try {
                await this.notifications.create(
                    post.authorId,
                    'Someone reacted',
                    `Your post "${post.title}" got a new ${type}`,
                    NotificationType.COMMENT, // closest available; SOCIAL not in enum yet
                    { postId: post.id, fromUserId: userId, reaction: type },
                );
            } catch {}
        }

        return this.aggregate(postId);
    }

    /** Return reaction breakdown for a post + the current user's own pick. */
    async aggregate(postId: string, viewerId?: string) {
        if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(postId)) {
            return { total: 0, breakdown: {}, mine: null };
        }
        const rows = await this.reactionsRepo.find({ where: { postId } });
        const breakdown: Record<string, number> = {};
        let mine: string | null = null;
        for (const r of rows) {
            breakdown[r.type] = (breakdown[r.type] || 0) + 1;
            if (viewerId && r.userId === viewerId) mine = r.type;
        }
        return { total: rows.length, breakdown, mine };
    }

    /** Bulk reactions lookup keyed by postId — used by the feed to hydrate cards. */
    async aggregateBulk(postIds: string[], viewerId?: string) {
        if (postIds.length === 0) return {} as Record<string, any>;
        const rows = await this.reactionsRepo.find({ where: { postId: In(postIds) } });
        const out: Record<string, { total: number; breakdown: Record<string, number>; mine: string | null }> = {};
        for (const id of postIds) out[id] = { total: 0, breakdown: {}, mine: null };
        for (const r of rows) {
            const bucket = out[r.postId];
            if (!bucket) continue;
            bucket.total++;
            bucket.breakdown[r.type] = (bucket.breakdown[r.type] || 0) + 1;
            if (viewerId && r.userId === viewerId) bucket.mine = r.type;
        }
        return out;
    }

    // ──────────────── Comments (with one-level threading + likes) ────────────────
    async listComments(postId: string, viewerId?: string) {
        if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(postId)) {
            return [];
        }
        const rows = await this.commentsRepo.find({
            where: { postId },
            order: { createdAt: 'ASC' },
        });

        // Which of these did the viewer like?
        let myLikes = new Set<string>();
        if (viewerId && rows.length > 0) {
            const likes = await this.commentLikesRepo.find({
                where: { userId: viewerId, commentId: In(rows.map(r => r.id)) },
            });
            myLikes = new Set(likes.map(l => l.commentId));
        }

        const shape = (c: any) => ({
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

        // Group: top-level comments + their replies
        const byId = new Map<string, ReturnType<typeof shape> & { replies: any[] }>();
        const top: any[] = [];
        for (const c of rows) {
            const v = { ...shape(c), replies: [] as any[] };
            byId.set(c.id, v);
            if (!c.parentId) top.push(v);
        }
        for (const c of rows) {
            if (c.parentId) {
                const parent = byId.get(c.parentId);
                if (parent) parent.replies.push(byId.get(c.id));
                else top.push(byId.get(c.id)); // orphan → surface at top-level
            }
        }
        return top;
    }

    async addComment(postId: string, authorId: string, body: string, parentId?: string | null) {
        if (!body || !body.trim()) throw new ForbiddenException('Comment cannot be empty');
        const post = await this.postsRepo.findOne({ where: { id: postId } });
        if (!post) throw new NotFoundException('Post not found');

        let parent: Comment | null = null;
        if (parentId) {
            parent = await this.commentsRepo.findOne({ where: { id: parentId, postId } });
            if (!parent) throw new NotFoundException('Parent comment not found');
            // Enforce one-level threading: replies under a reply collapse to the same root.
            if (parent.parentId) parentId = parent.parentId;
        }

        const saved = await this.commentsRepo.save(this.commentsRepo.create({
            postId, authorId, body: body.trim(),
            parentId: parentId || null,
        }));
        post.commentCount = (post.commentCount || 0) + 1;
        await this.postsRepo.save(post);
        if (parent) {
            parent.replyCount = (parent.replyCount || 0) + 1;
            await this.commentsRepo.save(parent);
        }

        // Notify (a) post author and (b) parent-comment author if different
        const notifyTargets = new Set<string>();
        if (post.authorId && post.authorId !== authorId) notifyTargets.add(post.authorId);
        if (parent && parent.authorId && parent.authorId !== authorId) notifyTargets.add(parent.authorId);
        for (const targetId of notifyTargets) {
            try {
                await this.notifications.create(
                    targetId,
                    parent ? 'New reply' : 'New comment',
                    parent
                        ? `Someone replied to your comment on "${post.title}"`
                        : `Someone commented on "${post.title}"`,
                    NotificationType.COMMENT,
                    { postId: post.id, commentId: saved.id, fromUserId: authorId },
                );
            } catch {}
        }
        return saved;
    }

    // ──────────────── Comment likes ────────────────
    async toggleCommentLike(commentId: string, userId: string) {
        const comment = await this.commentsRepo.findOne({ where: { id: commentId } });
        if (!comment) throw new NotFoundException('Comment not found');
        const existing = await this.commentLikesRepo.findOne({ where: { commentId, userId } });
        let liked: boolean;
        if (existing) {
            await this.commentLikesRepo.delete({ commentId, userId });
            comment.likeCount = Math.max(0, (comment.likeCount || 0) - 1);
            liked = false;
        } else {
            await this.commentLikesRepo.save(this.commentLikesRepo.create({ commentId, userId }));
            comment.likeCount = (comment.likeCount || 0) + 1;
            liked = true;
        }
        await this.commentsRepo.save(comment);

        // Notify comment author when someone likes (skip self-likes & unlikes)
        if (liked && comment.authorId && comment.authorId !== userId) {
            try {
                await this.notifications.create(
                    comment.authorId,
                    'Comment liked',
                    `Someone liked your comment`,
                    NotificationType.COMMENT,
                    { postId: comment.postId, commentId, fromUserId: userId },
                );
            } catch {}
        }
        return { liked, likeCount: comment.likeCount };
    }

    /** Increment view counter — used by the post-detail endpoint. */
    async trackView(postId: string) {
        if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(postId)) return;
        await this.postsRepo.increment({ id: postId }, 'viewCount', 1);
    }

    async create(authorId: string, data: Partial<Post>): Promise<Post> {
        const post = this.postsRepo.create({
            ...data,
            authorId,
            isActive: true,
        });
        const saved = await this.postsRepo.save(post);

        // Detect @mentions and notify mentioned users
        const text = `${data.title || ''} ${data.body || ''}`;
        const mentionMatches = text.match(/@([a-zA-Z0-9_]{3,30})/g);
        if (mentionMatches) {
            const handles = [...new Set(mentionMatches.map((m) => m.slice(1).toLowerCase()))];
            const mentionedUsers = await this.usersRepo.find({
                where: handles.map((h) => ({ handle: h })),
            });
            for (const user of mentionedUsers) {
                if (user.id === authorId) continue;
                await this.notifications.create(
                    user.id,
                    'You were mentioned',
                    `${(data as any).authorName || 'Someone'} mentioned you in a post`,
                    NotificationType.MENTION,
                    { postId: saved.id },
                );
            }
        }

        return saved;
    }

    async list(opts: ListOpts = {}) {
        const page = Math.max(1, Number(opts.page) || 1);
        const limit = Math.min(50, Math.max(1, Number(opts.limit) || 10));
        const offset = (page - 1) * limit;

        const qb = this.postsRepo.createQueryBuilder('p')
            .leftJoinAndSelect('p.author', 'a')
            .where('p.isActive = :a', { a: true });

        if (opts.authorId) qb.andWhere('p.authorId = :u', { u: opts.authorId });
        if (opts.category) qb.andWhere('p.category = :c', { c: opts.category });

        if (opts.sort === 'top') {
            qb.orderBy('p.upvotes', 'DESC')
              .addOrderBy('p.downvotes', 'ASC')
              .addOrderBy('p.createdAt', 'DESC');
        } else if (opts.sort === 'hot') {
            qb.orderBy('p.upvotes', 'DESC')
              .addOrderBy('p.commentCount', 'DESC')
              .addOrderBy('p.createdAt', 'DESC');
        } else {
            qb.orderBy('p.isPinned', 'DESC').addOrderBy('p.createdAt', 'DESC');
        }

        const [rows, total] = await qb.skip(offset).take(limit).getManyAndCount();

        const data = rows.map((p: any) => ({
            id: p.id,
            type: 'post' as const,
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

    async findOne(id: string) {
        const post = await this.postsRepo.findOne({ where: { id }, relations: ['author'] });
        if (!post) throw new NotFoundException('Post not found');
        return post;
    }

    async vote(id: string, dir: 'up' | 'down' | 'clear') {
        const post = await this.findOne(id);
        if (dir === 'up') post.upvotes++;
        else if (dir === 'down') post.downvotes++;
        else if (dir === 'clear') {
            if (post.upvotes > 0) post.upvotes--;
        }
        return this.postsRepo.save(post);
    }

    async remove(id: string, requesterId: string) {
        const post = await this.findOne(id);
        if (post.authorId !== requesterId) throw new ForbiddenException('Not your post');
        post.isActive = false;
        await this.postsRepo.save(post);
        return { deleted: true };
    }

    async repost(postId: string, userId: string, comment?: string) {
        const existing = await this.repostsRepo.findOne({ where: { postId, userId } });
        if (existing) throw new ForbiddenException('Already reposted');

        const repost = this.repostsRepo.create({ postId, userId, comment });
        await this.repostsRepo.save(repost);

        // Increment repost count on post
        await this.postsRepo.increment({ id: postId }, 'repostCount', 1);

        return repost;
    }

    async undoRepost(postId: string, userId: string) {
        const repost = await this.repostsRepo.findOne({ where: { postId, userId } });
        if (!repost) throw new NotFoundException('Repost not found');
        await this.repostsRepo.remove(repost);
        await this.postsRepo.decrement({ id: postId }, 'repostCount', 1);
        return { removed: true };
    }

    async listReposts(postId: string) {
        return this.repostsRepo.find({
            where: { postId },
            relations: ['user'],
            order: { createdAt: 'DESC' },
        });
    }
}
