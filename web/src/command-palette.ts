/**
 * Global ⌘K / Ctrl+K command palette.
 *
 * One keyboard shortcut, one place to find anything: people, places, and
 * every section of the app. Keyboard-first navigation (↑↓ Enter Esc),
 * mouse works too, but the design rewards the keyboard.
 */

import * as api from './api';

interface CommandItem {
    id: string;
    section: 'page' | 'people' | 'places';
    icon: string;            // emoji or single char — we render via textContent
    title: string;
    subtitle?: string;
    href: string;
    avatar?: string | null;
}

const PAGE_SHORTCUTS: CommandItem[] = [
    { id: 'p-home',        section: 'page', icon: '🏠', title: 'Home feed',                href: '#/' },
    { id: 'p-passport',    section: 'page', icon: '🪪', title: 'My Travel Profile',        href: '__OWN_HANDLE__' },
    { id: 'p-activity',    section: 'page', icon: '🌐', title: 'Following activity',       href: '#/activity' },
    { id: 'p-explore',     section: 'page', icon: '🧭', title: 'Explore places',           href: '#/explore' },
    { id: 'p-trips',       section: 'page', icon: '🗺',  title: 'Trip plans by travelers', href: '#/discover-trips' },
    { id: 'p-leaderboard', section: 'page', icon: '🏆', title: 'Leaderboard',              href: '#/leaderboard' },
    { id: 'p-badges',      section: 'page', icon: '🏅', title: 'My badges',                href: '#/badges' },
    { id: 'p-saved',       section: 'page', icon: '🔖', title: 'Saved posts',              href: '#/saved' },
    { id: 'p-favorites',   section: 'page', icon: '❤',  title: 'Saved places',            href: '#/favorites' },
    { id: 'p-messages',    section: 'page', icon: '💬', title: 'Messages',                 href: '#/messages' },
    { id: 'p-inquiries',   section: 'page', icon: '📧', title: 'My inquiries',             href: '#/inquiries' },
    { id: 'p-events',      section: 'page', icon: '📅', title: 'Events',                   href: '#/events' },
    { id: 'p-tips',        section: 'page', icon: '💡', title: 'Travel tips',              href: '#/tips' },
    { id: 'p-profile',     section: 'page', icon: '⚙', title: 'Edit profile',             href: '#/profile-edit' },
    { id: 'p-search',      section: 'page', icon: '🔍', title: 'Full search',              href: '#/search' },
];

function escapeHtml(s: string): string {
    return String(s ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

let root: HTMLDivElement | null = null;
let input: HTMLInputElement | null = null;
let list: HTMLDivElement | null = null;
let activeIndex = 0;
let lastItems: CommandItem[] = [];
let debounceTimer: number | null = null;

function mountShell() {
    if (root) return;
    root = document.createElement('div');
    root.className = 'cmdk-root';
    root.setAttribute('aria-hidden', 'true');
    root.innerHTML = `
        <div class="cmdk-backdrop"></div>
        <div class="cmdk-panel" role="dialog" aria-modal="true" aria-label="Command palette">
            <div class="cmdk-input-row">
                <i class="lucide-search cmdk-search-icon" aria-hidden="true"></i>
                <input class="cmdk-input" type="text" placeholder="Search people, places, pages…" autocomplete="off" spellcheck="false" />
                <kbd class="cmdk-esc">esc</kbd>
            </div>
            <div class="cmdk-list" role="listbox"></div>
            <div class="cmdk-footer">
                <span><kbd>↑</kbd><kbd>↓</kbd> to navigate</span>
                <span><kbd>↵</kbd> to open</span>
                <span><kbd>esc</kbd> to close</span>
            </div>
        </div>
    `;
    document.body.appendChild(root);
    input = root.querySelector('.cmdk-input');
    list = root.querySelector('.cmdk-list');

    root.querySelector('.cmdk-backdrop')?.addEventListener('click', close);

    input?.addEventListener('input', () => {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = window.setTimeout(() => render(input!.value), 180);
    });

    input?.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') { e.preventDefault(); close(); return; }
        if (e.key === 'ArrowDown') { e.preventDefault(); move(1); return; }
        if (e.key === 'ArrowUp')   { e.preventDefault(); move(-1); return; }
        if (e.key === 'Enter')     { e.preventDefault(); commit(); return; }
    });
}

function ownHandle(): string | null {
    try {
        const raw = localStorage.getItem('etunisia_user') || localStorage.getItem('auth_user');
        if (!raw) return null;
        const u = JSON.parse(raw);
        return u?.handle ?? null;
    } catch { return null; }
}

function resolveHref(item: CommandItem): string {
    if (item.href === '__OWN_HANDLE__') {
        const h = ownHandle();
        return h ? `#/u/${encodeURIComponent(h)}` : '#/login';
    }
    return item.href;
}

function filterPages(q: string): CommandItem[] {
    if (!q) return PAGE_SHORTCUTS;
    const lower = q.toLowerCase();
    return PAGE_SHORTCUTS.filter((p) => p.title.toLowerCase().includes(lower));
}

async function fetchPeople(q: string): Promise<CommandItem[]> {
    if (!q || q.length < 2) return [];
    try {
        const r = await fetch(`/api/v1/users/search?q=${encodeURIComponent(q)}&limit=6`).then((r) => r.json());
        const arr: any[] = Array.isArray(r) ? r : (r?.data ?? []);
        return arr.map((u: any) => ({
            id: `u-${u.id}`,
            section: 'people' as const,
            icon: '',
            title: u.fullName || 'Traveler',
            subtitle: [u.handle ? '@' + u.handle : '', u.country].filter(Boolean).join(' · '),
            href: u.handle ? `#/u/${encodeURIComponent(u.handle)}` : '#',
            avatar: u.avatar || null,
        }));
    } catch { return []; }
}

async function fetchPlaces(q: string): Promise<CommandItem[]> {
    if (!q || q.length < 2) return [];
    try {
        const r: any = await (api as any).search?.(q);
        const arr: any[] = (r?.places || []).slice(0, 6);
        return arr.map((p: any) => ({
            id: `pl-${p.id}`,
            section: 'places' as const,
            icon: '📍',
            title: p.name || 'Place',
            subtitle: [p.city, p.category?.name || p.category].filter(Boolean).join(' · '),
            href: `#/place/${p.id}`,
            avatar: p.coverImage || (p.images && p.images[0]) || null,
        }));
    } catch { return []; }
}

async function render(q: string) {
    if (!list) return;
    const trimmed = q.trim();
    const pages = filterPages(trimmed);

    // Optimistic instant render of pages while the async fetches resolve.
    activeIndex = 0;
    lastItems = pages;
    paint(pages, { peopleLoading: trimmed.length >= 2, placesLoading: trimmed.length >= 2 });

    const [people, places] = await Promise.all([fetchPeople(trimmed), fetchPlaces(trimmed)]);
    lastItems = [...pages, ...people, ...places];
    paint(lastItems, { peopleLoading: false, placesLoading: false });
}

function sectionHeader(label: string): string {
    return `<div class="cmdk-section-head">${escapeHtml(label)}</div>`;
}

function renderItem(item: CommandItem, idx: number): string {
    const isActive = idx === activeIndex;
    const sub = item.subtitle ? `<span class="cmdk-sub">${escapeHtml(item.subtitle)}</span>` : '';
    const iconCell = item.avatar
        ? `<img class="cmdk-avatar" src="${escapeHtml(item.avatar)}" alt="" />`
        : `<span class="cmdk-emoji">${escapeHtml(item.icon || '•')}</span>`;
    return `
        <div role="option" aria-selected="${isActive}" class="cmdk-item ${isActive ? 'active' : ''}" data-idx="${idx}">
            ${iconCell}
            <div class="cmdk-text">
                <span class="cmdk-title">${escapeHtml(item.title)}</span>
                ${sub}
            </div>
            <span class="cmdk-section-pill">${item.section}</span>
        </div>
    `;
}

function paint(items: CommandItem[], state: { peopleLoading: boolean; placesLoading: boolean }) {
    if (!list) return;

    const grouped = { page: [] as CommandItem[], people: [] as CommandItem[], places: [] as CommandItem[] };
    items.forEach((i) => grouped[i.section].push(i));

    const flat: CommandItem[] = [...grouped.page, ...grouped.people, ...grouped.places];
    lastItems = flat;
    if (activeIndex >= flat.length) activeIndex = Math.max(0, flat.length - 1);

    let html = '';
    if (grouped.page.length) {
        html += sectionHeader('Pages');
        grouped.page.forEach((it) => {
            const idx = flat.indexOf(it);
            html += renderItem(it, idx);
        });
    }
    if (grouped.people.length || state.peopleLoading) {
        html += sectionHeader(`People${state.peopleLoading ? ' …' : ''}`);
        grouped.people.forEach((it) => {
            const idx = flat.indexOf(it);
            html += renderItem(it, idx);
        });
        if (state.peopleLoading && !grouped.people.length) html += `<div class="cmdk-skel">Searching travelers…</div>`;
    }
    if (grouped.places.length || state.placesLoading) {
        html += sectionHeader(`Places${state.placesLoading ? ' …' : ''}`);
        grouped.places.forEach((it) => {
            const idx = flat.indexOf(it);
            html += renderItem(it, idx);
        });
        if (state.placesLoading && !grouped.places.length) html += `<div class="cmdk-skel">Searching destinations…</div>`;
    }
    if (!html) {
        html = `<div class="cmdk-empty">No matches. Try a name, city, or page.</div>`;
    }
    list.innerHTML = html;

    list.querySelectorAll<HTMLElement>('.cmdk-item').forEach((el) => {
        el.addEventListener('mouseenter', () => {
            activeIndex = Number(el.dataset.idx) || 0;
            highlight();
        });
        el.addEventListener('click', () => {
            activeIndex = Number(el.dataset.idx) || 0;
            commit();
        });
    });
}

function highlight() {
    if (!list) return;
    list.querySelectorAll<HTMLElement>('.cmdk-item').forEach((el) => {
        const isActive = Number(el.dataset.idx) === activeIndex;
        el.classList.toggle('active', isActive);
        el.setAttribute('aria-selected', String(isActive));
        if (isActive) el.scrollIntoView({ block: 'nearest' });
    });
}

function move(delta: number) {
    if (!lastItems.length) return;
    activeIndex = (activeIndex + delta + lastItems.length) % lastItems.length;
    highlight();
}

function commit() {
    const item = lastItems[activeIndex];
    if (!item) return;
    const href = resolveHref(item);
    if (href && href !== '#') location.hash = href;
    close();
}

function open() {
    mountShell();
    if (!root || !input) return;
    root.classList.add('open');
    root.setAttribute('aria-hidden', 'false');
    input.value = '';
    render('');
    setTimeout(() => input?.focus(), 30);
    document.body.style.overflow = 'hidden';
}

function close() {
    if (!root) return;
    root.classList.remove('open');
    root.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
}

export function initCommandPalette() {
    document.addEventListener('keydown', (e) => {
        const meta = e.metaKey || e.ctrlKey;
        if (meta && (e.key === 'k' || e.key === 'K')) {
            e.preventDefault();
            open();
        }
    });
    // Surface the shortcut on the existing topbar search input as a hint.
    const topbarSearch = document.querySelector<HTMLInputElement>('input[type="search"], #topbar-search-input, #global-search-input');
    if (topbarSearch) {
        topbarSearch.placeholder = `${topbarSearch.placeholder || 'Search'}  (⌘K)`;
    }
    // Expose for the keyboard-shy: clicking the topbar search bar opens the palette.
    const searchTriggers = document.querySelectorAll('[data-open-cmdk]');
    searchTriggers.forEach((t) => t.addEventListener('click', open));
    (window as any).openCommandPalette = open;
}
