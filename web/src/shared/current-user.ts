/**
 * The signed-in user, readable from React and non-React code alike.
 *
 * Source of truth is the zustand auth store, persisted under `etunisia-auth`.
 * The legacy `etunisia_user` key is only ever written by SignupGate, and
 * `auth_user` is written by nothing at all — so reading those alone reports
 * "logged out" for almost every real session. They remain as a fallback only.
 *
 * Prefer `useAuthStore((s) => s.user)` inside React components; use these where
 * a hook is not available, or as a fallback before the store has hydrated.
 */

/** The persisted user object. Loosely typed — callers read handle/phone/etc. */
export function currentUser(): Record<string, any> | null {
    try {
        const raw = localStorage.getItem('etunisia-auth');
        if (raw) {
            const u = JSON.parse(raw)?.state?.user;
            if (u?.id) return u;
        }
    } catch { /* fall through to legacy keys */ }

    try {
        const raw = localStorage.getItem('etunisia_user') || localStorage.getItem('auth_user');
        if (raw) {
            const u = JSON.parse(raw);
            if (u?.id) return u;
        }
    } catch { /* ignore */ }

    return null;
}

export function currentUserId(): string | null {
    return currentUser()?.id ?? null;
}
