/**
 * The remix engine.
 *
 * A circuit arrives from the API as an ordered list of real places with
 * dwell times and straight-line hops. Everything a traveller actually asks —
 * "I only have four days", "I land in Djerba not Tunis", "I don't drive",
 * "what will this cost the two of us" — is answered here, client-side, so the
 * controls respond instantly instead of round-tripping.
 *
 * Nothing in here invents facts. Distances come from the catalog coordinates,
 * entry fees from the place records; the cost bands are declared assumptions
 * that the UI shows the traveller rather than hiding behind a single number.
 */

import type { CircuitDetail, CircuitStop } from '../../../api';

// ── options ──────────────────────────────────────────────────────────────

export type Pace = 'relaxed' | 'balanced' | 'packed';
export type Transport = 'car' | 'public' | 'guided';
export type StayTier = 'hostel' | 'mid' | 'boutique';
export type FoodTier = 'street' | 'mixed' | 'restaurant';

export interface PlanOptions {
    days: number;
    pace: Pace;
    /** Run the route backwards — for travellers arriving at the far end. */
    reverse: boolean;
    transport: Transport;
    travelers: number;
    stay: StayTier;
    food: FoodTier;
    /** "YYYY-MM-DD" — drives calendar dates, weather and the season verdict. */
    startDate: string | null;
    /** Place ids the traveller removed from this circuit. */
    dropped: string[];
    /** placeId → replacement stop chosen from the catalog nearby. */
    swaps: Record<string, CircuitStop>;
    /** Extra stops the traveller added, keyed by the stop they follow. */
    extras: Record<string, CircuitStop[]>;
}

export function defaultOptions(circuit: CircuitDetail): PlanOptions {
    return {
        days: circuit.defaultDays,
        pace: 'balanced',
        reverse: false,
        transport: circuit.carFree ? 'public' : 'car',
        travelers: 2,
        stay: 'mid',
        food: 'mixed',
        startDate: null,
        dropped: [],
        swaps: {},
        extras: {},
    };
}

// ── declared assumptions (shown to the user, never buried) ───────────────

/** Straight-line km → road km. Tunisian trunk roads bend about this much. */
export const ROAD_FACTOR = 1.25;

const SPEED_KMH: Record<Transport, number> = { car: 72, public: 52, guided: 66 };
/** Fixed minutes lost per intercity leg (waiting for the louage to fill, etc). */
const LEG_OVERHEAD_MIN: Record<Transport, number> = { car: 10, public: 35, guided: 15 };

/** Active minutes per day, before the pace multiplier. */
const DAY_BUDGET_MIN: Record<Pace, number> = { relaxed: 330, balanced: 450, packed: 570 };
const DAY_START_HOUR: Record<Pace, number> = { relaxed: 9.5, balanced: 8.75, packed: 8 };

/** Per person per day, TND. */
export const FOOD_BAND: Record<FoodTier, number> = { street: 35, mixed: 75, restaurant: 140 };
/** Multiplier on the circuit's own mid-range nightly band. */
export const STAY_MULT: Record<StayTier, number> = { hostel: 0.45, mid: 1, boutique: 1.9 };

/** Car: rental + fuel. Public: fare per km. Guided: all-in day rate. */
const CAR_DAY_RENTAL_TND = 115;
const FUEL_TND_PER_KM = 0.18; // ~7 L/100 km at pump price
const PUBLIC_TND_PER_KM = 0.075;
const PUBLIC_MIN_LEG_TND = 3;
const GUIDED_DAY_TND = 320; // per vehicle with driver

// ── shaped output ────────────────────────────────────────────────────────

export interface PlannedStop {
    stop: CircuitStop;
    /** Minutes from midnight when you arrive. */
    arriveMin: number;
    /** Minutes from midnight when you leave. */
    leaveMin: number;
    /** Drive from the previous stop, null for the first stop of the trip. */
    leg: { km: number; minutes: number; crossCity: boolean } | null;
    /** Set when the stop wants a different time of day than it gets. */
    slotWarning: string | null;
    /** Set when the stop is only reachable with your own wheels. */
    transportWarning: string | null;
}

export interface PlannedDay {
    index: number;
    date: Date | null;
    stops: PlannedStop[];
    /** Base city for the night — where you should book. */
    base: string;
    driveKm: number;
    driveMinutes: number;
    onSiteMinutes: number;
    /** Wall-clock span of the day, "08:45 – 18:20". */
    span: string;
}

export interface CostLine { label: string; total: number; note: string }
export interface CostBreakdown {
    lines: CostLine[];
    total: number;
    perPerson: number;
    perPersonPerDay: number;
}

export interface Plan {
    days: PlannedDay[];
    stops: CircuitStop[];
    droppedForTime: CircuitStop[];
    totalKm: number;
    totalDriveMinutes: number;
    totalOnSiteMinutes: number;
    cost: CostBreakdown;
    /** Longest single drive in the plan — the honest "is this brutal" signal. */
    longestLegKm: number;
}

// ── geometry ─────────────────────────────────────────────────────────────

export function haversineKm(a: CircuitStop, b: CircuitStop): number {
    const toRad = (d: number) => (d * Math.PI) / 180;
    const dLat = toRad(b.latitude - a.latitude);
    const dLng = toRad(b.longitude - a.longitude);
    const s =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLng / 2) ** 2;
    return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(s)));
}

function legMinutes(km: number, transport: Transport): number {
    return Math.round((km * ROAD_FACTOR) / SPEED_KMH[transport] * 60) + LEG_OVERHEAD_MIN[transport];
}

const sameCity = (a?: string, b?: string) =>
    (a || '').trim().toLowerCase() === (b || '').trim().toLowerCase();

// ── the sequence a set of options produces ───────────────────────────────

/** Apply reverse / drops / swaps / extras to get the working stop list. */
export function sequence(circuit: CircuitDetail, opts: PlanOptions): CircuitStop[] {
    const base = opts.reverse ? [...circuit.stops].reverse() : circuit.stops;
    const out: CircuitStop[] = [];
    for (const s of base) {
        if (opts.dropped.includes(s.placeId)) continue;
        out.push(opts.swaps[s.placeId] || s);
        for (const extra of opts.extras[s.placeId] || []) out.push(extra);
    }
    return out;
}

/**
 * Trim the route to what genuinely fits. Priority 3 stops go first, then
 * priority 2 — never priority 1, which is the reason the circuit exists.
 * Returns what survived and what was cut, so the UI can say so out loud.
 */
function fitToDays(stops: CircuitStop[], opts: PlanOptions): { kept: CircuitStop[]; cut: CircuitStop[] } {
    const budget = DAY_BUDGET_MIN[opts.pace] * opts.days;
    const load = (list: CircuitStop[]) => {
        let m = 0;
        for (let i = 0; i < list.length; i++) {
            m += list[i].minutes;
            if (i > 0) m += legMinutes(haversineKm(list[i - 1], list[i]), opts.transport);
        }
        return m;
    };

    const kept = [...stops];
    const cut: CircuitStop[] = [];
    for (const tier of [3, 2] as const) {
        while (load(kept) > budget) {
            const idx = kept.findIndex((s) => s.priority === tier);
            if (idx === -1) break;
            cut.push(kept[idx]);
            kept.splice(idx, 1);
        }
        if (load(kept) <= budget) break;
    }
    return { kept, cut };
}

/**
 * Split an ordered route into exactly `days` days.
 *
 * A daily minute budget is binary-searched until the greedy fill lands on the
 * requested day count, with a hard rule on top: a hop of 90 km or more always
 * ends the day, because nobody wants a two-hour transfer at 16:00.
 */
function splitIntoDays(stops: CircuitStop[], opts: PlanOptions): CircuitStop[][] {
    if (!stops.length) return [];
    const target = Math.max(1, Math.min(opts.days, stops.length));

    const greedy = (budget: number): CircuitStop[][] => {
        const out: CircuitStop[][] = [];
        let cur: CircuitStop[] = [];
        let spent = 0;
        for (let i = 0; i < stops.length; i++) {
            const s = stops[i];
            const prev = cur[cur.length - 1];
            const hopKm = prev ? haversineKm(prev, s) : 0;
            const hopMin = prev ? legMinutes(hopKm, opts.transport) : 0;
            const wouldOverflow = cur.length > 0 && (spent + hopMin + s.minutes > budget || hopKm >= 90);
            // Never strand the tail: leave at least one stop for each day left.
            const daysLeft = target - out.length - 1;
            const stopsLeft = stops.length - i;
            const mustBreak = wouldOverflow && stopsLeft > daysLeft;
            if (mustBreak) {
                out.push(cur);
                cur = [s];
                spent = s.minutes;
            } else {
                cur.push(s);
                spent += hopMin + s.minutes;
            }
        }
        if (cur.length) out.push(cur);
        return out;
    };

    let lo = 90;
    let hi = 24 * 60;
    let best = greedy(hi);
    for (let i = 0; i < 24 && lo < hi; i++) {
        const mid = Math.round((lo + hi) / 2);
        const attempt = greedy(mid);
        if (attempt.length > target) lo = mid + 1;
        else { best = attempt; hi = mid; }
    }

    // Still short of the requested days? Split the heaviest day until we match.
    while (best.length < target && best.some((d) => d.length > 1)) {
        let hi2 = 0;
        for (let i = 1; i < best.length; i++) if (best[i].length > best[hi2].length) hi2 = i;
        if (best[hi2].length < 2) break;
        const day = best[hi2];
        const at = Math.ceil(day.length / 2);
        best.splice(hi2, 1, day.slice(0, at), day.slice(at));
    }
    return best;
}

// ── cost ─────────────────────────────────────────────────────────────────

function buildCost(
    circuit: CircuitDetail,
    stops: CircuitStop[],
    roadKm: number,
    opts: PlanOptions,
): CostBreakdown {
    const people = Math.max(1, opts.travelers);
    const nights = Math.max(0, opts.days - 1);
    const lines: CostLine[] = [];

    const entry = stops.reduce((sum, s) => sum + (s.entryPrice || 0), 0) * people;
    if (entry > 0) {
        lines.push({ label: 'Site entry', total: entry, note: `Published gate prices, ${people}×` });
    }

    if (opts.transport === 'car') {
        const rental = CAR_DAY_RENTAL_TND * opts.days;
        const fuel = Math.round(roadKm * FUEL_TND_PER_KM);
        lines.push({ label: 'Car hire', total: rental, note: `${opts.days} day${opts.days === 1 ? '' : 's'} · economy class` });
        lines.push({ label: 'Fuel', total: fuel, note: `${Math.round(roadKm)} km · ~7 L/100 km` });
    } else if (opts.transport === 'public') {
        const legs = Math.max(1, new Set(stops.map((s) => s.city)).size - 1);
        const fare = Math.round(Math.max(roadKm * PUBLIC_TND_PER_KM, legs * PUBLIC_MIN_LEG_TND)) * people;
        lines.push({ label: 'Louage & train', total: fare, note: `${legs} intercity leg${legs === 1 ? '' : 's'}, ${people}×` });
    } else {
        lines.push({ label: 'Driver & vehicle', total: GUIDED_DAY_TND * opts.days, note: `${opts.days} day${opts.days === 1 ? '' : 's'} · shared by the group` });
    }

    if (nights > 0) {
        const perNight = Math.round(circuit.stayBandTnd * STAY_MULT[opts.stay]);
        lines.push({
            label: 'Accommodation',
            total: perNight * nights * people,
            note: `${nights} night${nights === 1 ? '' : 's'} · ~${perNight} TND pp`,
        });
    }

    const foodPerDay = FOOD_BAND[opts.food];
    lines.push({
        label: 'Food',
        total: foodPerDay * opts.days * people,
        note: `${foodPerDay} TND pp/day`,
    });

    const total = lines.reduce((sum, l) => sum + l.total, 0);
    return {
        lines,
        total,
        perPerson: Math.round(total / people),
        perPersonPerDay: Math.round(total / people / Math.max(1, opts.days)),
    };
}

// ── slot fit ─────────────────────────────────────────────────────────────

const SLOT_WINDOW: Record<CircuitStop['slot'], [number, number]> = {
    morning: [7 * 60, 12 * 60],
    midday: [11 * 60, 15 * 60],
    afternoon: [14 * 60, 18 * 60],
    evening: [16.5 * 60, 21 * 60],
};
const SLOT_LABEL: Record<CircuitStop['slot'], string> = {
    morning: 'best early',
    midday: 'best around midday',
    afternoon: 'best mid-afternoon',
    evening: 'best at golden hour',
};

/** Stops that only make sense with your own vehicle. */
const CAR_ONLY_KINDS: CircuitStop['kind'][] = ['desert', 'nature'];

// ── the build ────────────────────────────────────────────────────────────

export function buildPlan(circuit: CircuitDetail, opts: PlanOptions): Plan {
    const raw = sequence(circuit, opts);
    const { kept, cut } = fitToDays(raw, opts);
    const grouped = splitIntoDays(kept, opts);

    const start = parseDate(opts.startDate);
    const days: PlannedDay[] = [];
    let totalKm = 0;
    let totalDrive = 0;
    let totalOnSite = 0;
    let longestLegKm = 0;
    let prevStop: CircuitStop | null = null;

    grouped.forEach((dayStops, di) => {
        let clock = DAY_START_HOUR[opts.pace] * 60;
        let driveKm = 0;
        let driveMin = 0;
        let onSite = 0;
        const planned: PlannedStop[] = [];

        dayStops.forEach((stop, si) => {
            let leg: PlannedStop['leg'] = null;
            if (si === 0 && prevStop) {
                // Overnight transfer — it happens at the top of the new day.
                const km = haversineKm(prevStop, stop);
                const minutes = legMinutes(km, opts.transport);
                leg = { km: Math.round(km), minutes, crossCity: !sameCity(prevStop.city, stop.city) };
                clock += minutes;
                driveKm += km;
                driveMin += minutes;
                longestLegKm = Math.max(longestLegKm, km);
            } else if (si > 0) {
                const prev = dayStops[si - 1];
                const km = haversineKm(prev, stop);
                const minutes = legMinutes(km, opts.transport);
                leg = { km: Math.round(km), minutes, crossCity: !sameCity(prev.city, stop.city) };
                clock += minutes;
                driveKm += km;
                driveMin += minutes;
                longestLegKm = Math.max(longestLegKm, km);
            }

            const arriveMin = clock;
            clock += stop.minutes;
            onSite += stop.minutes;

            const [lo, hi] = SLOT_WINDOW[stop.slot];
            const midpoint = arriveMin + stop.minutes / 2;
            const slotWarning =
                midpoint < lo - 45 || midpoint > hi + 45
                    ? `${SLOT_LABEL[stop.slot]} — you arrive ${fmtClock(arriveMin)}`
                    : null;

            planned.push({
                stop,
                arriveMin,
                leaveMin: clock,
                leg,
                slotWarning,
                transportWarning:
                    opts.transport === 'public' && CAR_ONLY_KINDS.includes(stop.kind)
                        ? 'No public transport to the trailhead — arrange a local taxi or a driver for this leg.'
                        : null,
            });
            prevStop = stop;
        });

        // Where you sleep: the city you spend the most on-site time in.
        const cityTime = new Map<string, number>();
        for (const p of planned) cityTime.set(p.stop.city, (cityTime.get(p.stop.city) || 0) + p.stop.minutes);
        const base = [...cityTime.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || planned[0]?.stop.city || '';

        totalKm += driveKm;
        totalDrive += driveMin;
        totalOnSite += onSite;

        days.push({
            index: di,
            date: start ? addDays(start, di) : null,
            stops: planned,
            base,
            driveKm: Math.round(driveKm * ROAD_FACTOR),
            driveMinutes: driveMin,
            onSiteMinutes: onSite,
            span: planned.length
                ? `${fmtClock(planned[0].arriveMin)} – ${fmtClock(planned[planned.length - 1].leaveMin)}`
                : '',
        });
    });

    const roadKm = totalKm * ROAD_FACTOR;
    return {
        days,
        stops: kept,
        droppedForTime: cut,
        totalKm: Math.round(roadKm),
        totalDriveMinutes: totalDrive,
        totalOnSiteMinutes: totalOnSite,
        cost: buildCost(circuit, kept, roadKm, opts),
        longestLegKm: Math.round(longestLegKm * ROAD_FACTOR),
    };
}

// ── season ───────────────────────────────────────────────────────────────

export type SeasonVerdict = 'perfect' | 'fine' | 'avoid';

export function seasonFor(circuit: { bestMonths: number[]; avoidMonths?: { months: number[]; reason: string } },
    month: number): { verdict: SeasonVerdict; label: string; reason: string } {
    if (circuit.avoidMonths?.months.includes(month)) {
        return { verdict: 'avoid', label: 'Wrong season', reason: circuit.avoidMonths.reason };
    }
    if (circuit.bestMonths.includes(month)) {
        return { verdict: 'perfect', label: 'Prime season', reason: `${MONTHS[month - 1]} is one of the best months for this route.` };
    }
    return { verdict: 'fine', label: 'Doable', reason: `${MONTHS[month - 1]} works, but this route shines in ${monthList(circuit.bestMonths)}.` };
}

export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const MONTHS_SHORT = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];

function monthList(months: number[]): string {
    const names = months.slice().sort((a, b) => a - b).map((m) => MONTHS[m - 1].slice(0, 3));
    if (names.length <= 2) return names.join(' and ');
    return `${names[0]}–${names[names.length - 1]}`;
}

// ── formatting ───────────────────────────────────────────────────────────

export function fmtClock(minutes: number): string {
    const m = ((Math.round(minutes) % 1440) + 1440) % 1440;
    return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

export function fmtDuration(minutes: number): string {
    const m = Math.round(minutes);
    if (m < 60) return `${m} min`;
    const h = Math.floor(m / 60);
    const rest = m % 60;
    return rest ? `${h} h ${rest}` : `${h} h`;
}

export function parseDate(value: string | null | undefined): Date | null {
    if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const [y, m, d] = value.split('-').map(Number);
    return new Date(y, m - 1, d);
}

export function addDays(date: Date, n: number): Date {
    const out = new Date(date);
    out.setDate(out.getDate() + n);
    return out;
}

export function dayOffsetFromToday(date: Date): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return Math.round((d.getTime() - today.getTime()) / 86_400_000);
}

// ── plain-text export (WhatsApp, email, printing) ────────────────────────

export function planToText(circuit: CircuitDetail, plan: Plan, opts: PlanOptions): string {
    const lines: string[] = [];
    lines.push(circuit.title.toUpperCase());
    lines.push(circuit.tagline);
    lines.push(`${plan.days.length} days · ${plan.stops.length} stops · ${plan.totalKm} km · ~${plan.cost.perPerson} TND per person`);
    lines.push('');
    for (const day of plan.days) {
        const date = day.date ? day.date.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' }) : '';
        lines.push(`— DAY ${day.index + 1}${date ? ` · ${date}` : ''} · sleep in ${day.base}`);
        for (const p of day.stops) {
            const legPart = p.leg ? ` (${p.leg.km} km, ${fmtDuration(p.leg.minutes)})` : '';
            lines.push(`  ${fmtClock(p.arriveMin)}  ${p.stop.name} — ${p.stop.city}${legPart}`);
        }
        lines.push('');
    }
    if (plan.droppedForTime.length) {
        lines.push(`Cut for time: ${plan.droppedForTime.map((s) => s.name).join(', ')}`);
        lines.push('');
    }
    lines.push(`Planned on e-Tunisia · ${typeof location !== 'undefined' ? location.origin : ''}/itineraries/${circuit.slug}`);
    return lines.join('\n');
}
