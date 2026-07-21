/**
 * Local circuit state — saved routes, per-circuit remix settings and packing
 * checklists. Deliberately localStorage-only: a traveller comparing four
 * circuits at 1 a.m. should not need an account, and the moment they commit
 * the plan goes to the real trip cart, which is where the server takes over.
 */

import type { PlanOptions } from './plan';

const SAVED_KEY = 'etunisia_circuits_saved_v1';
const OPTS_KEY = 'etunisia_circuit_opts_v1';
const CHECK_KEY = 'etunisia_circuit_checklist_v1';
const COMPARE_KEY = 'etunisia_circuits_compare_v1';

export const CIRCUITS_CHANGE = 'etunisia:circuits-change';

function read<T>(key: string, fallback: T): T {
    try {
        const raw = localStorage.getItem(key);
        return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
        return fallback;
    }
}
function write(key: string, value: unknown) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch { /* quota or private mode — the page still works, just forgets */ }
    window.dispatchEvent(new CustomEvent(CIRCUITS_CHANGE));
}

// ── saved circuits ───────────────────────────────────────────────────────

export function savedSlugs(): string[] {
    return read<string[]>(SAVED_KEY, []);
}
export function isSaved(slug: string): boolean {
    return savedSlugs().includes(slug);
}
export function toggleSaved(slug: string): boolean {
    const list = savedSlugs();
    const i = list.indexOf(slug);
    if (i === -1) list.push(slug);
    else list.splice(i, 1);
    write(SAVED_KEY, list);
    return i === -1;
}

// ── compare tray ─────────────────────────────────────────────────────────

export const COMPARE_MAX = 3;

export function compareSlugs(): string[] {
    return read<string[]>(COMPARE_KEY, []);
}
/** Returns false when the tray is already full. */
export function toggleCompare(slug: string): boolean {
    const list = compareSlugs();
    const i = list.indexOf(slug);
    if (i !== -1) {
        list.splice(i, 1);
    } else {
        if (list.length >= COMPARE_MAX) return false;
        list.push(slug);
    }
    write(COMPARE_KEY, list);
    return true;
}
export function clearCompare() {
    write(COMPARE_KEY, []);
}

// ── remix options, per circuit ───────────────────────────────────────────

export function readOptions(slug: string): Partial<PlanOptions> | null {
    const all = read<Record<string, Partial<PlanOptions>>>(OPTS_KEY, {});
    return all[slug] || null;
}
export function writeOptions(slug: string, opts: PlanOptions) {
    const all = read<Record<string, Partial<PlanOptions>>>(OPTS_KEY, {});
    // Swaps and extras carry whole place records; keep them out of storage so
    // a stale copy can never shadow the live catalog.
    const { swaps, extras, ...persisted } = opts;
    all[slug] = persisted;
    write(OPTS_KEY, all);
}

// ── packing checklist ────────────────────────────────────────────────────

export function readChecklist(slug: string): string[] {
    const all = read<Record<string, string[]>>(CHECK_KEY, {});
    return all[slug] || [];
}
export function toggleChecklistItem(slug: string, item: string) {
    const all = read<Record<string, string[]>>(CHECK_KEY, {});
    const list = all[slug] || [];
    const i = list.indexOf(item);
    if (i === -1) list.push(item);
    else list.splice(i, 1);
    all[slug] = list;
    write(CHECK_KEY, all);
}

// ── subscription ─────────────────────────────────────────────────────────

export function onCircuitsChange(cb: () => void): () => void {
    const handler = () => cb();
    window.addEventListener(CIRCUITS_CHANGE, handler);
    window.addEventListener('storage', handler);
    return () => {
        window.removeEventListener(CIRCUITS_CHANGE, handler);
        window.removeEventListener('storage', handler);
    };
}
