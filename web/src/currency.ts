// Global display currency — prices are stored in TND; tourists can flip the whole
// app to EUR / USD / GBP with a live daily rate. Same event-driven pattern as the
// city filter: localStorage persistence, a window event on change, a vanilla nav
// pill, and React reads via useCurrency().

export const CURRENCY_EVENT = 'etunisia:currency-changed';
const STORAGE_KEY = 'display_currency';
const RATES_KEY = 'currency_rates_v1';

export interface CurrencyDef { code: string; symbol: string; label: string; }

export const CURRENCIES: CurrencyDef[] = [
    { code: 'TND', symbol: 'DT', label: 'Tunisian Dinar' },
    { code: 'EUR', symbol: '€', label: 'Euro' },
    { code: 'USD', symbol: '$', label: 'US Dollar' },
    { code: 'GBP', symbol: '£', label: 'British Pound' },
];

// TND → currency multipliers. TND is always 1. Others start with sane fallbacks
// (approx mid-2020s rates) so conversion works offline; refreshed daily from a
// free, key-less API when online.
const FALLBACK_RATES: Record<string, number> = { TND: 1, EUR: 0.29, USD: 0.32, GBP: 0.25 };

let current: string = 'TND';
let rates: Record<string, number> = { ...FALLBACK_RATES };

try { current = localStorage.getItem(STORAGE_KEY) || 'TND'; } catch { /* ignore */ }
try {
    const cached = JSON.parse(localStorage.getItem(RATES_KEY) || 'null');
    if (cached && cached.rates && typeof cached.rates === 'object') {
        rates = { ...FALLBACK_RATES, ...cached.rates, TND: 1 };
    }
} catch { /* ignore */ }

export function getCurrency(): string { return current; }
export function currentDef(): CurrencyDef {
    return CURRENCIES.find((c) => c.code === current) || CURRENCIES[0];
}

export function setCurrency(code: string): void {
    if (!CURRENCIES.some((c) => c.code === code) || code === current) return;
    current = code;
    try { localStorage.setItem(STORAGE_KEY, code); } catch { /* ignore */ }
    renderPillLabel();
    window.dispatchEvent(new CustomEvent(CURRENCY_EVENT, { detail: { currency: code } }));
}

/** Convert a TND amount into the active display currency. */
export function convertFromTND(tnd: number): number {
    const r = rates[current] ?? 1;
    return (Number(tnd) || 0) * r;
}

/**
 * Format a TND amount in the active display currency.
 * TND keeps the local "123 DT" style; foreign currencies show the symbol.
 */
export function formatMoney(tnd: number, opts: { decimals?: number } = {}): string {
    const def = currentDef();
    const value = convertFromTND(tnd);
    const decimals = opts.decimals ?? (def.code === 'TND' ? 0 : (value < 100 ? 2 : 0));
    const n = value.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    return def.code === 'TND' ? `${n} DT` : `${def.symbol}${n}`;
}

/** Refresh TND→* rates once a day from a free, key-less source. Best-effort. */
export async function refreshRates(): Promise<void> {
    try {
        const cached = JSON.parse(localStorage.getItem(RATES_KEY) || 'null');
        const today = new Date().toISOString().slice(0, 10);
        if (cached?.date === today) return; // already fresh today
        const res = await fetch('https://open.er-api.com/v6/latest/TND');
        if (!res.ok) return;
        const data = await res.json();
        if (data?.result === 'success' && data.rates) {
            const next: Record<string, number> = { TND: 1 };
            for (const c of CURRENCIES) if (data.rates[c.code]) next[c.code] = data.rates[c.code];
            rates = { ...FALLBACK_RATES, ...next, TND: 1 };
            localStorage.setItem(RATES_KEY, JSON.stringify({ date: today, rates: next }));
            window.dispatchEvent(new CustomEvent(CURRENCY_EVENT, { detail: { currency: current } }));
        }
    } catch { /* offline — keep fallback/cached rates */ }
}

// ── Vanilla nav pill (mirrors the city filter) ─────────────
const COIN_SVG = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M14.8 9a2.4 2.4 0 0 0-2.3-1.5h-.9A2.3 2.3 0 0 0 9.5 12c.4.4.9.6 1.5.6h1a2.3 2.3 0 0 1 0 4.5h-.9A2.4 2.4 0 0 1 8.8 15"/><path d="M12 6.2v1.3M12 16.5v1.3"/></svg>';
const CHEVRON_SVG = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>';

let pill: HTMLButtonElement | null = null;
let menu: HTMLDivElement | null = null;

function renderPillLabel() {
    if (!pill) return;
    pill.innerHTML = `${COIN_SVG}<span class="nav-city-label">${current}</span>${CHEVRON_SVG}`;
    pill.classList.toggle('has-city', current !== 'TND');
}

function buildMenu() {
    if (menu) return menu;
    menu = document.createElement('div');
    menu.className = 'nav-city-menu';
    menu.setAttribute('role', 'listbox');
    const paint = () => {
        menu!.innerHTML = CURRENCIES.map((c) =>
            `<button class="nav-city-item${current === c.code ? ' is-active' : ''}" data-code="${c.code}">` +
            `${c.code} · ${c.label}</button>`,
        ).join('');
    };
    paint();
    menu.addEventListener('click', (e) => {
        const btn = (e.target as HTMLElement).closest<HTMLElement>('.nav-city-item');
        if (!btn) return;
        setCurrency(btn.dataset.code || 'TND');
        paint();
        closeMenu();
    });
    document.addEventListener('click', (e) => {
        if (menu?.classList.contains('open') && !menu.contains(e.target as Node) && e.target !== pill && !pill?.contains(e.target as Node)) {
            closeMenu();
        }
    });
    return menu;
}

function closeMenu() { menu?.classList.remove('open'); }

/** Mount the currency pill into the navbar. Call once at boot. */
export function initCurrencyToggle(): void {
    const actions = document.querySelector('.nav-actions');
    if (!actions || pill) return;
    pill = document.createElement('button');
    pill.className = 'nav-city nav-currency';
    pill.type = 'button';
    pill.setAttribute('aria-label', 'Change display currency');
    renderPillLabel();
    const m = buildMenu();
    pill.addEventListener('click', () => m.classList.toggle('open'));
    const wrap = document.createElement('div');
    wrap.className = 'nav-city-wrap';
    wrap.appendChild(pill);
    wrap.appendChild(m);
    actions.insertBefore(wrap, actions.firstChild);
    void refreshRates();
}
