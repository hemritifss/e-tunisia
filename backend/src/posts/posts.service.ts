import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from './post.entity';
import { Comment } from './comment.entity';
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
        private notifications: NotificationsService,
    ) {}

    // ──────────────── Comments ────────────────
    async listComments(postId: string) {
        if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(postId)) {
            return [];
        }
        const rows = await this.commentsRepo.find({
            where: { postId },
            order: { createdAt: 'ASC' },
        });
        return rows.map((c: any) => ({
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

    async addComment(postId: string, authorId: string, body: string) {
        if (!body || !body.trim()) throw new ForbiddenException('Comment cannot be empty');
        const post = await this.postsRepo.findOne({ where: { id: postId } });
        if (!post) throw new NotFoundException('Post not found');
        const saved = await this.commentsRepo.save(this.commentsRepo.create({
            postId, authorId, body: body.trim(),
        }));
        post.commentCount = (post.commentCount || 0) + 1;
        await this.postsRepo.save(post);

        // Notify post author (unless they're commenting on themselves)
        if (post.authorId && post.authorId !== authorId) {
            try {
                await this.notifications.create(
                    post.authorId,
                    'New comment',
                    `Someone commented on "${post.title}"`,
                    NotificationType.COMMENT,
                    { postId: post.id, fromUserId: authorId },
                );
            } catch {}
        }
        return saved;
    }

    async create(authorId: string, data: Partial<Post>): Promise<Post> {
        const post = this.postsRepo.create({
            ...data,
            authorId,
            isActive: true,
        });
        return this.postsRepo.save(post);
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
}
