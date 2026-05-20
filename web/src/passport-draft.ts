/**
 * Soft passport: localStorage accumulator for anonymous visitors.
 * Anything they tap, save, or explore before signup gets preserved here
 * and POSTed to /users/me/seed right after they claim their handle.
 *
 * The whole point: signup feels like *claiming* a passport you already built,
 * not filling in a blank one.
 */

const KEY = 'etunisia.passport-draft.v1';

export interface PassportDraft {
    visitedCities: string[];
    interests: string[];
    handleHint?: string;
}

function safeParse(raw: string | null): PassportDraft {
    if (!raw) return { visitedCities: [], interests: [] };
    try {
        const parsed = JSON.parse(raw);
        return {
            visitedCities: Array.isArray(parsed.visitedCities) ? parsed.visitedCities : [],
            interests: Array.isArray(parsed.interests) ? parsed.interests : [],
            handleHint: typeof parsed.handleHint === 'string' ? parsed.handleHint : undefined,
        };
    } catch {
        return { visitedCities: [], interests: [] };
    }
}

export function readDraft(): PassportDraft {
    try { return safeParse(localStorage.getItem(KEY)); } catch { return { visitedCities: [], interests: [] }; }
}

export function writeDraft(d: PassportDraft): void {
    try { localStorage.setItem(KEY, JSON.stringify(d)); } catch {}
}

export function addVisitedCity(city: string | null | undefined): void {
    const trimmed = (city || '').trim();
    if (!trimmed) return;
    const d = readDraft();
    if (!d.visitedCities.includes(trimmed)) {
        d.visitedCities.push(trimmed);
        writeDraft(d);
    }
}

export function addInterest(tag: string | null | undefined): void {
    const trimmed = (tag || '').trim();
    if (!trimmed) return;
    const d = readDraft();
    if (!d.interests.includes(trimmed)) {
        d.interests.push(trimmed);
        writeDraft(d);
    }
}

export function setHandleHint(handle: string | null | undefined): void {
    const d = readDraft();
    d.handleHint = (handle || '').toLowerCase().trim() || undefined;
    writeDraft(d);
}

export function clearDraft(): void {
    try { localStorage.removeItem(KEY); } catch {}
}

/** Heuristic: is the user logged out? Used to gate draft-tracking. */
export function isAnonymous(): boolean {
    try { return !localStorage.getItem('auth_token'); } catch { return true; }
}
