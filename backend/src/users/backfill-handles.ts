import { Repository } from 'typeorm';
import { User } from './user.entity';
import { HANDLE_PATTERN, RESERVED_HANDLES } from './reserved-handles';

/** Generate a candidate handle from a fullName.
 *  Lowercase, ascii-only, 3-30 chars, must start with a letter. */
function candidateFromName(fullName: string): string {
    const base = (fullName || 'traveler')
        .toLowerCase()
        .normalize('NFKD')
        .replace(/[^\x00-\x7f]/g, '')
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .replace(/^[^a-z]+/, 't_');
    let trimmed = base.slice(0, 22) || 'traveler';
    if (trimmed.length < 3) trimmed = trimmed + '_t';
    return trimmed;
}

function randomSuffix(): string {
    return Math.random().toString(36).slice(2, 6);
}

/** Idempotent: only updates users where handle IS NULL. Returns count filled. */
export async function backfillHandles(repo: Repository<User>): Promise<number> {
    const pending = await repo.createQueryBuilder('u')
        .select(['u.id', 'u.fullName'])
        .where('u.handle IS NULL')
        .getMany();
    if (!pending.length) return 0;

    let filled = 0;
    for (const u of pending) {
        let candidate = candidateFromName(u.fullName);
        for (let i = 0; i < 8; i++) {
            const final = candidate;
            if (HANDLE_PATTERN.test(final) && !RESERVED_HANDLES.has(final)) {
                const clash = await repo.findOne({ where: { handle: final } });
                if (!clash) {
                    await repo.update(u.id, { handle: final });
                    filled++;
                    break;
                }
            }
            candidate = candidateFromName(u.fullName) + '_' + randomSuffix();
        }
    }
    return filled;
}
