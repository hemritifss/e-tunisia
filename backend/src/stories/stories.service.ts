import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Story } from './story.entity';

@Injectable()
export class StoriesService {
    constructor(@InjectRepository(Story) private repo: Repository<Story>) {}

    async create(authorId: string, data: { imageUrl: string; caption?: string }) {
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 h
        const story = this.repo.create({ ...data, authorId, expiresAt, isActive: true });
        return this.repo.save(story);
    }

    /**
     * Returns active stories grouped by author — each author surfaces once with their
     * latest image as the thumbnail and the full list available behind it.
     */
    async listActiveGrouped() {
        const stories = await this.repo.find({
            where: { isActive: true, expiresAt: MoreThan(new Date()) },
            relations: ['author'],
            order: { createdAt: 'DESC' },
        });

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
            });
        }
        return Array.from(byAuthor.values())
            .sort((a, b) => new Date(b.latestAt).getTime() - new Date(a.latestAt).getTime());
    }

    async recordView(id: string) {
        await this.repo.increment({ id }, 'viewCount', 1);
        return { ok: true };
    }

    async remove(id: string, requesterId: string) {
        const s = await this.repo.findOne({ where: { id } });
        if (!s) return { deleted: false };
        if (s.authorId !== requesterId) return { deleted: false };
        s.isActive = false;
        await this.repo.save(s);
        return { deleted: true };
    }
}
