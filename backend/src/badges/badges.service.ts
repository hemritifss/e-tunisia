import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { BADGE_DEFINITIONS, BadgeEvent } from './badge-definitions';

@Injectable()
export class BadgesService {
    constructor(
        @InjectRepository(User) private usersRepo: Repository<User>,
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
        return awarded;
    }
}
