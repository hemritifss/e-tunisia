// Thin admin fetch layer. Admin endpoints live under /api/v1/admin/* and are
// guarded server-side (role === 'admin'). 401/403 → ADMIN_FORBIDDEN sentinel so
// the UI can render the "admins only" state instead of an empty table.

export const ADMIN_FORBIDDEN = Symbol('admin_forbidden');
export type AdminForbidden = typeof ADMIN_FORBIDDEN;

function token(): string | null {
    return localStorage.getItem('etunisia_token') || localStorage.getItem('auth_token');
}

function unwrap(json: any): any {
    return json && typeof json === 'object' && json.data !== undefined ? json.data : json;
}

/** GET an admin resource. Returns the payload, ADMIN_FORBIDDEN, or null on error. */
export async function adminGet<T = any>(path: string): Promise<T | AdminForbidden | null> {
    const t = token();
    if (!t) return ADMIN_FORBIDDEN;
    try {
        const r = await fetch(`/api/v1${path}`, { headers: { Authorization: `Bearer ${t}` } });
        if (r.status === 401 || r.status === 403) return ADMIN_FORBIDDEN;
        if (!r.ok) return null;
        const json = await r.json();
        const data = unwrap(json);
        // Re-attach meta for paginated endpoints (interceptor lifts it to top level).
        if (json && typeof json === 'object' && 'meta' in json && json.meta) {
            return { data, meta: json.meta } as any;
        }
        return data as T;
    } catch {
        return null;
    }
}

/** Mutate an admin resource (PATCH/DELETE/POST). Throws on non-OK so callers can toast. */
export async function adminMutate(path: string, method: 'PATCH' | 'DELETE' | 'POST' = 'PATCH', body?: any): Promise<any> {
    const t = token();
    const r = await fetch(`/api/v1${path}`, {
        method,
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
    });
    if (!r.ok) {
        let msg = `HTTP ${r.status}`;
        try {
            const j = await r.json();
            const m = j?.error?.message ?? j?.message;
            if (typeof m === 'string') msg = m;
        } catch { /* ignore */ }
        throw new Error(msg);
    }
    if (r.status === 204) return null;
    try { return unwrap(await r.json()); } catch { return null; }
}
