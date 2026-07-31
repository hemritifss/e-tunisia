/**
 * The live strip - the topmost band of the app chrome (Bled motion specimen:
 * `bled-ticker`, 40s linear, paused on hover and in a background tab).
 *
 * Real data only, from four independent sources that each degrade by omission:
 * a source that fails, or has nothing to say, contributes no line rather than a
 * placeholder. When every source comes back empty the host stays hidden and
 * reserves no space at all - which is the normal state with the backend down.
 *
 * Populated once at boot. There is deliberately no polling: re-rendering the
 * track restarts the marquee mid-scroll, which reads as a glitch, and none of
 * these lines change fast enough to be worth that.
 */

import { api } from './shared/api';
import { getActiveTravelers } from './api';

/** Tunis, for the sunset line. */
const TUNIS = { lat: 36.8065, lon: 10.1815 };

/** The city centroid sits inland of the marine grid, so the sea-temperature
 *  probe uses open water in the Gulf of Tunis instead. */
const GULF_OF_TUNIS = { lat: 36.87, lon: 10.35 };

/** Lines are written in sentence case; the strip uppercases them in CSS, which
 *  keeps the accessible text readable instead of feeding screen readers caps. */
async function activityLines(): Promise<string[]> {
    try {
        // Already `.catch(() => [])` inside shared/api, but older builds of the
        // endpoint answered `{ data: [...] }` - guard both shapes.
        const raw = await api.getGlobalActivity(8);
        const entries: any[] = Array.isArray(raw) ? raw : (raw as any)?.data ?? [];
        const lines: string[] = [];

        for (const e of entries) {
            const actor = String(e?.actor?.fullName || '').trim();
            if (!actor) continue;

            if (e.type === 'review') {
                const place = String(e?.target?.placeName || '').trim();
                lines.push(place ? `${actor} reviewed ${place}` : `${actor} left a review`);
            } else if (e.type === 'trip') {
                const title = String(e?.target?.title || '').trim();
                lines.push(title ? `${actor} planned ${title}` : `${actor} planned a trip`);
            } else if (e.type === 'endorse') {
                const who = String(e?.target?.user?.fullName || '').trim();
                if (who) lines.push(`${actor} endorsed ${who}`);
            }
        }
        return lines.slice(0, 6);
    } catch {
        return [];
    }
}

async function travelersLine(): Promise<string | null> {
    try {
        const rows = await getActiveTravelers(50);
        if (!Array.isArray(rows)) return null;
        // Rows are place-visits, so one person can appear several times.
        const people = new Set(rows.map((r: any) => r?.userId).filter(Boolean));
        const n = people.size;
        if (!n) return null;
        return `${n} traveler${n === 1 ? '' : 's'} on the map`;
    } catch {
        return null;
    }
}

async function sunsetLine(): Promise<string | null> {
    try {
        const url =
            `https://api.open-meteo.com/v1/forecast?latitude=${TUNIS.lat}&longitude=${TUNIS.lon}` +
            `&daily=sunset&timezone=auto&forecast_days=1`;
        const res = await fetch(url);
        if (!res.ok) return null;
        const json = await res.json();
        // open-meteo returns local wall time as "YYYY-MM-DDTHH:MM", no zone suffix.
        const iso = json?.daily?.sunset?.[0];
        const hhmm = typeof iso === 'string' ? iso.slice(11, 16) : '';
        return /^\d{2}:\d{2}$/.test(hhmm) ? `Sunset in Tunis ${hhmm}` : null;
    } catch {
        return null;
    }
}

async function seaTempLine(): Promise<string | null> {
    try {
        const url =
            `https://marine-api.open-meteo.com/v1/marine?latitude=${GULF_OF_TUNIS.lat}` +
            `&longitude=${GULF_OF_TUNIS.lon}&current=sea_surface_temperature&timezone=auto`;
        const res = await fetch(url);
        if (!res.ok) return null;
        const json = await res.json();
        const t = json?.current?.sea_surface_temperature;
        return Number.isFinite(t) ? `Sea ${Math.round(t)}° gulf of Tunis` : null;
    } catch {
        return null;
    }
}

function appendCopy(track: HTMLElement, lines: string[], decorative: boolean): void {
    for (const line of lines) {
        const item = document.createElement('span');
        item.className = 'live-ticker-item';
        // Actor and place names are user data - textContent, never innerHTML.
        item.textContent = line;
        if (decorative) item.setAttribute('aria-hidden', 'true');
        track.appendChild(item);
    }
}

/**
 * bled-ticker translates the track by -50%, so the item list has to be present
 * an EVEN number of times or the loop jumps by whatever the halves differ by.
 * Two copies is the minimum the keyframe needs; a short list is topped up in
 * pairs until half a track overflows the strip, otherwise blank space scrolls
 * through between the last item and the first.
 *
 * Width is read off the border box because the track is width:max-content and
 * the join between copies is the trailing item margin.
 */
function fill(track: HTMLElement, viewport: HTMLElement, lines: string[]): void {
    const need = viewport.clientWidth;
    if (need === 0) return; // no box yet (hidden strip) - the observer calls back
    for (let guard = 0; guard < 8; guard++) {
        if (track.getBoundingClientRect().width / 2 >= need) return;
        appendCopy(track, lines, true);
        appendCopy(track, lines, true);
    }
}

async function mount(host: HTMLElement, track: HTMLElement, lines: string[]): Promise<void> {
    // The strip is mono and the fallback metrics differ enough from JetBrains
    // Mono to change the repeat count. Measure once the real face is in.
    try { await document.fonts?.ready; } catch { /* best effort */ }

    const viewport = host.querySelector<HTMLElement>('.live-ticker-viewport');
    if (!viewport) return;

    track.replaceChildren();
    appendCopy(track, lines, false);
    appendCopy(track, lines, true);

    host.hidden = false;
    document.body.classList.add('has-live-ticker');

    fill(track, viewport, lines);
    // The strip is display:none for logged-out visitors, so the first fill can
    // land on a zero-width box. This catches the box appearing at login, and
    // window resizes, with one mechanism. Growing the track does not resize the
    // viewport, so there is no feedback loop.
    new ResizeObserver(() => fill(track, viewport, lines)).observe(viewport);

    // Hover pausing is pure CSS. A tab that is not on screen gets the same
    // treatment through this class, so the compositor is not ticking a marquee
    // nobody can see.
    const syncVisibility = () => host.classList.toggle('is-paused', document.hidden);
    document.addEventListener('visibilitychange', syncVisibility);
    syncVisibility();
}

export function initLiveTicker(): void {
    const host = document.getElementById('live-ticker');
    const track = document.getElementById('live-ticker-track');
    if (!host || !track) return;

    void (async () => {
        const [activity, travelers, sunset, sea] = await Promise.all([
            activityLines(),
            travelersLine(),
            sunsetLine(),
            seaTempLine(),
        ]);

        const lines = [...activity, travelers, sunset, sea].filter(
            (line): line is string => typeof line === 'string' && line.length > 0,
        );
        if (lines.length === 0) return; // nothing real to say - stay hidden, reserve nothing

        await mount(host, track, lines);
    })();
}
