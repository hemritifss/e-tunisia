import { DataSource } from 'typeorm';
import { PlaceVisit } from './place-visit.entity';
import { User } from './user.entity';
import { Place } from '../places/place.entity';

/**
 * One-shot, idempotent backfill: populate place_visits from every user's
 * `visitedPlaceIds` simple-array. Runs only when place_visits is empty (the first
 * boot after introducing the table) so honest rarity reflects historical visits too.
 * After that, toggleVisited() dual-writes keep it live.
 */
export async function backfillPlaceVisits(ds: DataSource): Promise<number> {
    const pvRepo = ds.getRepository(PlaceVisit);
    if ((await pvRepo.count()) > 0) return 0; // already populated

    const users = await ds.getRepository(User).find({ select: ['id', 'visitedPlaceIds'] as any });
    const places = await ds.getRepository(Place).find({ select: ['id', 'city'] as any });
    const cityById = new Map(places.map((p) => [p.id, p.city]));

    const rows: Partial<PlaceVisit>[] = [];
    for (const u of users) {
        const ids = Array.isArray((u as any).visitedPlaceIds) ? (u as any).visitedPlaceIds : [];
        for (const pid of ids) {
            if (pid) rows.push({ userId: u.id, placeId: pid, city: cityById.get(pid) ?? null });
        }
    }
    if (rows.length === 0) return 0;
    await pvRepo.createQueryBuilder().insert().values(rows).orIgnore().execute();
    return rows.length;
}
