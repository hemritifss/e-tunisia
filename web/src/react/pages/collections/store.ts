/**
 * Local carnet state — the traveller's own themed boards ("carnets") plus the
 * love/save marks they leave on editor collections.
 *
 * Deliberately localStorage-first, exactly like the circuits store: building a
 * board of dream places at 1 a.m. should never need an account or a running
 * backend. The collections API stays the source of truth for *editor* picks;
 * everything a user assembles themselves lives here until (later) a sync step
 * hands it to the server. This keeps the whole page alive even with Docker down.
 */

export type CarnetThemeKey =
    | 'beach' | 'heritage' | 'food' | 'desert'
    | 'architecture' | 'nature' | 'city' | 'gem';

export interface CarnetPlace {
    id: string;
    name?: string;
    city?: string;
    cover?: string;
    /** A margin scribble: why this place earned a spot on the board. */
    note?: string;
}

export interface Carnet {
    id: string;
    title: string;
    description?: string;
    /** A single stamp glyph shown on the card corner. */
    emoji?: string;
    theme?: CarnetThemeKey;
    /** User-set cover; when absent the card stitches a collage from its places. */
    cover?: string;
    isPrivate?: boolean;
    places: CarnetPlace[];
    /** Handles / emails invited to co-curate (Pro). */
    collaborators?: string[];
    /** Set when this board was forked from an editor collection. */
    remixOf?: string;
    loves?: number;
    createdAt: string;
    updatedAt: string;
}

const CARNETS_KEY = 'etunisia_carnets_v1';
const LOVED_KEY = 'etunisia_collections_loved_v1';
const SAVED_KEY = 'etunisia_collections_saved_v1';

/** Mirrors backend FREE_CAPS.maxCollections — keep the two in lockstep. */
export const FREE_MAX_CARNETS = 3;

export const COLLECTIONS_CHANGE = 'etunisia:collections-change';

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
    } catch { /* quota or private mode — page still works, just forgets */ }
    window.dispatchEvent(new CustomEvent(COLLECTIONS_CHANGE));
}

function uid(prefix: string): string {
    return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

// ── carnets ────────────────────────────────────────────────────────────────

export function listCarnets(): Carnet[] {
    return read<Carnet[]>(CARNETS_KEY, []);
}

export function getCarnet(id: string): Carnet | undefined {
    return listCarnets().find((c) => c.id === id);
}

export function carnetCount(): number {
    return listCarnets().length;
}

/** True once the free traveller has spent every carnet slot. */
export function atCarnetCap(isPro: boolean): boolean {
    return !isPro && carnetCount() >= FREE_MAX_CARNETS;
}

function persist(list: Carnet[]) {
    write(CARNETS_KEY, list);
}

export function createCarnet(data: Partial<Carnet>): Carnet {
    const now = new Date().toISOString();
    const carnet: Carnet = {
        id: uid('cn'),
        title: (data.title || 'Untitled carnet').trim().slice(0, 80),
        description: data.description?.trim().slice(0, 400) || '',
        emoji: data.emoji || '',
        theme: data.theme,
        cover: data.cover || '',
        isPrivate: !!data.isPrivate,
        places: data.places || [],
        collaborators: data.collaborators || [],
        remixOf: data.remixOf,
        loves: 0,
        createdAt: now,
        updatedAt: now,
    };
    persist([carnet, ...listCarnets()]);
    return carnet;
}

export function updateCarnet(id: string, patch: Partial<Carnet>): Carnet | undefined {
    const list = listCarnets();
    const i = list.findIndex((c) => c.id === id);
    if (i === -1) return undefined;
    const merged: Carnet = { ...list[i], ...patch, id, updatedAt: new Date().toISOString() };
    list[i] = merged;
    persist(list);
    return merged;
}

export function deleteCarnet(id: string) {
    persist(listCarnets().filter((c) => c.id !== id));
}

export function addPlaceToCarnet(id: string, place: CarnetPlace): boolean {
    const carnet = getCarnet(id);
    if (!carnet) return false;
    if (carnet.places.some((p) => p.id === place.id)) return false;
    updateCarnet(id, { places: [...carnet.places, place] });
    return true;
}

export function removePlaceFromCarnet(id: string, placeId: string) {
    const carnet = getCarnet(id);
    if (!carnet) return;
    updateCarnet(id, { places: carnet.places.filter((p) => p.id !== placeId) });
}

export function setPlaceNote(id: string, placeId: string, note: string) {
    const carnet = getCarnet(id);
    if (!carnet) return;
    updateCarnet(id, {
        places: carnet.places.map((p) => (p.id === placeId ? { ...p, note: note.slice(0, 200) } : p)),
    });
}

/** Nudge a place one slot up (dir -1) or down (dir +1) in the running order. */
export function movePlace(id: string, placeId: string, dir: -1 | 1) {
    const carnet = getCarnet(id);
    if (!carnet) return;
    const places = [...carnet.places];
    const i = places.findIndex((p) => p.id === placeId);
    const j = i + dir;
    if (i === -1 || j < 0 || j >= places.length) return;
    [places[i], places[j]] = [places[j], places[i]];
    updateCarnet(id, { places });
}

/**
 * Fork an editor collection into an editable personal carnet. We only hold the
 * source's place ids up front; the detail view hydrates names/covers on open.
 */
export function remixInto(source: {
    id: string; title: string; description?: string; cover?: string;
    theme?: CarnetThemeKey; placeIds?: string[];
}): Carnet {
    return createCarnet({
        title: `${source.title} — my copy`.slice(0, 80),
        description: source.description,
        cover: source.cover,
        theme: source.theme,
        remixOf: source.id,
        places: (source.placeIds || []).map((pid) => ({ id: String(pid) })),
    });
}

// ── loved / saved editor collections ────────────────────────────────────────

export function lovedIds(): string[] {
    return read<string[]>(LOVED_KEY, []);
}
export function isLoved(id: string): boolean {
    return lovedIds().includes(id);
}
export function toggleLove(id: string): boolean {
    const list = lovedIds();
    const i = list.indexOf(id);
    if (i === -1) list.push(id);
    else list.splice(i, 1);
    write(LOVED_KEY, list);
    return i === -1;
}

export function savedIds(): string[] {
    return read<string[]>(SAVED_KEY, []);
}
export function isSaved(id: string): boolean {
    return savedIds().includes(id);
}
export function toggleSave(id: string): boolean {
    const list = savedIds();
    const i = list.indexOf(id);
    if (i === -1) list.push(id);
    else list.splice(i, 1);
    write(SAVED_KEY, list);
    return i === -1;
}

// ── subscription ────────────────────────────────────────────────────────────

export function onCollectionsChange(cb: () => void): () => void {
    const handler = () => cb();
    window.addEventListener(COLLECTIONS_CHANGE, handler);
    window.addEventListener('storage', handler);
    return () => {
        window.removeEventListener(COLLECTIONS_CHANGE, handler);
        window.removeEventListener('storage', handler);
    };
}
