// i18n core — three hand-written locales (en/fr/ar) plus **any other language
// on demand**: unknown locales are AI-translated server-side from the English
// dictionary (POST /api/v1/i18n/translate, Redis-cached per dictionary version)
// and cached in localStorage. No LLM configured → the switch is refused and the
// UI stays in the current language.
//
// - t(key): lookup with English fallback (missing keys never break UI)
// - setLocale(): persists, stamps <html lang/dir> (RTL for ar/he/fa/ur),
//   re-translates the vanilla chrome ([data-i18n]) and notifies React (useT)

import { DICTIONARIES } from './dictionaries';

const STORAGE_KEY = 'locale';
export const LOCALE_EVENT = 'etunisia:locale-changed';

const RTL = new Set(['ar', 'he', 'fa', 'ur']);

export interface LocaleMeta { id: string; label: string; dir: 'ltr' | 'rtl' }

const meta = (id: string, label: string): LocaleMeta =>
    ({ id, label, dir: RTL.has(id) ? 'rtl' : 'ltr' });

/** Built-in first, then the AI-translated world. */
export const LOCALES: LocaleMeta[] = [
    meta('en', 'English'),
    meta('fr', 'Français'),
    meta('ar', 'العربية'),
    meta('de', 'Deutsch'),
    meta('it', 'Italiano'),
    meta('es', 'Español'),
    meta('pt', 'Português'),
    meta('nl', 'Nederlands'),
    meta('ru', 'Русский'),
    meta('uk', 'Українська'),
    meta('pl', 'Polski'),
    meta('cs', 'Čeština'),
    meta('sv', 'Svenska'),
    meta('da', 'Dansk'),
    meta('no', 'Norsk'),
    meta('fi', 'Suomi'),
    meta('el', 'Ελληνικά'),
    meta('hu', 'Magyar'),
    meta('ro', 'Română'),
    meta('tr', 'Türkçe'),
    meta('he', 'עברית'),
    meta('fa', 'فارسی'),
    meta('ur', 'اردو'),
    meta('hi', 'हिन्दी'),
    meta('zh', '中文'),
    meta('ja', '日本語'),
    meta('ko', '한국어'),
    meta('th', 'ไทย'),
    meta('vi', 'Tiếng Việt'),
    meta('id', 'Bahasa Indonesia'),
];

const BUILT_IN = new Set(Object.keys(DICTIONARIES));

/** AI-translated packs installed at runtime. */
const packs: Record<string, Record<string, string>> = {};

let current = 'en';

/** Version stamp of the English dictionary — invalidates cached packs when strings change. */
function dictHash(): string {
    const s = JSON.stringify(DICTIONARIES.en);
    let h = 5381;
    for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
    return (h >>> 0).toString(36);
}

function detect(): string {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved && (BUILT_IN.has(saved) || LOCALES.some((l) => l.id === saved))) return saved;
    } catch {}
    const nav = (typeof navigator !== 'undefined' ? navigator.language : 'en').toLowerCase();
    const short = nav.split('-')[0];
    if (BUILT_IN.has(short)) return short;
    if (LOCALES.some((l) => l.id === short)) return short;
    return 'en';
}

export function getLocale(): string {
    return current;
}

export function t(key: string): string {
    return packs[current]?.[key]
        ?? (DICTIONARIES as Record<string, Record<string, string>>)[current]?.[key]
        ?? DICTIONARIES.en[key]
        ?? key;
}

/** Translate every [data-i18n] node under root (vanilla chrome: nav, dropdown). */
export function applyTranslations(root: ParentNode = document): void {
    root.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
        const key = el.dataset.i18n;
        if (key) el.textContent = t(key);
    });
    root.querySelectorAll<HTMLElement>('[data-i18n-placeholder]').forEach((el) => {
        const key = el.dataset.i18nPlaceholder;
        if (key && 'placeholder' in el) (el as HTMLInputElement).placeholder = t(key);
    });
}

function stampDocument(): void {
    document.documentElement.lang = current;
    document.documentElement.dir = RTL.has(current.split('-')[0]) ? 'rtl' : 'ltr';
}

function commit(locale: string): void {
    current = locale;
    try { localStorage.setItem(STORAGE_KEY, locale); } catch {}
    stampDocument();
    applyTranslations();
    window.dispatchEvent(new CustomEvent(LOCALE_EVENT, { detail: { locale } }));
}

/** Fetch (or restore) the AI pack for a non-built-in locale. */
async function ensurePack(locale: string): Promise<boolean> {
    if (packs[locale]) return true;
    const cacheKey = `i18n_pack_${locale}_${dictHash()}`;
    try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            packs[locale] = JSON.parse(cached);
            return true;
        }
    } catch {}
    try {
        const res = await fetch('/api/v1/i18n/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ locale, entries: DICTIONARIES.en }),
        });
        const json = await res.json().catch(() => null);
        const entries = json?.data?.entries ?? json?.entries;
        if (entries && typeof entries === 'object') {
            packs[locale] = entries;
            try { localStorage.setItem(cacheKey, JSON.stringify(entries)); } catch {}
            return true;
        }
    } catch {}
    return false;
}

/**
 * Switch language. Built-ins apply instantly; other locales resolve their AI
 * pack first (network) and refuse the switch when no pack can be produced —
 * a half-switched UI is worse than an honest "not available".
 */
export async function setLocale(locale: string): Promise<boolean> {
    if (!locale || locale === current) return true;
    if (BUILT_IN.has(locale)) {
        commit(locale);
        return true;
    }
    const ok = await ensurePack(locale);
    if (!ok) return false;
    commit(locale);
    return true;
}

/** Call once at boot, before the first render pass. */
export function initI18n(): void {
    current = detect();
    stampDocument();
    applyTranslations();
    // Saved non-built-in locale: restore its pack (localStorage → network) and
    // re-translate once it lands. Until then English shows — never a blank UI.
    if (!BUILT_IN.has(current)) {
        void ensurePack(current).then((ok) => {
            if (ok) {
                applyTranslations();
                window.dispatchEvent(new CustomEvent(LOCALE_EVENT, { detail: { locale: current } }));
            }
        });
    }
}
