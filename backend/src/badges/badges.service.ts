import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { Post } from '../posts/post.entity';
import { BADGE_DEFINITIONS, BadgeEvent, BadgeDefinition } from './badge-definitions';

const BADGE_BY_ID: Record<string, BadgeDefinition> =
    Object.fromEntries(BADGE_DEFINITIONS.map((d) => [d.id, d]));

@Injectable()
export class BadgesService {
    private readonly logger = new Logger(BadgesService.name);

    constructor(
        @InjectRepository(User) private usersRepo: Repository<User>,
        @InjectRepository(Post) private postsRepo: Repository<Post>,
    ) {}

    /** Award any eligible badges for this event. Idempotent. Returns the list of newly-awarded badge ids. */
    async awardIfEligible(userId: string, event: BadgeEvent, payload: any = {}): Promise<string[]> {
        if (!userId) return [];
        const user = await this.usersRepo.findOne({ where: { id: userId } });
        if (!user) return [];

        const current = Array.isArray(user.badges) ? user.badges : [];
        const awarded: string[] = [];
        let extraPoints = 0;

        for (const def of BADGE_DEFINITIONS) {
            if (def.eligible(event, payload, current.concat(awarded))) {
                awarded.push(def.id);
                extraPoints += def.points;
            }
        }

        if (awarded.length === 0) return [];

        user.badges = current.concat(awarded);
        user.points = (user.points || 0) + extraPoints;
        await this.usersRepo.save(user);

        // Publish a celebratory achievement card into the feed (others can react to
        // it — social proof). Best-effort: never let this break the award itself.
        this.publishAchievementPost(user, awarded, extraPoints).catch((e) =>
            this.logger.warn(`Achievement post failed for ${userId}: ${e?.message}`),
        );

        return awarded;
    }

    /** Auto-generated 'achievement' feed post celebrating newly-earned badges. */
    private async publishAchievementPost(user: User, badgeIds: string[], points: number): Promise<void> {
        const defs = badgeIds.map((id) => BADGE_BY_ID[id]).filter(Boolean);
        if (defs.length === 0) return;
        const names = defs.map((d) => d.label);
        const title = defs.length === 1
            ? `Earned the “${names[0]}” badge`
            : `Earned ${defs.length} new badges`;
        const body = defs.map((d) => `🏅 ${d.label} — ${d.description}`).join('\n');
        await this.postsRepo.save(this.postsRepo.create({
            kind: 'achievement',
            category: 'achievement',
            title,
            body,
            authorId: user.id,
            meta: {
                type: 'badge',
                points,
                badges: defs.map((d) => ({ id: d.id, label: d.label, description: d.description, points: d.points })),
            },
        }));
    }
}
