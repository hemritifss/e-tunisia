"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var RoutingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoutingService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const crypto_1 = require("crypto");
const redis_service_1 = require("../redis/redis.service");
const CACHE_TTL_S = 7 * 24 * 3600;
const MAX_COORDS = 25;
const FETCH_TIMEOUT_MS = 8000;
let RoutingService = RoutingService_1 = class RoutingService {
    constructor(config, redis) {
        this.config = config;
        this.redis = redis;
        this.logger = new common_1.Logger(RoutingService_1.name);
    }
    get osrmBase() {
        return (this.config.get('OSRM_URL') || 'https://router.project-osrm.org').replace(/\/+$/, '');
    }
    get mapboxToken() {
        return this.config.get('MAPBOX_TOKEN') || null;
    }
    get useMapbox() {
        return this.config.get('ROUTING_PROVIDER') === 'mapbox' && !!this.mapboxToken;
    }
    parseCoords(raw) {
        const pairs = String(raw || '').split(';').map((p) => p.split(',').map(Number));
        if (pairs.length < 2 || pairs.length > MAX_COORDS) {
            throw new common_1.BadRequestException(`coords must contain 2–${MAX_COORDS} points`);
        }
        for (const [lng, lat] of pairs) {
            if (!Number.isFinite(lng) || !Number.isFinite(lat) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
                throw new common_1.BadRequestException('coords must be "lng,lat;lng,lat;…"');
            }
        }
        return pairs;
    }
    async fetchJson(url) {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
        try {
            const res = await fetch(url, {
                signal: ctrl.signal,
                headers: { 'User-Agent': 'e-tunisia/1.0 (trip routing)' },
            });
            if (!res.ok)
                throw new Error(`routing upstream HTTP ${res.status}`);
            return await res.json();
        }
        finally {
            clearTimeout(timer);
        }
    }
    cacheKey(kind, coords) {
        const h = (0, crypto_1.createHash)('sha1')
            .update(coords.map((c) => c.map((n) => n.toFixed(5)).join(',')).join(';'))
            .digest('hex').slice(0, 16);
        return `routing:${this.useMapbox ? 'mb' : 'osrm'}:${kind}:${h}`;
    }
    async route(coords) {
        const key = this.cacheKey('route', coords);
        const cached = await this.redis.getJson(key).catch(() => null);
        if (cached)
            return cached;
        const path = coords.map((c) => c.join(',')).join(';');
        const url = this.useMapbox
            ? `https://api.mapbox.com/directions/v5/mapbox/driving/${path}?overview=full&geometries=geojson&access_token=${this.mapboxToken}`
            : `${this.osrmBase}/route/v1/driving/${path}?overview=full&geometries=geojson&steps=false`;
        const json = await this.fetchJson(url);
        const r = json?.routes?.[0];
        if (!r)
            throw new common_1.BadRequestException('No drivable route found between these stops');
        const out = {
            distanceM: Math.round(r.distance),
            durationS: Math.round(r.duration),
            legs: (r.legs || []).map((l) => ({ distanceM: Math.round(l.distance), durationS: Math.round(l.duration) })),
            geometry: r.geometry?.coordinates || [],
        };
        await this.redis.setJson(key, out, CACHE_TTL_S).catch(() => { });
        return out;
    }
    async optimize(coords) {
        const key = this.cacheKey('trip', coords);
        const cached = await this.redis.getJson(key).catch(() => null);
        if (cached)
            return cached;
        const path = coords.map((c) => c.join(',')).join(';');
        const url = this.useMapbox
            ? `https://api.mapbox.com/optimized-trips/v1/mapbox/driving/${path}?source=first&destination=any&roundtrip=false&overview=full&geometries=geojson&access_token=${this.mapboxToken}`
            : `${this.osrmBase}/trip/v1/driving/${path}?source=first&destination=any&roundtrip=false&overview=full&geometries=geojson&steps=false`;
        const json = await this.fetchJson(url);
        const trip = json?.trips?.[0];
        const waypoints = json?.waypoints;
        if (!trip || !Array.isArray(waypoints)) {
            throw new common_1.BadRequestException('Could not optimize this set of stops');
        }
        const out = {
            distanceM: Math.round(trip.distance),
            durationS: Math.round(trip.duration),
            legs: (trip.legs || []).map((l) => ({ distanceM: Math.round(l.distance), durationS: Math.round(l.duration) })),
            geometry: trip.geometry?.coordinates || [],
            order: waypoints.map((w) => w.waypoint_index),
        };
        await this.redis.setJson(key, out, CACHE_TTL_S).catch(() => { });
        return out;
    }
    haversineKm(a, b) {
        const [lng1, lat1] = a, [lng2, lat2] = b;
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const s = Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
        return 2 * R * Math.asin(Math.sqrt(s));
    }
    costRange(mid) {
        return { lowTnd: Math.max(1, Math.round(mid * 0.85)), highTnd: Math.max(2, Math.round(mid * 1.2)) };
    }
    transportEstimate(from, to, fromCity, toCity) {
        const straightKm = this.haversineKm(from, to);
        const roadKm = Math.max(1, Math.round(straightKm * 1.25));
        const driveMin = Math.round((roadKm / 80) * 60);
        const norm = (s) => (s || '').trim().toLowerCase();
        const railPair = RoutingService_1.RAIL_CITIES.has(norm(fromCity)) &&
            RoutingService_1.RAIL_CITIES.has(norm(toCity)) && norm(fromCity) !== norm(toCity);
        const options = [];
        options.push({ mode: 'drive', label: 'Car', durationMin: driveMin, note: 'Fastest, door to door' });
        options.push({
            mode: 'louage', label: 'Louage (shared taxi)', durationMin: Math.round(driveMin * 1.15),
            cost: this.costRange(roadKm * 0.08), note: 'Leaves when full from the louage station',
        });
        options.push({
            mode: 'bus', label: 'Bus (SNTRI)', durationMin: Math.round(driveMin * 1.35),
            cost: this.costRange(roadKm * 0.055), note: 'Cheapest; scheduled departures',
        });
        if (railPair) {
            options.push({
                mode: 'train', label: 'Train (SNCFT)', durationMin: Math.round(driveMin * 1.25),
                cost: this.costRange(roadKm * 0.05), note: 'Comfortable on the coastal line',
            });
        }
        if (roadKm <= 4) {
            options.push({
                mode: 'walk', label: 'Walk', durationMin: Math.round((roadKm / 4.5) * 60),
                cost: { lowTnd: 0, highTnd: 0 }, note: 'Perfect for medina distances',
            });
        }
        return { distanceKm: roadKm, straightKm: Math.round(straightKm), options };
    }
};
exports.RoutingService = RoutingService;
RoutingService.RAIL_CITIES = new Set([
    'tunis', 'bizerte', 'borj cedria', 'hammam lif', 'nabeul', 'dar chaabane',
    'sousse', 'monastir', 'mahdia', 'el jem', 'sfax', 'gabes', 'gabès',
    'gafsa', 'metlaoui', 'moularès', 'redeyef',
]);
exports.RoutingService = RoutingService = RoutingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        redis_service_1.RedisService])
], RoutingService);
//# sourceMappingURL=routing.service.js.map