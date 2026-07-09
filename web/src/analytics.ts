// First-party product analytics — the thin client half.
//
// track() queues events in memory and flushes them in batches to
// POST /api/v1/analytics/events (durable log; works logged-out via a stable
// anonId). Flushes on an interval and on tab-hide via sendBeacon so nothing
// is lost when the user closes the tab. Fire-and-forget by design: analytics
// must never break or slow the product.
//
// Core events wired at boot: session_start (with days-since-last for retention
// cohorts), post_create, and the call sites sprinkle: signup, save, share,
// react, trip_plan.

interface QueuedEvent {
    name: string;
    props?: Record<string, unknown>;
    anonId: string;
}

const ENDPOINT = '/api/v1/analytics/events';
const FLUSH_MS = 5000;
const MAX_QUEUE = 40;
const ANON_KEY = 'etunisia_anon_id';
const LAST_SESSION_KEY = 'etunisia_last_session';

let queue: QueuedEvent[] = [];
let timer: number | null = null;
let inited = false;

function anonId(): string {
    try {
        let id = localStorage.getItem(ANON_KEY);
        if (!id) {
            id = (crypto as any).randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
            localStorage.setItem(ANON_KEY, id!);
        }
        return id!;
    } catch {
        return 'no-storage';
    }
}

function apiBase(): string {
    // Mirrors shared/api.ts: VITE_API_URL or same-origin.
    const raw = ((import.meta as any).env?.VITE_API_URL ?? '').replace(/\/+$/, '');
    return raw.replace(/\/api\/v\d+$/, '');
}

export function track(name: string, props?: Record<string, unknown>): void {
    if (!/^[a-z0-9_.:-]{1,64}$/i.test(name)) return;
    queue.push({ name, props, anonId: anonId() });
    if (queue.length >= MAX_QUEUE) flush();
    else if (timer == null && typeof window !== 'undefined') {
        timer = window.setTimeout(flush, FLUSH_MS);
    }
}

function flush(useBeacon = false): void {
    if (timer != null) { clearTimeout(timer); timer = null; }
    if (!queue.length) return;
    const events = queue;
    queue = [];
    const url = `${apiBase()}${ENDPOINT}`;
    const payload = JSON.stringify({ events });

    if (useBeacon && navigator.sendBeacon) {
        // sendBeacon can't carry an Authorization header — events still land
        // with the anonId, which is enough for aggregate counts.
        navigator.sendBeacon(url, new Blob([payload], { type: 'application/json' }));
        return;
    }

    const token = (() => { try { return localStorage.getItem('etunisia_token'); } catch { return null; } })();
    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: payload,
        keepalive: true,
    }).catch(() => { /* analytics never surfaces errors */ });
}

/** Call once at app boot. */
export function initAnalytics(): void {
    if (inited || typeof window === 'undefined') return;
    inited = true;

    // Session start + gap since previous session → D1/D7 retention cohorts.
    let daysSinceLast: number | null = null;
    try {
        const last = Number(localStorage.getItem(LAST_SESSION_KEY));
        if (Number.isFinite(last) && last > 0) {
            daysSinceLast = Math.floor((Date.now() - last) / 86_400_000);
        }
        localStorage.setItem(LAST_SESSION_KEY, String(Date.now()));
    } catch {}
    track('session_start', daysSinceLast == null ? undefined : { daysSinceLast });

    // Post creation is announced app-wide already — piggyback on it.
    window.document.addEventListener('etunisia:post-created', () => track('post_create'));

    // Never lose the tail of a session.
    window.document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') flush(true);
    });
    window.addEventListener('pagehide', () => flush(true));
}
