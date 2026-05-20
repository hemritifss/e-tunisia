"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.backfillHandles = backfillHandles;
const reserved_handles_1 = require("./reserved-handles");
function candidateFromName(fullName) {
    const base = (fullName || 'traveler')
        .toLowerCase()
        .normalize('NFKD')
        .replace(/[^\x00-\x7f]/g, '')
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .replace(/^[^a-z]+/, 't_');
    let trimmed = base.slice(0, 22) || 'traveler';
    if (trimmed.length < 3)
        trimmed = trimmed + '_t';
    return trimmed;
}
function randomSuffix() {
    return Math.random().toString(36).slice(2, 6);
}
async function backfillHandles(repo) {
    const pending = await repo.createQueryBuilder('u')
        .select(['u.id', 'u.fullName'])
        .where('u.handle IS NULL')
        .getMany();
    if (!pending.length)
        return 0;
    let filled = 0;
    for (const u of pending) {
        let candidate = candidateFromName(u.fullName);
        for (let i = 0; i < 8; i++) {
            const final = candidate;
            if (reserved_handles_1.HANDLE_PATTERN.test(final) && !reserved_handles_1.RESERVED_HANDLES.has(final)) {
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
//# sourceMappingURL=backfill-handles.js.map