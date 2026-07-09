/**
 * Deduplicate places created by overlapping seed runs (Dougga, Great Mosque of
 * Kairouan, Matmata, Ichkeul, …). For each group of duplicates it keeps the
 * richest row, re-points EVERY child reference (reviews, saves, visits, posts,
 * inquiries, bookings, collections, itineraries, trips …) onto the keeper, then
 * deletes the losers and recomputes the keeper's rating/reviewCount.
 *
 * SAFE BY DEFAULT: prints the merge plan and per-table counts but writes nothing.
 * Re-run with --apply to perform the merge inside a single transaction.
 *
 *   # from backend/
 *   npx ts-node scripts/dedup-places.ts            # dry run (plan only)
 *   npx ts-node scripts/dedup-places.ts --apply    # execute the merge
 *
 * Grouping key = normalized name + governorate, further gated by geographic
 * proximity so two genuinely different places that happen to share a name in the
 * same governorate are never merged.
 */
import 'reflect-metadata';
import { AppDataSource } from '../src/database/data-source';
import type { QueryRunner } from 'typeorm';

const APPLY = process.argv.includes('--apply');

// Max distance (degrees, ~2.2 km) between two rows to treat them as the same place.
const PROXIMITY_DEG = 0.02;

// Child tables holding a scalar "placeId" FK — a plain re-point is safe.
const SCALAR_FK: Array<{ table: string; col: string }> = [
  { table: 'reviews', col: 'placeId' },
  { table: 'place_inquiries', col: 'placeId' },
  { table: 'bookings', col: 'placeId' },
  { table: 'events', col: 'placeId' },
  { table: 'inventory_items', col: 'placeId' },
  { table: 'tour_packages', col: 'placeId' },
  { table: 'posts', col: 'placeId' },
  { table: 'activities', col: 'placeId' },
];

// simple-array columns (comma-joined text) holding place ids.
const ARRAY_COLS: Array<{ table: string; col: string }> = [
  { table: 'users', col: 'favoriteIds' },
  { table: 'users', col: 'visitedPlaceIds' },
  { table: 'collections', col: 'placeIds' },
  { table: 'itineraries', col: 'placeIds' },
];

interface PlaceRow {
  id: string;
  name: string;
  governorate: string;
  city: string;
  reviewCount: number;
  images: string | null;
  description: string | null;
  latitude: string | null;
  longitude: string | null;
  createdAt: Date;
}

const norm = (s: string | null | undefined) =>
  (s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip combining diacritics
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

const imgCount = (v: string | null) => (v ? v.split(',').filter(Boolean).length : 0);

function near(a: PlaceRow, b: PlaceRow): boolean {
  if (!a.latitude || !a.longitude || !b.latitude || !b.longitude) return true; // missing coords → don't block
  const dLat = Math.abs(Number(a.latitude) - Number(b.latitude));
  const dLon = Math.abs(Number(a.longitude) - Number(b.longitude));
  return dLat <= PROXIMITY_DEG && dLon <= PROXIMITY_DEG;
}

/** Keeper = most reviews, then most images, then longest description, then oldest. */
function pickKeeper(rows: PlaceRow[]): PlaceRow {
  return [...rows].sort((a, b) =>
    (b.reviewCount - a.reviewCount) ||
    (imgCount(b.images) - imgCount(a.images)) ||
    ((b.description?.length || 0) - (a.description?.length || 0)) ||
    (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
  )[0];
}

async function replaceInSimpleArray(qr: QueryRunner, table: string, col: string, loser: string, keeper: string) {
  const rows: Array<{ id: string; val: string | null }> = await qr.query(
    `SELECT id, "${col}" AS val FROM "${table}" WHERE "${col}" LIKE $1`, [`%${loser}%`],
  );
  let n = 0;
  for (const r of rows) {
    const arr = String(r.val || '').split(',').filter(Boolean);
    if (!arr.includes(loser)) continue;
    const next = Array.from(new Set(arr.map((x) => (x === loser ? keeper : x))));
    await qr.query(`UPDATE "${table}" SET "${col}" = $1 WHERE id = $2`, [next.join(','), r.id]);
    n++;
  }
  return n;
}

async function replaceInJson(
  qr: QueryRunner, table: string, col: string, loser: string, keeper: string,
  mutate: (data: any) => boolean,
) {
  const rows: Array<{ id: string; val: any }> = await qr.query(
    `SELECT id, "${col}" AS val FROM "${table}" WHERE "${col}"::text LIKE $1`, [`%${loser}%`],
  );
  let n = 0;
  for (const r of rows) {
    let data = r.val;
    if (typeof data === 'string') { try { data = JSON.parse(data); } catch { continue; } }
    if (mutate(data)) {
      await qr.query(`UPDATE "${table}" SET "${col}" = $1 WHERE id = $2`, [JSON.stringify(data), r.id]);
      n++;
    }
  }
  return n;
}

async function main() {
  await AppDataSource.initialize();
  console.log(`\n=== Place dedup (${APPLY ? 'APPLY' : 'DRY RUN'}) ===\n`);

  const places: PlaceRow[] = await AppDataSource.query(
    `SELECT id, name, governorate, city, "reviewCount", images, description, latitude, longitude, "createdAt" FROM places`,
  );

  // Group by normalized name + governorate.
  const groups = new Map<string, PlaceRow[]>();
  for (const p of places) {
    const key = `${norm(p.name)}|${norm(p.governorate)}`;
    (groups.get(key) || groups.set(key, []).get(key)!).push(p);
  }

  // Build a merge plan: keeper + proximity-gated losers.
  const plan: Array<{ keeper: PlaceRow; losers: PlaceRow[] }> = [];
  for (const rows of groups.values()) {
    if (rows.length < 2) continue;
    const keeper = pickKeeper(rows);
    const losers = rows.filter((r) => r.id !== keeper.id && near(keeper, r));
    if (losers.length) plan.push({ keeper, losers });
  }

  if (!plan.length) {
    console.log('No duplicate places found. Nothing to do.\n');
    await AppDataSource.destroy();
    return;
  }

  for (const { keeper, losers } of plan) {
    console.log(`• "${keeper.name}" (${keeper.city}, ${keeper.governorate})`);
    console.log(`    keep  ${keeper.id}  [${keeper.reviewCount} reviews, ${imgCount(keeper.images)} imgs]`);
    for (const l of losers) {
      const counts: string[] = [];
      for (const { table, col } of SCALAR_FK) {
        const [{ c }] = await AppDataSource.query(
          `SELECT count(*)::int AS c FROM "${table}" WHERE "${col}" = $1`, [l.id],
        );
        if (c > 0) counts.push(`${table}:${c}`);
      }
      const [{ c: visits }] = await AppDataSource.query(
        `SELECT count(*)::int AS c FROM place_visits WHERE "placeId" = $1`, [l.id],
      );
      if (visits > 0) counts.push(`place_visits:${visits}`);
      console.log(`    merge ${l.id}  → ${counts.length ? counts.join(', ') : 'no child rows'}`);
    }
  }

  if (!APPLY) {
    console.log(`\nDRY RUN — ${plan.length} group(s) would be merged. Re-run with --apply to execute.\n`);
    await AppDataSource.destroy();
    return;
  }

  const qr = AppDataSource.createQueryRunner();
  await qr.connect();
  await qr.startTransaction();
  try {
    let mergedPlaces = 0;
    const touchedKeepers = new Set<string>();
    for (const { keeper, losers } of plan) {
      for (const l of losers) {
        // 1) scalar FK tables
        for (const { table, col } of SCALAR_FK) {
          await qr.query(`UPDATE "${table}" SET "${col}" = $1 WHERE "${col}" = $2`, [keeper.id, l.id]);
        }
        // 2) place_visits — unique (userId, placeId): drop colliding rows, then re-point
        await qr.query(
          `DELETE FROM place_visits pv WHERE pv."placeId" = $1
             AND EXISTS (SELECT 1 FROM place_visits k WHERE k."userId" = pv."userId" AND k."placeId" = $2)`,
          [l.id, keeper.id],
        );
        await qr.query(`UPDATE place_visits SET "placeId" = $1 WHERE "placeId" = $2`, [keeper.id, l.id]);
        // 3) simple-array columns
        for (const { table, col } of ARRAY_COLS) {
          await replaceInSimpleArray(qr, table, col, l.id, keeper.id);
        }
        // 4) simple-json: itinerary day plans + trip-plan stops
        await replaceInJson(qr, 'itineraries', 'days', l.id, keeper.id, (days: any[]) => {
          let ch = false;
          for (const d of days || []) {
            if (Array.isArray(d.placeIds) && d.placeIds.includes(l.id)) {
              d.placeIds = Array.from(new Set(d.placeIds.map((x: string) => (x === l.id ? keeper.id : x))));
              ch = true;
            }
          }
          return ch;
        });
        await replaceInJson(qr, 'trip_plans', 'stops', l.id, keeper.id, (stops: any[]) => {
          let ch = false;
          for (const s of stops || []) {
            if (s.placeId === l.id) { s.placeId = keeper.id; ch = true; }
          }
          return ch;
        });
        // 5) delete the loser place
        await qr.query(`DELETE FROM places WHERE id = $1`, [l.id]);
        mergedPlaces++;
      }
      touchedKeepers.add(keeper.id);
    }

    // Recompute rating + reviewCount for every keeper that absorbed rows.
    for (const id of touchedKeepers) {
      await qr.query(
        `UPDATE places SET
           "reviewCount" = (SELECT count(*) FROM reviews WHERE "placeId" = $1),
           rating = COALESCE((SELECT round(avg(rating)::numeric, 1) FROM reviews WHERE "placeId" = $1), 0)
         WHERE id = $1`,
        [id],
      );
    }

    await qr.commitTransaction();
    console.log(`\nAPPLIED — merged ${mergedPlaces} duplicate place(s) into ${touchedKeepers.size} keeper(s).\n`);
  } catch (err) {
    await qr.rollbackTransaction();
    console.error('\nMerge failed — rolled back. No changes written.\n', err);
    process.exitCode = 1;
  } finally {
    await qr.release();
    await AppDataSource.destroy();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
