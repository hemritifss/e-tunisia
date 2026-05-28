"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.backfillPlaceVisits = backfillPlaceVisits;
const place_visit_entity_1 = require("./place-visit.entity");
const user_entity_1 = require("./user.entity");
const place_entity_1 = require("../places/place.entity");
async function backfillPlaceVisits(ds) {
    const pvRepo = ds.getRepository(place_visit_entity_1.PlaceVisit);
    if ((await pvRepo.count()) > 0)
        return 0;
    const users = await ds.getRepository(user_entity_1.User).find({ select: ['id', 'visitedPlaceIds'] });
    const places = await ds.getRepository(place_entity_1.Place).find({ select: ['id', 'city'] });
    const cityById = new Map(places.map((p) => [p.id, p.city]));
    const rows = [];
    for (const u of users) {
        const ids = Array.isArray(u.visitedPlaceIds) ? u.visitedPlaceIds : [];
        for (const pid of ids) {
            if (pid)
                rows.push({ userId: u.id, placeId: pid, city: cityById.get(pid) ?? null });
        }
    }
    if (rows.length === 0)
        return 0;
    await pvRepo.createQueryBuilder().insert().values(rows).orIgnore().execute();
    return rows.length;
}
//# sourceMappingURL=backfill-place-visits.js.map