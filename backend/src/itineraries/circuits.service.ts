import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Place } from '../places/place.entity';
import {
    CIRCUIT_BY_SLUG, CIRCUIT_TEMPLATES, CircuitAnchor, CircuitTemplate, DWELL_BY_KIND,
} from './circuits.data';

/** A resolved stop: editorial intent + a real catalog place behind it. */
export interface CircuitStop {
    placeId: string;
    slug: string;
    name: string;
    city: string;
    governorate: string;
    latitude: number;
    longitude: number;
    cover: string | null;
    rating: number;
    reviewCount: number;
    tags: string[];
    /** TND, null when the place is free or unpriced. */
    entryPrice: number | null;
    openingHours: string | null;
    kind: CircuitAnchor['kind'];
    why: string;
    priority: 1 | 2 | 3;
    minutes: number;
    slot: NonNullable<CircuitAnchor['slot']>;
    /** Straight-line km from the previous stop (0 for the first). */
    hopKm: number;
}

export interface CircuitSummary {
    slug: string;
    title: string;
    tagline: string;
    summary: string;
    theme: CircuitTemplate['theme'];
    region: CircuitTemplate['region'];
    difficulty: CircuitTemplate['difficulty'];
    defaultDays: number;
    dayRange: [number, number];
    bestMonths: number[];
    avoidMonths: CircuitTemplate['avoidMonths'];
    carFree: boolean;
    stayBandTnd: number;
    /** Sum of straight-line hops — an honest floor, real roads are longer. */
    distanceKm: number;
    stopCount: number;
    /** Cities in visiting order, de-duplicated. */
    cities: string[];
    /** Place ids in visiting order — lets the card show carnet overlap. */
    stopIds: string[];
    /** Up to 4 covers for the card collage. */
    covers: string[];
    /** Total site-entry cost per person in TND. */
    entryCostTnd: number;
    /** Total on-site minutes across every stop. */
    onSiteMinutes: number;
}

export interface CircuitDetail extends CircuitSummary {
    knowHow: string[];
    packing: string[];
    stops: CircuitStop[];
}

const R_KM = 6371;
function haversine(aLat: number, aLng: number, bLat: number, bLng: number): number {
    const toRad = (d: number) => (d * Math.PI) / 180;
    const dLat = toRad(bLat - aLat);
    const dLng = toRad(bLng - aLng);
    const s =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
    return 2 * R_KM * Math.asin(Math.min(1, Math.sqrt(s)));
}

const norm = (s: string | null | undefined) =>
    (s || '')
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .trim()
        .toLowerCase();

/** Governorate spellings drift across seeds ("Kebili" / "Kébili" / "Kbili"). */
const GOV_ALIASES: Record<string, string> = {
    kebili: 'kebili', kbili: 'kebili',
    gabes: 'gabes',
    beja: 'beja',
    medenine: 'medenine', mednine: 'medenine',
    kef: 'kef', lekef: 'kef',
    manouba: 'manouba', mannouba: 'manouba',
};
const govKey = (s: string | null | undefined) => {
    const n = norm(s);
    return GOV_ALIASES[n] || n;
};

const TTL_MS = 10 * 60 * 1000;

@Injectable()
export class CircuitsService {
    constructor(
        @InjectRepository(Place)
        private placesRepo: Repository<Place>,
    ) {}

    private cache: { at: number; details: CircuitDetail[] } | null = null;

    /** Card-level data for the directory. */
    async list(): Promise<CircuitSummary[]> {
        const all = await this.hydrateAll();
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        return all.map(({ stops, knowHow, packing, ...card }) => card);
    }

    async findOne(slug: string): Promise<CircuitDetail> {
        const all = await this.hydrateAll();
        const found = all.find((c) => c.slug === slug);
        if (!found) throw new NotFoundException('Circuit not found');
        return found;
    }

    /** Every place used by any circuit — lets the client prefetch in one call. */
    async allStopIds(): Promise<string[]> {
        const all = await this.hydrateAll();
        return [...new Set(all.flatMap((c) => c.stops.map((s) => s.placeId)))];
    }

    // ── hydration ────────────────────────────────────────────────────────

    private async hydrateAll(): Promise<CircuitDetail[]> {
        if (this.cache && Date.now() - this.cache.at < TTL_MS) return this.cache.details;

        const places = await this.placesRepo.find({
            where: { isActive: true, isApproved: true },
            select: [
                'id', 'slug', 'name', 'city', 'governorate', 'latitude', 'longitude',
                'coverImage', 'images', 'rating', 'reviewCount', 'tags',
                'entryPrice', 'avgVisitMinutes', 'openingHours',
            ],
        });

        const bySlug = new Map<string, Place>();
        const byCity = new Map<string, Place[]>();
        const byGov = new Map<string, Place[]>();
        for (const p of places) {
            if (!Number.isFinite(Number(p.latitude)) || !Number.isFinite(Number(p.longitude))) continue;
            if (p.slug) bySlug.set(p.slug, p);
            const c = norm(p.city);
            const g = govKey(p.governorate);
            if (!byCity.has(c)) byCity.set(c, []);
            byCity.get(c)!.push(p);
            if (!byGov.has(g)) byGov.set(g, []);
            byGov.get(g)!.push(p);
        }

        const details = CIRCUIT_TEMPLATES
            .map((tpl) => this.hydrateOne(tpl, bySlug, byCity, byGov))
            .filter((c): c is CircuitDetail => c !== null);

        this.cache = { at: Date.now(), details };
        return details;
    }

    private hydrateOne(
        tpl: CircuitTemplate,
        bySlug: Map<string, Place>,
        byCity: Map<string, Place[]>,
        byGov: Map<string, Place[]>,
    ): CircuitDetail | null {
        const used = new Set<string>();
        const stops: CircuitStop[] = [];

        for (const anchor of tpl.anchors) {
            const place = this.resolveAnchor(anchor, bySlug, byCity, byGov, used);
            if (!place) continue;
            used.add(place.id);

            const lat = Number(place.latitude);
            const lng = Number(place.longitude);
            const prev = stops[stops.length - 1];
            stops.push({
                placeId: place.id,
                slug: place.slug,
                name: place.name,
                city: place.city,
                governorate: place.governorate,
                latitude: lat,
                longitude: lng,
                cover: place.coverImage || place.images?.[0] || null,
                rating: Number(place.rating) || 0,
                reviewCount: place.reviewCount || 0,
                tags: place.tags || [],
                entryPrice: place.entryPrice != null ? Number(place.entryPrice) : null,
                openingHours: place.openingHours || null,
                kind: anchor.kind,
                why: anchor.why,
                priority: anchor.priority,
                minutes: anchor.minutes ?? place.avgVisitMinutes ?? DWELL_BY_KIND[anchor.kind],
                slot: anchor.slot ?? 'midday',
                hopKm: prev ? Math.round(haversine(prev.latitude, prev.longitude, lat, lng)) : 0,
            });
        }

        // A circuit with fewer than three real stops is not a circuit — hide it
        // rather than ship a two-pin route that looks broken.
        if (stops.length < 3) return null;

        const cities: string[] = [];
        for (const s of stops) if (!cities.includes(s.city)) cities.push(s.city);

        return {
            slug: tpl.slug,
            title: tpl.title,
            tagline: tpl.tagline,
            summary: tpl.summary,
            theme: tpl.theme,
            region: tpl.region,
            difficulty: tpl.difficulty,
            defaultDays: tpl.defaultDays,
            dayRange: tpl.dayRange,
            bestMonths: tpl.bestMonths,
            avoidMonths: tpl.avoidMonths,
            carFree: tpl.carFree,
            stayBandTnd: tpl.stayBandTnd,
            distanceKm: stops.reduce((sum, s) => sum + s.hopKm, 0),
            stopCount: stops.length,
            cities,
            stopIds: stops.map((s) => s.placeId),
            covers: stops.map((s) => s.cover).filter((c): c is string => !!c).slice(0, 4),
            entryCostTnd: stops.reduce((sum, s) => sum + (s.entryPrice || 0), 0),
            onSiteMinutes: stops.reduce((sum, s) => sum + s.minutes, 0),
            knowHow: tpl.knowHow,
            packing: tpl.packing,
            stops,
        };
    }

    /**
     * Preferred slug → best tag match in the city → best in the city →
     * best tag match in the governorate. Anything already used in this
     * circuit is skipped so a route never visits the same place twice.
     */
    private resolveAnchor(
        anchor: CircuitAnchor,
        bySlug: Map<string, Place>,
        byCity: Map<string, Place[]>,
        byGov: Map<string, Place[]>,
        used: Set<string>,
    ): Place | null {
        for (const slug of anchor.prefer || []) {
            const p = bySlug.get(slug);
            if (p && !used.has(p.id)) return p;
        }

        const wanted = (anchor.tags || []).map(norm);
        const score = (p: Place) => {
            const tags = (p.tags || []).map(norm);
            const hits = wanted.filter((w) => tags.some((t) => t.includes(w) || w.includes(t))).length;
            // Tag fit dominates; rating and review volume break ties.
            return hits * 100 + Number(p.rating || 0) * 10 + Math.min(20, (p.reviewCount || 0) / 25);
        };
        const best = (pool: Place[] | undefined, requireTag: boolean) => {
            if (!pool?.length) return null;
            const eligible = pool
                .filter((p) => !used.has(p.id))
                .filter((p) => !requireTag || score(p) >= 100);
            if (!eligible.length) return null;
            return eligible.reduce((a, b) => (score(b) > score(a) ? b : a));
        };

        const city = byCity.get(norm(anchor.city));
        const gov = byGov.get(govKey(anchor.governorate));
        return (
            best(city, true) ||
            best(gov, true) ||
            best(city, false) ||
            best(gov, false)
        );
    }
}

export { CIRCUIT_BY_SLUG };
