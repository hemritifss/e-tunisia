import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import { RedisService } from '../redis/redis.service';

/**
 * Real road routing for trips — no more straight lines between stops.
 *
 * Providers:
 *  - OSRM (default, keyless): OSRM_URL env or the public demo server.
 *    /route  → actual road geometry + per-leg distance/duration
 *    /trip   → traveling-salesman: the stop ORDER that minimizes driving
 *  - Mapbox (optional): set MAPBOX_TOKEN and ROUTING_PROVIDER=mapbox to use
 *    Directions + Optimized Trips instead (higher rate limits, traffic aware).
 *
 * Every result is cached in Redis for a week — roads don't move, so a given
 * set of stops costs one upstream call ever.
 */

export interface RouteLeg { distanceM: number; durationS: number }
export interface RouteResult {
    distanceM: number;
    durationS: number;
    legs: RouteLeg[];
    /** [lng, lat] pairs of the road geometry, ready for Leaflet (after swap). */
    geometry: [number, number][];
}
export interface OptimizeResult extends RouteResult {
    /** For input stop i, order[i] = its position in the optimized sequence. */
    order: number[];
}

const CACHE_TTL_S = 7 * 24 * 3600;
const MAX_COORDS = 25;
const FETCH_TIMEOUT_MS = 8000;

@Injectable()
export class RoutingService {
    private readonly logger = new Logger(RoutingService.name);

    constructor(
        private readonly config: ConfigService,
        private readonly redis: RedisService,
    ) {}

    private get osrmBase(): string {
        return (this.config.get<string>('OSRM_URL') || 'https://router.project-osrm.org').replace(/\/+$/, '');
    }

    private get mapboxToken(): string | null {
        return this.config.get<string>('MAPBOX_TOKEN') || null;
    }

    private get useMapbox(): boolean {
        return this.config.get<string>('ROUTING_PROVIDER') === 'mapbox' && !!this.mapboxToken;
    }

    /** "lng,lat;lng,lat;…" → validated coord pairs. */
    parseCoords(raw: string): [number, number][] {
        const pairs = String(raw || '').split(';').map((p) => p.split(',').map(Number)) as [number, number][];
        if (pairs.length < 2 || pairs.length > MAX_COORDS) {
            throw new BadRequestException(`coords must contain 2–${MAX_COORDS} points`);
        }
        for (const [lng, lat] of pairs) {
            if (!Number.isFinite(lng) || !Number.isFinite(lat) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
                throw new BadRequestException('coords must be "lng,lat;lng,lat;…"');
            }
        }
        return pairs;
    }

    private async fetchJson(url: string): Promise<any> {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
        try {
            const res = await fetch(url, {
                signal: ctrl.signal,
                headers: { 'User-Agent': 'e-tunisia/1.0 (trip routing)' },
            });
            if (!res.ok) throw new Error(`routing upstream HTTP ${res.status}`);
            return await res.json();
        } finally {
            clearTimeout(timer);
        }
    }

    private cacheKey(kind: string, coords: [number, number][]): string {
        const h = createHash('sha1')
            .update(coords.map((c) => c.map((n) => n.toFixed(5)).join(',')).join(';'))
            .digest('hex').slice(0, 16);
        return `routing:${this.useMapbox ? 'mb' : 'osrm'}:${kind}:${h}`;
    }

    async route(coords: [number, number][]): Promise<RouteResult> {
        const key = this.cacheKey('route', coords);
        const cached = await this.redis.getJson<RouteResult>(key).catch(() => null);
        if (cached) return cached;

        const path = coords.map((c) => c.join(',')).join(';');
        const url = this.useMapbox
            ? `https://api.mapbox.com/directions/v5/mapbox/driving/${path}?overview=full&geometries=geojson&access_token=${this.mapboxToken}`
            : `${this.osrmBase}/route/v1/driving/${path}?overview=full&geometries=geojson&steps=false`;

        const json = await this.fetchJson(url);
        const r = json?.routes?.[0];
        if (!r) throw new BadRequestException('No drivable route found between these stops');

        const out: RouteResult = {
            distanceM: Math.round(r.distance),
            durationS: Math.round(r.duration),
            legs: (r.legs || []).map((l: any) => ({ distanceM: Math.round(l.distance), durationS: Math.round(l.duration) })),
            geometry: r.geometry?.coordinates || [],
        };
        await this.redis.setJson(key, out, CACHE_TTL_S).catch(() => {});
        return out;
    }

    /**
     * Best visiting ORDER for the given stops (first stop stays first — the
     * tourist starts where they start), then the real route in that order.
     */
    async optimize(coords: [number, number][]): Promise<OptimizeResult> {
        const key = this.cacheKey('trip', coords);
        const cached = await this.redis.getJson<OptimizeResult>(key).catch(() => null);
        if (cached) return cached;

        const path = coords.map((c) => c.join(',')).join(';');
        const url = this.useMapbox
            ? `https://api.mapbox.com/optimized-trips/v1/mapbox/driving/${path}?source=first&destination=any&roundtrip=false&overview=full&geometries=geojson&access_token=${this.mapboxToken}`
            : `${this.osrmBase}/trip/v1/driving/${path}?source=first&destination=any&roundtrip=false&overview=full&geometries=geojson&steps=false`;

        const json = await this.fetchJson(url);
        const trip = json?.trips?.[0];
        const waypoints = json?.waypoints;
        if (!trip || !Array.isArray(waypoints)) {
            throw new BadRequestException('Could not optimize this set of stops');
        }

        const out: OptimizeResult = {
            distanceM: Math.round(trip.distance),
            durationS: Math.round(trip.duration),
            legs: (trip.legs || []).map((l: any) => ({ distanceM: Math.round(l.distance), durationS: Math.round(l.duration) })),
            geometry: trip.geometry?.coordinates || [],
            order: waypoints.map((w: any) => w.waypoint_index),
        };
        await this.redis.setJson(key, out, CACHE_TTL_S).catch(() => {});
        return out;
    }
}
