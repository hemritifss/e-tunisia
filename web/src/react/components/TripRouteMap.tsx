import React, { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Map as MapIcon, Route, Wand2, Car } from 'lucide-react';
import * as api from '../../api';
import { useT } from '../../i18n/useT';

/**
 * The tourist's trip on real Tunisian roads.
 *
 * - Road geometry, distance and drive time come from the backend routing
 *   proxy (OSRM by default, Mapbox when configured) — never straight lines
 *   unless the routing service is unreachable (honest dashed fallback).
 * - Per-day driving stats + trip total render under the map.
 * - "Optimize route" re-orders each day's stops for the shortest drive
 *   (traveling-salesman via the routing engine) — cart view only.
 */

export interface RouteStop {
    placeId: string;
    placeName?: string;
    dayIndex: number;
    latitude?: number | null;
    longitude?: number | null;
}

interface RouteLeg { distanceM: number; durationS: number }
interface RouteData {
    distanceM: number;
    durationS: number;
    legs: RouteLeg[];
    geometry: [number, number][]; // [lng, lat] pairs from the router
}

interface Props {
    stops: RouteStop[];
    /** null = show all days */
    activeDay?: number | null;
    onStopClick?: (placeId: string) => void;
    /** Provided by the editable cart view: re-sequence one day's stops. */
    onReorderDay?: (dayIndex: number, order: number[]) => void;
}

/** Day palette — token hues, readable on both themes. */
const DAY_COLORS = [
    'oklch(62% 0.17 30)',   // terracotta
    'oklch(55% 0.14 240)',  // mediterranean
    'oklch(58% 0.12 145)',  // olive
    'oklch(70% 0.14 80)',   // gold
    'oklch(58% 0.2 300)',   // violet
    'oklch(62% 0.13 200)',  // cyan
    'oklch(62% 0.19 15)',   // coral
];
export const dayColor = (d: number) => DAY_COLORS[d % DAY_COLORS.length];

// ── Coordinate resolution (older trips / live cart lack lat/lng) ──────────

const coordCache = new Map<string, { lat: number; lng: number } | null>();

async function resolveCoords(placeIds: string[]): Promise<void> {
    const missing = placeIds.filter((id) => !coordCache.has(id));
    if (!missing.length) return;
    try {
        const res: any = await api.getPlacesByIds(missing);
        const arr: any[] = Array.isArray(res) ? res : res?.data || [];
        for (const p of arr) {
            const lat = Number(p?.latitude), lng = Number(p?.longitude);
            coordCache.set(p.id, Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null);
        }
    } catch { /* fall through to null marks below */ }
    for (const id of missing) if (!coordCache.has(id)) coordCache.set(id, null);
}

// ── Road routes (client cache on top of the server's Redis cache) ─────────

const routeCache = new Map<string, RouteData | null>();

async function fetchRoute(coords: [number, number][]): Promise<RouteData | null> {
    const key = coords.map((c) => c.map((n) => n.toFixed(5)).join(',')).join(';');
    if (routeCache.has(key)) return routeCache.get(key)!;
    try {
        const r: any = await api.getRoute(coords);
        const data: RouteData | null = r && Array.isArray(r.geometry) && r.geometry.length
            ? { distanceM: r.distanceM, durationS: r.durationS, legs: r.legs || [], geometry: r.geometry }
            : null;
        routeCache.set(key, data);
        return data;
    } catch {
        routeCache.set(key, null);
        return null;
    }
}

// ── Formatting ─────────────────────────────────────────────────────────────

export function fmtKm(m: number): string {
    const km = m / 1000;
    return km >= 10 ? `${Math.round(km)} km` : `${km.toFixed(1)} km`;
}

export function fmtDur(s: number): string {
    const min = Math.round(s / 60);
    if (min < 60) return `${min} min`;
    const h = Math.floor(min / 60);
    return `${h}h ${String(min % 60).padStart(2, '0')}`;
}

type Located = RouteStop & { lat: number; lng: number };

interface RoadData {
    dayRoutes: Map<number, RouteData | null>;
    hops: Array<{ fromDay: number; toDay: number; route: RouteData | null; from: Located; to: Located }>;
    totalM: number;
    totalS: number;
    complete: boolean; // every piece got real road data
}

export function TripRouteMap({ stops, activeDay = null, onStopClick, onReorderDay }: Props) {
    const t = useT();
    const containerRef = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<L.Map | null>(null);
    const layerRef = useRef<L.LayerGroup | null>(null);
    const [located, setLocated] = useState<Located[]>([]);
    const [resolving, setResolving] = useState(true);
    const [roads, setRoads] = useState<RoadData | null>(null);
    const [routing, setRouting] = useState(false);
    const [optimizing, setOptimizing] = useState(false);
    const [optNote, setOptNote] = useState<string | null>(null);

    const stopsKey = useMemo(
        () => stops.map((s) => `${s.placeId}:${s.dayIndex}:${s.latitude ?? '?'}`).join('|'),
        [stops],
    );

    // 1) Resolve coordinates.
    useEffect(() => {
        let cancelled = false;
        (async () => {
            setResolving(true);
            const needFetch = stops
                .filter((s) => !Number.isFinite(Number(s.latitude)) || !Number.isFinite(Number(s.longitude)))
                .map((s) => s.placeId);
            if (needFetch.length) await resolveCoords(needFetch);
            const out: Located[] = [];
            for (const s of stops) {
                let lat = Number(s.latitude), lng = Number(s.longitude);
                if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
                    const c = coordCache.get(s.placeId);
                    if (!c) continue;
                    lat = c.lat; lng = c.lng;
                }
                out.push({ ...s, lat, lng });
            }
            if (cancelled) return;
            out.sort((a, b) => a.dayIndex - b.dayIndex
                || stops.findIndex((s) => s.placeId === a.placeId) - stops.findIndex((s) => s.placeId === b.placeId));
            setLocated(out);
            setResolving(false);
        })();
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [stopsKey]);

    const byDay = useMemo(() => {
        const m = new Map<number, Located[]>();
        for (const s of located) {
            if (!m.has(s.dayIndex)) m.set(s.dayIndex, []);
            m.get(s.dayIndex)!.push(s);
        }
        return m;
    }, [located]);

    // 2) Fetch real road routes: one per day (its stops in order) + one per
    //    inter-day hop (last stop → next day's first stop).
    useEffect(() => {
        if (!located.length) { setRoads(null); return; }
        let cancelled = false;
        (async () => {
            setRouting(true);
            const days = [...byDay.keys()].sort((a, b) => a - b);
            const dayRoutes = new Map<number, RouteData | null>();
            const hops: RoadData['hops'] = [];

            await Promise.all([
                ...days.map(async (d) => {
                    const ds = byDay.get(d)!;
                    if (ds.length < 2) { dayRoutes.set(d, null); return; }
                    dayRoutes.set(d, await fetchRoute(ds.map((s) => [s.lng, s.lat] as [number, number])));
                }),
                ...days.slice(1).map(async (d, i) => {
                    const prev = byDay.get(days[i])!;
                    const from = prev[prev.length - 1];
                    const to = byDay.get(d)![0];
                    hops.push({ fromDay: days[i], toDay: d, from, to, route: await fetchRoute([[from.lng, from.lat], [to.lng, to.lat]]) });
                }),
            ]);
            if (cancelled) return;

            let totalM = 0, totalS = 0, complete = true;
            for (const d of days) {
                const r = dayRoutes.get(d);
                if (r) { totalM += r.distanceM; totalS += r.durationS; }
                else if ((byDay.get(d)?.length || 0) >= 2) complete = false;
            }
            for (const h of hops) {
                if (h.route) { totalM += h.route.distanceM; totalS += h.route.durationS; }
                else complete = false;
            }
            hops.sort((a, b) => a.fromDay - b.fromDay);
            setRoads({ dayRoutes, hops, totalM, totalS, complete });
            setRouting(false);
        })();
        return () => { cancelled = true; };
    }, [byDay, located.length]);

    // Mount the map once.
    useEffect(() => {
        if (!containerRef.current || mapRef.current) return;
        const map = L.map(containerRef.current, {
            center: [34.5, 9.5],
            zoom: 6,
            scrollWheelZoom: false,
            attributionControl: false,
        });
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18 }).addTo(map);
        L.control.attribution({ prefix: false }).addAttribution('© OpenStreetMap').addTo(map);
        mapRef.current = map;
        layerRef.current = L.layerGroup().addTo(map);
        return () => { map.remove(); mapRef.current = null; layerRef.current = null; };
    }, []);

    // 3) Draw: markers + real road polylines (dashed straight line only as
    //    fallback when routing failed for a piece).
    useEffect(() => {
        const map = mapRef.current, layer = layerRef.current;
        if (!map || !layer) return;
        layer.clearLayers();
        if (!located.length) return;

        const days = [...byDay.keys()].sort((a, b) => a - b);
        const shownDays = activeDay == null ? days : days.filter((d) => d === activeDay);
        let stopNo = 0;
        const bounds: L.LatLngExpression[] = [];
        const toLatLng = (g: [number, number][]) => g.map(([lng, lat]) => [lat, lng] as [number, number]);

        for (const d of days) {
            const dayStops = byDay.get(d)!;
            const color = dayColor(d);
            const visible = shownDays.includes(d);

            if (visible && dayStops.length > 1) {
                const road = roads?.dayRoutes.get(d);
                if (road?.geometry?.length) {
                    // Real road — outline + colored line for readability on any tile.
                    const path = toLatLng(road.geometry);
                    L.polyline(path, { color: 'oklch(20% 0.01 260)', weight: 6, opacity: 0.25 }).addTo(layer);
                    L.polyline(path, { color, weight: 3.5, opacity: 0.95 }).addTo(layer);
                } else {
                    L.polyline(dayStops.map((s) => [s.lat, s.lng]), {
                        color, weight: 2.5, opacity: 0.6, dashArray: '4 8',
                    }).addTo(layer);
                }
            }

            for (const s of dayStops) {
                stopNo += 1;
                if (!visible) continue;
                bounds.push([s.lat, s.lng]);
                const icon = L.divIcon({
                    className: 'trip-route-marker-wrap',
                    html: `<span class="trip-route-marker" style="background:${color}">${stopNo}</span>`,
                    iconSize: [30, 30],
                    iconAnchor: [15, 15],
                });
                const marker = L.marker([s.lat, s.lng], { icon }).addTo(layer);
                marker.bindPopup(
                    `<strong>${(s.placeName || 'Stop').replace(/</g, '&lt;')}</strong><br/>` +
                    `<span style="opacity:.75">${t('trip.day')} ${s.dayIndex + 1}</span>`,
                );
                if (onStopClick) marker.on('click', () => onStopClick(s.placeId));
            }
        }

        // Inter-day hops — real roads too, drawn dashed to read as "transfer".
        if (activeDay == null && roads) {
            for (const h of roads.hops) {
                if (h.route?.geometry?.length) {
                    L.polyline(toLatLng(h.route.geometry), {
                        color: 'oklch(55% 0.01 260)', weight: 2.5, opacity: 0.7, dashArray: '6 8',
                    }).addTo(layer);
                } else {
                    L.polyline([[h.from.lat, h.from.lng], [h.to.lat, h.to.lng]], {
                        color: 'oklch(60% 0.01 260)', weight: 2, opacity: 0.5, dashArray: '4 10',
                    }).addTo(layer);
                }
            }
        }

        if (bounds.length) {
            map.fitBounds(L.latLngBounds(bounds as [number, number][]), { padding: [36, 36], maxZoom: 12 });
        }
    }, [located, byDay, roads, activeDay, onStopClick, t]);

    // ── Optimizer: shortest visiting order per day (start stop stays first) ──
    const canOptimize = !!onReorderDay
        && [...byDay.values()].some((ds) => ds.length >= 3)
        // every stop of an optimizable day must be located, or indices would drift
        && [...byDay.entries()].every(([d, ds]) => ds.length === stops.filter((s) => s.dayIndex === d).length);

    const optimize = async () => {
        if (!onReorderDay || optimizing) return;
        setOptimizing(true);
        setOptNote(null);
        try {
            let savedM = 0;
            for (const [d, ds] of [...byDay.entries()].sort(([a], [b]) => a - b)) {
                if (ds.length < 3) continue;
                const before = roads?.dayRoutes.get(d)?.distanceM ?? null;
                const r: any = await api.optimizeRoute(ds.map((s) => [s.lng, s.lat] as [number, number]));
                const order: number[] = r?.order || [];
                if (order.length !== ds.length) continue;
                const identity = order.every((pos, i) => pos === i);
                if (!identity) onReorderDay(d, order);
                if (before != null && typeof r?.distanceM === 'number' && r.distanceM < before) {
                    savedM += before - r.distanceM;
                }
            }
            setOptNote(savedM > 1000
                ? `${t('trip.optimized')} · −${fmtKm(savedM)}`
                : t('trip.alreadyOptimal'));
        } catch {
            setOptNote(t('trip.optimizeFailed'));
        } finally {
            setOptimizing(false);
        }
    };

    if (!stops.length) return null;

    const days = [...byDay.keys()].sort((a, b) => a - b);

    return (
        <div className="trip-route-wrap">
            <div className="trip-route-map">
                <div ref={containerRef} className="trip-route-map-canvas" />
                {(resolving || routing) && (
                    <div className="trip-route-map-loading">
                        <Route size={15} /> {resolving ? t('trip.mapLoading') : t('trip.routing')}
                    </div>
                )}
                {!resolving && located.length === 0 && (
                    <div className="trip-route-map-loading">
                        <MapIcon size={15} /> {t('trip.mapNoCoords')}
                    </div>
                )}
            </div>

            {/* Real driving numbers — per day and total */}
            {roads && (roads.totalM > 0 || roads.hops.length > 0) && (
                <div className="trip-drive-stats">
                    {days.map((d) => {
                        const r = roads.dayRoutes.get(d);
                        if (!r) return null;
                        return (
                            <span key={d} className={`trip-drive-stat${activeDay === d ? ' is-active' : ''}`}>
                                <span className="trip-drive-dot" style={{ background: dayColor(d) }} />
                                {t('trip.day')} {d + 1} · {fmtKm(r.distanceM)} · {fmtDur(r.durationS)}
                            </span>
                        );
                    })}
                    {roads.totalM > 0 && (
                        <span className="trip-drive-stat trip-drive-total">
                            <Car size={13} /> {t('trip.totalDriving')}: {fmtKm(roads.totalM)} · {fmtDur(roads.totalS)}
                            {!roads.complete && ' *'}
                        </span>
                    )}
                    {canOptimize && (
                        <button type="button" className="trip-optimize-btn" onClick={optimize} disabled={optimizing}>
                            <Wand2 size={13} />
                            {optimizing ? t('trip.optimizing') : t('trip.optimize')}
                        </button>
                    )}
                    {optNote && <span className="trip-drive-stat trip-opt-note">{optNote}</span>}
                </div>
            )}
        </div>
    );
}

/** Day filter chips shared by the trip views. */
export function TripDayChips({
    days, active, onPick,
}: { days: number[]; active: number | null; onPick: (d: number | null) => void }) {
    const t = useT();
    if (days.length <= 1) return null;
    return (
        <div className="trip-day-chips" role="tablist" aria-label="Trip days">
            <button
                role="tab"
                aria-selected={active == null}
                className={`trip-day-chip${active == null ? ' is-active' : ''}`}
                onClick={() => onPick(null)}
            >
                {t('trip.allDays')}
            </button>
            {days.map((d) => (
                <button
                    key={d}
                    role="tab"
                    aria-selected={active === d}
                    className={`trip-day-chip${active === d ? ' is-active' : ''}`}
                    style={{ ['--chip-color' as any]: dayColor(d) }}
                    onClick={() => onPick(active === d ? null : d)}
                >
                    <span className="trip-day-chip-dot" />
                    {t('trip.day')} {d + 1}
                </button>
            ))}
        </div>
    );
}
