import { BadRequestException, Inject, Injectable, NotFoundException, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Endorsement } from './endorsement.entity';
import { User } from './user.entity';
import { UsersService } from './users.service';
import { isValidTopic } from './endorsement-topics';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/notification.entity';

export interface EndorsementSummaryRow {
    topic: string;
    count: number;
}

export interface EndorsementGroup extends EndorsementSummaryRow {
    /** Up to 5 most recent endorsers, public-safe fields only. */
    recent: Array<{ id: string; handle: string | null; fullName: string; avatar: string | null }>;
}

@Injectable()
export class EndorsementsService {
    constructor(
        @InjectRepository(Endorsement) private endorsementsRepo: Repository<Endorsement>,
        @InjectRepository(User) private usersRepo: Repository<User>,
        @Inject(forwardRef(() => UsersService)) private users: UsersService,
        private notifications: NotificationsService,
    ) {}

    /** Idempotent endorse. Returns { endorsed: true, count } for that topic. */
    async endorse(endorserId: string, endorsedHandle: string, topic: string) {
        if (!isValidTopic(topic)) {
            throw new BadRequestException('Unknown endorsement topic');
        }
        const endorsed = await this.users.findByHandle(endorsedHandle);
        if (!endorsed) throw new NotFoundException('User not found');
        if (endorsed.id === endorserId) {
            throw new BadRequestException("Can't endorse yourself");
        }

        const existing = await this.endorsementsRepo.findOne({
            where: { endorserId, endorsedId: endorsed.id, topic },
        });
        if (!existing) {
            await this.endorsementsRepo.save(
                this.endorsementsRepo.create({ endorserId, endorsedId: endorsed.id, topic }),
            );
            // Notify the endorsed user.
            try {
                const endorser = await this.usersRepo.findOne({
                    where: { id: endorserId },
                    select: ['id', 'fullName', 'handle', 'avatar'] as any,
                });
                if (endorser) {
                    await this.notifications.create(
                        endorsed.id,
                        `${endorser.fullName} endorsed you`,
                        `@${endorser.handle ?? 'someone'} endorsed your ${topic.replace(/-/g, ' ')} expertise.`,
                        NotificationType.MENTION, // closest existing type — no separate ENDORSE enum value
                        { endorserId: endorser.id, endorserHandle: endorser.handle, endorserAvatar: endorser.avatar, topic },
                    );
                }
            } catch {}
            await this.users.invalidatePassportCache(endorsed.id);
        }

        const count = await this.endorsementsRepo.count({
            where: { endorsedId: endorsed.id, topic },
        });
        return { endorsed: true, count };
    }

    /** Toggle off. Returns { endorsed: false, count }. */
    async unendorse(endorserId: string, endorsedHandle: string, topic: string) {
        if (!isValidTopic(topic)) throw new BadRequestException('Unknown endorsement topic');
        const endorsed = await this.users.findByHandle(endorsedHandle);
        if (!endorsed) throw new NotFoundException('User not found');

        await this.endorsementsRepo.delete({ endorserId, endorsedId: endorsed.id, topic });
        await this.users.invalidatePassportCache(endorsed.id);

        const count = await this.endorsementsRepo.count({
            where: { endorsedId: endorsed.id, topic },
        });
        return { endorsed: false, count };
    }

    /** Top-N topics by endorsement count for the given user, lightweight. */
    async topForUser(userId: string, limit = 3): Promise<EndorsementSummaryRow[]> {
        const rows = await this.endorsementsRepo
            .createQueryBuilder('e')
            .select('e.topic', 'topic')
            .addSelect('COUNT(*)', 'count')
            .where('e.endorsedId = :id', { id: userId })
            .groupBy('e.topic')
            .orderBy('count', 'DESC')
            .limit(Math.min(20, Math.max(1, limit)))
            .getRawMany()
            .catch(() => [] as Array<{ topic: string; count: string }>);
        return rows.map((r: any) => ({ topic: r.topic, count: Number(r.count) }));
    }

    /** Detailed list grouped by topic with up to 5 recent endorsers per topic. */
    async listForHandle(handle: string): Promise<EndorsementGroup[]> {
        const user = await this.users.findByHandle(handle);
        if (!user) return [];
        const summary = await this.topForUser(user.id, 20);
        if (!summary.length) return [];

        // Fetch the recent endorsers for each topic in parallel.
        const groups = await Promise.all(
            summary.map(async (s) => {
                const rows = await this.endorsementsRepo.find({
                    where: { endorsedId: user.id, topic: s.topic },
                    order: { createdAt: 'DESC' },
                    take: 5,
                });
                if (!rows.length) return { ...s, recent: [] };
                const endorsers = await this.usersRepo.find({
                    where: rows.map((r) => ({ id: r.endorserId })),
                    select: ['id', 'handle', 'fullName', 'avatar'] as any,
                });
                const byId = new Map(endorsers.map((u: any) => [u.id, u]));
                return {
                    ...s,
                    recent: rows
                        .map((r) => byId.get(r.endorserId))
                        .filter(Boolean)
                        .map((u: any) => ({
                            id: u.id,
                            handle: u.handle ?? null,
                            fullName: u.fullName,
                            avatar: u.avatar || null,
                        })),
                };
            }),
        );
        return groups;
    }

    /** Which topics has the viewer already endorsed for this user? */
    async myEndorsementsFor(viewerId: string | null, handle: string): Promise<string[]> {
        if (!viewerId) return [];
        const user = await this.users.findByHandle(handle);
        if (!user || user.id === viewerId) return [];
        const rows = await this.endorsementsRepo.find({
            where: { endorserId: viewerId, endorsedId: user.id },
            select: ['topic'],
        });
        return rows.map((r) => r.topic);
    }
}
