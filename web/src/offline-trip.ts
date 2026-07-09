// ============================================
// OFFLINE TRIP — proactively warm the runtime caches (Tier 2.3)
// ============================================
// The service worker caches trip data, place data, uploads and map tiles as they
// are viewed. This warms them ahead of time for a specific trip so it works fully
// offline on the road: place pages + the map tiles covering the route.

const TILE_HOSTS = ['a', 'b', 'c', 'd'];
const MAX_TILES_PER_ZOOM = 80; // keep a "download" bounded and wifi-friendly

interface Bbox { minLat: number; maxLat: number; minLng: number; maxLng: number; }

function lonToTileX(lon: number, z: number): number {
  return Math.floor(((lon + 180) / 360) * 2 ** z);
}
function latToTileY(lat: number, z: number): number {
  const r = (lat * Math.PI) / 180;
  return Math.floor(((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * 2 ** z);
}

/** Tile [x,y] coords covering a bbox at zoom z, padded by one and capped. */
function tilesForBbox(b: Bbox, z: number): Array<[number, number]> {
  const x0 = lonToTileX(b.minLng, z) - 1, x1 = lonToTileX(b.maxLng, z) + 1;
  const y0 = latToTileY(b.maxLat, z) - 1, y1 = latToTileY(b.minLat, z) + 1;
  const out: Array<[number, number]> = [];
  for (let x = x0; x <= x1; x++) {
    for (let y = y0; y <= y1; y++) {
      if (x >= 0 && y >= 0) out.push([x, y]);
      if (out.length >= MAX_TILES_PER_ZOOM) return out;
    }
  }
  return out;
}

/**
 * Warm caches for a trip so it opens offline. Best-effort: failures are ignored
 * (the SW keeps whatever it managed to fetch). Returns when done.
 */
export async function prefetchTripOffline(trip: any): Promise<void> {
  const tasks: Promise<any>[] = [];
  const stops: any[] = Array.isArray(trip?.stops) ? trip.stops : [];

  // 1) Place data (also pulls covers into the 'uploads' cache when rendered).
  const placeIds = Array.from(new Set(stops.map((s) => s.placeId).filter(Boolean)));
  for (const id of placeIds) {
    tasks.push(fetch(`/api/v1/places/${encodeURIComponent(id)}`).catch(() => {}));
  }

  // 2) Map tiles covering the route bbox at a few zoom levels.
  const coords = stops
    .filter((s) => Number.isFinite(Number(s.latitude)) && Number.isFinite(Number(s.longitude)))
    .map((s) => [Number(s.latitude), Number(s.longitude)] as [number, number]);
  if (coords.length) {
    const lats = coords.map((c) => c[0]);
    const lngs = coords.map((c) => c[1]);
    const bbox: Bbox = {
      minLat: Math.min(...lats), maxLat: Math.max(...lats),
      minLng: Math.min(...lngs), maxLng: Math.max(...lngs),
    };
    let h = 0;
    for (const z of [7, 9, 11]) {
      for (const [x, y] of tilesForBbox(bbox, z)) {
        const host = TILE_HOSTS[h++ % TILE_HOSTS.length];
        tasks.push(fetch(`https://${host}.basemaps.cartocdn.com/rastertiles/voyager/${z}/${x}/${y}.png`).catch(() => {}));
      }
    }
  }

  await Promise.allSettled(tasks);
}
