// Global city filter — one selected city, honored across the whole app
// (Explore, Events, Map; anything else can subscribe the same way).
//
// Same event-driven pattern as i18n: localStorage persistence, a window event
// on change, a vanilla nav pill UI, and React pages subscribe via useCity().

import { t } from './i18n';

export const CITY_EVENT = 'etunisia:city-changed';
const STORAGE_KEY = 'city_filter';

/** Governorate-level cities with map centers (for the map flyTo). */
export const CITIES: Array<{ name: string; lat: number; lng: number }> = [
    { name: 'Tunis', lat: 36.8065, lng: 10.1815 },
    { name: 'Ariana', lat: 36.8665, lng: 10.1647 },
    { name: 'Ben Arous', lat: 36.7435, lng: 10.2320 },
    { name: 'Manouba', lat: 36.8101, lng: 10.0956 },
    { name: 'Nabeul', lat: 36.4561, lng: 10.7376 },
    { name: 'Hammamet', lat: 36.4000, lng: 10.6167 },
    { name: 'Zaghouan', lat: 36.4029, lng: 10.1429 },
    { name: 'Bizerte', lat: 37.2744, lng: 9.8739 },
    { name: 'Béja', lat: 36.7256, lng: 9.1817 },
    { name: 'Jendouba', lat: 36.5011, lng: 8.7802 },
    { name: 'Tabarka', lat: 36.9544, lng: 8.7580 },
    { name: 'Le Kef', lat: 36.1742, lng: 8.7049 },
    { name: 'Siliana', lat: 36.0849, lng: 9.3708 },
    { name: 'Sousse', lat: 35.8256, lng: 10.6369 },
    { name: 'Monastir', lat: 35.7643, lng: 10.8113 },
    { name: 'Mahdia', lat: 35.5047, lng: 11.0622 },
    { name: 'Sfax', lat: 34.7406, lng: 10.7603 },
    { name: 'Kairouan', lat: 35.6781, lng: 10.0963 },
    { name: 'Kasserine', lat: 35.1676, lng: 8.8365 },
    { name: 'Sidi Bouzid', lat: 35.0382, lng: 9.4849 },
    { name: 'Gabès', lat: 33.8815, lng: 10.0982 },
    { name: 'Médenine', lat: 33.3549, lng: 10.5055 },
    { name: 'Djerba', lat: 33.8076, lng: 10.8451 },
    { name: 'Tataouine', lat: 32.9297, lng: 10.4518 },
    { name: 'Gafsa', lat: 34.4250, lng: 8.7842 },
    { name: 'Tozeur', lat: 33.9197, lng: 8.1335 },
    { name: 'Kébili', lat: 33.7050, lng: 8.9690 },
    { name: 'Douz', lat: 33.4664, lng: 9.0203 },
    { name: 'Sidi Bou Said', lat: 36.8687, lng: 10.3416 },
    { name: 'Matmata', lat: 33.5449, lng: 9.9715 },
];

let current: string | null = null;
try { current = localStorage.getItem(STORAGE_KEY) || null; } catch {}

export function getCity(): string | null {
    return current;
}

export function setCity(city: string | null): void {
    if (city === current) return;
    current = city;
    try {
        if (city) localStorage.setItem(STORAGE_KEY, city);
        else localStorage.removeItem(STORAGE_KEY);
    } catch {}
    renderPillLabel();
    window.dispatchEvent(new CustomEvent(CITY_EVENT, { detail: { city } }));
}

export function cityCenter(city: string | null): { lat: number; lng: number } | null {
    if (!city) return null;
    return CITIES.find((c) => c.name.toLowerCase() === city.toLowerCase()) || null;
}

// ── Vanilla nav pill ───────────────────────────────────────

const PIN_SVG = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>';
const CHEVRON_SVG = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>';

let pill: HTMLButtonElement | null = null;
let menu: HTMLDivElement | null = null;

function renderPillLabel() {
    if (!pill) return;
    const label = current || t('city.all');
    pill.innerHTML = `${PIN_SVG}<span class="nav-city-label">${label}</span>${CHEVRON_SVG}`;
    pill.classList.toggle('has-city', !!current);
}

function buildMenu() {
    if (menu) return menu;
    menu = document.createElement('div');
    menu.className = 'nav-city-menu';
    menu.setAttribute('role', 'listbox');
    const paint = () => {
        menu!.innerHTML =
            `<button class="nav-city-item${current ? '' : ' is-active'}" data-city="">${t('city.all')}</button>` +
            CITIES.map((c) =>
                `<button class="nav-city-item${current === c.name ? ' is-active' : ''}" data-city="${c.name}">${c.name}</button>`,
            ).join('');
    };
    paint();
    menu.addEventListener('click', (e) => {
        const btn = (e.target as HTMLElement).closest<HTMLElement>('.nav-city-item');
        if (!btn) return;
        setCity(btn.dataset.city || null);
        paint();
        closeMenu();
    });
    document.addEventListener('click', (e) => {
        if (menu?.classList.contains('open') && !menu.contains(e.target as Node) && e.target !== pill && !pill?.contains(e.target as Node)) {
            closeMenu();
        }
    });
    window.addEventListener('etunisia:locale-changed', () => { renderPillLabel(); paint(); });
    return menu;
}

function closeMenu() { menu?.classList.remove('open'); }

/** Mount the pill into the navbar. Call once at boot. */
export function initCityFilter(): void {
    const actions = document.querySelector('.nav-actions');
    if (!actions || pill) return;
    pill = document.createElement('button');
    pill.className = 'nav-city';
    pill.type = 'button';
    pill.setAttribute('aria-label', 'Filter by city');
    renderPillLabel();
    const m = buildMenu();
    pill.addEventListener('click', () => m.classList.toggle('open'));
    const wrap = document.createElement('div');
    wrap.className = 'nav-city-wrap';
    wrap.appendChild(pill);
    wrap.appendChild(m);
    actions.insertBefore(wrap, actions.firstChild);
}
